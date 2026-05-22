// ════════════════════════════════════════════════════════════════
// Accounting Audit Dashboard
// ════════════════════════════════════════════════════════════════

frappe.pages['accounting-audit'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Accounting Audit Dashboard',
		single_column: true
	});
	wrapper.accounting_audit = new AccountingAuditDashboard(page);
};

frappe.pages['accounting-audit'].on_page_show = function(wrapper) {
	// Page already rendered on first load; no auto-refresh needed.
};

// ────────────────────────────────────────────────────────────────
// CSS Styles (injected once)
// ────────────────────────────────────────────────────────────────
(function injectStyles() {
	if (document.getElementById('aa-styles')) return;
	var style = document.createElement('style');
	style.id = 'aa-styles';
	style.textContent = `
/* ── Layout ── */
.aa-page {
	padding: 16px 20px 40px;
	font-family: var(--font-stack, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
}

/* ── Summary Bar ── */
.aa-summary-bar {
	display: flex;
	gap: 16px;
	flex-wrap: wrap;
	margin-bottom: 20px;
}
.aa-stat {
	flex: 1 1 140px;
	border-radius: 10px;
	padding: 16px 20px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	box-shadow: 0 1px 4px rgba(0,0,0,0.08);
	min-width: 130px;
}
.aa-stat .aa-stat-count {
	font-size: 2rem;
	font-weight: 700;
	line-height: 1;
}
.aa-stat .aa-stat-label {
	font-size: 0.78rem;
	text-transform: uppercase;
	letter-spacing: .05em;
	font-weight: 600;
	opacity: 0.75;
}
.aa-stat.critical  { background: #fef2f2; border-left: 5px solid #ef4444; color: #991b1b; }
.aa-stat.warning   { background: #fffbeb; border-left: 5px solid #f59e0b; color: #78350f; }
.aa-stat.info      { background: #eff6ff; border-left: 5px solid #3b82f6; color: #1e3a8a; }
.aa-stat.total     { background: #f8fafc; border-left: 5px solid #6366f1; color: #312e81; }

/* ── Filter Bar ── */
.aa-filter-bar {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	align-items: flex-end;
	margin-bottom: 16px;
	padding: 12px 16px;
	background: #f8fafc;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
}
.aa-filter-group {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 160px;
}
.aa-filter-group label {
	font-size: 0.72rem;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: .04em;
	color: #64748b;
}
.aa-filter-group select,
.aa-filter-group input {
	padding: 6px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 0.85rem;
	background: #fff;
	color: #1e293b;
	outline: none;
	transition: border-color .15s;
}
.aa-filter-group select:focus,
.aa-filter-group input:focus {
	border-color: #6366f1;
	box-shadow: 0 0 0 2px rgba(99,102,241,.15);
}
.aa-filter-actions {
	display: flex;
	gap: 8px;
	align-items: flex-end;
}
.aa-btn {
	padding: 7px 16px;
	border-radius: 6px;
	border: none;
	font-size: 0.84rem;
	font-weight: 600;
	cursor: pointer;
	transition: background .15s, opacity .15s;
	display: inline-flex;
	align-items: center;
	gap: 6px;
}
.aa-btn:disabled { opacity: .55; cursor: not-allowed; }
.aa-btn-primary  { background: #6366f1; color: #fff; }
.aa-btn-primary:hover:not(:disabled) { background: #4f46e5; }
.aa-btn-secondary { background: #e2e8f0; color: #334155; }
.aa-btn-secondary:hover:not(:disabled) { background: #cbd5e1; }

/* ── Meta bar ── */
.aa-meta-bar {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 8px;
	font-size: 0.8rem;
	color: #64748b;
}
.aa-result-count { font-weight: 600; }

/* ── Category Section ── */
.aa-category-section {
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	margin-bottom: 16px;
	overflow: hidden;
	box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.aa-category-header {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: #f8fafc;
	cursor: pointer;
	user-select: none;
	border-bottom: 1px solid #e2e8f0;
}
.aa-category-header:hover { background: #f1f5f9; }
.aa-category-name {
	font-weight: 700;
	font-size: 0.95rem;
	color: #1e293b;
	flex: 1;
}
.aa-category-pills { display: flex; gap: 6px; align-items: center; }
.aa-pill {
	display: inline-flex; align-items: center; gap: 4px;
	padding: 2px 8px; border-radius: 999px;
	font-size: 0.72rem; font-weight: 700;
}
.aa-pill-critical { background: #fee2e2; color: #b91c1c; }
.aa-pill-warning  { background: #fef3c7; color: #92400e; }
.aa-pill-info     { background: #dbeafe; color: #1d4ed8; }
.aa-chevron { color: #94a3b8; transition: transform .2s; font-size: 0.85rem; }
.aa-chevron.collapsed { transform: rotate(-90deg); }
.aa-category-body { overflow-x: auto; }

/* ── Findings Table ── */
.aa-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.84rem;
}
.aa-table thead th {
	background: #f1f5f9;
	color: #475569;
	font-weight: 700;
	font-size: 0.75rem;
	text-transform: uppercase;
	letter-spacing: .04em;
	padding: 10px 14px;
	border-bottom: 2px solid #e2e8f0;
	white-space: nowrap;
	text-align: left;
}
.aa-table tbody tr {
	border-bottom: 1px solid #f1f5f9;
	transition: background .1s;
}
.aa-table tbody tr:hover { filter: brightness(0.97); }
.aa-table tbody td {
	padding: 9px 14px;
	vertical-align: top;
	color: #1e293b;
}
.aa-table tbody tr:last-child { border-bottom: none; }

/* row colours */
.aa-row-critical { background: #fef2f2; }
.aa-row-warning  { background: #fffbeb; }
.aa-row-info     { background: #eff6ff; }

/* ── Severity Badge ── */
.aa-badge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 3px 9px;
	border-radius: 999px;
	font-size: 0.73rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: .04em;
	white-space: nowrap;
}
.aa-badge-critical { background: #fee2e2; color: #b91c1c; }
.aa-badge-warning  { background: #fef3c7; color: #92400e; }
.aa-badge-info     { background: #dbeafe; color: #1d4ed8; }

/* ── Link cell ── */
.aa-link-btn {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	color: #6366f1;
	text-decoration: none;
	font-weight: 600;
	font-size: 0.82rem;
	padding: 2px 6px;
	border-radius: 4px;
	transition: background .12s;
	background: transparent;
	border: none;
	cursor: pointer;
}
.aa-link-btn:hover { background: #eef2ff; text-decoration: underline; }

/* ── Loading / Empty state ── */
.aa-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	color: #64748b;
	gap: 12px;
}
.aa-spinner {
	width: 36px; height: 36px;
	border: 4px solid #e2e8f0;
	border-top-color: #6366f1;
	border-radius: 50%;
	animation: aa-spin .7s linear infinite;
}
@keyframes aa-spin { to { transform: rotate(360deg); } }
.aa-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60px 20px;
	color: #94a3b8;
	gap: 12px;
	font-size: 1rem;
}
.aa-empty i { font-size: 3rem; }

/* ── Intro banner ── */
.aa-intro {
	padding: 16px 20px;
	background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);
	border-radius: 10px;
	border: 1px solid #c7d2fe;
	margin-bottom: 20px;
	display: flex;
	align-items: center;
	gap: 14px;
	color: #1e3a8a;
}
.aa-intro i { font-size: 1.6rem; color: #6366f1; flex-shrink: 0; }
.aa-intro-title { font-weight: 700; font-size: 1rem; margin-bottom: 2px; }
.aa-intro-desc  { font-size: 0.83rem; opacity: .85; }
`;
	document.head.appendChild(style);
})();

