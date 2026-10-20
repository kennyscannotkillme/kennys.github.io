/**
 * HHH 研究终端 — 共享数据层与格式化工具
 *
 * 两个数据文件均由 Python 导出，前端只做读取、筛选与格式化。
 *   public/portfolio-analytics.json  — scripts/export_hhh_workbench_analytics.py
 *   public/industry-research.json    — scripts/export_hhh_industry.py
 *
 * 本文件不做任何经济/财务推导：没有收益率、毛利率、同比、回撤、夏普的再计算。
 * 唯一的数值变换是「小数 → 百分比」的单位展示（×100），该语义由
 * metric_definitions.relative_return 明确规定。缺值一律显式标注，不用 0 代替。
 */
import analyticsSeed from '@/public/portfolio-analytics.json';
import industrySeed from '@/public/industry-research.json';

/* ═══════════════ portfolio-analytics.json ═══════════════ */

export interface CurvePoint {
  date: string;
  point_kind: string;
  portfolio_nav: number | null;
  benchmark_nav: number | null;
  matched_benchmark_nav: number | null;
  cumulative_return: number | null;
  benchmark_return: number | null;
  relative_return: number | null;
  relative_wealth_return?: number | null;
  drawdown: number | null;
  exposure: number | null;
  cash?: number | null;
  position_value?: number | null;
  dividend_receivable?: number | null;
  cumulative_cost: number | null;
}

export interface PeriodReturn {
  period: string;
  year: string;
  start_nav: number;
  final_nav: number;
  profit: number;
  return: number;
  benchmark_return: number;
  first_date: string;
  last_date: string;
  partial_period: boolean;
}

export interface StrategyMetrics {
  initial_nav: number | null;
  final_nav: number | null;
  benchmark_final_nav: number | null;
  profit_cny: number | null;
  net_return: number | null;
  cagr: number | null;
  benchmark_return: number | null;
  max_drawdown: number | null;
  sharpe: number | null;
  sortino: number | null;
  profit_factor: number | null;
  profit_factor_status?: string | null;
  win_rate: number | null;
  payoff_ratio: number | null;
  average_win?: number | null;
  average_loss?: number | null;
  trades: number | null;
  winning_trades?: number | null;
  losing_trades?: number | null;
  breakeven_trades?: number | null;
  entries?: number | null;
  fills?: number | null;
  total_cost: number | null;
  commission?: number | null;
  stamp_duty?: number | null;
  slippage?: number | null;
  turnover_two_way?: number | null;
  turnover_annualized?: number | null;
  mean_position_weight: number | null;
  final_position_weight?: number | null;
  matched_benchmark_return?: number | null;
  matched_benchmark_final_nav?: number | null;
  drawdown_duration_days: number | null;
  normalized_initial_units?: number | null;
  normalized_final_units?: number | null;
}

export interface DrawdownEpisode {
  peak_date: string;
  end_date: string;
  calendar_days: number;
  recovered: boolean;
}

export interface TradeRow {
  id: string;
  ticker: string;
  entry_date: string;
  exit_date: string;
  net_pnl: number;
  quantity: number;
  cash_distributions: number;
  scope: string;
}

export interface TerminalPosition {
  ticker: string;
  quantity: number;
  market_value: number;
  weight: number;
  as_of: string;
}

export interface RobustnessRow {
  name: string;
  final_nav: number | null;
  net_return: number | null;
  method?: string | null;
  status?: string | null;
  note?: string | null;
}

export interface Strategy {
  mark_clock?: string;
  mark_clock_note?: string;
  id: string;
  name: string;
  basis: string;
  currency: string | null;
  period: string[];
  data_as_of: string;
  status: string;
  evidence_status: string;
  source_status?: string | null;
  execution?: string | null;
  metrics: StrategyMetrics;
  curve: CurvePoint[];
  years: PeriodReturn[];
  months: PeriodReturn[];
  costs: {
    commission?: number;
    stamp_duty?: number;
    slippage?: number;
    total?: number;
    currency?: string;
    market_impact?: number | null;
    status?: string;
    slippage_kind?: string;
  } | null;
  drawdown: {
    maximum_duration_calendar_days: number;
    episodes: DrawdownEpisode[];
    terminal_underwater: boolean;
  } | null;
  trades: TradeRow[];
  terminal_positions: TerminalPosition[];
  attribution: {
    status: string;
    closed_positions_net_pnl: number | null;
    open_positions_and_residual_pnl: number | null;
    factor_attribution: unknown;
    industry_attribution: unknown;
    note?: string;
    open_price_pnl?: number | null;
    open_cash_distribution_pnl?: number | null;
  } | null;
  robustness: RobustnessRow[];
  capacity: { status: string; estimated_cny: number | null; note?: string } | null;
  industry_exposure?: { status: string; items: unknown[]; reason?: string } | null;
  initial_reference?: {
    date: string;
    point_kind: string;
    portfolio_nav: number;
    benchmark_nav: number;
    label: string;
  } | null;
  benchmark?: { id: string; name: string; tradable: boolean; clock: string; note: string } | null;
  limitations: string[];
  source_ids: string[];
}

