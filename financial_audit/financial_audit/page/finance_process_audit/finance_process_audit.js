frappe.pages['finance-process-audit'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: (frappe.boot.lang || 'en') === 'ar'
			? 'لوحة استثناءات العمليات المالية'
			: 'Finance Process Exception & Compliance Dashboard',
		single_column: true
	});
	wrapper.fpa_dashboard = new FinanceProcessAuditDashboard(page);
};

frappe.pages['finance-process-audit'].on_page_show = function(wrapper) {
	if (wrapper.fpa_dashboard) {
		wrapper.fpa_dashboard.refresh_if_stale();
	}
};

// ═══════════════════════════════════════════════════════════
// Bilingual Translations
// ═══════════════════════════════════════════════════════════
const FPA_T = {
	// Actions
	refresh:           { ar: 'تحديث', en: 'Refresh' },
	ai_copilot_btn:    { ar: 'مساعد AI', en: 'AI Copilot' },
	clear_ai:          { ar: 'مسح التحليل', en: 'Clear AI' },
	pdf_export_btn:    { ar: 'تصدير PDF', en: 'Export PDF' },
	ai_settings_btn:   { ar: 'إعدادات AI', en: 'AI Settings' },
	loading_data:      { ar: 'جاري تحميل البيانات...', en: 'Loading process audit data...' },
	error_loading:     { ar: 'حدث خطأ أثناء التحميل', en: 'Error loading data' },
	no_data:           { ar: 'لا توجد بيانات', en: 'No data available' },
	load_data_first:   { ar: 'يرجى تحميل البيانات أولاً', en: 'Please load data first' },
	ai_analyzing:      { ar: 'جاري التحليل... قد يستغرق دقيقة', en: 'AI analysis in progress... may take a minute' },
	ai_no_response:    { ar: 'لا توجد استجابة', en: 'No response from AI' },
	ai_error:          { ar: 'حدث خطأ في AI', en: 'AI error' },
	ai_puter_failed:   { ar: 'فشل تحميل Puter AI', en: 'Puter AI failed to load' },
	// Filters
	company:           { ar: 'الشركة', en: 'Company' },
	from_date:         { ar: 'من تاريخ', en: 'From Date' },
	to_date:           { ar: 'إلى تاريخ', en: 'To Date' },
	priority_filter:   { ar: 'الأولوية', en: 'Priority Filter' },
	all_priorities:    { ar: 'جميع الأولويات', en: 'All Priorities' },
	select_company:    { ar: 'اختر الشركة', en: 'Select Company' },
	// Score card labels
	audit_health:      { ar: 'صحة التدقيق', en: 'Audit Health' },
	compliance_score:  { ar: 'درجة الامتثال', en: 'Compliance Score' },
	risk_score:        { ar: 'درجة المخاطر', en: 'Risk Score' },
	critical_issues:   { ar: 'مشكلات حرجة', en: 'Critical Issues' },
	high_issues:       { ar: 'مشكلات عالية', en: 'High Issues' },
	medium_issues:     { ar: 'متوسطة', en: 'Medium Issues' },
	low_issues:        { ar: 'منخفضة', en: 'Low Issues' },
	total_pending:     { ar: 'إجمالي المعلقة', en: 'Total Pending' },
	total_overdue:     { ar: 'إجمالي المتأخرة', en: 'Total Overdue' },
	ar_outstanding:    { ar: 'الذمم المدينة', en: 'AR Outstanding' },
	ap_outstanding:    { ar: 'الذمم الدائنة', en: 'AP Outstanding' },
	procurement_risk:  { ar: 'مخاطر المشتريات', en: 'Procurement Risk' },
	accounting_risk:   { ar: 'مخاطر المحاسبة', en: 'Accounting Risk' },
	asset_compliance:  { ar: 'امتثال الأصول', en: 'Asset Compliance' },
	collection_risk:   { ar: 'مخاطر التحصيل', en: 'Collection Risk' },
	// Insights section
	top_insights:      { ar: 'أبرز الاستثناءات الحرجة', en: 'Top Critical Exceptions' },
	top_insights_desc: { ar: 'أعلى 50 بند حرج أو عالي الخطورة مرتبة حسب القيمة والأولوية', en: 'Top 50 Critical & High priority issues ranked by value and priority' },
	// Module names
	mod_po:      { ar: 'تدقيق أوامر الشراء', en: 'Purchase Order Audit' },
	mod_mr:      { ar: 'تدقيق طلبات الصرف', en: 'Material Request Audit' },
	mod_pi:      { ar: 'تدقيق فواتير الشراء', en: 'Purchase Invoice Audit' },
	mod_pe:      { ar: 'تدقيق قيود السداد', en: 'Payment Entry Audit' },
	mod_je:      { ar: 'تدقيق قيود اليومية', en: 'Journal Entry Audit' },
	mod_asset:   { ar: 'تدقيق الأصول الثابتة', en: 'Fixed Asset Audit' },
	mod_prepaid: { ar: 'تدقيق المصروفات المدفوعة مقدماً', en: 'Prepaid & Deferred Expense Audit' },
	mod_so:      { ar: 'تدقيق أوامر البيع', en: 'Sales Order Audit' },
	mod_si:      { ar: 'تدقيق فواتير المبيعات', en: 'Sales Invoice Audit' },
	// Module descriptions
	desc_po:      { ar: 'أوامر الشراء المفتوحة غير المستلمة أو غير المفوترة مع تحليل التقادم', en: 'Open POs not received or not billed with aging analysis' },
	desc_mr:      { ar: 'طلبات الصرف المفتوحة المتأخرة مصنفة حسب الغرض والقسم', en: 'Open overdue material requests classified by purpose and department' },
	desc_pi:      { ar: 'فواتير الشراء غير المسددة مع تحليل تقادم الذمم الدائنة والفواتير المكررة', en: 'Unpaid purchase invoices with AP aging and duplicate detection' },
	desc_pe:      { ar: 'قيود السداد المسودة ومعتمدة من المدير غير المسلمة', en: 'Draft payment entries and MD Approved entries not yet submitted' },
	desc_je:      { ar: 'قيود اليومية المسودة والقيود غير العادية ذات القيم المرتفعة', en: 'Draft journal entries and unusual high-value entries' },
	desc_asset:   { ar: 'الأصول ذات الإهلاك الفائت وانعدام أمين الحفظ والقيم الشاذة', en: 'Assets with missed depreciation, missing custodians and value anomalies' },
	desc_prepaid: { ar: 'أرصدة المصروفات المؤجلة وقيود الاستهلاك المعلقة', en: 'Deferred expense balances and pending amortization journal entries' },
	desc_so:      { ar: 'أوامر البيع المفتوحة غير المسلمة أو غير المفوترة مع تحليل التقادم', en: 'Open SOs not delivered or not billed with aging analysis' },
	desc_si:      { ar: 'فواتير المبيعات المستحقة مع تحليل تقادم الذمم المدينة ومخاطر الديون المشكوك فيها', en: 'Outstanding sales invoices with AR aging and bad debt risk analysis' },
	// Table headers
	th_name:       { ar: 'المستند', en: 'Document' },
	th_supplier:   { ar: 'المورد', en: 'Supplier' },
	th_customer:   { ar: 'العميل', en: 'Customer' },
	th_date:       { ar: 'التاريخ', en: 'Date' },
	th_due_date:   { ar: 'تاريخ الاستحقاق', en: 'Due Date' },
	th_amount:     { ar: 'المبلغ', en: 'Amount' },
	th_outstanding:{ ar: 'المستحق', en: 'Outstanding' },
	th_age_days:   { ar: 'الأيام', en: 'Age (Days)' },
	th_overdue:    { ar: 'التأخر', en: 'Overdue (Days)' },
	th_priority:   { ar: 'الأولوية', en: 'Priority' },
	th_status:     { ar: 'الحالة', en: 'Status' },
	th_workflow:   { ar: 'حالة الموافقة', en: 'Workflow' },
	th_received:   { ar: '% مستلم', en: '% Received' },
	th_billed:     { ar: '% مفوتر', en: '% Billed' },
	th_delivered:  { ar: '% مسلم', en: '% Delivered' },
	th_count:      { ar: 'العدد', en: 'Count' },
	th_value:      { ar: 'القيمة', en: 'Value' },
	th_purpose:    { ar: 'الغرض', en: 'Purpose' },
	th_department: { ar: 'القسم', en: 'Department' },
	th_asset_name: { ar: 'الأصل', en: 'Asset' },
	th_category:   { ar: 'الفئة', en: 'Category' },
	th_depr_date:  { ar: 'تاريخ الإهلاك', en: 'Depreciation Date' },
	th_depr_amt:   { ar: 'مبلغ الإهلاك', en: 'Depreciation Amount' },
	th_issue:      { ar: 'المشكلة', en: 'Issue' },
	th_account:    { ar: 'الحساب', en: 'Account' },
	th_balance:    { ar: 'الرصيد', en: 'Balance' },
	th_type:       { ar: 'النوع', en: 'Type' },
	th_module:     { ar: 'القسم', en: 'Module' },
	th_desc:       { ar: 'الوصف', en: 'Description' },
	// Aging buckets
	age_0_7:   { ar: '0–7 أيام', en: '0–7 days' },
	age_8_30:  { ar: '8–30 يوم', en: '8–30 days' },
	age_31_60: { ar: '31–60 يوم', en: '31–60 days' },
	age_61_90: { ar: '61–90 يوم', en: '61–90 days' },
	age_90p:   { ar: '90+ يوم', en: '90+ days' },
	// Summary labels
	lbl_total:          { ar: 'الإجمالي', en: 'Total' },
	lbl_critical:       { ar: 'حرج', en: 'Critical' },
	lbl_high:           { ar: 'عالي', en: 'High' },
	lbl_medium:         { ar: 'متوسط', en: 'Medium' },
	lbl_low:            { ar: 'منخفض', en: 'Low' },
	lbl_value:          { ar: 'الإجمالي المالي', en: 'Total Value' },
	lbl_overdue:        { ar: 'المتأخرة', en: 'Overdue' },
	lbl_aging_analysis: { ar: 'تحليل التقادم', en: 'Aging Analysis' },
	lbl_top_items:      { ar: 'أبرز السجلات', en: 'Top Records' },
	lbl_supplier_sum:   { ar: 'ملخص الموردين', en: 'Supplier Summary' },
	lbl_customer_sum:   { ar: 'ملخص العملاء', en: 'Customer Summary' },
	lbl_dept_sum:       { ar: 'ملخص الأقسام', en: 'Department Summary' },
	lbl_category_sum:   { ar: 'ملخص الفئات', en: 'Category Summary' },
	lbl_md_approved:    { ar: 'معتمد من المدير', en: 'MD Approved' },
	lbl_md_over3:       { ar: '3+ أيام', en: '3+ Days' },
	lbl_md_over7:       { ar: '7+ أيام', en: '7+ Days' },
	lbl_md_over14:      { ar: '14+ أيام (حرج)', en: '14+ Days (Critical)' },
	lbl_duplicate:      { ar: 'فواتير مكررة محتملة', en: 'Potential Duplicate Invoices' },
	lbl_unusual:        { ar: 'قيود غير عادية', en: 'Unusual High-Value Entries' },
	lbl_missed_dep:     { ar: 'إهلاك فائت', en: 'Missed Depreciation' },
	lbl_no_custodian:   { ar: 'بدون أمين حفظ', en: 'No Custodian' },
	lbl_anomalies:      { ar: 'قيم شاذة', en: 'Value Anomalies' },
	lbl_deferred_bal:   { ar: 'أرصدة المؤجل', en: 'Deferred Balances' },
	lbl_pend_amor:      { ar: 'استهلاك معلق', en: 'Pending Amortization' },
	lbl_bad_debt:       { ar: 'ديون مشكوك فيها', en: 'Bad Debt Risk' },
	lbl_repeat_off:     { ar: 'عملاء متكررون', en: 'Repeat Offenders' },
	lbl_days_in_state:  { ar: 'أيام في الحالة', en: 'Days in State' },
	lbl_missing_ref:    { ar: 'مرجع ناقص', en: 'Missing Reference' },
	lbl_by_purpose:     { ar: 'حسب الغرض', en: 'By Purpose' },
	// AI
	ai_copilot_title:   { ar: 'مساعد التدقيق الذكي (AI Copilot)', en: 'AI Audit Copilot' },
	ai_module_title:    { ar: 'تحليل الذكاء الاصطناعي', en: 'AI Analysis' },
	ai_analysis_of:     { ar: 'تحليل AI لـ', en: 'AI Analysis of' },
	// PDF
	pdf_preparing:      { ar: 'جاري تجهيز التقرير...', en: 'Preparing report...' },
};