// ────────────────────────────────────────────────────────────────
// Main Class
// ────────────────────────────────────────────────────────────────
class AccountingAuditDashboard {
	constructor(page) {
		this.page = page;
		this.all_findings = [];
		this.filtered_findings = [];
		this.generated_at = null;
		this.summary = null;

		this.setup_page();
		this.render_skeleton();
	}

	// ── Toolbar ──────────────────────────────────────────────────

	setup_page() {
		const me = this;

		// Primary button: Run Audit
		this.run_btn = this.page.set_primary_action('Run Audit', () => me.run_audit(), 'fa fa-play');

		// Inner button: Export CSV
		this.page.add_inner_button('Export CSV', () => me.export_csv());

		// Filter: Company
		this.$company_filter = this.page.add_field({
			fieldtype: 'Link',
			fieldname: 'company',
			options: 'Company',
			label: 'Company',
			placeholder: 'All Companies',
			change() {
				me.apply_filters();
			}
		});

		// Filter: Category
		this.$category_filter = this.page.add_field({
			fieldtype: 'Select',
			fieldname: 'category',
			label: 'Category',
			options: [''].concat([
				'Company Defaults', 'Salary', 'Asset', 'Tax', 'Inventory',
				'Payment', 'Banking'
			]),
			change() {
				me.apply_filters();
			}
		});

		// Filter: Severity
		this.$severity_filter = this.page.add_field({
			fieldtype: 'Select',
			fieldname: 'severity',
			label: 'Severity',
			options: ['All', 'Critical', 'Warning', 'Info'],
			change() {
				me.apply_filters();
			}
		});
	}

