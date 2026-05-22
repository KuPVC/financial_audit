import frappe
from frappe.utils import now


@frappe.whitelist()
def get_accounting_audit_data(filters=None):
	"""
	Main entry point for the Accounting Audit Dashboard.
	Runs all accounting configuration checks across all companies
	and returns findings with severity levels.
	"""
	if isinstance(filters, str):
		filters = frappe.parse_json(filters)
	filters = frappe._dict(filters or {})

	findings = []

	# Pre-compute shared data once to avoid repeated DB hits across checks
	company_names = frappe.get_all("Company", pluck="name")
	companies_data = frappe.get_all(
		"Company",
		fields=[
			"name", "default_currency", "cost_center",
			"default_receivable_account", "default_payable_account",
			"default_bank_account", "default_cash_account",
			"default_expense_account", "default_income_account",
			"round_off_account", "write_off_account",
			"exchange_gain_loss_account", "default_payroll_payable_account",
			"default_expense_claim_payable_account", "stock_adjustment_account",
			"accumulated_depreciation_account", "depreciation_expense_account",
			"default_inventory_account", "capital_work_in_progress_account",
			"default_deferred_revenue_account", "default_deferred_expense_account",
			"default_buying_terms", "default_selling_terms",
			"perpetual_inventory",
		],
	)
	# Single full Account scan — shared across all checks that need CoA validation
	existing_accounts = set(frappe.get_all("Account", pluck="name"))

	# Run all checks
	findings.extend(check_company_defaults(companies_data, existing_accounts))
	findings.extend(check_salary_components(company_names))
	findings.extend(check_asset_categories(company_names))
	findings.extend(check_mode_of_payment(company_names))
	findings.extend(check_item_defaults(company_names))
	findings.extend(check_tax_templates(existing_accounts))
	findings.extend(check_warehouse_accounts(companies_data))
	findings.extend(check_cost_centers(companies_data, company_names))
	findings.extend(check_bank_accounts())
	findings.extend(check_employee_payroll())
	findings.extend(check_payroll_settings())
	findings.extend(check_item_tax_templates(existing_accounts))

	# Apply company filter if provided
	filter_company = filters.get("company")
	if filter_company:
		findings = [f for f in findings if not f.get("company") or f.get("company") == filter_company]

	# Build summary
	critical_count = sum(1 for f in findings if f.get("severity") == "Critical")
	warning_count = sum(1 for f in findings if f.get("severity") == "Warning")
	info_count = sum(1 for f in findings if f.get("severity") == "Info")
	categories = sorted({f.get("category", "") for f in findings if f.get("category")})

	return {
		"findings": findings,
		"summary": {
			"critical": critical_count,
			"warning": warning_count,
			"info": info_count,
			"total": len(findings),
			"companies": company_names,
			"categories": categories,
		},
		"generated_at": now(),
	}


# ─────────────────────────────────────────────────────────────
# A. Company Default Accounts
# ─────────────────────────────────────────────────────────────