export interface WatchItem {
  ticker: string;
  name: string;
  rank: number;
  score: number;
  momentum: number | null;
  pb: number | null;
  volatility: number | null;
  trend_percentile?: number | null;
  value_percentile?: number | null;
  lowvol_percentile?: number | null;
  reference_close: number | null;
  risk_flags: string[];
}

export interface Watchlist {
  status: string;
  signal_date: string;
  intended_session: string;
  risk_on: boolean;
  eligible_ranked_count: number | null;
  breadth_median_momentum: number | null;
  items: WatchItem[];
  source_id: string;
  freshness: string;
  scope: string;
  forward_performance: unknown;
}

export interface QuantLab {
  factors: { id: string; name: string; formula: string; mechanism: string }[];
  factor_weighting: string;
  experiments: {
    id: string;
    name: string;
    mechanism: string;
    status: string;
    period: string[];
    source_ids: string[];
  }[];
  forward_watchlists: Watchlist[];
  forward_validation_status: string;
  corporate_actions: {
    total: number;
    resolved: number;
    unresolved: number;
    classifications: Record<string, number>;
    actual_ledger_or_feature_impact_rows: number;
    status: string;
    source_id: string;
    note: string;
  };
  new_research_runs: number;
  new_downloads: number;
  live_ordering: boolean;
}

export interface AnalyticsSource {
  id: string;
  path: string;
  sha256: string;
}

export interface Analytics {
  version: number;
  generated_at: string;
  scope: string;
  default_strategy_id: string;
  live_ordering: boolean;
  metric_definitions: Record<string, string>;
  strategies: Strategy[];
  quant_lab: QuantLab;
  sources: AnalyticsSource[];
}

/* ═══════════════ industry-research.json ═══════════════ */

export interface IndustrySource {
  id: string;
  title: string;
  url: string | null;
  path?: string | null;
  published_at: string | null;
  retrieved_on?: string | null;
  verification: string;
  evidence_grade?: string | null;
  source_type?: string | null;
  document_locator?: string | null;
  verification_note?: string | null;
  last_verified?: string | null;
  pit_eligible?: boolean | null;
  scope?: string | null;
}

export interface LayerCompanyRef {
  ticker: string;
  name: string;
  market: string;
}

export interface ValuationBlock {
  value: number | null;
  metric?: string | null;
  unit?: string | null;
  as_of_date?: string | null;
  forecast_period?: string | null;
  source?: unknown;
  status: string;
  reason?: string | null;
}

export interface Layer {
  id: string;
  group: string;
  name: string;
  role: string;
  supply_demand: string;
  bottleneck: string;
  company_tickers: string[];
  source_ids: string[];
  upstream: string[];
  downstream: string[];
  watch: string;
  catalysts: string[];
  risks: string[];
  invalidation: string[];
  growth_expectations: string;
  signal: string;
  signal_reason: string;
  evidence: string;
  claim_status: string;
  relationship_type: string;
  valuation: ValuationBlock;
  layer: string;
  topics: string[];
  theme_layers: Record<string, string>;
  companies: LayerCompanyRef[];
  evidence_grade: string;
  signal_source_ids: string[];
  as_of_date: string;
  last_verified: string;
}

export interface Theme {
  id: string;
  name: string;
  layer_ids: string[];
  description: string;
  default_market: string;
}

export interface HistoryPoint {
  period: string;
  date: string;
  revenue_m: number;
  source_ids?: string[];
  release_date?: string | null;
  publication_date_semantics?: string | null;
}