	// ── HTML Skeleton ─────────────────────────────────────────────

	render_skeleton() {
		this.page.main.html(`
<div class="aa-page">

	<!-- Intro Banner -->
	<div class="aa-intro">
		<i class="fa fa-shield"></i>
		<div>
			<div class="aa-intro-title">Accounting Configuration Audit</div>
			<div class="aa-intro-desc">
				Scans all ERPNext accounting configurations across every company and surfaces
				missing or incomplete setups, categorised by severity.
				Click <strong>Run Audit</strong> to begin.
			</div>
		</div>
	</div>

	<!-- Summary Bar -->
	<div class="aa-summary-bar">
		<div class="aa-stat critical">
			<span class="aa-stat-count" id="aa-count-critical">—</span>
			<span class="aa-stat-label"><i class="fa fa-exclamation-circle"></i> Critical</span>
		</div>
		<div class="aa-stat warning">
			<span class="aa-stat-count" id="aa-count-warning">—</span>
			<span class="aa-stat-label"><i class="fa fa-exclamation-triangle"></i> Warning</span>
		</div>
		<div class="aa-stat info">
			<span class="aa-stat-count" id="aa-count-info">—</span>
			<span class="aa-stat-label"><i class="fa fa-info-circle"></i> Info</span>
		</div>
		<div class="aa-stat total">
			<span class="aa-stat-count" id="aa-count-total">—</span>
			<span class="aa-stat-label">Total Findings</span>
		</div>
	</div>

	<!-- Meta bar -->
	<div class="aa-meta-bar">
		<span class="aa-result-count" id="aa-result-count"></span>
		<span id="aa-generated-at"></span>
	</div>

	<!-- Findings Table -->
	<div class="aa-findings" id="aa-findings-container">
		<div class="aa-empty">
			<i class="fa fa-clipboard-list"></i>
			<span>Run the audit to see findings.</span>
		</div>
	</div>

</div>
		`);
	}

	// ── Run Audit ─────────────────────────────────────────────────

	run_audit() {
		const me = this;

		// Show loading state
		this._set_loading(true);
		this._show_loading_state();

		// Collect filters
		const company = (this.$company_filter && this.$company_filter.get_value) ?
			this.$company_filter.get_value() : '';

		const filters = {};
		if (company) filters.company = company;

		frappe.call({
			method: 'financial_audit.financial_audit.page.accounting_audit.accounting_audit.get_accounting_audit_data',
			args: { filters: filters },
			freeze: false,
			callback(r) {
				me._set_loading(false);
				if (r.exc) {
					me._show_error(r.exc);
					return;
				}
				if (r.message) {
					me.render_results(r.message);
				}
			},
			error(err) {
				me._set_loading(false);
				me._show_error(err && err.message ? err.message : 'An unexpected error occurred.');
			}
		});
	}

	// ── Render Results ────────────────────────────────────────────

	render_results(data) {
		this.all_findings    = data.findings || [];
		this.summary         = data.summary  || {};
		this.generated_at    = data.generated_at || '';

		// Update summary cards (full totals)
		document.getElementById('aa-count-critical').textContent = this.summary.critical || 0;
		document.getElementById('aa-count-warning').textContent  = this.summary.warning  || 0;
		document.getElementById('aa-count-info').textContent     = this.summary.info     || 0;
		document.getElementById('aa-count-total').textContent    = this.summary.total    || 0;

		// Timestamp
		const ts = document.getElementById('aa-generated-at');
		if (ts && this.generated_at) {
			ts.textContent = 'Generated at ' + frappe.datetime.str_to_user(this.generated_at);
		}

		// Populate category dropdown dynamically
		this._refresh_category_options(this.summary.categories || []);

		// Apply current filter selections to render the table
		this.apply_filters();
	}