def check_company_defaults(companies_data, existing_accounts):
	findings = []

	# (field, severity, label, is_account)
	# is_account=False skips CoA existence check
	fields_config = [
		("default_receivable_account", "Critical", "Default Receivable Account", True),
		("default_payable_account", "Critical", "Default Payable Account", True),
		("default_bank_account", "Critical", "Default Bank Account", True),
		("cost_center", "Critical", "Default Cost Center", False),
		("default_cash_account", "Warning", "Default Cash Account", True),
		("default_expense_account", "Warning", "Default Expense Account", True),
		("default_income_account", "Warning", "Default Income Account", True),
		("round_off_account", "Warning", "Round Off Account", True),
		("write_off_account", "Warning", "Write Off Account", True),
		("exchange_gain_loss_account", "Warning", "Exchange Gain/Loss Account", True),
		("default_payroll_payable_account", "Warning", "Default Payroll Payable Account", True),
		("default_expense_claim_payable_account", "Warning", "Expense Claim Payable Account", True),
		("stock_adjustment_account", "Warning", "Stock Adjustment Account", True),
		("accumulated_depreciation_account", "Warning", "Accumulated Depreciation Account", True),
		("depreciation_expense_account", "Warning", "Depreciation Expense Account", True),
		("default_inventory_account", "Warning", "Default Inventory Account", True),
		("capital_work_in_progress_account", "Info", "Capital WIP Account", True),
		("default_deferred_revenue_account", "Info", "Default Deferred Revenue Account", True),
		("default_deferred_expense_account", "Info", "Default Deferred Expense Account", True),
		("default_buying_terms", "Info", "Default Buying Terms", False),
		("default_selling_terms", "Info", "Default Selling Terms", False),
	]

	for company in companies_data:
		for field, severity, label, is_account in fields_config:
			value = company.get(field)
			if not value:
				findings.append({
					"severity": severity,
					"category": "Company Defaults",
					"doctype": "Company",
					"record": company["name"],
					"company": company["name"],
					"field": field,
					"issue": f"{label} is not set for company '{company['name']}'",
					"action": f"Go to Company '{company['name']}' and set the {label} field.",
					"link": f"Form/Company/{company['name']}",
				})
			elif is_account and value not in existing_accounts:
				findings.append({
					"severity": severity,
					"category": "Company Defaults",
					"doctype": "Company",
					"record": company["name"],
					"company": company["name"],
					"field": field,
					"issue": f"{label} '{value}' does not exist in Chart of Accounts for company '{company['name']}'",
					"action": f"Verify or recreate account '{value}' in the Chart of Accounts, then reassign it in Company settings.",
					"link": f"Form/Company/{company['name']}",
				})

	return findings


# ─────────────────────────────────────────────────────────────
# B. Salary Components
# ─────────────────────────────────────────────────────────────

def check_salary_components(company_names):
	findings = []

	rows = frappe.db.sql(
		"""
		SELECT sc.name, sc.type, sca.company, sca.account
		FROM `tabSalary Component` sc
		LEFT JOIN `tabSalary Component Account` sca ON sca.parent = sc.name
		WHERE sc.type IN ('Earning', 'Deduction')
		""",
		as_dict=True,
	)

	# Build map: component -> {company: account}
	component_map = {}
	for row in rows:
		comp = row["name"]
		if comp not in component_map:
			component_map[comp] = {"type": row["type"], "accounts": {}}
		if row.get("company"):
			component_map[comp]["accounts"][row["company"]] = row.get("account")

	for comp_name, data in component_map.items():
		for company in company_names:
			account = data["accounts"].get(company)
			if account is None:
				findings.append({
					"severity": "Critical",
					"category": "Salary",
					"doctype": "Salary Component",
					"record": comp_name,
					"company": company,
					"field": "account",
					"issue": f"Salary Component '{comp_name}' ({data['type']}) has no account configured for company '{company}'",
					"action": f"Open Salary Component '{comp_name}', go to Accounts tab and add a row for company '{company}'.",
					"link": f"Form/Salary Component/{comp_name}",
				})
			elif not account:
				findings.append({
					"severity": "Critical",
					"category": "Salary",
					"doctype": "Salary Component",
					"record": comp_name,
					"company": company,
					"field": "account",
					"issue": f"Salary Component '{comp_name}' ({data['type']}) has a blank account for company '{company}'",
					"action": f"Open Salary Component '{comp_name}', go to Accounts tab and set the account for company '{company}'.",
					"link": f"Form/Salary Component/{comp_name}",
				})

	return findings


# ─────────────────────────────────────────────────────────────
# C. Asset Categories
# ─────────────────────────────────────────────────────────────