export interface FinancialPeriod {
  fiscal_period: string | null;
  period_end: string | null;
  observed_at?: string | null;
  published_at?: string | null;
  publication_date_semantics?: string | null;
  revenue_usd_million: number | null;
  revenue_reported?: { value: number | null; unit: string | null; currency: string | null } | null;
  usd_basis?: string | null;
  accounting_standard?: string | null;
  gross_margin_pct: number | null;
  gaap_gross_margin_pct?: number | null;
  gross_margin_basis?: string | null;
  gaap_gross_profit_usd_million?: number | null;
  source_ids: string[];
  verification: string;
  data_status: string;
}

export interface MetricRow {
  entity_id: string;
  industry: string[];
  supply_chain_layer: string[];
  ticker: string;
  market: string;
  metric: string;
  value: number | null;
  unit: string | null;
  as_of_date: string | null;
  forecast_period: string | null;
  source: string[];
  evidence_grade: string;
  last_verified: string | null;
  status: string;
  reason: string | null;
}

export interface MissingMetric {
  metric: string;
  reason: string;
  value: null;
}

export interface Company {
  ticker: string;
  name: string;
  market: string;
  profile: string;
  source_ids: string[];
  revenue_m: number | null;
  previous_revenue_m: number | null;
  prior_year_revenue_m: number | null;
  gross_margin_pct: number | null;
  gaap_gross_margin_pct?: number | null;
  operating_cash_flow_m: number | null;
  free_cash_flow_m: number | null;
  net_income_m: number | null;
  eps_diluted: number | null;
  ntm_pe: number | null;
  forward_ev_ebitda: number | null;
  period: string | null;
  period_end: string | null;
  release_date: string | null;
  currency: string | null;
  accounting_standard: string | null;
  history: HistoryPoint[];
  verification: string;
  valuation_status: string;
  revenue_yoy_pct: number | null;
  revenue_qoq_pct: number | null;
  entity_id: string;
  industry_position: string[];
  layer_ids: string[];
  drivers: string[];
  catalysts: string[];
  risks: string[];
  watchpoints?: string[];
  research_scope: string;
  financial_notes?: string[];
  history_semantics?: string | null;
  gross_margin_basis?: string | null;
  revenue_currency_basis?: string | null;
  financial_periods?: {
    latest?: FinancialPeriod | null;
    prior_quarter?: FinancialPeriod | null;
    year_ago?: FinancialPeriod | null;
  } | null;
  reported_revenue?: { value: number | null; unit: string | null; currency: string | null } | null;
  missing_metrics: MissingMetric[];
  metrics: MetricRow[];
  consensus_expectations: ValuationBlock | null;
  historical_valuation_range: ValuationBlock | null;
  market_snapshot: {
    last: number | null;
    currency: string | null;
    as_of_utc: string | null;
    prior_close: number | null;
    exchange: string | null;
    status: string;
    source_ids: string[];
    note: string;
  } | null;
}

export interface ScenarioPoint {
  growth_pct: number;
  multiple_change_pct: number;
  price_index: number;
  return_pct: number;
}

export interface IndustryData {
  schema_version: number;
  data_contract_version?: number;
  as_of: string;
  title: string;
  subtitle: string;
  coverage_note?: string;
  data_status?: string;
  reproduction_command?: string;
  input_fingerprints?: { path: string; sha256: string }[];
  stats: {
    layer_count: number;
    company_count: number;
    financial_count: number;
    theme_count?: number;
    valuation_count?: number;
  };
  sources: IndustrySource[];
  layers: Layer[];
  companies: Company[];
  themes: Theme[];
  scenario: {
    base_index: number;
    growth_rates: number[];
    multiple_changes: number[];
    points: ScenarioPoint[];
    formula: string;
    status?: string;
    assumptions?: string[];
  } | null;
  conclusions: { title: string; body: string; type: string; source_ids: string[] }[];
  method: string[];
}

/* ═══════════════ datasets ═══════════════ */

export const analytics = analyticsSeed as unknown as Analytics;
export const industry = industrySeed as unknown as IndustryData;

export const strategies: Strategy[] = Array.isArray(analytics?.strategies) ? analytics.strategies : [];
export const defaultStrategyId = analytics?.default_strategy_id ?? strategies[0]?.id ?? '';
export const quantLab = analytics?.quant_lab;

export const layers: Layer[] = Array.isArray(industry?.layers) ? industry.layers : [];
export const companies: Company[] = Array.isArray(industry?.companies) ? industry.companies : [];
export const themes: Theme[] = Array.isArray(industry?.themes) ? industry.themes : [];
export const industrySources: IndustrySource[] = Array.isArray(industry?.sources) ? industry.sources : [];