	// ── Apply Client-Side Filters ─────────────────────────────────

	apply_filters() {
		const severity_val = (this.$severity_filter && this.$severity_filter.get_value) ?
			this.$severity_filter.get_value() : 'All';
		const category_val = (this.$category_filter && this.$category_filter.get_value) ?
			this.$category_filter.get_value() : '';
		const company_val  = (this.$company_filter && this.$company_filter.get_value) ?
			this.$company_filter.get_value() : '';

		this.filtered_findings = this.all_findings.filter(f => {
			if (severity_val && severity_val !== 'All' && f.severity !== severity_val) return false;
			if (category_val && f.category !== category_val) return false;
			if (company_val  && f.company && f.company !== company_val) return false;
			return true;
		});

		this._render_table(this.filtered_findings);
	}

	// ── Render Table ──────────────────────────────────────────────

	_render_table(findings) {
		const container = document.getElementById('aa-findings-container');
		const countEl   = document.getElementById('aa-result-count');

		if (countEl) {
			countEl.textContent = `Showing ${findings.length} finding${findings.length !== 1 ? 's' : ''}`;
		}

		if (!findings.length) {
			container.innerHTML = `
				<div class="aa-empty">
					<i class="fa fa-check-circle" style="color:#22c55e;"></i>
					<span>No findings match the current filters.</span>
				</div>`;
			return;
		}

		// Group findings by category
		const groups = {};
		findings.forEach(f => {
			const cat = f.category || 'Other';
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(f);
		});

		const categoryIcons = {
			'Company Defaults': 'fa fa-building',
			'Salary':           'fa fa-money',
			'Asset':            'fa fa-cubes',
			'Tax':              'fa fa-percent',
			'Inventory':        'fa fa-boxes',
			'Payment':          'fa fa-credit-card',
			'Banking':          'fa fa-bank',
			'HR':               'fa fa-users',
			'Payroll':          'fa fa-file-text',
		};

		let html = '';
		Object.entries(groups).forEach(([category, items]) => {
			const counts = { critical: 0, warning: 0, info: 0 };
			items.forEach(f => { counts[(f.severity || 'Info').toLowerCase()]++; });

			const pills = [
				counts.critical ? `<span class="aa-pill aa-pill-critical"><i class="fa fa-exclamation-circle"></i> ${counts.critical} Critical</span>` : '',
				counts.warning  ? `<span class="aa-pill aa-pill-warning"><i class="fa fa-exclamation-triangle"></i> ${counts.warning} Warning</span>` : '',
				counts.info     ? `<span class="aa-pill aa-pill-info"><i class="fa fa-info-circle"></i> ${counts.info} Info</span>` : '',
			].filter(Boolean).join('');

			const iconClass = categoryIcons[category] || 'fa fa-folder';
			const rows = items.map(f => this._render_row(f, true)).join('');

			html += `
<div class="aa-category-section">
	<div class="aa-category-header" onclick="
		var body = this.nextElementSibling;
		body.style.display = body.style.display === 'none' ? '' : 'none';
		this.querySelector('.aa-chevron').classList.toggle('collapsed');
	">
		<i class="${iconClass}" style="color:#6366f1;font-size:1.1rem;flex-shrink:0;"></i>
		<span class="aa-category-name">${category}</span>
		<span class="aa-category-pills">${pills}</span>
		<i class="fa fa-chevron-down aa-chevron"></i>
	</div>
	<div class="aa-category-body">
		<table class="aa-table">
			<thead>
				<tr>
					<th>Severity</th>
					<th>DocType</th>
					<th>Record</th>
					<th>Company</th>
					<th>Issue</th>
					<th>Recommended Action</th>
					<th>Open</th>
				</tr>
			</thead>
			<tbody>${rows}</tbody>
		</table>
	</div>
</div>`;
		});

		container.innerHTML = html;
	}