def check_asset_categories(company_names):
	findings = []

	# ERPNext v16: tabAsset Category Account uses 'company_name' (not 'company')
	account_fields = [
		("fixed_asset_account", "Critical", "Fixed Asset Account"),
		("accumulated_depreciation_account", "Critical", "Accumulated Depreciation Account"),
		("depreciation_expense_account", "Critical", "Depreciation Expense Account"),
		("capital_work_in_progress_account", "Warning", "Capital WIP Account"),
	]

	field_list = ", ".join(["aca.company_name"] + [f"aca.{f[0]}" for f in account_fields])
	rows = frappe.db.sql(
		f"""
		SELECT ac.name AS category, {field_list}
		FROM `tabAsset Category` ac
		LEFT JOIN `tabAsset Category Account` aca ON aca.parent = ac.name
		""",
		as_dict=True,
	)

	# Map: category -> {company -> row}
	cat_map = {}
	for row in rows:
		cat = row["category"]
		if cat not in cat_map:
			cat_map[cat] = {}
		company = row.get("company_name")
		if company:
			cat_map[cat][company] = row

	for cat_name, company_rows in cat_map.items():
		for company in company_names:
			row = company_rows.get(company)
			if not row:
				findings.append({
					"severity": "Critical",
					"category": "Asset",
					"doctype": "Asset Category",
					"record": cat_name,
					"company": company,
					"field": "accounts",
					"issue": f"Asset Category '{cat_name}' has no accounts configured for company '{company}'",
					"action": f"Open Asset Category '{cat_name}' and add account entries for company '{company}'.",
					"link": f"Form/Asset Category/{cat_name}",
				})
			else:
				for field, severity, label in account_fields:
					if not row.get(field):
						findings.append({
							"severity": severity,
							"category": "Asset",
							"doctype": "Asset Category",
							"record": cat_name,
							"company": company,
							"field": field,
							"issue": f"Asset Category '{cat_name}' is missing '{label}' for company '{company}'",
							"action": f"Open Asset Category '{cat_name}' and set '{label}' for company '{company}'.",
							"link": f"Form/Asset Category/{cat_name}",
						})

	return findings


# ─────────────────────────────────────────────────────────────
# D. Mode of Payment
# ─────────────────────────────────────────────────────────────

def check_mode_of_payment(company_names):
	findings = []

	rows = frappe.db.sql(
		"""
		SELECT mop.name, mop.type, mopa.company, mopa.default_account
		FROM `tabMode of Payment` mop
		LEFT JOIN `tabMode of Payment Account` mopa ON mopa.parent = mop.name
		WHERE mop.type IN ('Cash', 'Bank', 'General')
		""",
		as_dict=True,
	)

	# Map: mop -> {company: account}
	mop_map = {}
	for row in rows:
		mop = row["name"]
		if mop not in mop_map:
			mop_map[mop] = {}
		if row.get("company"):
			mop_map[mop][row["company"]] = row.get("default_account")

	for mop_name, accounts in mop_map.items():
		for company in company_names:
			account = accounts.get(company)
			if account is None:
				findings.append({
					"severity": "Warning",
					"category": "Payment",
					"doctype": "Mode of Payment",
					"record": mop_name,
					"company": company,
					"field": "default_account",
					"issue": f"Mode of Payment '{mop_name}' has no default account for company '{company}'",
					"action": f"Open Mode of Payment '{mop_name}' and add a default account for company '{company}'.",
					"link": f"Form/Mode of Payment/{mop_name}",
				})
			elif not account:
				findings.append({
					"severity": "Warning",
					"category": "Payment",
					"doctype": "Mode of Payment",
					"record": mop_name,
					"company": company,
					"field": "default_account",
					"issue": f"Mode of Payment '{mop_name}' has a blank default account for company '{company}'",
					"action": f"Open Mode of Payment '{mop_name}' and set the default account for company '{company}'.",
					"link": f"Form/Mode of Payment/{mop_name}",
				})

	return findings


# ─────────────────────────────────────────────────────────────
# E. Item Defaults
# ─────────────────────────────────────────────────────────────