// ═══════════════════════════════════════════════════════════
// Dashboard Class
// ═══════════════════════════════════════════════════════════
class FinanceProcessAuditDashboard {
	constructor(page) {
		this.page = page;
		this.filters = {};
		this.data = {};
		this.currency = 'AED';
		this.lang = (frappe.boot.lang || 'en') === 'ar' ? 'ar' : 'en';
		this.is_rtl = this.lang === 'ar';
		this._last_load = 0;
		this._module_ai_panels = {};
		this.priority_filter = '';

		this.setup_page();
		this.render_filters();
		this.load_data();
	}

	t(key) {
		const e = FPA_T[key];
		if (!e) return key;
		return e[this.lang] || e['en'] || key;
	}

	// ─── Page Setup ─────────────────────────────────────────
	setup_page() {
		const dir = this.is_rtl ? 'rtl' : 'ltr';
		this.page.set_primary_action(this.t('refresh'), () => this.load_data(), 'refresh');
		this.page.add_inner_button(this.t('ai_copilot_btn'), () => this.run_ai_analysis());
		this.page.add_inner_button(this.t('clear_ai'), () => this.clear_ai());
		this.page.add_inner_button(this.t('pdf_export_btn'), () => this.export_pdf());
		this.page.add_inner_button(this.t('ai_settings_btn'), () => frappe.set_route('Form', 'Financial Audit Settings'));

		this.page.main.html(`
			<div class="financial-audit-page${this.is_rtl ? '' : ' ltr-mode'}" dir="${dir}">
				<div class="filters-section"></div>
				<!-- Score Cards -->
				<div class="fpa-scores"></div>
				<!-- AI Copilot Panel -->
				<div class="ai-analysis-section" style="display:none">
					<div class="section-header ai-header" data-target="fpa-ai-body">
						<span class="section-title"><i class="fa fa-magic" style="margin-${this.is_rtl ? 'left' : 'right'}:8px"></i> ${this.t('ai_copilot_title')}</span>
						<span class="toggle-chevron">&#9660;</span>
					</div>
					<div class="section-body fpa-ai-body"></div>
				</div>
				<!-- Management Insights -->
				<div class="fpa-insights-section data-section">
					<div class="section-header" data-target="fpa-insights-body">
						<span class="section-title">
							<span class="section-icon" style="background:#fef2f2;color:#b91c1c"><i class="fa fa-exclamation-triangle"></i></span>
							${this.t('top_insights')}
						</span>
						<span class="toggle-chevron">&#9660;</span>
					</div>
					<div class="section-desc">${this.t('top_insights_desc')}</div>
					<div class="section-body fpa-insights-body"></div>
				</div>
				<!-- 9 Module Sections -->
				<div class="fpa-modules"></div>
			</div>
		`);

		// Cache refs
		this.$filters  = this.page.main.find('.filters-section');
		this.$scores   = this.page.main.find('.fpa-scores');
		this.$ai       = this.page.main.find('.ai-analysis-section');
		this.$ai_body  = this.page.main.find('.fpa-ai-body');
		this.$insights = this.page.main.find('.fpa-insights-body');
		this.$modules  = this.page.main.find('.fpa-modules');

		// Section toggle
		this.page.main.on('click', '.section-header', function() {
			const target = $(this).data('target');
			if (!target) return;
			const $body = $(this).closest('.data-section, .ai-analysis-section').find('.section-body');
			$body.slideToggle(200);
			$(this).find('.toggle-chevron').toggleClass('collapsed');
		});
	}