export const industrySourceById = new Map(industrySources.map((s) => [s.id, s]));
export const analyticsSourceById = new Map(
  (Array.isArray(analytics?.sources) ? analytics.sources : []).map((s) => [s.id, s]),
);
export const companyByTicker = new Map(companies.map((c) => [c.ticker, c]));
export const layerById = new Map(layers.map((l) => [l.id, l]));

export function strategyById(id: string): Strategy | null {
  return strategies.find((s) => s.id === id) ?? strategies.find((s) => s.id === defaultStrategyId) ?? strategies[0] ?? null;
}

/** 有人民币资金账本的策略；Gen2 只有归一化单位，永远不金额化。 */
export function isCapitalBasis(s: Strategy | null | undefined): boolean {
  return s?.basis === 'CNY_SIMULATED_CAPITAL';
}

/* ═══════════════ 格式化（仅显示层） ═══════════════ */

export const UNAVAILABLE = 'Unavailable';
export const PENDING = 'DATA PENDING';
export const DASH = '—';

const NF_AMOUNT = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const NF_INT = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

function symbolFor(currency: string | null | undefined): string {
  if (currency === 'CNY') return '¥';
  if (currency === 'USD') return '$';
  return '';
}

export function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** 金额；缺值返回 Unavailable，绝不返回 0。 */
export function money(v: number | null | undefined, currency: string | null | undefined = 'CNY'): string {
  if (!isNum(v)) return UNAVAILABLE;
  return symbolFor(currency) + NF_AMOUNT.format(v);
}

export function int(v: number | null | undefined): string {
  return isNum(v) ? NF_INT.format(v) : UNAVAILABLE;
}

export function dec(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return UNAVAILABLE;
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);
}

/** 源数据为小数收益（0.01 = 1%）。×100 是契约规定的单位展示，不是新指标。 */
export function pctFraction(v: number | null | undefined, digits = 2, signed = true): string {
  if (!isNum(v)) return UNAVAILABLE;
  const s = (v * 100).toFixed(digits);
  return (signed && v > 0 ? '+' : '') + s + '%';
}

/** 源数据已经是百分数（例如 revenue_yoy_pct = 105.85）。 */
export function pctValue(v: number | null | undefined, digits = 2, signed = true): string {
  if (!isNum(v)) return UNAVAILABLE;
  const s = v.toFixed(digits);
  return (signed && v > 0 ? '+' : '') + s + '%';
}

/** 累计收益差，按契约以「百分点」展示，不是风险调整 alpha。 */
export function points(v: number | null | undefined, digits = 2): string {
  if (!isNum(v)) return UNAVAILABLE;
  return (v > 0 ? '+' : '') + (v * 100).toFixed(digits) + ' pp';
}

export function ratio(v: number | null | undefined, digits = 2): string {
  return isNum(v) ? v.toFixed(digits) : UNAVAILABLE;
}

export function day(v: string | null | undefined): string {
  return typeof v === 'string' && v ? v.slice(0, 10) : UNAVAILABLE;
}

/** ISO 时间戳 → UTC 日期+时分，避免依赖浏览器本地时区造成水合不一致。 */
export function stampUtc(v: string | null | undefined): string {
  if (typeof v !== 'string' || !v) return UNAVAILABLE;
  const d = v.slice(0, 10);
  const t = v.length >= 16 ? v.slice(11, 16) : '';
  return t ? `${d} ${t} UTC` : d;
}

export function text(v: unknown): string {
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

export function textOr(v: unknown, fallback = UNAVAILABLE): string {
  return text(v) || fallback;
}

export function sign(v: number | null | undefined): 'up' | 'down' | 'flat' {
  if (!isNum(v) || v === 0) return 'flat';
  return v > 0 ? 'up' : 'down';
}

export const MARKET_LABEL: Record<string, string> = {
  US: '美股',
  A_SHARE: 'A股',
  SE: '瑞典',
  TW: '台股',
  HK: '港股',
};

export function marketLabel(m: string | null | undefined): string {
  const key = text(m);
  return MARKET_LABEL[key] ?? (key || UNAVAILABLE);
}

/** 策略基准口径的简短中文说明。 */
export function basisLabel(s: Strategy | null | undefined): string {
  if (!s) return UNAVAILABLE;
  return s.basis === 'CNY_SIMULATED_CAPITAL' ? '人民币模拟资金账本' : '归一化单位（无人民币口径）';
}