def check_item_defaults(company_names):
	findings = []

	# Only stock items that have had Stock Ledger movements; limit for performance
	items_with_transactions = frappe.db.sql(
		"""
		SELECT DISTINCT i.name, i.item_name
		FROM `tabItem` i
		INNER JOIN `tabStock Ledger Entry` sle ON sle.item_code = i.name
		WHERE i.is_stock_item = 1 AND i.disabled = 0
		LIMIT 500
		""",
		as_dict=True,
	)

	if not items_with_transactions:
		return findings

	item_names = [i["name"] for i in items_with_transactions]

	placeholders = ", ".join(["%s"] * len(item_names))
	defaults_rows = frappe.db.sql(
		f"""
		SELECT parent AS item, company, default_warehouse, income_account, expense_account
		FROM `tabItem Default`
		WHERE parent IN ({placeholders})
		""",
		tuple(item_names),
		as_dict=True,
	)

	# Map: item -> {company: row}
	defaults_map = {}
	for row in defaults_rows:
		item = row["item"]
		if item not in defaults_map:
			defaults_map[item] = {}
		defaults_map[item][row["company"]] = row

	for item_code in item_names:
		for company in company_names:
			row = defaults_map.get(item_code, {}).get(company)
			if not row:
				findings.append({
					"severity": "Critical",
					"category": "Inventory",
					"doctype": "Item",
					"record": item_code,
					"company": company,
					"field": "default_warehouse",
					"issue": f"Stock item '{item_code}' has no Item Defaults configured for company '{company}'",
					"action": f"Open Item '{item_code}', go to Item Defaults and add an entry for company '{company}'.",
					"link": f"Form/Item/{item_code}",
				})
			else:
				if not row.get("default_warehouse"):
					findings.append({
						"severity": "Critical",
						"category": "Inventory",
						"doctype": "Item",
						"record": item_code,
						"company": company,
						"field": "default_warehouse",
						"issue": f"Stock item '{item_code}' has no Default Warehouse set for company '{company}'",
						"action": f"Open Item '{item_code}' and set Default Warehouse for company '{company}'.",
						"link": f"Form/Item/{item_code}",
					})
				if not row.get("income_account"):
					findings.append({
						"severity": "Warning",
						"category": "Inventory",
						"doctype": "Item",
						"record": item_code,
						"company": company,
						"field": "income_account",
						"issue": f"Stock item '{item_code}' has no Income Account set for company '{company}'",
						"action": f"Open Item '{item_code}' and set Income Account for company '{company}'.",
						"link": f"Form/Item/{item_code}",
					})
				if not row.get("expense_account"):
					findings.append({
						"severity": "Warning",
						"category": "Inventory",
						"doctype": "Item",
						"record": item_code,
						"company": company,
						"field": "expense_account",
						"issue": f"Stock item '{item_code}' has no Expense Account set for company '{company}'",
						"action": f"Open Item '{item_code}' and set Expense Account for company '{company}'.",
						"link": f"Form/Item/{item_code}",
					})

	return findings


# ─────────────────────────────────────────────────────────────
# F. Sales & Purchase Tax Templates
# ─────────────────────────────────────────────────────────────

def check_tax_templates(existing_accounts):
	findings = []

	def _check_template_rows(rows, doctype, link_prefix):
		template_map = {}
		for row in rows:
			tmpl = row["template"]
			if tmpl not in template_map:
				template_map[tmpl] = {"company": row.get("company", ""), "rows": []}
			template_map[tmpl]["rows"].append(row.get("account_head"))

		for tmpl_name, data in template_map.items():
			for account_head in data["rows"]:
				if account_head is None:
					findings.append({
						"severity": "Critical",
						"category": "Tax",
						"doctype": doctype,
						"record": tmpl_name,
						"company": data["company"],
						"field": "account_head",
						"issue": f"{doctype} '{tmpl_name}' has a row with no Account Head set",
						"action": f"Open '{tmpl_name}' and set Account Head on all tax rows.",
						"link": f"{link_prefix}/{tmpl_name}",
					})
				elif account_head not in existing_accounts:
					findings.append({
						"severity": "Warning",
						"category": "Tax",
						"doctype": doctype,
						"record": tmpl_name,
						"company": data["company"],
						"field": "account_head",
						"issue": f"{doctype} '{tmpl_name}' references Account Head '{account_head}' which does not exist",
						"action": f"Create account '{account_head}' in Chart of Accounts or update the template.",
						"link": f"{link_prefix}/{tmpl_name}",
					})

	sales_rows = frappe.db.sql(
		"""
		SELECT stct.name AS template, stct.company, stc.account_head
		FROM `tabSales Taxes and Charges Template` stct
		LEFT JOIN `tabSales Taxes and Charges` stc ON stc.parent = stct.name
		""",
		as_dict=True,
	)
	_check_template_rows(sales_rows, "Sales Taxes and Charges Template",
		"Form/Sales Taxes and Charges Template")

	purchase_rows = frappe.db.sql(
		"""
		SELECT ptct.name AS template, ptct.company, ptc.account_head
		FROM `tabPurchase Taxes and Charges Template` ptct
		LEFT JOIN `tabPurchase Taxes and Charges` ptc ON ptc.parent = ptct.name
		""",
		as_dict=True,
	)
	_check_template_rows(purchase_rows, "Purchase Taxes and Charges Template",
		"Form/Purchase Taxes and Charges Template")

	return findings