	_render_row(f, in_category) {
		const sev  = (f.severity || 'Info').toLowerCase();
		const icon = {
			critical: 'fa fa-exclamation-circle',
			warning:  'fa fa-exclamation-triangle',
			info:     'fa fa-info-circle',
		}[sev] || 'fa fa-info-circle';

		const badge = `<span class="aa-badge aa-badge-${sev}"><i class="${icon}"></i>${f.severity || 'Info'}</span>`;

		let link = '';
		if (f.link) {
			// f.link is like "Form/Company/Name" or "List/Employee/List"
			const parts = f.link.split('/').filter(Boolean);
			if (parts.length >= 2) {
				const routeArgs = parts.map(p => JSON.stringify(p)).join(', ');
				link = `<button class="aa-link-btn" onclick="frappe.set_route(${routeArgs})">
					<i class="fa fa-external-link"></i> Open
				</button>`;
			}
		}

		const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

		return `
<tr class="aa-row-${sev}">
	<td>${badge}</td>
	<td style="white-space:nowrap;">${esc(f.doctype)}</td>
	<td style="max-width:180px;word-break:break-all;">${esc(f.record)}</td>
	<td style="white-space:nowrap;">${esc(f.company)}</td>
	<td style="max-width:280px;">${esc(f.issue)}</td>
	<td style="max-width:260px;color:#475569;">${esc(f.action)}</td>
	<td>${link}</td>
</tr>`;
	}

	// ── Export CSV ────────────────────────────────────────────────

	export_csv() {
		if (!this.filtered_findings.length) {
			frappe.msgprint('No findings to export. Run the audit first.');
			return;
		}

		const headers = ['Severity','Category','DocType','Record','Company','Issue','Recommended Action','Link'];

		const escape_csv = val => {
			const s = String(val == null ? '' : val);
			if (s.includes(',') || s.includes('"') || s.includes('\n')) {
				return '"' + s.replace(/"/g, '""') + '"';
			}
			return s;
		};

		const rows = [
			headers.join(','),
			...this.filtered_findings.map(f =>
				[f.severity, f.category, f.doctype, f.record, f.company, f.issue, f.action, f.link]
					.map(escape_csv).join(',')
			)
		];

		const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
		const url  = URL.createObjectURL(blob);
		const a    = document.createElement('a');
		a.href     = url;
		a.download = `accounting_audit_${frappe.datetime.nowdate()}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// ── Helpers ───────────────────────────────────────────────────

	_set_loading(is_loading) {
		if (this.run_btn) {
			if (is_loading) {
				this.run_btn.prop('disabled', true);
				this.run_btn.html('<i class="fa fa-spinner fa-spin"></i> Running...');
			} else {
				this.run_btn.prop('disabled', false);
				this.run_btn.html('<i class="fa fa-play"></i> Run Audit');
			}
		}
	}

	_show_loading_state() {
		const container = document.getElementById('aa-findings-container');
		if (container) {
			container.innerHTML = `
				<div class="aa-loading">
					<div class="aa-spinner"></div>
					<span>Running accounting audit across all companies... This may take a moment.</span>
				</div>`;
		}
		// Reset summary counts
		['critical','warning','info','total'].forEach(k => {
			const el = document.getElementById(`aa-count-${k}`);
			if (el) el.textContent = '…';
		});
		const countEl = document.getElementById('aa-result-count');
		if (countEl) countEl.textContent = '';
	}

	_show_error(msg) {
		const container = document.getElementById('aa-findings-container');
		if (container) {
			container.innerHTML = `
				<div class="aa-empty" style="color:#ef4444;">
					<i class="fa fa-times-circle" style="color:#ef4444;"></i>
					<span>Error running audit. Please check the error console.</span>
					<small style="max-width:500px;text-align:center;opacity:.7;">${
						String(msg || '').substring(0, 400)
					}</small>
				</div>`;
		}
		['critical','warning','info','total'].forEach(k => {
			const el = document.getElementById(`aa-count-${k}`);
			if (el) el.textContent = '—';
		});
		frappe.msgprint({
			title: 'Audit Error',
			message: 'Could not complete the accounting audit. Check the browser console for details.',
			indicator: 'red'
		});
	}

	_refresh_category_options(categories) {
		if (!this.$category_filter) return;
		const current = this.$category_filter.get_value();
		// Rebuild options on the underlying df and re-set value
		const opts = ['All Categories'].concat(categories);
		if (this.$category_filter.df) {
			this.$category_filter.df.options = opts.join('\n');
		}
		// Find and update the <select> element directly
		const $select = $(this.$category_filter.wrapper).find('select');
		if ($select.length) {
			$select.empty();
			opts.forEach(opt => {
				$select.append($('<option>').val(opt === 'All Categories' ? '' : opt).text(opt));
			});
			if (current && categories.includes(current)) {
				$select.val(current);
			}
		}
	}
}
