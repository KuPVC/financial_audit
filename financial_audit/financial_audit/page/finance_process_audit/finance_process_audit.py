import frappe
from frappe import _
from frappe.utils import flt, nowdate, cint, date_diff, getdate
import json
import time

# ─── Reuse AI infrastructure from the existing Financial Audit page ────────────
from financial_audit.financial_audit.page.financial_audit.financial_audit import (
    get_ai_settings, call_ai_api, _log_ai_request, _increment_rate_limit
)


# ═══════════════════════════════════════════════════════════════════════════════
#  PRIORITY HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

_PRIORITY_THRESHOLDS = {
    "value_critical": 500_000,
    "value_high": 100_000,
    "value_medium": 10_000,
    "age_critical": 90,
    "age_high": 60,
    "age_medium": 30,
}


def _priority(age_days: int, value: float) -> str:
    age = int(age_days or 0)
    val = flt(value)
    if age >= _PRIORITY_THRESHOLDS["age_critical"] or val >= _PRIORITY_THRESHOLDS["value_critical"]:
        return "Critical"
    if age >= _PRIORITY_THRESHOLDS["age_high"] or val >= _PRIORITY_THRESHOLDS["value_high"]:
        return "High"
    if age >= _PRIORITY_THRESHOLDS["age_medium"] or val >= _PRIORITY_THRESHOLDS["value_medium"]:
        return "Medium"
    return "Low"


def _aging_buckets(items, age_field="age_days", value_field="grand_total"):
    buckets = [
        {"label": "0–7 days",   "min": 0,  "max": 7,   "count": 0, "value": 0.0},
        {"label": "8–30 days",  "min": 8,  "max": 30,  "count": 0, "value": 0.0},
        {"label": "31–60 days", "min": 31, "max": 60,  "count": 0, "value": 0.0},
        {"label": "61–90 days", "min": 61, "max": 90,  "count": 0, "value": 0.0},
        {"label": "90+ days",   "min": 91, "max": 9999,"count": 0, "value": 0.0},
    ]
    for item in items:
        age = int(item.get(age_field) or 0)
        val = flt(item.get(value_field) or 0)
        for bucket in buckets:
            if bucket["min"] <= age <= bucket["max"]:
                bucket["count"] += 1
                bucket["value"] += val
                break
    for b in buckets:
        b["value"] = flt(b["value"], 2)
    return buckets