# ─────────────────────────────────────────────────────────────
# G. Warehouse Accounts
# ─────────────────────────────────────────────────────────────

def check_warehouse_accounts(companies_data):
	findings = []

	# Companies with perpetual inventory get Critical; others get Warning
	perpetual_companies = {c["name"] for c in companies_data if c.get("perpetual_inventory")}

	warehouses = frappe.get_all(
		"Warehouse",
		filters=[["warehouse_type", "!=", "Transit"], ["is_group", "=", 0]],
		fields=["name", "account", "company"],
	)

	for wh in warehouses:
		if not wh.get("account"):
			is_perpetual = wh.get("company") in perpetual_companies
			findings.append({
				"severity": "Critical" if is_perpetual else "Warning",
				"category": "Inventory",
				"doctype": "Warehouse",
				"record": wh["name"],
				"company": wh.get("company", ""),
				"field": "account",
				"issue": (
					f"Warehouse '{wh['name']}' has no GL Account "
					f"({'Perpetual Inventory is enabled — posting will fail' if is_perpetual else 'required for perpetual inventory'})"
				),
				"action": f"Open Warehouse '{wh['name']}' and set the Account field to a valid stock asset account.",
				"link": f"Form/Warehouse/{wh['name']}",
			})

	return findings


# ─────────────────────────────────────────────────────────────
# H. Cost Centers
# ─────────────────────────────────────────────────────────────

def check_cost_centers(companies_data, company_names):
	findings = []

	# Derive cost center map from already-fetched companies_data
	company_cc_map = {c["name"]: c.get("cost_center") for c in companies_data}

	cc_counts = frappe.db.sql(
		"""
		SELECT company, COUNT(*) AS cnt
		FROM `tabCost Center`
		WHERE is_group = 0
		GROUP BY company
		""",
		as_dict=True,
	)
	cc_count_map = {row["company"]: row["cnt"] for row in cc_counts}

	for company in company_names:
		if cc_count_map.get(company, 0) == 0:
			findings.append({
				"severity": "Critical",
				"category": "Company Defaults",
				"doctype": "Cost Center",
				"record": company,
				"company": company,
				"field": "cost_center",
				"issue": f"No non-group Cost Centers exist for company '{company}'",
				"action": f"Create at least one Cost Center for company '{company}' in Accounts > Cost Centers.",
				"link": "List/Cost Center/List",
			})

		if not company_cc_map.get(company):
			findings.append({
				"severity": "Critical",
				"category": "Company Defaults",
				"doctype": "Company",
				"record": company,
				"company": company,
				"field": "cost_center",
				"issue": f"No Default Cost Center is set for company '{company}'",
				"action": f"Open Company '{company}' and set the Default Cost Center field.",
				"link": f"Form/Company/{company}",
			})

	return findings


# ─────────────────────────────────────────────────────────────
# I. Bank Accounts
# ─────────────────────────────────────────────────────────────

def check_bank_accounts():
	findings = []

	bank_accounts = frappe.get_all(
		"Bank Account",
		fields=["name", "account", "bank", "company"],
	)

	for ba in bank_accounts:
		if not ba.get("account"):
			findings.append({
				"severity": "Critical",
				"category": "Banking",
				"doctype": "Bank Account",
				"record": ba["name"],
				"company": ba.get("company", ""),
				"field": "account",
				"issue": f"Bank Account '{ba['name']}' has no linked GL Account",
				"action": f"Open Bank Account '{ba['name']}' and link it to a valid GL account (Bank/Cash type).",
				"link": f"Form/Bank Account/{ba['name']}",
			})
		if not ba.get("bank"):
			findings.append({
				"severity": "Warning",
				"category": "Banking",
				"doctype": "Bank Account",
				"record": ba["name"],
				"company": ba.get("company", ""),
				"field": "bank",
				"issue": f"Bank Account '{ba['name']}' has no Bank set",
				"action": f"Open Bank Account '{ba['name']}' and set the Bank field.",
				"link": f"Form/Bank Account/{ba['name']}",
			})

	return findings


# ─────────────────────────────────────────────────────────────
# J. Employee Payroll Setup
# ─────────────────────────────────────────────────────────────