	// ─── Filters ────────────────────────────────────────────
	render_filters() {
		const today = frappe.datetime.get_today();
		const year_start = frappe.datetime.year_start();

		this.$filters.html(`
			<div class="filters-row">
				<div class="filter-field"><label>${this.t('company')}</label><div class="fpa-company-field"></div></div>
				<div class="filter-field"><label>${this.t('from_date')}</label><div class="fpa-from-field"></div></div>
				<div class="filter-field"><label>${this.t('to_date')}</label><div class="fpa-to-field"></div></div>
				<div class="filter-field">
					<label>${this.t('priority_filter')}</label>
					<select class="form-control fpa-priority-select" style="height:32px;font-size:13px;border-radius:6px;border:1px solid var(--border-color,#e5e7eb);padding:0 8px">
						<option value="">${this.t('all_priorities')}</option>
						<option value="Critical">${this.t('lbl_critical')}</option>
						<option value="High">${this.t('lbl_high')}</option>
						<option value="Medium">${this.t('lbl_medium')}</option>
						<option value="Low">${this.t('lbl_low')}</option>
					</select>
				</div>
			</div>
		`);

		this.company_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Link', options: 'Company', fieldname: 'company',
				placeholder: this.t('select_company'),
				change: () => { this.filters.company = this.company_ctrl.get_value(); this.load_data(); }
			},
			parent: this.$filters.find('.fpa-company-field'),
			render_input: true
		});
		const default_company = frappe.defaults.get_user_default('Company');
		this.company_ctrl.set_value(default_company);
		this.filters.company = default_company;

		this.from_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Date', fieldname: 'from_date', default: year_start,
				change: () => { this.filters.from_date = this.from_ctrl.get_value(); this.load_data(); }
			},
			parent: this.$filters.find('.fpa-from-field'),
			render_input: true
		});
		this.from_ctrl.set_value(year_start);
		this.filters.from_date = year_start;

		this.to_ctrl = frappe.ui.form.make_control({
			df: {
				fieldtype: 'Date', fieldname: 'to_date', default: today,
				change: () => { this.filters.to_date = this.to_ctrl.get_value(); this.load_data(); }
			},
			parent: this.$filters.find('.fpa-to-field'),
			render_input: true
		});
		this.to_ctrl.set_value(today);
		this.filters.to_date = today;

		this.$filters.find('.fpa-priority-select').on('change', (e) => {
			this.priority_filter = e.target.value;
			if (this.data && this.data.scores) {
				this.render_modules();
			}
		});
	}

	// ─── Data Loading ────────────────────────────────────────
	load_data() {
		this.$scores.html(`<div class="loading-state"><i class="fa fa-spinner fa-spin"></i> ${this.t('loading_data')}</div>`);
		this.$modules.empty();
		this.$insights.empty();

		frappe.call({
			method: 'financial_audit.financial_audit.page.finance_process_audit.finance_process_audit.get_process_exception_data',
			args: { filters: this.filters },
			timeout: 120,
			callback: (r) => {
				if (r.message) {
					this.data = r.message;
					this.currency = r.message.currency || 'AED';
					this._last_load = Date.now();
					this.render_all();
				} else {
					this.$scores.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${this.t('error_loading')}</p></div>`);
				}
			},
			error: () => {
				this.$scores.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${this.t('error_loading')}</p></div>`);
			}
		});
	}

	refresh_if_stale() {
		if (Date.now() - this._last_load > 300000) this.load_data();
	}

	// ─── Render All ─────────────────────────────────────────
	render_all() {
		this.render_score_cards();
		this.render_insights();
		this.render_modules();
	}

	// ─── Score Cards ─────────────────────────────────────────
	render_score_cards() {
		const s = this.data.scores || {};
		const color_for_score = (v, invert) => {
			if (invert) return v <= 20 ? '#047857' : v <= 50 ? '#b45309' : '#b91c1c';
			return v >= 75 ? '#047857' : v >= 50 ? '#b45309' : '#b91c1c';
		};
		const score_card = (title, value, suffix, color, icon, sub) => `
			<div class="kpi-card" style="border-top:3px solid ${color}">
				<div class="kpi-icon" style="color:${color}"><i class="fa ${icon}"></i></div>
				<div class="kpi-title">${title}</div>
				<div class="kpi-value" style="color:${color}">${value}${suffix || ''}</div>
				${sub ? `<div class="kpi-desc">${sub}</div>` : ''}
			</div>`;

		const count_card = (title, value, color, icon) => `
			<div class="kpi-card" style="border-top:3px solid ${color}">
				<div class="kpi-icon" style="color:${color}"><i class="fa ${icon}"></i></div>
				<div class="kpi-title">${title}</div>
				<div class="kpi-value" style="color:${color}">${(value || 0).toLocaleString()}</div>
			</div>`;

		const currency_card = (title, value, icon) => `
			<div class="kpi-card">
				<div class="kpi-icon"><i class="fa ${icon}"></i></div>
				<div class="kpi-title">${title}</div>
				<div class="kpi-value">${this.fc(value)}</div>
			</div>`;

		const health_color = color_for_score(s.audit_health_score, false);
		const comp_color   = color_for_score(s.compliance_score, false);
		const risk_color   = color_for_score(s.risk_score, true);

		this.$scores.html(`
			<div style="margin-bottom:8px;font-size:11px;color:var(--text-muted,#6b7280);font-weight:600;letter-spacing:0.5px;text-transform:uppercase">
				${this.lang === 'ar' ? 'لوحة النتائج — ' : 'Scorecard — '} ${this.data.company || ''} | ${this.data.as_of || ''}
			</div>
			<div class="kpi-cards">
				${score_card(this.t('audit_health'), s.audit_health_score || 0, '/100', health_color, 'fa-heartbeat', this.lang === 'ar' ? 'صحة العمليات المالية' : 'Financial process health')}
				${score_card(this.t('compliance_score'), s.compliance_score || 0, '/100', comp_color, 'fa-shield', this.lang === 'ar' ? 'درجة الامتثال التنظيمي' : 'Regulatory compliance score')}
				${score_card(this.t('risk_score'), s.risk_score || 0, '/100', risk_color, 'fa-exclamation-circle', this.lang === 'ar' ? 'مؤشر المخاطر الإجمالية' : 'Overall risk indicator')}
				${count_card(this.t('critical_issues'), s.critical_count, '#b91c1c', 'fa-times-circle')}
				${count_card(this.t('high_issues'), s.high_count, '#dc6803', 'fa-exclamation-circle')}
				${count_card(this.t('medium_issues'), s.medium_count, '#b45309', 'fa-minus-circle')}
				${count_card(this.t('low_issues'), s.low_count, '#6b7280', 'fa-check-circle')}
				${count_card(this.t('total_pending'), s.total_pending_actions, '#4361ee', 'fa-clock-o')}
				${count_card(this.t('total_overdue'), s.total_overdue_transactions, '#b91c1c', 'fa-calendar-times-o')}
				${currency_card(this.t('ar_outstanding'), s.total_outstanding_receivables, 'fa-arrow-circle-down')}
				${currency_card(this.t('ap_outstanding'), s.total_outstanding_payables, 'fa-arrow-circle-up')}
				${score_card(this.t('procurement_risk'), s.procurement_risk_score || 0, '/100', color_for_score(s.procurement_risk_score, true), 'fa-truck', '')}
				${score_card(this.t('accounting_risk'), s.accounting_risk_score || 0, '/100', color_for_score(s.accounting_risk_score, true), 'fa-book', '')}
				${score_card(this.t('asset_compliance'), s.asset_compliance_score || 0, '/100', color_for_score(s.asset_compliance_score, false), 'fa-building', '')}
				${score_card(this.t('collection_risk'), s.collection_risk_score || 0, '/100', color_for_score(s.collection_risk_score, true), 'fa-users', '')}
			</div>
		`);
	}

	// ─── Top Insights Table ──────────────────────────────────
	render_insights() {
		const insights = this.data.insights || [];
		if (!insights.length) { this.$insights.html(this.empty_msg()); return; }

		const rows = insights.slice(0, 50).map((item, i) => `
			<tr>
				<td>${i + 1}</td>
				<td>${this.priority_badge(item.priority)}</td>
				<td>${item.module || ''}</td>
				<td class="link-cell">
					${item.docname ? `<a href="/app/${(item.module || '').toLowerCase().replace(/\s+/g, '-')}/${encodeURIComponent(item.docname)}" target="_blank">${item.docname}</a>` : '—'}
				</td>
				<td>${item.desc || ''}</td>
				<td class="currency-cell">${this.fc(item.value)}</td>
				<td>${item.age_days || 0}</td>
			</tr>`).join('');

		this.$insights.html(`
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>#</th>
					<th>${this.t('th_priority')}</th>
					<th>${this.t('th_module')}</th>
					<th>${this.t('th_name')}</th>
					<th>${this.t('th_desc')}</th>
					<th>${this.t('th_amount')}</th>
					<th>${this.t('th_age_days')}</th>
				</tr></thead><tbody>${rows}</tbody></table>
			</div>
		`);
	}

	// ─── Module Sections ─────────────────────────────────────
	render_modules() {
		const MODULES = [
			{ key: 'po_audit',      icon: 'fa-shopping-cart',   icon_bg: '#eff6ff', icon_color: '#1d4ed8',  t_title: 'mod_po',      t_desc: 'desc_po',      render: (d) => this.render_po(d) },
			{ key: 'mr_audit',      icon: 'fa-list-alt',        icon_bg: '#f0fdf4', icon_color: '#15803d',  t_title: 'mod_mr',      t_desc: 'desc_mr',      render: (d) => this.render_mr(d) },
			{ key: 'pi_audit',      icon: 'fa-file-text',       icon_bg: '#fef3c7', icon_color: '#b45309',  t_title: 'mod_pi',      t_desc: 'desc_pi',      render: (d) => this.render_pi(d) },
			{ key: 'payment_audit', icon: 'fa-credit-card',     icon_bg: '#fdf2f8', icon_color: '#9d174d',  t_title: 'mod_pe',      t_desc: 'desc_pe',      render: (d) => this.render_pe(d) },
			{ key: 'je_audit',      icon: 'fa-pencil-square-o', icon_bg: '#eef1ff', icon_color: '#4338ca',  t_title: 'mod_je',      t_desc: 'desc_je',      render: (d) => this.render_je(d) },
			{ key: 'asset_audit',   icon: 'fa-building',        icon_bg: '#fff7ed', icon_color: '#c2410c',  t_title: 'mod_asset',   t_desc: 'desc_asset',   render: (d) => this.render_asset(d) },
			{ key: 'prepaid_audit', icon: 'fa-calendar-check-o',icon_bg: '#f0fdf4', icon_color: '#065f46',  t_title: 'mod_prepaid', t_desc: 'desc_prepaid', render: (d) => this.render_prepaid(d) },
			{ key: 'so_audit',      icon: 'fa-tag',             icon_bg: '#fdf2f8', icon_color: '#be185d',  t_title: 'mod_so',      t_desc: 'desc_so',      render: (d) => this.render_so(d) },
			{ key: 'si_audit',      icon: 'fa-file-invoice',    icon_bg: '#fef2f2', icon_color: '#b91c1c',  t_title: 'mod_si',      t_desc: 'desc_si',      render: (d) => this.render_si(d) },
		];

		let html = '';
		MODULES.forEach(m => {
			const section_id = `fpa-mod-${m.key}`;
			const ai_id = `fpa-ai-${m.key}`;
			html += `
				<div class="data-section fpa-module-section" id="${section_id}">
					<div class="section-header" data-target="${section_id}-body">
						<span class="section-title">
							<span class="section-icon" style="background:${m.icon_bg};color:${m.icon_color}"><i class="fa ${m.icon}"></i></span>
							${this.t(m.t_title)}
						</span>
						<span style="display:flex;align-items:center;gap:8px">
							<button class="btn btn-xs btn-default fpa-module-ai-btn" data-module="${m.key}" style="font-size:11px;padding:2px 8px;border-radius:12px" onclick="event.stopPropagation()">
								<i class="fa fa-magic"></i> AI
							</button>
							<span class="toggle-chevron">&#9660;</span>
						</span>
					</div>
					<div class="section-desc">${this.t(m.t_desc)}</div>
					<div class="section-body ${section_id}-body">
						<div class="${section_id}-content"></div>
						<div class="${ai_id}-panel" style="display:none;margin-top:16px;padding:16px;background:var(--bg-color,#fafafa);border:1px solid var(--border-color,#e5e7eb);border-radius:10px"></div>
					</div>
				</div>`;
		});

		this.$modules.html(html);

		// Render each module content
		MODULES.forEach(m => {
			const module_data = this.data[m.key] || {};
			const $container = this.$modules.find(`#fpa-mod-${m.key}-content`);
			const content_html = m.render(module_data);
			this.$modules.find(`.fpa-mod-${m.key}-content`).html(content_html);
		});

		// Bind AI buttons
		this.$modules.find('.fpa-module-ai-btn').on('click', (e) => {
			const key = $(e.currentTarget).data('module');
			this.run_module_ai(key);
		});
	}

	// ─── Module Summary Bar ──────────────────────────────────
	summary_bar(s) {
		if (!s) return '';
		return `
			<div class="fpa-summary-bar">
				<span class="fpa-sum-item total"><i class="fa fa-list"></i> ${this.t('lbl_total')}: <strong>${s.total || 0}</strong></span>
				<span class="fpa-sum-item critical"><i class="fa fa-times-circle"></i> ${this.t('lbl_critical')}: <strong>${s.critical || 0}</strong></span>
				<span class="fpa-sum-item high"><i class="fa fa-exclamation-circle"></i> ${this.t('lbl_high')}: <strong>${s.high || 0}</strong></span>
				<span class="fpa-sum-item medium"><i class="fa fa-minus-circle"></i> ${this.t('lbl_medium')}: <strong>${s.medium || 0}</strong></span>
				<span class="fpa-sum-item low"><i class="fa fa-check-circle"></i> ${this.t('lbl_low')}: <strong>${s.low || 0}</strong></span>
				${s.total_value > 0 ? `<span class="fpa-sum-item value"><i class="fa fa-money"></i> ${this.t('lbl_value')}: <strong>${this.fc(s.total_value)}</strong></span>` : ''}
				${s.overdue_count > 0 ? `<span class="fpa-sum-item overdue"><i class="fa fa-calendar-times-o"></i> ${this.t('lbl_overdue')}: <strong>${s.overdue_count}</strong></span>` : ''}
			</div>`;
	}

	// ─── Aging Table ─────────────────────────────────────────
	aging_table(buckets) {
		if (!buckets || !buckets.length) return '';
		const total_count = buckets.reduce((s, b) => s + (b.count || 0), 0) || 1;
		const rows = buckets.map(b => {
			const pct = Math.round((b.count / total_count) * 100);
			const bar_color = b.label.includes('90+') || b.label.includes('61') ? '#ef4444'
				: b.label.includes('31') ? '#f97316'
				: b.label.includes('8') || b.label.includes('30') ? '#eab308'
				: '#22c55e';
			return `<tr>
				<td>${b.label}</td>
				<td><strong>${b.count}</strong></td>
				<td class="currency-cell">${this.fc(b.value)}</td>
				<td>
					<div style="display:flex;align-items:center;gap:6px">
						<div style="flex:1;background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden">
							<div style="width:${pct}%;height:100%;background:${bar_color};border-radius:4px"></div>
						</div>
						<span style="font-size:11px;color:#6b7280;min-width:30px">${pct}%</span>
					</div>
				</td>
			</tr>`;
		}).join('');
		return `<div style="margin-bottom:16px">
			<div class="fpa-subsection-title"><i class="fa fa-clock-o"></i> ${this.t('lbl_aging_analysis')}</div>
			<table class="audit-table" style="max-width:600px">
				<thead><tr><th>${this.t('th_type')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th><th>%</th></tr></thead>
				<tbody>${rows}</tbody>
			</table>
		</div>`;
	}

	// ─── Module 1: Purchase Order ────────────────────────────
	render_po(d) {
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);
		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/purchase-order/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.supplier_name || r.supplier || ''}</td>
			<td>${r.transaction_date || ''}</td>
			<td>${r.schedule_date || ''}</td>
			<td class="currency-cell">${this.fc(r.base_grand_total)}</td>
			<td>${r.per_received || 0}%</td>
			<td>${r.per_billed || 0}%</td>
			<td>${r.age_days || 0}</td>
			<td>${r.days_past_delivery > 0 ? `<span style="color:#b91c1c">${r.days_past_delivery}</span>` : '—'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const sup_rows = (d.supplier_summary || []).map(s => `<tr>
			<td>${s.supplier}</td><td>${s.count}</td><td class="currency-cell">${this.fc(s.value)}</td>
		</tr>`).join('');

		return this.summary_bar(d.summary) + this.aging_table(d.aging) + `
			<div class="fpa-subsection-title"><i class="fa fa-list"></i> ${this.t('lbl_top_items')}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.t('th_supplier')}</th>
					<th>${this.t('th_date')}</th><th>${this.lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date'}</th>
					<th>${this.t('th_amount')}</th><th>${this.t('th_received')}</th><th>${this.t('th_billed')}</th>
					<th>${this.t('th_age_days')}</th><th>${this.lang === 'ar' ? 'تأخر التسليم' : 'Days Late'}</th>
					<th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="10" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${sup_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-truck"></i> ${this.t('lbl_supplier_sum')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:500px"><thead><tr>
						<th>${this.t('th_supplier')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
					</tr></thead><tbody>${sup_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── Module 2: Material Request ──────────────────────────
	render_mr(d) {
		const by_purpose = d.by_purpose || {};
		let content = this.summary_bar(d.summary);

		Object.entries(by_purpose).forEach(([purpose, pdata]) => {
			const items = this._filter_priority(pdata.items || []);
			const rows = items.slice(0, 15).map(r => `<tr>
				<td class="link-cell"><a href="/app/material-request/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
				<td>${r.department || ''}</td>
				<td>${r.transaction_date || ''}</td>
				<td>${r.schedule_date || ''}</td>
				<td>${r.age_days || 0}</td>
				<td>${r.days_overdue > 0 ? `<span style="color:#b91c1c">${r.days_overdue}</span>` : '—'}</td>
				<td>${r.per_ordered || 0}%</td>
				<td>${this.priority_badge(r.priority)}</td>
			</tr>`).join('');

			content += `
				<div class="fpa-subsection-title" style="margin-top:16px">
					<i class="fa fa-tag"></i> ${purpose}
					<span class="fpa-badge-count">${pdata.summary?.total || 0}</span>
				</div>
				${this.aging_table(pdata.aging)}
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_department')}</th>
						<th>${this.t('th_date')}</th><th>${this.lang === 'ar' ? 'تاريخ الحاجة' : 'Required Date'}</th>
						<th>${this.t('th_age_days')}</th><th>${this.t('th_overdue')}</th>
						<th>${this.t('th_billed')}</th><th>${this.t('th_priority')}</th>
					</tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
				</div>`;
		});

		const dept_rows = (d.dept_summary || []).map(s => `<tr>
			<td>${s.department}</td><td>${s.count}</td>
		</tr>`).join('');
		if (dept_rows) {
			content += `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-sitemap"></i> ${this.t('lbl_dept_sum')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:400px"><thead><tr>
						<th>${this.t('th_department')}</th><th>${this.t('th_count')}</th>
					</tr></thead><tbody>${dept_rows}</tbody></table>
				</div>`;
		}
		return content;
	}

	// ─── Module 3: Purchase Invoice ──────────────────────────
	render_pi(d) {
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);
		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/purchase-invoice/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.supplier_name || r.supplier || ''}</td>
			<td>${r.posting_date || ''}</td>
			<td>${r.due_date || ''}</td>
			<td class="currency-cell">${this.fc(r.outstanding_amount)}</td>
			<td>${r.age_days || 0}</td>
			<td>${r.days_overdue > 0 ? `<span style="color:#b91c1c">${r.days_overdue}</span>` : '—'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		// AP Aging
		const ap_aging_rows = (d.ap_aging || []).map(b => `<tr>
			<td>${b.label}</td><td>${b.count}</td><td class="currency-cell">${this.fc(b.value)}</td>
		</tr>`).join('');

		const sup_rows = (d.supplier_summary || []).map(s => `<tr>
			<td>${s.supplier}</td><td>${s.count}</td><td class="currency-cell">${this.fc(s.outstanding)}</td>
		</tr>`).join('');

		const dup_rows = (d.duplicates || []).map(r => `<tr>
			<td class="link-cell"><a href="/app/purchase-invoice/${encodeURIComponent(r.invoice1)}" target="_blank">${r.invoice1}</a></td>
			<td class="link-cell"><a href="/app/purchase-invoice/${encodeURIComponent(r.invoice2)}" target="_blank">${r.invoice2}</a></td>
			<td>${r.supplier_name || ''}</td>
			<td class="currency-cell">${this.fc(r.amount)}</td>
			<td>${r.days_apart}</td>
		</tr>`).join('');

		return this.summary_bar(d.summary) + `
			${ap_aging_rows ? `<div class="fpa-subsection-title"><i class="fa fa-clock-o"></i> ${this.lang === 'ar' ? 'تقادم الذمم الدائنة' : 'AP Aging'}</div>
			<div class="table-responsive">
				<table class="audit-table" style="max-width:500px"><thead><tr>
					<th>${this.t('th_type')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
				</tr></thead><tbody>${ap_aging_rows}</tbody></table>
			</div>` : ''}
			<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-list"></i> ${this.t('lbl_top_items')}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.t('th_supplier')}</th>
					<th>${this.t('th_date')}</th><th>${this.t('th_due_date')}</th>
					<th>${this.t('th_outstanding')}</th><th>${this.t('th_age_days')}</th>
					<th>${this.t('th_overdue')}</th><th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${sup_rows ? `<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-truck"></i> ${this.t('lbl_supplier_sum')}</div>
			<div class="table-responsive">
				<table class="audit-table" style="max-width:500px"><thead><tr>
					<th>${this.t('th_supplier')}</th><th>${this.t('th_count')}</th><th>${this.t('th_outstanding')}</th>
				</tr></thead><tbody>${sup_rows}</tbody></table>
			</div>` : ''}
			${dup_rows ? `<div class="fpa-subsection-title" style="margin-top:16px;color:#b91c1c"><i class="fa fa-copy"></i> ${this.t('lbl_duplicate')} (${d.duplicates.length})</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.lang === 'ar' ? 'الفاتورة 1' : 'Invoice 1'}</th><th>${this.lang === 'ar' ? 'الفاتورة 2' : 'Invoice 2'}</th>
					<th>${this.t('th_supplier')}</th><th>${this.t('th_amount')}</th>
					<th>${this.lang === 'ar' ? 'الفرق (أيام)' : 'Days Apart'}</th>
				</tr></thead><tbody>${dup_rows}</tbody></table>
			</div>` : ''}`;
	}

	// ─── Module 4: Payment Entry ─────────────────────────────
	render_pe(d) {
		const md = d.md_approved || [];
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);

		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/payment-entry/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.payment_type || ''}</td>
			<td>${r.party_name || r.party || ''}</td>
			<td class="currency-cell">${this.fc(r.paid_amount)}</td>
			<td>${r.posting_date || ''}</td>
			<td>${r.workflow_state || 'Draft'}</td>
			<td>${r.age_days || 0}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const md_rows = md.slice(0, 20).map(r => `<tr>
			<td class="link-cell"><a href="/app/payment-entry/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.party_name || r.party || ''}</td>
			<td class="currency-cell">${this.fc(r.paid_amount)}</td>
			<td>${r.posting_date || ''}</td>
			<td>${r.days_in_state || 0}</td>
			<td>${this.priority_badge(r.md_priority || 'Medium')}</td>
		</tr>`).join('');

		return this.summary_bar(d.summary) + `
			<div class="fpa-summary-bar" style="margin-bottom:12px">
				<span class="fpa-sum-item total"><i class="fa fa-clock-o"></i> ${this.t('lbl_md_approved')}: <strong>${d.md_count || 0}</strong></span>
				<span class="fpa-sum-item critical"><i class="fa fa-exclamation-triangle"></i> ${this.t('lbl_md_over14')}: <strong>${(d.md_over_14 || []).length}</strong></span>
				<span class="fpa-sum-item high">${this.t('lbl_md_over7')}: <strong>${(d.md_over_7 || []).length}</strong></span>
				<span class="fpa-sum-item medium">${this.t('lbl_md_over3')}: <strong>${(d.md_over_3 || []).length}</strong></span>
				<span class="fpa-sum-item value"><i class="fa fa-money"></i> ${this.lang === 'ar' ? 'قيمة MD المعتمد' : 'MD Approved Value'}: <strong>${this.fc(d.total_md_value)}</strong></span>
			</div>
			${this.aging_table(d.aging)}
			${md_rows ? `
				<div class="fpa-subsection-title" style="color:#9d174d"><i class="fa fa-check-square-o"></i> ${this.t('lbl_md_approved')}</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_supplier')}</th>
						<th>${this.t('th_amount')}</th><th>${this.t('th_date')}</th>
						<th>${this.t('lbl_days_in_state')}</th><th>${this.t('th_priority')}</th>
					</tr></thead><tbody>${md_rows}</tbody></table>
				</div>` : ''}
			<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-list"></i> ${this.lang === 'ar' ? 'جميع السداد المسودة' : 'All Draft Payments'}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.lang === 'ar' ? 'النوع' : 'Type'}</th>
					<th>${this.t('th_supplier')}</th><th>${this.t('th_amount')}</th>
					<th>${this.t('th_date')}</th><th>${this.t('th_workflow')}</th>
					<th>${this.t('th_age_days')}</th><th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>`;
	}

	// ─── Module 5: Journal Entry ─────────────────────────────
	render_je(d) {
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);

		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/journal-entry/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.voucher_type || ''}</td>
			<td>${r.posting_date || ''}</td>
			<td class="currency-cell">${this.fc(r.total_debit)}</td>
			<td>${r.workflow_state || 'Draft'}</td>
			<td>${r.age_days || 0}</td>
			<td>${r.missing_reference ? `<span class="risk-badge-high">${this.t('lbl_missing_ref')}</span>` : ''}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const unusual_rows = (d.unusual_entries || []).map(r => `<tr>
			<td class="link-cell"><a href="/app/journal-entry/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.voucher_type || ''}</td>
			<td>${r.posting_date || ''}</td>
			<td class="currency-cell"><strong>${this.fc(r.total_debit)}</strong></td>
			<td>${r.user_remark || ''}</td>
		</tr>`).join('');

		const type_rows = (d.by_type || []).map(t => `<tr>
			<td>${t.type}</td><td>${t.count}</td><td class="currency-cell">${this.fc(t.value)}</td>
		</tr>`).join('');

		return this.summary_bar(d.summary) + `
			<div class="fpa-summary-bar" style="margin-bottom:12px">
				<span class="fpa-sum-item total"><i class="fa fa-file-text"></i> ${this.lang === 'ar' ? 'ناقص مرجع' : 'Missing Reference'}: <strong>${d.missing_reference_count || 0}</strong></span>
			</div>
			${this.aging_table(d.aging)}
			<div class="fpa-subsection-title"><i class="fa fa-list"></i> ${this.t('lbl_top_items')}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.t('th_type')}</th><th>${this.t('th_date')}</th>
					<th>${this.t('th_amount')}</th><th>${this.t('th_workflow')}</th>
					<th>${this.t('th_age_days')}</th><th>${this.t('lbl_missing_ref')}</th><th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${unusual_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b91c1c"><i class="fa fa-warning"></i> ${this.t('lbl_unusual')} (${d.unusual_entries.length})</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_type')}</th><th>${this.t('th_date')}</th>
						<th>${this.t('th_amount')}</th><th>${this.lang === 'ar' ? 'ملاحظة' : 'Remark'}</th>
					</tr></thead><tbody>${unusual_rows}</tbody></table>
				</div>` : ''}
			${type_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-pie-chart"></i> ${this.lang === 'ar' ? 'حسب النوع' : 'By Type'}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:400px"><thead><tr>
						<th>${this.t('th_type')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
					</tr></thead><tbody>${type_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── Module 6: Fixed Asset ───────────────────────────────
	render_asset(d) {
		const s = d.summary || {};
		const missed = d.missed_depreciation || [];
		const anomalies = d.anomalies || [];
		const no_cust = d.no_custodian || [];
		const items = this._filter_priority(d.items || []);

		const asset_rows = items.slice(0, 20).map(r => `<tr>
			<td class="link-cell"><a href="/app/asset/${encodeURIComponent(r.name)}" target="_blank">${r.asset_name || r.name}</a></td>
			<td>${r.asset_category || ''}</td>
			<td>${r.status || ''}</td>
			<td class="currency-cell">${this.fc(r.gross_purchase_amount)}</td>
			<td class="currency-cell">${this.fc(r.value_after_depreciation)}</td>
			<td>${r.missing_custodian ? `<span class="risk-badge-high">${this.lang === 'ar' ? 'غائب' : 'Missing'}</span>` : '✓'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const missed_rows = missed.slice(0, 20).map(r => `<tr>
			<td class="link-cell"><a href="/app/asset/${encodeURIComponent(r.asset)}" target="_blank">${r.asset_name || r.asset}</a></td>
			<td>${r.asset_category || ''}</td>
			<td>${r.schedule_date || ''}</td>
			<td class="currency-cell">${this.fc(r.depreciation_amount)}</td>
			<td>${r.days_overdue > 0 ? `<span style="color:#b91c1c">${r.days_overdue}</span>` : '0'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const anomaly_rows = anomalies.map(a => `<tr>
			<td class="link-cell"><a href="/app/asset/${encodeURIComponent(a.asset)}" target="_blank">${a.asset_name || a.asset}</a></td>
			<td><span class="risk-badge-high">${a.issue}</span></td>
			<td class="currency-cell">${this.fc(Math.abs(a.amount))}</td>
		</tr>`).join('');

		const cat_rows = (d.category_summary || []).map(c => `<tr>
			<td>${c.category}</td><td>${c.count}</td><td class="currency-cell">${this.fc(c.value)}</td>
		</tr>`).join('');

		return this.summary_bar(s) + `
			<div class="fpa-summary-bar" style="margin-bottom:12px">
				<span class="fpa-sum-item critical"><i class="fa fa-calendar-times-o"></i> ${this.t('lbl_missed_dep')}: <strong>${s.missed_depreciation_count || 0}</strong></span>
				<span class="fpa-sum-item value"><i class="fa fa-money"></i> ${this.lang === 'ar' ? 'قيمة الإهلاك الفائت' : 'Missed Dep. Value'}: <strong>${this.fc(s.missed_depreciation_value)}</strong></span>
				<span class="fpa-sum-item high"><i class="fa fa-user-times"></i> ${this.t('lbl_no_custodian')}: <strong>${s.no_custodian_count || 0}</strong></span>
				<span class="fpa-sum-item high"><i class="fa fa-exclamation-triangle"></i> ${this.t('lbl_anomalies')}: <strong>${s.anomaly_count || 0}</strong></span>
			</div>
			<div class="fpa-subsection-title"><i class="fa fa-list"></i> ${this.lang === 'ar' ? 'الأصول النشطة' : 'Active Assets'}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_asset_name')}</th><th>${this.t('th_category')}</th><th>${this.t('th_status')}</th>
					<th>${this.lang === 'ar' ? 'تكلفة الشراء' : 'Purchase Cost'}</th>
					<th>${this.lang === 'ar' ? 'القيمة الحالية' : 'Net Book Value'}</th>
					<th>${this.t('lbl_no_custodian')}</th><th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${asset_rows || `<tr><td colspan="7" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${missed_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b91c1c"><i class="fa fa-calendar-times-o"></i> ${this.t('lbl_missed_dep')} (${missed.length})</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_asset_name')}</th><th>${this.t('th_category')}</th>
						<th>${this.t('th_depr_date')}</th><th>${this.t('th_depr_amt')}</th>
						<th>${this.t('th_overdue')}</th><th>${this.t('th_priority')}</th>
					</tr></thead><tbody>${missed_rows}</tbody></table>
				</div>` : ''}
			${anomaly_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b91c1c"><i class="fa fa-warning"></i> ${this.t('lbl_anomalies')} (${anomalies.length})</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:500px"><thead><tr>
						<th>${this.t('th_asset_name')}</th><th>${this.t('th_issue')}</th><th>${this.t('th_amount')}</th>
					</tr></thead><tbody>${anomaly_rows}</tbody></table>
				</div>` : ''}
			${cat_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-pie-chart"></i> ${this.t('lbl_category_sum')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:450px"><thead><tr>
						<th>${this.t('th_category')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
					</tr></thead><tbody>${cat_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── Module 7: Prepaid / Deferred ────────────────────────
	render_prepaid(d) {
		const s = d.summary || {};
		const deferred = d.deferred_balances || [];
		const pending = d.pending_amortization || [];
		const deferred_pi = d.deferred_pi || [];

		const bal_rows = deferred.map(r => `<tr>
			<td>${r.account_name || r.account}</td>
			<td class="currency-cell"><strong>${this.fc(r.balance)}</strong></td>
		</tr>`).join('');

		const amor_rows = pending.slice(0, 20).map(r => `<tr>
			<td class="link-cell"><a href="/app/journal-entry/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.posting_date || ''}</td>
			<td class="currency-cell">${this.fc(r.total_debit)}</td>
			<td>${r.workflow_state || 'Draft'}</td>
			<td>${r.age_days || 0}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const pi_rows = deferred_pi.slice(0, 15).map(r => `<tr>
			<td class="link-cell"><a href="/app/purchase-invoice/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.supplier_name || ''}</td>
			<td>${r.posting_date || ''}</td>
			<td class="currency-cell">${this.fc(r.grand_total)}</td>
			<td class="currency-cell">${this.fc(r.outstanding_amount)}</td>
		</tr>`).join('');

		return this.summary_bar(s) + `
			<div class="fpa-summary-bar" style="margin-bottom:12px">
				<span class="fpa-sum-item value"><i class="fa fa-money"></i> ${this.t('lbl_deferred_bal')}: <strong>${this.fc(s.total_deferred_balance)}</strong></span>
				<span class="fpa-sum-item high"><i class="fa fa-clock-o"></i> ${this.t('lbl_pend_amor')}: <strong>${s.pending_amortization_count || 0}</strong></span>
			</div>
			${this.aging_table(d.aging)}
			${bal_rows ? `
				<div class="fpa-subsection-title"><i class="fa fa-bank"></i> ${this.t('lbl_deferred_bal')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:500px"><thead><tr>
						<th>${this.t('th_account')}</th><th>${this.t('th_balance')}</th>
					</tr></thead><tbody>${bal_rows}</tbody></table>
				</div>` : ''}
			${amor_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b45309"><i class="fa fa-calendar"></i> ${this.t('lbl_pend_amor')} (${pending.length})</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_date')}</th>
						<th>${this.t('th_amount')}</th><th>${this.t('th_workflow')}</th>
						<th>${this.t('th_age_days')}</th><th>${this.t('th_priority')}</th>
					</tr></thead><tbody>${amor_rows}</tbody></table>
				</div>` : ''}
			${pi_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-file-text"></i> ${this.lang === 'ar' ? 'فواتير شراء مؤجلة' : 'Deferred Expense Invoices'} (${deferred_pi.length})</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_supplier')}</th>
						<th>${this.t('th_date')}</th><th>${this.t('th_amount')}</th>
						<th>${this.t('th_outstanding')}</th>
					</tr></thead><tbody>${pi_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── Module 8: Sales Order ───────────────────────────────
	render_so(d) {
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);
		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/sales-order/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.customer_name || r.customer || ''}</td>
			<td>${r.transaction_date || ''}</td>
			<td>${r.delivery_date || ''}</td>
			<td class="currency-cell">${this.fc(r.base_grand_total)}</td>
			<td>${r.per_delivered || 0}%</td>
			<td>${r.per_billed || 0}%</td>
			<td>${r.age_days || 0}</td>
			<td>${r.days_past_delivery > 0 ? `<span style="color:#b91c1c">${r.days_past_delivery}</span>` : '—'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const cust_rows = (d.customer_summary || []).map(c => `<tr>
			<td>${c.customer}</td><td>${c.count}</td><td class="currency-cell">${this.fc(c.value)}</td>
		</tr>`).join('');

		return this.summary_bar(d.summary) + this.aging_table(d.aging) + `
			<div class="fpa-subsection-title"><i class="fa fa-list"></i> ${this.t('lbl_top_items')}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.t('th_customer')}</th>
					<th>${this.t('th_date')}</th><th>${this.lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date'}</th>
					<th>${this.t('th_amount')}</th><th>${this.t('th_delivered')}</th><th>${this.t('th_billed')}</th>
					<th>${this.t('th_age_days')}</th><th>${this.lang === 'ar' ? 'تأخر التسليم' : 'Days Late'}</th>
					<th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="10" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${cust_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-users"></i> ${this.t('lbl_customer_sum')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:450px"><thead><tr>
						<th>${this.t('th_customer')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
					</tr></thead><tbody>${cust_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── Module 9: Sales Invoice ─────────────────────────────
	render_si(d) {
		const s = d.summary || {};
		const items = this._filter_priority(d.items || []);
		const top = items.slice(0, 30);

		const rows = top.map(r => `<tr>
			<td class="link-cell"><a href="/app/sales-invoice/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.customer_name || r.customer || ''}</td>
			<td>${r.posting_date || ''}</td>
			<td>${r.due_date || ''}</td>
			<td class="currency-cell">${this.fc(r.outstanding_amount)}</td>
			<td>${r.age_days || 0}</td>
			<td>${r.days_overdue > 0 ? `<span style="color:#b91c1c">${r.days_overdue}</span>` : '—'}</td>
			<td>${this.priority_badge(r.priority)}</td>
		</tr>`).join('');

		const ar_aging_rows = (d.ar_aging || []).map(b => `<tr>
			<td>${b.label}</td><td>${b.count}</td><td class="currency-cell">${this.fc(b.value)}</td>
		</tr>`).join('');

		const cust_rows = (d.customer_summary || []).map(c => `<tr>
			<td>${c.customer}</td><td>${c.count}</td><td class="currency-cell">${this.fc(c.outstanding)}</td>
		</tr>`).join('');

		const bad_rows = (d.bad_debt_risk || []).map(r => `<tr>
			<td class="link-cell"><a href="/app/sales-invoice/${encodeURIComponent(r.name)}" target="_blank">${r.name}</a></td>
			<td>${r.customer_name || r.customer || ''}</td>
			<td class="currency-cell"><strong>${this.fc(r.outstanding_amount)}</strong></td>
			<td>${r.days_overdue}</td>
		</tr>`).join('');

		const offender_rows = (d.repeat_offenders || []).map(c => `<tr>
			<td>${c.customer}</td><td>${c.count}</td><td class="currency-cell">${this.fc(c.outstanding)}</td>
		</tr>`).join('');

		return this.summary_bar(s) + `
			<div class="fpa-summary-bar" style="margin-bottom:12px">
				<span class="fpa-sum-item critical"><i class="fa fa-exclamation-triangle"></i> ${this.t('lbl_bad_debt')}: <strong>${s.bad_debt_risk_count || 0}</strong></span>
				<span class="fpa-sum-item value"><i class="fa fa-money"></i> ${this.lang === 'ar' ? 'قيمة المشكوك فيه' : 'Bad Debt Value'}: <strong>${this.fc(s.bad_debt_risk_value)}</strong></span>
				<span class="fpa-sum-item high"><i class="fa fa-user-times"></i> ${this.t('lbl_repeat_off')}: <strong>${s.repeat_offender_count || 0}</strong></span>
			</div>
			${ar_aging_rows ? `
				<div class="fpa-subsection-title"><i class="fa fa-clock-o"></i> ${this.lang === 'ar' ? 'تقادم الذمم المدينة' : 'AR Aging'}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:500px"><thead><tr>
						<th>${this.t('th_type')}</th><th>${this.t('th_count')}</th><th>${this.t('th_value')}</th>
					</tr></thead><tbody>${ar_aging_rows}</tbody></table>
				</div>` : ''}
			<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-list"></i> ${this.t('lbl_top_items')}</div>
			<div class="table-responsive">
				<table class="audit-table"><thead><tr>
					<th>${this.t('th_name')}</th><th>${this.t('th_customer')}</th>
					<th>${this.t('th_date')}</th><th>${this.t('th_due_date')}</th>
					<th>${this.t('th_outstanding')}</th><th>${this.t('th_age_days')}</th>
					<th>${this.t('th_overdue')}</th><th>${this.t('th_priority')}</th>
				</tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center text-muted">${this.t('no_data')}</td></tr>`}</tbody></table>
			</div>
			${cust_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px"><i class="fa fa-users"></i> ${this.t('lbl_customer_sum')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:450px"><thead><tr>
						<th>${this.t('th_customer')}</th><th>${this.t('th_count')}</th><th>${this.t('th_outstanding')}</th>
					</tr></thead><tbody>${cust_rows}</tbody></table>
				</div>` : ''}
			${bad_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b91c1c"><i class="fa fa-exclamation-triangle"></i> ${this.t('lbl_bad_debt')} (${(d.bad_debt_risk || []).length})</div>
				<div class="table-responsive">
					<table class="audit-table"><thead><tr>
						<th>${this.t('th_name')}</th><th>${this.t('th_customer')}</th>
						<th>${this.t('th_outstanding')}</th><th>${this.t('th_overdue')}</th>
					</tr></thead><tbody>${bad_rows}</tbody></table>
				</div>` : ''}
			${offender_rows ? `
				<div class="fpa-subsection-title" style="margin-top:16px;color:#b45309"><i class="fa fa-repeat"></i> ${this.t('lbl_repeat_off')}</div>
				<div class="table-responsive">
					<table class="audit-table" style="max-width:450px"><thead><tr>
						<th>${this.t('th_customer')}</th>
						<th>${this.lang === 'ar' ? 'عدد الفواتير' : 'Invoice Count'}</th>
						<th>${this.t('th_outstanding')}</th>
					</tr></thead><tbody>${offender_rows}</tbody></table>
				</div>` : ''}`;
	}

	// ─── AI Copilot (Overall) ────────────────────────────────
	async run_ai_analysis() {
		if (!this.data || !this.data.scores) {
			frappe.msgprint(this.t('load_data_first'));
			return;
		}
		this.$ai.slideDown(200, () => {
			$('html,body').animate({ scrollTop: this.$ai.offset().top - 60 }, 300);
		});
		this.$ai_body.html(`<div class="loading-state"><i class="fa fa-spinner fa-spin"></i> ${this.t('ai_analyzing')}</div>`);

		try {
			const me = this;
			frappe.call({
				method: 'financial_audit.financial_audit.page.finance_process_audit.finance_process_audit.get_process_exception_ai_analysis',
				args: { filters: this.filters, lang: this.lang },
				timeout: 300,
				callback: async function(r) {
					if (!r.message) {
						me.$ai_body.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${me.t('ai_no_response')}</p></div>`);
						return;
					}
					const result = r.message;
					if (result.provider === 'Puter') {
						me.load_puter_js();
						try {
							await me._wait_for_puter();
							const response = await puter.ai.chat(result.prompt, { model: 'gpt-4o-mini' });
							const text = typeof response === 'string' ? response
								: (response?.message?.content?.[0]?.text || response?.message?.content || response?.toString() || me.t('ai_no_response'));
							me._render_ai_panel(me.$ai_body, text, true);
						} catch (e) {
							me.$ai_body.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${me.t('ai_error')}: ${e.message || e}</p></div>`);
						}
					} else {
						if (result.analysis) {
							me._render_ai_panel(me.$ai_body, result.analysis, true);
						} else {
							me.$ai_body.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${me.t('ai_no_response')}</p></div>`);
						}
					}
				},
				error: function(err) {
					me.$ai_body.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${me.t('ai_error')}: ${err.message || ''}</p></div>`);
				}
			});
		} catch (e) {
			this.$ai_body.html(`<div class="empty-state"><div class="empty-icon"><i class="fa fa-exclamation-triangle"></i></div><p>${this.t('ai_error')}: ${e.message || e}</p></div>`);
		}
	}

	// ─── Per-Module AI ───────────────────────────────────────
	async run_module_ai(module_key) {
		const module_data = this.data[module_key] || {};
		const $section = this.$modules.find(`#fpa-mod-${module_key}`);
		const $panel   = $section.find(`[class*="fpa-ai-${module_key}-panel"]`);

		$panel.show().html(`<div class="loading-state"><i class="fa fa-spinner fa-spin"></i> ${this.t('ai_analyzing')}</div>`);
		$('html,body').animate({ scrollTop: $panel.offset().top - 60 }, 300);

		try {
			const me = this;
			frappe.call({
				method: 'financial_audit.financial_audit.page.finance_process_audit.finance_process_audit.get_module_ai_analysis',
				args: {
					module_key: module_key,
					module_data: JSON.stringify(module_data),
					lang: this.lang
				},
				timeout: 180,
				callback: async function(r) {
					if (!r.message) {
						$panel.html(`<div class="empty-state"><p>${me.t('ai_no_response')}</p></div>`);
						return;
					}
					const result = r.message;
					if (result.provider === 'Puter') {
						me.load_puter_js();
						try {
							await me._wait_for_puter();
							const response = await puter.ai.chat(result.prompt, { model: 'gpt-4o-mini' });
							const text = typeof response === 'string' ? response
								: (response?.message?.content?.[0]?.text || response?.message?.content || response?.toString() || me.t('ai_no_response'));
							me._render_ai_panel($panel, text, false);
						} catch (e) {
							$panel.html(`<div class="empty-state"><p>${me.t('ai_error')}: ${e.message || e}</p></div>`);
						}
					} else {
						if (result.analysis) {
							me._render_ai_panel($panel, result.analysis, false);
						} else {
							$panel.html(`<div class="empty-state"><p>${me.t('ai_no_response')}</p></div>`);
						}
					}
				},
				error: function(err) {
					$panel.html(`<div class="empty-state"><p>${me.t('ai_error')}: ${err.message || ''}</p></div>`);
				}
			});
		} catch (e) {
			$panel.html(`<div class="empty-state"><p>${this.t('ai_error')}: ${e.message || e}</p></div>`);
		}
	}

	// ─── AI Panel Renderer ───────────────────────────────────
	_render_ai_panel($target, text, is_copilot) {
		const _esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		let ai_html = _esc(text)
			.replace(/^### (.*$)/gm, '<h4>$1</h4>')
			.replace(/^## (.*$)/gm, '<h3>$1</h3>')
			.replace(/^# (.*$)/gm, '<h2>$1</h2>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/^[-*] (.*$)/gm, '<li>$1</li>')
			.replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
			.replace(/\n\n/g, '</p><p>')
			.replace(/\n/g, '<br>');
		ai_html = ai_html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>').replace(/<\/ul>\s*<ul>/g, '');

		const dir = this.is_rtl ? 'rtl' : 'ltr';
		const header_title = is_copilot ? this.t('ai_copilot_title') : this.t('ai_module_title');
		const company = (this.data || {}).company || '';
		const as_of   = (this.data || {}).as_of || '';

		$target.html(`
			<div class="ai-report" dir="${dir}">
				<div class="ai-report-header">
					<i class="fa fa-magic" style="color:var(--fa-primary-light,#8b5cf6)"></i>
					<span>${header_title}${company ? ' — ' + company : ''}</span>
					${as_of ? `<span class="ai-date">${as_of}</span>` : ''}
				</div>
				${is_copilot ? this._copilot_score_summary() : ''}
				<div style="border-top:2px solid var(--fa-border,#e5e7eb);padding-top:20px;margin-top:12px">
					<div class="ai-section-title"><i class="fa fa-lightbulb-o" style="color:#b45309"></i> ${this.lang === 'ar' ? 'التحليل والتوصيات' : 'Analysis & Recommendations'}</div>
					<div class="ai-report-content"><p>${ai_html}</p></div>
				</div>
			</div>`);
	}

	_copilot_score_summary() {
		const s = (this.data || {}).scores || {};
		const color = (v, inv) => {
			if (inv) return v <= 20 ? '#047857' : v <= 50 ? '#b45309' : '#b91c1c';
			return v >= 75 ? '#047857' : v >= 50 ? '#b45309' : '#b91c1c';
		};
		const metric = (label, value, inv, suffix) => `
			<div class="ai-summary-card">
				<div class="label">${label}</div>
				<div class="value" style="color:${color(value, inv)}">${value || 0}${suffix || ''}</div>
			</div>`;

		return `<div class="ai-summary-grid" style="margin:16px 0">
			${metric(this.t('audit_health'), s.audit_health_score, false, '/100')}
			${metric(this.t('compliance_score'), s.compliance_score, false, '/100')}
			${metric(this.t('risk_score'), s.risk_score, true, '/100')}
			${metric(this.t('critical_issues'), s.critical_count, true, '')}
			${metric(this.t('high_issues'), s.high_count, true, '')}
			${metric(this.t('total_pending'), s.total_pending_actions, true, '')}
		</div>`;
	}

	// ─── Clear AI ────────────────────────────────────────────
	clear_ai() {
		this.$ai.slideUp(200);
		this.$ai_body.empty();
		this.$modules.find('[class*="-panel"]').hide().empty();
	}

	// ─── Export PDF ──────────────────────────────────────────
	export_pdf() {
		if (!this.data || !this.data.scores) {
			frappe.msgprint(this.t('load_data_first'));
			return;
		}
		frappe.msgprint({ title: this.t('pdf_export_btn'), message: this.t('pdf_preparing') });
		setTimeout(() => window.print(), 500);
	}

	// ─── Puter Helpers ───────────────────────────────────────
	load_puter_js() {
		if (!window.puter) {
			const s = document.createElement('script');
			s.src = 'https://js.puter.com/v2/';
			s.async = true;
			document.head.appendChild(s);
		}
	}

	_wait_for_puter(timeout = 12000) {
		return new Promise((resolve, reject) => {
			if (window.puter) return resolve();
			const start = Date.now();
			const check = setInterval(() => {
				if (window.puter) { clearInterval(check); resolve(); }
				else if (Date.now() - start > timeout) { clearInterval(check); reject(new Error(this.t('ai_puter_failed'))); }
			}, 200);
		});
	}

	// ─── Utilities ──────────────────────────────────────────
	fc(v) { return format_currency(v || 0, this.currency); }

	short_number(v) {
		if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + 'M';
		if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + 'K';
		return (v || 0).toString();
	}

	priority_badge(priority) {
		const map = {
			Critical: { cls: 'risk-badge-critical', icon: 'fa-times-circle', label: { ar: 'حرج', en: 'Critical' } },
			High:     { cls: 'risk-badge-high',     icon: 'fa-exclamation-circle', label: { ar: 'عالي', en: 'High' } },
			Medium:   { cls: 'risk-badge-medium',   icon: 'fa-minus-circle', label: { ar: 'متوسط', en: 'Medium' } },
			Low:      { cls: 'risk-badge-low',       icon: 'fa-check-circle', label: { ar: 'منخفض', en: 'Low' } },
		};
		const m = map[priority] || map['Low'];
		return `<span class="${m.cls}"><i class="fa ${m.icon}"></i> ${m.label[this.lang]}</span>`;
	}

	empty_msg() {
		return `<div class="empty-state"><div class="empty-icon"><i class="fa fa-inbox"></i></div><p>${this.t('no_data')}</p></div>`;
	}

	_filter_priority(items) {
		if (!this.priority_filter) return items;
		return items.filter(i => i.priority === this.priority_filter);
	}
}