def _module_summary(items, value_field="grand_total", overdue_field=None):
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    total_value = 0.0
    overdue_count = 0
    for item in items:
        p = item.get("priority", "Low")
        counts[p] = counts.get(p, 0) + 1
        total_value += flt(item.get(value_field) or 0)
        if overdue_field and flt(item.get(overdue_field) or 0) > 0:
            overdue_count += 1
    return {
        "total": len(items),
        "critical": counts["Critical"],
        "high": counts["High"],
        "medium": counts["Medium"],
        "low": counts["Low"],
        "total_value": flt(total_value, 2),
        "overdue_count": overdue_count,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

@frappe.whitelist()
def get_process_exception_data(filters=None):
    """Main entry point — collects all module audit data in one call."""
    if isinstance(filters, str):
        filters = frappe.parse_json(filters)
    filters = frappe._dict(filters or {})

    if not filters.get("company"):
        filters["company"] = (
            frappe.defaults.get_user_default("Company")
            or frappe.db.get_single_value("Global Defaults", "default_company")
        )

    company = filters.company

    from erpnext import get_company_currency
    currency = get_company_currency(company)

    po    = get_po_audit(company, filters)
    mr    = get_mr_audit(company, filters)
    pi    = get_pi_audit(company, filters)
    pe    = get_payment_audit(company, filters)
    je    = get_je_audit(company, filters)
    asset = get_asset_audit(company, filters)
    pre   = get_prepaid_audit(company, filters)
    so    = get_so_audit(company, filters)
    si    = get_si_audit(company, filters)

    scores = _calculate_scores(po, mr, pi, pe, je, asset, pre, so, si)
    insights = _build_top_insights(po, mr, pi, pe, je, asset, pre, so, si)

    return {
        "company": company,
        "currency": currency,
        "as_of": nowdate(),
        "scores": scores,
        "insights": insights,
        "po_audit":      po,
        "mr_audit":      mr,
        "pi_audit":      pi,
        "payment_audit": pe,
        "je_audit":      je,
        "asset_audit":   asset,
        "prepaid_audit": pre,
        "so_audit":      so,
        "si_audit":      si,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 1 — PURCHASE ORDER AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_po_audit(company, filters):
    rows = frappe.db.sql("""
        SELECT
            po.name, po.supplier, po.supplier_name,
            po.transaction_date, po.schedule_date,
            po.grand_total, po.base_grand_total,
            COALESCE(po.per_received, 0)  AS per_received,
            COALESCE(po.per_billed, 0)    AS per_billed,
            po.status,
            COALESCE(po.workflow_state, po.status) AS workflow_state,
            DATEDIFF(CURDATE(), po.transaction_date) AS age_days,
            CASE WHEN po.schedule_date < CURDATE()
                 THEN DATEDIFF(CURDATE(), po.schedule_date) ELSE 0 END AS days_past_delivery
        FROM `tabPurchase Order` po
        WHERE po.docstatus = 1
          AND po.company = %(company)s
          AND po.status NOT IN ('Closed','Cancelled','Completed')
        ORDER BY po.base_grand_total DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in rows:
        r["priority"] = _priority(r.age_days, r.base_grand_total)
        r["not_received"] = r.per_received < 100
        r["not_billed"]   = r.per_billed < 100
        items.append(dict(r))

    # Top-10 critical POs for summary table
    critical_pos = sorted(
        [i for i in items if i["priority"] in ("Critical", "High")],
        key=lambda x: (-x.get("base_grand_total", 0), -x.get("age_days", 0))
    )[:10]

    # Supplier-wise outstanding
    sup_map = {}
    for i in items:
        s = i.get("supplier_name") or i.get("supplier", "")
        sup_map.setdefault(s, {"supplier": s, "count": 0, "value": 0.0})
        sup_map[s]["count"] += 1
        sup_map[s]["value"] += flt(i.get("base_grand_total") or 0)
    supplier_summary = sorted(sup_map.values(), key=lambda x: -x["value"])[:10]
    for s in supplier_summary:
        s["value"] = flt(s["value"], 2)

    return {
        "summary": _module_summary(items, "base_grand_total", "days_past_delivery"),
        "items": items,
        "critical_pos": critical_pos,
        "aging": _aging_buckets(items),
        "supplier_summary": supplier_summary,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 2 — MATERIAL REQUEST AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_mr_audit(company, filters):
    rows = frappe.db.sql("""
        SELECT
            mr.name, mr.title, mr.material_request_type,
            mr.company, mr.transaction_date, mr.schedule_date,
            mr.status,
            COALESCE(mr.per_ordered, 0) AS per_ordered,
            COALESCE(mr.workflow_state, mr.status) AS workflow_state,
            DATEDIFF(CURDATE(), mr.transaction_date) AS age_days,
            CASE WHEN mr.schedule_date < CURDATE()
                 THEN DATEDIFF(CURDATE(), mr.schedule_date) ELSE 0 END AS days_overdue
        FROM `tabMaterial Request` mr
        WHERE mr.docstatus = 1
          AND mr.company = %(company)s
          AND mr.status NOT IN ('Stopped','Cancelled','Transferred','Issued','Received')
        ORDER BY mr.transaction_date
        LIMIT 300
    """, {"company": company}, as_dict=True)

    by_purpose = {"Purchase": [], "Material Transfer": [], "Material Issue": [], "Other": []}
    for r in rows:
        r["priority"] = _priority(r.age_days, 0)
        purpose = r.material_request_type or "Other"
        if purpose not in by_purpose:
            purpose = "Other"
        by_purpose[purpose].append(dict(r))

    all_items = list(rows)
    return {
        "summary": _module_summary(all_items, "age_days"),
        "by_purpose": {k: {
            "items": v,
            "summary": _module_summary(v, "age_days", "days_overdue"),
            "aging": _aging_buckets(v),
        } for k, v in by_purpose.items() if v},
        "dept_summary": [],
        "items": all_items,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 3 — PURCHASE INVOICE AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_pi_audit(company, filters):
    rows = frappe.db.sql("""
        SELECT
            pi.name, pi.supplier, pi.supplier_name,
            pi.posting_date, pi.due_date,
            pi.grand_total, pi.base_grand_total,
            pi.outstanding_amount,
            DATEDIFF(CURDATE(), pi.posting_date) AS age_days,
            CASE WHEN pi.due_date < CURDATE()
                 THEN DATEDIFF(CURDATE(), pi.due_date) ELSE 0 END AS days_overdue,
            COALESCE(pi.workflow_state, 'Submitted') AS workflow_state
        FROM `tabPurchase Invoice` pi
        WHERE pi.docstatus = 1
          AND pi.company = %(company)s
          AND pi.outstanding_amount > 0
          AND pi.is_return = 0
        ORDER BY pi.outstanding_amount DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in rows:
        r["priority"] = _priority(r.days_overdue, r.outstanding_amount)
        items.append(dict(r))

    # AP aging buckets (by due date overdue)
    ap_aging = [
        {"label": "Current (not due)", "count": 0, "value": 0.0},
        {"label": "1–30 days overdue", "count": 0, "value": 0.0},
        {"label": "31–60 days overdue","count": 0, "value": 0.0},
        {"label": "61–90 days overdue","count": 0, "value": 0.0},
        {"label": "90+ days overdue",  "count": 0, "value": 0.0},
    ]
    for i in items:
        ov = int(i.get("days_overdue") or 0)
        val = flt(i.get("outstanding_amount") or 0)
        if ov <= 0:       ap_aging[0]["count"] += 1; ap_aging[0]["value"] += val
        elif ov <= 30:    ap_aging[1]["count"] += 1; ap_aging[1]["value"] += val
        elif ov <= 60:    ap_aging[2]["count"] += 1; ap_aging[2]["value"] += val
        elif ov <= 90:    ap_aging[3]["count"] += 1; ap_aging[3]["value"] += val
        else:             ap_aging[4]["count"] += 1; ap_aging[4]["value"] += val
    for b in ap_aging:
        b["value"] = flt(b["value"], 2)

    # Supplier outstanding summary
    sup_map = {}
    for i in items:
        s = i.get("supplier_name") or i.get("supplier", "")
        sup_map.setdefault(s, {"supplier": s, "count": 0, "outstanding": 0.0})
        sup_map[s]["count"] += 1
        sup_map[s]["outstanding"] += flt(i.get("outstanding_amount") or 0)
    supplier_summary = sorted(sup_map.values(), key=lambda x: -x["outstanding"])[:10]
    for s in supplier_summary:
        s["outstanding"] = flt(s["outstanding"], 2)

    # Duplicate detection: same supplier + same amount within 7 days
    duplicates = frappe.db.sql("""
        SELECT pi1.name AS invoice1, pi2.name AS invoice2,
               pi1.supplier_name,
               pi1.grand_total AS amount,
               pi1.posting_date AS date1, pi2.posting_date AS date2,
               DATEDIFF(pi2.posting_date, pi1.posting_date) AS days_apart
        FROM `tabPurchase Invoice` pi1
        JOIN `tabPurchase Invoice` pi2
          ON pi1.supplier = pi2.supplier
         AND pi1.name < pi2.name
         AND ABS(pi1.grand_total - pi2.grand_total) < 1
         AND DATEDIFF(pi2.posting_date, pi1.posting_date) BETWEEN 0 AND 7
        WHERE pi1.docstatus = 1 AND pi2.docstatus = 1
          AND pi1.company = %(company)s
          AND pi1.is_return = 0
        ORDER BY pi1.grand_total DESC
        LIMIT 20
    """, {"company": company}, as_dict=True)

    total_outstanding = sum(flt(i.get("outstanding_amount") or 0) for i in items)
    return {
        "summary": _module_summary(items, "outstanding_amount", "days_overdue"),
        "items": items,
        "ap_aging": ap_aging,
        "supplier_summary": supplier_summary,
        "duplicates": list(duplicates),
        "total_outstanding": flt(total_outstanding, 2),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 4 — PAYMENT ENTRY AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_payment_audit(company, filters):
    # Draft payment entries (all workflow states)
    drafts = frappe.db.sql("""
        SELECT
            pe.name, pe.payment_type, pe.party_type, pe.party, pe.party_name,
            pe.paid_amount, pe.posting_date,
            COALESCE(pe.workflow_state, 'Draft') AS workflow_state,
            DATEDIFF(CURDATE(), pe.posting_date)  AS age_days,
            DATEDIFF(CURDATE(), pe.modified)       AS days_in_state
        FROM `tabPayment Entry` pe
        WHERE pe.docstatus = 0
          AND pe.company = %(company)s
        ORDER BY pe.paid_amount DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    md_approved = []
    for r in drafts:
        r["priority"] = _priority(r.age_days, r.paid_amount)
        items.append(dict(r))
        if (r.get("workflow_state") or "").strip() == "MD Approved":
            md_approved.append(dict(r))

    # Separate aging for MD-Approved
    def md_priority(days_in_state):
        d = int(days_in_state or 0)
        if d >= 14:  return "Critical"
        if d >= 7:   return "High"
        if d >= 3:   return "Medium"
        return "Low"

    for r in md_approved:
        r["md_priority"] = md_priority(r.get("days_in_state") or 0)

    md_over_3  = [r for r in md_approved if int(r.get("days_in_state") or 0) >= 3]
    md_over_7  = [r for r in md_approved if int(r.get("days_in_state") or 0) >= 7]
    md_over_14 = [r for r in md_approved if int(r.get("days_in_state") or 0) >= 14]

    total_draft_value = sum(flt(r.get("paid_amount") or 0) for r in items)
    total_md_value    = sum(flt(r.get("paid_amount") or 0) for r in md_approved)

    return {
        "summary": _module_summary(items, "paid_amount"),
        "items": items,
        "md_approved": md_approved,
        "md_over_3":   md_over_3,
        "md_over_7":   md_over_7,
        "md_over_14":  md_over_14,
        "aging": _aging_buckets(items, "age_days", "paid_amount"),
        "total_draft_value": flt(total_draft_value, 2),
        "total_md_value":    flt(total_md_value, 2),
        "md_count":          len(md_approved),
        "md_critical_count": len([r for r in md_approved if r.get("md_priority") == "Critical"]),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 5 — JOURNAL ENTRY AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_je_audit(company, filters):
    # Draft JEs
    drafts = frappe.db.sql("""
        SELECT
            je.name, je.voucher_type, je.posting_date,
            je.total_debit, je.user_remark, je.cheque_no,
            COALESCE(je.workflow_state, 'Draft') AS workflow_state,
            DATEDIFF(CURDATE(), je.posting_date) AS age_days
        FROM `tabJournal Entry` je
        WHERE je.docstatus = 0
          AND je.company = %(company)s
        ORDER BY je.total_debit DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in drafts:
        r["priority"] = _priority(r.age_days, r.total_debit)
        r["missing_reference"] = not bool(r.get("cheque_no") or r.get("user_remark"))
        items.append(dict(r))

    # High-value submitted JEs (potential anomalies)
    unusual = frappe.db.sql("""
        SELECT
            je.name, je.voucher_type, je.posting_date,
            je.total_debit, je.user_remark,
            COALESCE(je.workflow_state, 'Submitted') AS workflow_state
        FROM `tabJournal Entry` je
        WHERE je.docstatus = 1
          AND je.company = %(company)s
          AND je.total_debit > (
              SELECT AVG(j2.total_debit) * 3
              FROM `tabJournal Entry` j2
              WHERE j2.docstatus = 1 AND j2.company = %(company)s
                AND j2.total_debit > 0
          )
        ORDER BY je.total_debit DESC
        LIMIT 20
    """, {"company": company}, as_dict=True)

    by_type = {}
    for i in items:
        t = i.get("voucher_type") or "Journal Entry"
        by_type.setdefault(t, {"type": t, "count": 0, "value": 0.0})
        by_type[t]["count"] += 1
        by_type[t]["value"] += flt(i.get("total_debit") or 0)

    return {
        "summary": _module_summary(items, "total_debit"),
        "items": items,
        "unusual_entries": list(unusual),
        "by_type": list(by_type.values()),
        "aging": _aging_buckets(items, "age_days", "total_debit"),
        "missing_reference_count": sum(1 for i in items if i.get("missing_reference")),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 6 — ASSET AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_asset_audit(company, filters):
    assets = frappe.db.sql("""
        SELECT
            a.name, a.asset_name, a.asset_category, a.status,
            a.purchase_date, a.gross_purchase_amount,
            a.value_after_depreciation, a.custodian,
            DATEDIFF(CURDATE(), a.purchase_date) AS age_days,
            (a.gross_purchase_amount - a.value_after_depreciation) AS total_depreciated
        FROM `tabAsset` a
        WHERE a.docstatus = 1
          AND a.company = %(company)s
          AND a.status NOT IN ('Scrapped', 'Sold')
        ORDER BY a.gross_purchase_amount DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in assets:
        r["priority"] = _priority(0, r.gross_purchase_amount)
        r["missing_custodian"] = not bool(r.get("custodian"))
        r["fully_depreciated"] = flt(r.value_after_depreciation) <= 0
        items.append(dict(r))

    # Due depreciation entries not yet created
    missed_dep = []
    try:
        missed_dep = frappe.db.sql("""
            SELECT
                ds.parent AS asset, a.asset_name, a.asset_category,
                a.company,
                ds.schedule_date,
                ds.depreciation_amount,
                DATEDIFF(CURDATE(), ds.schedule_date) AS days_overdue
            FROM `tabDepreciation Schedule` ds
            JOIN `tabAsset` a ON a.name = ds.parent
            WHERE ds.schedule_date <= CURDATE()
              AND (ds.journal_entry IS NULL OR ds.journal_entry = '')
              AND a.docstatus = 1
              AND a.company = %(company)s
              AND a.status NOT IN ('Fully Depreciated','Scrapped','Sold')
            ORDER BY ds.schedule_date
            LIMIT 100
        """, {"company": company}, as_dict=True)
    except Exception:
        # Table may not exist or schema differs — graceful fallback
        pass

    missed_dep = list(missed_dep)

    for r in missed_dep:
        r["priority"] = _priority(int(r.get("days_overdue") or 0),
                                   flt(r.get("depreciation_amount") or 0))

    no_custodian = [i for i in items if i.get("missing_custodian")]
    anomalies = []
    for a in items:
        nbv  = flt(a.get("value_after_depreciation") or 0)
        cost = flt(a.get("gross_purchase_amount") or 0)
        if nbv > cost:
            anomalies.append({"asset": a.get("name"), "asset_name": a.get("asset_name", a.get("name")),
                               "issue": "Value exceeds cost",
                               "amount": flt(nbv - cost, 2)})
        if nbv < 0:
            anomalies.append({"asset": a.get("name"), "asset_name": a.get("asset_name", a.get("name")),
                               "issue": "Negative net book value",
                               "amount": flt(nbv, 2)})

    category_map = {}
    for i in items:
        cat = i.get("asset_category") or "Uncategorised"
        category_map.setdefault(cat, {"category": cat, "count": 0, "value": 0.0})
        category_map[cat]["count"] += 1
        category_map[cat]["value"] += flt(i.get("gross_purchase_amount") or 0)
    category_summary = sorted(category_map.values(), key=lambda x: -x["value"])
    for c in category_summary:
        c["value"] = flt(c["value"], 2)

    total_asset_value   = sum(flt(i.get("gross_purchase_amount") or 0) for i in items)
    total_net_value     = sum(flt(i.get("value_after_depreciation") or 0) for i in items)
    total_missed_dep    = sum(flt(r.get("depreciation_amount") or 0) for r in missed_dep)

    summary = _module_summary(items, "gross_purchase_amount")
    summary["missed_depreciation_count"] = len(missed_dep)
    summary["missed_depreciation_value"] = flt(total_missed_dep, 2)
    summary["no_custodian_count"]        = len(no_custodian)
    summary["anomaly_count"]             = len(anomalies)
    summary["total_asset_value"]         = flt(total_asset_value, 2)
    summary["total_net_value"]           = flt(total_net_value, 2)

    return {
        "summary": summary,
        "items": items,
        "missed_depreciation": missed_dep,
        "no_custodian": no_custodian,
        "anomalies": anomalies,
        "category_summary": category_summary,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 7 — PREPAID / DEFERRED EXPENSE AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_prepaid_audit(company, filters):
    # Active deferred expense account balances
    deferred_balances = frappe.db.sql("""
        SELECT acc.name AS account, acc.account_name,
               COALESCE(SUM(gle.debit - gle.credit), 0) AS balance
        FROM `tabGL Entry` gle
        JOIN `tabAccount` acc ON acc.name = gle.account
        WHERE acc.account_type = 'Deferred Expense'
          AND gle.company = %(company)s
          AND gle.is_cancelled = 0
          AND gle.posting_date <= CURDATE()
        GROUP BY acc.name
        HAVING balance > 0
        ORDER BY balance DESC
    """, {"company": company}, as_dict=True)

    # Draft JEs touching deferred expense accounts (pending amortization)
    pending_amortization = frappe.db.sql("""
        SELECT DISTINCT je.name, je.posting_date, je.total_debit,
               je.user_remark, COALESCE(je.workflow_state, 'Draft') AS workflow_state,
               DATEDIFF(CURDATE(), je.posting_date) AS age_days
        FROM `tabJournal Entry` je
        WHERE je.docstatus = 0
          AND je.company = %(company)s
          AND EXISTS (
              SELECT 1 FROM `tabJournal Entry Account` jea
              JOIN `tabAccount` acc ON acc.name = jea.account
              WHERE jea.parent = je.name
                AND acc.account_type = 'Deferred Expense'
          )
        ORDER BY je.posting_date
        LIMIT 100
    """, {"company": company}, as_dict=True)

    # Purchase invoices with deferred expense enabled
    deferred_pi = frappe.db.sql("""
        SELECT DISTINCT pi.name, pi.supplier_name, pi.posting_date,
               pi.grand_total, pi.outstanding_amount,
               DATEDIFF(CURDATE(), pi.posting_date) AS age_days
        FROM `tabPurchase Invoice` pi
        JOIN `tabPurchase Invoice Item` pii ON pii.parent = pi.name
        WHERE pi.docstatus = 1
          AND pi.company = %(company)s
          AND pii.enable_deferred_expense = 1
          AND pi.outstanding_amount > 0
        ORDER BY pi.grand_total DESC
        LIMIT 50
    """, {"company": company}, as_dict=True)

    items = list(pending_amortization)
    for r in items:
        r["priority"] = _priority(r.age_days, r.total_debit)

    total_deferred = sum(flt(r.get("balance") or 0) for r in deferred_balances)
    total_pending_amor = sum(flt(r.get("total_debit") or 0) for r in pending_amortization)

    summary = _module_summary(items, "total_debit")
    summary["total_deferred_balance"]    = flt(total_deferred, 2)
    summary["pending_amortization_count"] = len(pending_amortization)
    summary["pending_amortization_value"] = flt(total_pending_amor, 2)
    summary["deferred_pi_count"]         = len(deferred_pi)

    return {
        "summary": summary,
        "deferred_balances": list(deferred_balances),
        "pending_amortization": items,
        "deferred_pi": list(deferred_pi),
        "aging": _aging_buckets(items, "age_days", "total_debit"),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 8 — SALES ORDER AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_so_audit(company, filters):
    rows = frappe.db.sql("""
        SELECT
            so.name, so.customer, so.customer_name,
            so.transaction_date, so.delivery_date,
            so.grand_total, so.base_grand_total,
            COALESCE(so.per_delivered, 0) AS per_delivered,
            COALESCE(so.per_billed, 0)    AS per_billed,
            so.status,
            COALESCE(so.workflow_state, so.status) AS workflow_state,
            DATEDIFF(CURDATE(), so.transaction_date) AS age_days,
            CASE WHEN so.delivery_date < CURDATE()
                 THEN DATEDIFF(CURDATE(), so.delivery_date) ELSE 0 END AS days_past_delivery
        FROM `tabSales Order` so
        WHERE so.docstatus = 1
          AND so.company = %(company)s
          AND so.status NOT IN ('Closed','Cancelled','Completed')
        ORDER BY so.base_grand_total DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in rows:
        r["priority"] = _priority(r.age_days, r.base_grand_total)
        r["not_delivered"] = r.per_delivered < 100
        r["not_billed"]    = r.per_billed < 100
        items.append(dict(r))

    # Customer-wise pending
    cust_map = {}
    for i in items:
        c = i.get("customer_name") or i.get("customer", "")
        cust_map.setdefault(c, {"customer": c, "count": 0, "value": 0.0})
        cust_map[c]["count"] += 1
        cust_map[c]["value"] += flt(i.get("base_grand_total") or 0)
    customer_summary = sorted(cust_map.values(), key=lambda x: -x["value"])[:10]
    for c in customer_summary:
        c["value"] = flt(c["value"], 2)

    return {
        "summary": _module_summary(items, "base_grand_total", "days_past_delivery"),
        "items": items,
        "aging": _aging_buckets(items),
        "customer_summary": customer_summary,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODULE 9 — SALES INVOICE AUDIT
# ═══════════════════════════════════════════════════════════════════════════════

def get_si_audit(company, filters):
    rows = frappe.db.sql("""
        SELECT
            si.name, si.customer, si.customer_name,
            si.posting_date, si.due_date,
            si.grand_total, si.base_grand_total,
            si.outstanding_amount,
            DATEDIFF(CURDATE(), si.posting_date) AS age_days,
            CASE WHEN COALESCE(si.due_date, si.posting_date) < CURDATE()
                 THEN DATEDIFF(CURDATE(), COALESCE(si.due_date, si.posting_date)) ELSE 0 END AS days_overdue
        FROM `tabSales Invoice` si
        WHERE si.docstatus = 1
          AND si.company = %(company)s
          AND si.outstanding_amount > 0
          AND si.is_return = 0
        ORDER BY si.outstanding_amount DESC
        LIMIT 200
    """, {"company": company}, as_dict=True)

    items = []
    for r in rows:
        r["priority"] = _priority(r.days_overdue, r.outstanding_amount)
        items.append(dict(r))

    # AR aging buckets
    ar_aging = [
        {"label": "Current",          "count": 0, "value": 0.0},
        {"label": "1–30 days overdue","count": 0, "value": 0.0},
        {"label": "31–60 days",       "count": 0, "value": 0.0},
        {"label": "61–90 days",       "count": 0, "value": 0.0},
        {"label": "90+ days",         "count": 0, "value": 0.0},
    ]
    for i in items:
        ov = int(i.get("days_overdue") or 0)
        val = flt(i.get("outstanding_amount") or 0)
        if ov <= 0:     ar_aging[0]["count"] += 1; ar_aging[0]["value"] += val
        elif ov <= 30:  ar_aging[1]["count"] += 1; ar_aging[1]["value"] += val
        elif ov <= 60:  ar_aging[2]["count"] += 1; ar_aging[2]["value"] += val
        elif ov <= 90:  ar_aging[3]["count"] += 1; ar_aging[3]["value"] += val
        else:           ar_aging[4]["count"] += 1; ar_aging[4]["value"] += val
    for b in ar_aging:
        b["value"] = flt(b["value"], 2)

    # Customer-wise outstanding
    cust_map = {}
    for i in items:
        c = i.get("customer_name") or i.get("customer", "")
        cust_map.setdefault(c, {"customer": c, "count": 0, "outstanding": 0.0})
        cust_map[c]["count"] += 1
        cust_map[c]["outstanding"] += flt(i.get("outstanding_amount") or 0)
    customer_summary = sorted(cust_map.values(), key=lambda x: -x["outstanding"])[:10]
    for c in customer_summary:
        c["outstanding"] = flt(c["outstanding"], 2)

    # Bad-debt risk: 90+ days with significant balance
    bad_debt_risk = [i for i in items if int(i.get("days_overdue") or 0) >= 90
                     and flt(i.get("outstanding_amount") or 0) > 0]
    total_bad_debt_risk = sum(flt(i.get("outstanding_amount") or 0) for i in bad_debt_risk)
    total_outstanding = sum(flt(i.get("outstanding_amount") or 0) for i in items)

    # Repeated offenders: customers with 3+ overdue invoices
    repeat_offenders = sorted(
        [c for c in customer_summary if c["count"] >= 3],
        key=lambda x: -x["outstanding"]
    )

    summary = _module_summary(items, "outstanding_amount", "days_overdue")
    summary["total_outstanding"]     = flt(total_outstanding, 2)
    summary["bad_debt_risk_count"]   = len(bad_debt_risk)
    summary["bad_debt_risk_value"]   = flt(total_bad_debt_risk, 2)
    summary["repeat_offender_count"] = len(repeat_offenders)

    return {
        "summary": summary,
        "items": items,
        "ar_aging": ar_aging,
        "customer_summary": customer_summary,
        "bad_debt_risk": bad_debt_risk[:10],
        "repeat_offenders": repeat_offenders[:5],
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  SCORE CALCULATION
# ═══════════════════════════════════════════════════════════════════════════════

def _calculate_scores(*modules):
    total_crit = 0; total_high = 0; total_med = 0; total_low = 0

    for m in modules:
        if not m:
            continue
        s = m.get("summary", {})
        total_crit += s.get("critical", 0)
        total_high += s.get("high", 0)
        total_med  += s.get("medium", 0)
        total_low  += s.get("low", 0)

    weighted = total_crit * 10 + total_high * 4 + total_med * 2 + total_low * 0.5
    health = max(0, min(100, 100 - min(weighted / 5, 100)))

    po, mr, pi, pe, je, asset, pre, so, si = modules

    # Procurement Risk
    po_crit = (po.get("summary") or {}).get("critical", 0)
    po_total = max((po.get("summary") or {}).get("total", 1), 1)
    proc_risk = min(100, (po_crit / po_total) * 100 + ((mr.get("summary") or {}).get("overdue_count", 0) / max((mr.get("summary") or {}).get("total", 1), 1)) * 50)

    # Accounting Risk
    je_items = len((je.get("items") or []))
    pe_md = (pe.get("md_critical_count") or 0)
    acct_risk = min(100, je_items * 2 + pe_md * 15)

    # Asset Compliance
    missed_dep = (asset.get("summary") or {}).get("missed_depreciation_count", 0)
    asset_total = max((asset.get("summary") or {}).get("total", 1), 1)
    asset_compliance = max(0, 100 - min((missed_dep / asset_total) * 100, 100))

    # Collection Risk
    si_summary = si.get("summary") or {}
    total_ar = max(si_summary.get("total_outstanding", 1) or 1, 1)
    bad_debt = si_summary.get("bad_debt_risk_value", 0) or 0
    collection_risk = min(100, (bad_debt / total_ar) * 100)

    # Compliance Score
    compliance = max(0, 100 - (total_crit * 5 + total_high * 2))

    # Total pending / overdue
    total_pending = sum(
        (m.get("summary") or {}).get("total", 0) for m in modules if m
    )
    total_overdue = sum(
        (m.get("summary") or {}).get("overdue_count", 0) for m in modules if m
    )
    total_ar_out = (si.get("summary") or {}).get("total_outstanding", 0) or 0
    total_ap_out = (pi.get("summary") or {}).get("total_outstanding", 0) or pi.get("total_outstanding", 0) or 0

    return {
        "audit_health_score":      round(health),
        "compliance_score":        round(max(0, compliance)),
        "risk_score":              round(min(100, weighted / 2)),
        "critical_count":          total_crit,
        "high_count":              total_high,
        "medium_count":            total_med,
        "low_count":               total_low,
        "total_pending_actions":   total_pending,
        "total_overdue_transactions": total_overdue,
        "total_outstanding_receivables": flt(total_ar_out, 2),
        "total_outstanding_payables":    flt(total_ap_out, 2),
        "procurement_risk_score":  round(proc_risk),
        "accounting_risk_score":   round(acct_risk),
        "asset_compliance_score":  round(asset_compliance),
        "collection_risk_score":   round(collection_risk),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MANAGEMENT INSIGHTS — Top Issues Across All Modules
# ═══════════════════════════════════════════════════════════════════════════════

def _build_top_insights(*modules):
    """Collect Critical + High items across all modules for the top-insights panel."""
    module_labels = [
        "Purchase Order", "Material Request", "Purchase Invoice",
        "Payment Entry", "Journal Entry", "Asset",
        "Prepaid Expense", "Sales Order", "Sales Invoice",
    ]
    insights = []

    for module, label in zip(modules, module_labels):
        if not module:
            continue
        items = module.get("items") or []
        for item in items:
            priority = item.get("priority", "Low")
            if priority not in ("Critical", "High"):
                continue
            name_field = (item.get("name") or "")
            value_fields = ["base_grand_total", "outstanding_amount", "paid_amount",
                            "total_debit", "gross_purchase_amount"]
            value = next((flt(item.get(f) or 0)
                          for f in value_fields if item.get(f)), 0.0)

            insights.append({
                "module":   label,
                "docname":  name_field,
                "priority": priority,
                "value":    value,
                "age_days": item.get("age_days") or 0,
                "desc":     _insight_desc(label, item),
            })

    # Sort: Critical first, then by value desc
    insights.sort(key=lambda x: (0 if x["priority"] == "Critical" else 1, -x["value"]))
    return insights[:50]


def _insight_desc(module, item):
    """Short human-readable description of the issue."""
    age = item.get("age_days") or 0
    if module == "Purchase Order":
        s = item.get("supplier_name") or item.get("supplier", "")
        return f"{s} — PO pending {age} days"
    elif module == "Purchase Invoice":
        s = item.get("supplier_name") or item.get("supplier", "")
        return f"{s} — Outstanding {age} days old"
    elif module == "Payment Entry":
        ws = item.get("workflow_state", "Draft")
        return f"{ws} payment {age} days, amount {flt(item.get('paid_amount') or 0, 2)}"
    elif module == "Sales Invoice":
        c = item.get("customer_name") or item.get("customer", "")
        ov = item.get("days_overdue") or 0
        return f"{c} — Overdue {ov} days"
    elif module == "Asset":
        return f"{item.get('asset_name', item.get('name', ''))} — {item.get('status', '')}"
    elif module == "Sales Order":
        c = item.get("customer_name") or item.get("customer", "")
        return f"{c} — {age} days old"
    else:
        return f"{item.get('name', '')} — {age} days old"


# ═══════════════════════════════════════════════════════════════════════════════
#  AI ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════════

@frappe.whitelist()
def get_process_exception_ai_analysis(filters=None, lang=None):
    """Full AI analysis for the Finance Process Exception dashboard."""
    try:
        settings = frappe.get_single("Financial Audit Settings")
    except Exception:
        frappe.throw(_("Financial Audit Settings not found. Please configure AI settings."))

    if not cint(settings.enabled):
        frappe.throw(_("AI Analysis is disabled. Enable it in Financial Audit Settings."))

    if isinstance(filters, str):
        filters = frappe.parse_json(filters)
    filters = frappe._dict(filters or {})
    lang = lang or frappe.local.lang or "en"

    user = frappe.session.user
    today = nowdate()
    cache_key = f"fpa_ai:{user}:{today}"
    request_count = cint(frappe.cache.get(cache_key))
    if request_count >= cint(settings.max_requests_per_day or 20):
        frappe.throw(_("Daily AI request limit exceeded."))

    data = get_process_exception_data(filters)
    prompt = _build_process_ai_prompt(data, lang)
    provider = settings.ai_provider or "Puter (Free)"

    if provider == "Puter (Free)":
        _increment_rate_limit(cache_key)
        _log_ai_request(user, filters, "Success", provider=provider, model=settings.model_name)
        return {"provider": "Puter", "prompt": prompt}

    if not settings.api_key:
        frappe.throw(_("API Key required for {0}").format(provider))

    start = time.time()
    try:
        ai_response = call_ai_api(settings, prompt)
        elapsed = round(time.time() - start, 2)
        _increment_rate_limit(cache_key)
        _log_ai_request(user, filters, "Success", provider=provider,
                        model=settings.model_name, response_time=elapsed)
        return {"provider": provider, "analysis": ai_response}
    except Exception as e:
        elapsed = round(time.time() - start, 2)
        _log_ai_request(user, filters, "Failed", provider=provider,
                        error=str(e)[:500], model=settings.model_name, response_time=elapsed)
        frappe.log_error(title="Process Audit AI Error", message=frappe.get_traceback())
        frappe.throw(_("AI analysis failed: {0}").format(str(e)))


def _build_process_ai_prompt(data: dict, lang: str = "en") -> str:
    """Build the AI prompt from process exception data."""
    sc = data.get("scores") or {}
    currency = data.get("currency", "")
    company  = data.get("company", "")

    def fmt(v):
        if v is None: return "0"
        try: return f"{v:,.2f}" if isinstance(v, float) else f"{v:,}"
        except: return str(v)

    def module_summary(key, label):
        m = (data.get(key) or {}).get("summary") or {}
        return (f"{label}: {m.get('total',0)} items — "
                f"Critical {m.get('critical',0)}, High {m.get('high',0)}, "
                f"Medium {m.get('medium',0)}, Low {m.get('low',0)}, "
                f"Value {fmt(m.get('total_value') or m.get('total_outstanding'))} {currency}")

    sections = "\n".join([
        module_summary("po_audit",      "Purchase Orders"),
        module_summary("mr_audit",      "Material Requests"),
        module_summary("pi_audit",      "Purchase Invoices"),
        module_summary("payment_audit", "Payment Entries"),
        module_summary("je_audit",      "Journal Entries"),
        module_summary("asset_audit",   "Fixed Assets"),
        module_summary("prepaid_audit", "Prepaid/Deferred Expenses"),
        module_summary("so_audit",      "Sales Orders"),
        module_summary("si_audit",      "Sales Invoices"),
    ])

    top_insights = "\n".join(
        f"- [{i.get('priority')}] {i.get('module')}: {i.get('desc')} (Value: {fmt(i.get('value'))} {currency})"
        for i in (data.get("insights") or [])[:20]
    ) or "No critical issues detected"

    md_count = (data.get("payment_audit") or {}).get("md_count", 0)
    md_crit  = (data.get("payment_audit") or {}).get("md_critical_count", 0)
    missed_dep = (data.get("asset_audit") or {}).get("summary", {}).get("missed_depreciation_count", 0)
    bad_debt   = (data.get("si_audit") or {}).get("summary", {}).get("bad_debt_risk_value", 0)

    if lang == "ar":
        intro = (f'أنت مدقق مالي خبير. قم بتحليل بيانات عمليات المالية لشركة "{company}" '
                 f'بتاريخ {data.get("as_of","")} وقدم تقرير مراجعة شاملاً باللغة العربية.')
        requirements = """## التحليل المطلوب:
1. **تقييم الصحة العامة للعمليات المالية** (درجة من 100)
2. **أبرز المخاطر والاستثناءات العاجلة**
3. **تحليل أوامر الشراء المتعثرة وأثرها على التدفق النقدي**
4. **تقييم الذمم الدائنة والمدينة المتأخرة**
5. **تحليل قيود اليومية المعلقة ومخاطرها المحاسبية**
6. **تقييم أداء تحصيل المديونيات**
7. **مخاطر الإهلاك الفائت وأثره على القوائم المالية**
8. **التوصيات ذات الأولوية للأسبوع القادم**
9. **ملخص تنفيذي للإدارة العليا**"""
    else:
        intro = (f'You are an expert financial auditor and process controller. Analyze the following '
                 f'financial process exception data for company "{company}" as of {data.get("as_of","")} '
                 f'and provide a comprehensive audit report in English.')
        requirements = """## Required Analysis:
1. **Overall Financial Process Health Assessment** (score out of 100 with rationale)
2. **Top Critical Exceptions Requiring Immediate Action**
3. **Procurement Process Risks** — stuck POs, supplier delays, approval bottlenecks
4. **Payables Health** — aging AP, payment delays, cash flow impact
5. **Receivables Health** — collection risk, bad debt exposure, customer behavior
6. **Accounting Control Gaps** — draft JEs, pending payments, missing entries
7. **Asset Compliance Risks** — missed depreciation, custodian gaps
8. **Operational Bottlenecks** — departments/processes causing delays
9. **Priority Recommendations for Next 7 Days** — specific, actionable, ranked
10. **Executive Summary for MD/CFO** — 3-5 bullet points on biggest risks"""

    prompt = f"""{intro}

## Dashboard Scores:
- Audit Health Score: {sc.get("audit_health_score", 0)}/100
- Compliance Score: {sc.get("compliance_score", 0)}/100
- Risk Score: {sc.get("risk_score", 0)}/100
- Procurement Risk: {sc.get("procurement_risk_score", 0)}/100
- Accounting Risk: {sc.get("accounting_risk_score", 0)}/100
- Asset Compliance: {sc.get("asset_compliance_score", 0)}/100
- Collection Risk: {sc.get("collection_risk_score", 0)}/100

## Issue Distribution:
- Critical Issues: {sc.get("critical_count", 0)}
- High Priority: {sc.get("high_count", 0)}
- Medium Priority: {sc.get("medium_count", 0)}
- Low Priority: {sc.get("low_count", 0)}
- Total Pending Actions: {sc.get("total_pending_actions", 0)}

## Outstanding Balances:
- Total Receivables Outstanding: {fmt(sc.get("total_outstanding_receivables"))} {currency}
- Total Payables Outstanding: {fmt(sc.get("total_outstanding_payables"))} {currency}

## Module-by-Module Summary:
{sections}

## Special Alert Items:
- Payment Entries with MD Approved status (not submitted): {md_count} entries, {md_crit} critical (>14 days)
- Missed Asset Depreciation Entries: {missed_dep} schedules overdue
- Bad Debt Risk (90+ days overdue AR): {fmt(bad_debt)} {currency}

## Top 20 Critical & High Priority Issues:
{top_insights}

{requirements}

Provide specific document names, supplier/customer names, and monetary amounts where available.
Identify root causes, not just symptoms. Recommend specific actions with owners and timelines."""

    return prompt


@frappe.whitelist()
def get_module_ai_analysis(module_key=None, module_data=None, lang=None):
    """AI analysis for a single module — used for per-section AI buttons."""
    try:
        settings = frappe.get_single("Financial Audit Settings")
    except Exception:
        frappe.throw(_("Financial Audit Settings not found."))

    if not cint(settings.enabled):
        frappe.throw(_("AI Analysis is disabled."))

    if isinstance(module_data, str):
        module_data = frappe.parse_json(module_data)
    lang = lang or frappe.local.lang or "en"

    user = frappe.session.user
    today = nowdate()
    cache_key = f"fpa_module_ai:{user}:{today}"
    if cint(frappe.cache.get(cache_key)) >= cint(settings.max_requests_per_day or 20):
        frappe.throw(_("Daily AI request limit exceeded."))

    prompt = _build_module_prompt(module_key or "", module_data or {}, lang)
    provider = settings.ai_provider or "Puter (Free)"

    if provider == "Puter (Free)":
        _increment_rate_limit(cache_key)
        return {"provider": "Puter", "prompt": prompt}

    if not settings.api_key:
        frappe.throw(_("API Key required for {0}").format(provider))

    start = time.time()
    ai_response = call_ai_api(settings, prompt)
    elapsed = round(time.time() - start, 2)
    _increment_rate_limit(cache_key)
    return {"provider": provider, "analysis": ai_response}


def _build_module_prompt(module_key: str, data: dict, lang: str) -> str:
    """Build a focused prompt for a single module."""
    s = data.get("summary") or {}
    module_titles = {
        "po_audit":      "Purchase Order",
        "mr_audit":      "Material Request",
        "pi_audit":      "Purchase Invoice",
        "payment_audit": "Payment Entry",
        "je_audit":      "Journal Entry",
        "asset_audit":   "Fixed Asset",
        "prepaid_audit": "Prepaid/Deferred Expense",
        "so_audit":      "Sales Order",
        "si_audit":      "Sales Invoice",
    }
    title = module_titles.get(module_key, module_key)

    items_text = ""
    items = (data.get("items") or [])[:15]
    for i in items:
        row_parts = []
        for k in ["name", "supplier_name", "customer_name", "asset_name", "priority",
                  "age_days", "days_overdue", "base_grand_total", "outstanding_amount",
                  "paid_amount", "total_debit", "workflow_state", "status"]:
            if i.get(k) is not None:
                row_parts.append(f"{k}: {i[k]}")
        items_text += "- " + " | ".join(row_parts) + "\n"

    if lang == "ar":
        prompt = f"""أنت مدقق مالي خبير. حلل بيانات قسم {title} التالية وقدم:
1. ملخص تنفيذي (3 أسطر)
2. أبرز الاستثناءات والمخاطر
3. تحليل الأسباب الجذرية
4. توصيات محددة وعملية مرتبة حسب الأولوية
5. التأثير المالي والتشغيلي
6. الإجراء الأولوي التالي

البيانات:
- إجمالي السجلات: {s.get('total',0)}
- حرج: {s.get('critical',0)} | عالي: {s.get('high',0)} | متوسط: {s.get('medium',0)} | منخفض: {s.get('low',0)}
- القيمة الإجمالية: {s.get('total_value', s.get('total_outstanding', 0))}

أبرز السجلات:
{items_text}

قدم التحليل منظماً بعناوين واضحة باللغة العربية."""
    else:
        prompt = f"""You are an expert financial auditor. Analyze the following {title} exception data and provide:
1. Executive Summary (3 lines)
2. Key Exceptions & Risks identified
3. Root Cause Analysis
4. Specific, prioritized recommendations with owners
5. Financial & operational impact assessment
6. Immediate Next Best Action

Data Summary:
- Total Records: {s.get('total',0)}
- Critical: {s.get('critical',0)} | High: {s.get('high',0)} | Medium: {s.get('medium',0)} | Low: {s.get('low',0)}
- Total Value at Risk: {s.get('total_value', s.get('total_outstanding', 0))}

Top {title} Records:
{items_text}

Provide structured analysis with clear headings. Reference specific document names and amounts.
Explain WHY issues exist and WHAT should be done next."""

    return prompt