def check_employee_payroll():
	findings = []

	missing_cc = frappe.db.sql(
		"""
		SELECT COUNT(*) AS cnt
		FROM `tabEmployee`
		WHERE status = 'Active'
		  AND (payroll_cost_center IS NULL OR payroll_cost_center = '')
		""",
		as_dict=True,
	)
	missing_cc_count = missing_cc[0]["cnt"] if missing_cc else 0

	if missing_cc_count > 0:
		findings.append({
			"severity": "Warning",
			"category": "Salary",
			"doctype": "Employee",
			"record": "Multiple Employees",
			"company": "",
			"field": "payroll_cost_center",
			"issue": f"{missing_cc_count} active employee(s) are missing a Payroll Cost Center",
			"action": "Open each employee record and set the Payroll Cost Center. Use bulk edit in Employee list view.",
			"link": "List/Employee/List",
		})

	mismatch_rows = frappe.db.sql(
		"""
		SELECT COUNT(*) AS cnt
		FROM `tabEmployee` e
		INNER JOIN `tabCompany` c ON c.name = e.company
		WHERE e.status = 'Active'
		  AND e.salary_currency IS NOT NULL
		  AND e.salary_currency != ''
		  AND e.salary_currency != c.default_currency
		""",
		as_dict=True,
	)
	mismatch_count = mismatch_rows[0]["cnt"] if mismatch_rows else 0

	if mismatch_count > 0:
		findings.append({
			"severity": "Info",
			"category": "Salary",
			"doctype": "Employee",
			"record": "Multiple Employees",
			"company": "",
			"field": "salary_currency",
			"issue": f"{mismatch_count} active employee(s) have a salary currency different from their company's default",
			"action": "Review these employees and confirm the salary currency is intentional.",
			"link": "List/Employee/List",
		})

	return findings


# ─────────────────────────────────────────────────────────────
# K. Payroll Settings
# ─────────────────────────────────────────────────────────────

def check_payroll_settings():
	findings = []

	try:
		settings = frappe.get_single("Payroll Settings")
	except frappe.DoesNotExistError:
		return findings

	if not settings.get("payroll_based_on"):
		findings.append({
			"severity": "Warning",
			"category": "Salary",
			"doctype": "Payroll Settings",
			"record": "Payroll Settings",
			"company": "",
			"field": "payroll_based_on",
			"issue": "Payroll Settings: 'Payroll Based On' is not configured",
			"action": "Go to Payroll Settings and set 'Payroll Based On' to 'Leave' or 'Attendance'.",
			"link": "Form/Payroll Settings/Payroll Settings",
		})

	return findings


# ─────────────────────────────────────────────────────────────
# L. Item Tax Templates
# ─────────────────────────────────────────────────────────────

def check_item_tax_templates(existing_accounts):
	findings = []

	rows = frappe.db.sql(
		"""
		SELECT itt.name AS template, ittd.tax_type
		FROM `tabItem Tax Template` itt
		LEFT JOIN `tabItem Tax Template Detail` ittd ON ittd.parent = itt.name
		""",
		as_dict=True,
	)

	template_map = {}
	for row in rows:
		tmpl = row["template"]
		if tmpl not in template_map:
			template_map[tmpl] = []
		template_map[tmpl].append(row.get("tax_type"))

	for tmpl_name, tax_types in template_map.items():
		for tax_type in tax_types:
			if not tax_type:
				findings.append({
					"severity": "Warning",
					"category": "Tax",
					"doctype": "Item Tax Template",
					"record": tmpl_name,
					"company": "",
					"field": "tax_type",
					"issue": f"Item Tax Template '{tmpl_name}' has a row with no Tax Type (account) set",
					"action": f"Open Item Tax Template '{tmpl_name}' and set the Tax Type on all rows.",
					"link": f"Form/Item Tax Template/{tmpl_name}",
				})
			elif tax_type not in existing_accounts:
				findings.append({
					"severity": "Warning",
					"category": "Tax",
					"doctype": "Item Tax Template",
					"record": tmpl_name,
					"company": "",
					"field": "tax_type",
					"issue": f"Item Tax Template '{tmpl_name}' references account '{tax_type}' which does not exist",
					"action": f"Create account '{tax_type}' in Chart of Accounts or update the template.",
					"link": f"Form/Item Tax Template/{tmpl_name}",
				})

	return findings
