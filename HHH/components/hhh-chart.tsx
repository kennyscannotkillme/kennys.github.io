'use client';
/**
 * HHH 研究终端 — 策略曲线（Recharts）
 *
 * 所有数值直接取自 portfolio-analytics.json 的 curve / years 行。
 * 本组件只做：选列、单位换算（小数→百分比，契约规定的展示口径）、坐标渲染。
 * 不做收益率、回撤、夏普或任何指标的再计算。
 *
 * 起始本金不会被插进曲线：curve 的第一点按各策略原始估值时钟保留，
 * initial_reference 以参考线和脚注单独呈现，不改写来源 NAV。
 *
 * 图表子元素使用数组而非 Fragment，避免 Recharts 遍历 children 时漏掉系列。
 *
 * nav / cumulative / lognav 三个模式拆成上下两张图（上：策略，下：基准），
 * 共用同一条日期轴，纵轴各自独立缩放。叠加显示会把策略波动压平，所以改为分图；
 * 纵轴范围只做展示层的 min/max 留白，不产生任何新的经济数值。
 */
import { useId, useMemo, type ReactElement } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { UNAVAILABLE, dec, isNum, money, pctFraction, type Strategy } from '@/components/hhh-data';

export type ChartMode =
  | 'nav'
  | 'cumulative'
  | 'relative'
  | 'drawdown'
  | 'lognav'
  | 'years'
  | 'costs'
  | 'exposure';

export const CHART_MODES: { id: ChartMode; label: string; en: string }[] = [
  { id: 'nav', label: '资金曲线', en: 'Ledger NAV vs benchmark, same initial capital' },
  { id: 'cumulative', label: '累计收益', en: 'Cumulative return vs benchmark' },
  { id: 'relative', label: '相对表现', en: 'Cumulative return difference in percentage points' },
  { id: 'drawdown', label: '回撤', en: 'Drawdown from the running peak' },
  { id: 'lognav', label: '对数NAV', en: 'Same NAV series on a log scale' },
  { id: 'years', label: '年度表现', en: 'Yearly return vs benchmark' },
  { id: 'costs', label: '累计成本', en: 'Cumulative modeled trading cost' },
  { id: 'exposure', label: '仓位', en: 'Daily position weight' },
];

export function modeAvailable(s: Strategy | null | undefined, mode: ChartMode): boolean {
  if (!s) return false;
  const curve = Array.isArray(s.curve) ? s.curve : [];
  switch (mode) {
    case 'nav':
    case 'lognav':
      return curve.some((p) => isNum(p.portfolio_nav));
    case 'cumulative':
      return curve.some((p) => isNum(p.cumulative_return));
    case 'relative':
      return curve.some((p) => isNum(p.relative_return));
    case 'drawdown':
      return curve.some((p) => isNum(p.drawdown));
    case 'costs':
      return curve.some((p) => isNum(p.cumulative_cost));
    case 'exposure':
      return curve.some((p) => isNum(p.exposure));
    case 'years':
      return Array.isArray(s.years) && s.years.length > 0;
    default:
      return false;
  }
}

export function firstAvailableMode(s: Strategy | null | undefined, preferred: ChartMode): ChartMode {
  if (modeAvailable(s, preferred)) return preferred;
  const order: ChartMode[] = ['nav', 'cumulative', 'relative', 'drawdown', 'years'];
  return order.find((m) => modeAvailable(s, m)) ?? 'cumulative';
}

export function modeUnavailableReason(s: Strategy | null | undefined, mode: ChartMode): string {
  if (!s) return '没有可用策略。';
  if (s.basis === 'NORMALIZED_UNITS_NOT_CNY' && (mode === 'nav' || mode === 'lognav')) {
    return `${s.name} 只恢复了归一化单位历史，没有可核对的人民币资金账本，因此不存在 NAV 金额序列；此处不编造起始本金，已自动切换到收益口径。`;
  }
  if (s.basis === 'NORMALIZED_UNITS_NOT_CNY' && (mode === 'costs' || mode === 'exposure')) {
    return `${s.name} 的导出不含逐日成本与仓位序列（归一化成本单位不是人民币），该视图不可用。`;
  }
  return '该策略的导出中没有这一列数据，不以 0 代替。';
}

const COLOR_PORTFOLIO = '#b36e48';
const COLOR_BENCHMARK = '#408b73';
const COLOR_NEG = '#b4551f';
const COLOR_COST = '#8a6d3b';
const AXIS_TICK = { fontSize: 11, fill: '#6b747d' };

type Row = Record<string, string | number | null>;
type TipKind = 'money' | 'pct' | 'pp' | 'weight';

interface TipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string | null;
  color?: string;
}

function tickDate(v: string): string {
  return typeof v === 'string' ? v.slice(2).replace(/-/g, '/') : '';
}

function axisMoney(v: number): string {
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v);
  if (abs >= 1e8) return (v / 1e8).toFixed(2) + '亿';
  if (abs >= 1e4) return (v / 1e4).toFixed(0) + '万';
  return v.toFixed(0);
}
function axisPct(v: number): string {
  return Number.isFinite(v) ? v.toFixed(0) + '%' : '';
}
function axisPp(v: number): string {
  return Number.isFinite(v) ? v.toFixed(0) + 'pp' : '';
}

/** 值的展示格式；与 tooltip 共用，避免分图表头和悬浮框口径不一致。 */
function fmtValue(v: unknown, kind: TipKind, currency: string | null): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return UNAVAILABLE;
  if (kind === 'money') return money(v, currency);
  if (kind === 'pp') return (v > 0 ? '+' : '') + v.toFixed(2) + ' 个百分点';
  if (kind === 'weight') return v.toFixed(2) + '%';
  return (v > 0 ? '+' : '') + v.toFixed(2) + '%';
}

function ChartTooltip({
  active,
  payload,
  label,
  kind,
  currency,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  kind: TipKind;
  currency: string | null;
}) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;
  const fmt = (v: unknown): string => fmtValue(v, kind, currency);
  return (
    <div className="tm-tip">
      <div className="tm-tip-date">{String(label ?? '')}</div>
      {payload.map((p) => (
        <div className="tm-tip-row" key={String(p.dataKey)}>
          <span className="tm-tip-swatch" style={{ background: p.color }} aria-hidden="true" />
          <span className="tm-tip-name">{String(p.name ?? p.dataKey)}</span>
          <span className="tm-tip-value">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ 分图模式（策略 / 基准各自独立纵轴） ═══════════════ */

const SPLIT_MODES: ChartMode[] = ['nav', 'cumulative', 'lognav'];

/** 该模式是否按「策略在上、基准在下」两张图渲染。 */
export function isSplitMode(mode: ChartMode): boolean {
  return SPLIT_MODES.includes(mode);
}

function finiteValues(rows: Row[], key: string): number[] {
  const out: number[] = [];
  for (const r of rows) {
    const v = r[key];
    if (typeof v === 'number' && Number.isFinite(v)) out.push(v);
  }
  return out;
}

function extent(values: number[]): [number, number] | null {
  if (values.length === 0) return null;
  let lo = values[0];
  let hi = values[0];
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo, hi];
}

/** 最后一个有数的点；缺值点直接跳过，不前向填充。 */
function lastPoint(rows: Row[], key: string): { value: number; date: string } | null {
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const v = rows[i][key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return { value: v, date: typeof rows[i].date === 'string' ? (rows[i].date as string) : '' };
    }
  }
  return null;
}

/**
 * 线性纵轴范围：围绕本序列 min/max 留 6% 余量；全平序列退化为 ±2%（0 值用 ±1）。
 * 纯展示层计算，不改数据、不产生新指标。
 */
function linearDomain(values: number[]): [number, number] | null {
  const ext = extent(values);
  if (!ext) return null;
  const [lo, hi] = ext;
  if (hi === lo) {
    const pad = Math.abs(lo) > 0 ? Math.abs(lo) * 0.02 : 1;
    return [lo - pad, hi + pad];
  }
  const pad = (hi - lo) * 0.06;
  return [lo - pad, hi + pad];
}

/** 对数纵轴范围：只接受正值，按比例留 4% 余量，保证下界恒为正。 */
function logDomain(values: number[]): [number, number] | null {
  const ext = extent(values.filter((v) => v > 0));
  if (!ext) return null;
  const [lo, hi] = ext;
  if (hi === lo) return [lo / 1.1, hi * 1.1];
  const f = Math.pow(hi / lo, 0.04);
  return [lo / f, hi * f];
}

function posOrNull(v: string | number | null | undefined): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * 指定纵轴范围后 Recharts 的刻度不再是整数，范围窄时相邻刻度会被格式化成同一串文字。
 * 这里按范围跨度决定小数位，只影响刻度文字，不影响任何数值。
 */
function tickDigits(span: number, unit: number): number {
  const step = Math.abs(span) / 4 / unit;
  if (!Number.isFinite(step) || step <= 0) return 2;
  if (step >= 10) return 0;
  if (step >= 1) return 1;
  if (step >= 0.1) return 2;
  return 3;
}

function moneyAxisFor(domain: [number, number] | null): (v: number) => string {
  if (!domain) return axisMoney;
  const [lo, hi] = domain;
  const scale = Math.max(Math.abs(lo), Math.abs(hi));
  const unit = scale >= 1e8 ? 1e8 : scale >= 1e4 ? 1e4 : 1;
  const suffix = unit === 1e8 ? '亿' : unit === 1e4 ? '万' : '';
  const digits = tickDigits(hi - lo, unit);
  return (v: number) => (Number.isFinite(v) ? (v / unit).toFixed(digits) + suffix : '');
}

function pctAxisFor(domain: [number, number] | null): (v: number) => string {
  if (!domain) return axisPct;
  const digits = tickDigits(domain[1] - domain[0], 1);
  return (v: number) => (Number.isFinite(v) ? v.toFixed(digits) + '%' : '');
}

/** 单张分图：自带表头（系列名、单位、最新值）与独立纵轴。 */
function SplitPlot({
  rows,
  dataKey,
  name,
  color,
  strokeWidth,
  unit,
  kind,
  currency,
  syncId,
  logScale,
  reference,
  referenceLabel,
  wantZero,
  exported,
  dropped,
}: {
  rows: Row[];
  dataKey: string;
  name: string;
  color: string;
  strokeWidth: number;
  unit: string;
  kind: TipKind;
  currency: string | null;
  syncId: string;
  logScale: boolean;
  reference: number | null;
  referenceLabel: string;
  wantZero: boolean;
  exported: { label: string; value: string } | null;
  dropped: number;
}) {
  const values = useMemo(() => finiteValues(rows, dataKey), [rows, dataKey]);
  const domain = useMemo(() => (logScale ? logDomain(values) : linearDomain(values)), [values, logScale]);
  const latest = useMemo(() => lastPoint(rows, dataKey), [rows, dataKey]);

  const isMoney = kind === 'money';
  const axisFormat = isMoney ? moneyAxisFor(domain) : pctAxisFor(domain);
  const axisWidth = isMoney ? 70 : 58;

  const renderTip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: TipEntry[]; label?: string | number };
    return <ChartTooltip active={p.active} payload={p.payload} label={p.label} kind={kind} currency={currency} />;
  };

  const inDomain = (v: number | null): boolean =>
    isNum(v) && !!domain && v >= domain[0] && v <= domain[1];
  const showRef = inDomain(reference);
  const showZero = wantZero && inDomain(0);

  /* 范围外的参考线不画，改为文字说明；没有可画的序列时不提这些。 */
  const flags: string[] = [];
  if (domain) {
    if (isNum(reference) && !showRef) flags.push(`${referenceLabel}不在本图纵轴范围内（见下方脚注）`);
    if (wantZero && !showZero) flags.push('0% 不在本图纵轴范围内');
    if (dropped > 0) flags.push(`${dropped} 个非正数值无法在对数刻度显示，已留空，不以 0 代替`);
  }

  /* 与单图一致：子元素用数组，避免 Recharts 遍历 children 时漏掉系列。 */
  const series: ReactElement[] = [];
  if (showZero) series.push(<ReferenceLine key="zero" y={0} stroke="#9aa7b1" ifOverflow="discard" />);
  if (showRef) {
    series.push(
      <ReferenceLine
        key="ref"
        y={reference as number}
        stroke="#9aa7b1"
        strokeDasharray="4 4"
        ifOverflow="discard"
        label={{ value: referenceLabel, position: 'insideTopLeft', fontSize: 11, fill: '#6b747d' }}
      />,
    );
  }
  series.push(
    <Line
      key="s"
      type="linear"
      dataKey={dataKey}
      name={name}
      stroke={color}
      strokeWidth={strokeWidth}
      dot={values.length === 1 ? { r: 3, strokeWidth: 0, fill: color } : false}
      isAnimationActive={false}
      connectNulls={false}
    />,
  );

  return (
    <section className="tm-split-plot" aria-label={`${name}（独立纵轴）`}>
      <header className="tm-split-head">
        <span className="tm-split-name">
          <span className="tm-split-swatch" style={{ background: color }} aria-hidden="true" />
          {name}
        </span>
        <span className="tm-split-unit">{unit}</span>
        <span className="tm-split-latest">
          最新 <strong>{fmtValue(latest?.value, kind, currency)}</strong>
          {latest ? <small>@{latest.date}</small> : null}
        </span>
        {exported ? (
          <span className="tm-split-exported">
            {exported.label} {exported.value}
          </span>
        ) : null}
      </header>
      {domain ? (
        <div className="tm-split-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} syncId={syncId} margin={{ top: 6, right: 14, left: 4, bottom: 2 }}>
              <CartesianGrid stroke="#e3e7ec" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={tickDate}
                tick={AXIS_TICK}
                stroke="#c9d1d9"
                minTickGap={56}
                interval="preserveStartEnd"
              />
              <YAxis
                scale={logScale ? 'log' : 'auto'}
                domain={domain}
                allowDataOverflow
                tickFormatter={axisFormat}
                tick={AXIS_TICK}
                stroke="#c9d1d9"
                width={axisWidth}
              />
              <Tooltip content={renderTip} cursor={{ stroke: '#9aa7b1', strokeDasharray: '3 3' }} />
              {series}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="tm-split-empty">
          {logScale && values.length > 0
            ? '该序列在本区间没有正数值，无法用对数刻度显示；不以 0 或替代值代替。'
            : '该序列在导出中没有可绘制的数值，不以 0 代替。'}
        </p>
      )}
      {flags.length ? (
        <p className="tm-split-flag">{flags.join('；')}。</p>
      ) : null}
    </section>
  );
}

/** 上下两张图：策略在上、基准在下，同一日期轴、各自独立纵轴。 */
function SplitCharts({
  strategy,
  mode,
  rows,
  currency,
  syncId,
}: {
  strategy: Strategy;
  mode: ChartMode;
  rows: Row[];
  currency: string | null;
  syncId: string;
}) {
  const logScale = mode === 'lognav';
  const isNav = mode === 'nav' || mode === 'lognav';
  const keyS = isNav ? 'nav' : 'cum';
  const keyB = isNav ? 'benchmarkNav' : 'benchmarkCum';

  /* 对数刻度只能显示正值：非正点按缺值留空（connectNulls=false），不改写来源数值。 */
  const plotRows = useMemo<Row[]>(() => {
    if (!logScale) return rows;
    return rows.map((r) => ({ ...r, nav: posOrNull(r.nav), benchmarkNav: posOrNull(r.benchmarkNav) }));
  }, [rows, logScale]);

  const droppedS = logScale ? finiteValues(rows, keyS).filter((v) => v <= 0).length : 0;
  const droppedB = logScale ? finiteValues(rows, keyB).filter((v) => v <= 0).length : 0;

  const kind: TipKind = isNav ? 'money' : 'pct';
  const unitCore = isNav
    ? `${currency ?? '金额'} · ${logScale ? '对数刻度' : '线性刻度'}`
    : '% 累计收益';

  const ref = strategy.initial_reference;
  const m = strategy.metrics ?? ({} as Strategy['metrics']);
  const refS = mode === 'nav' ? (ref?.portfolio_nav ?? m.initial_nav ?? null) : null;
  const refB = mode === 'nav' ? (ref?.benchmark_nav ?? null) : null;

  /* 表头补充值全部直接取导出字段，不在前端另算指标。 */
  const exportedS = isNav
    ? isNum(m.final_nav)
      ? { label: '导出期末净值', value: money(m.final_nav, currency) }
      : null
    : isNum(m.net_return)
      ? { label: '导出净收益率', value: pctFraction(m.net_return) }
      : null;
  const exportedB = isNav
    ? isNum(m.benchmark_final_nav)
      ? { label: '导出基准期末值', value: money(m.benchmark_final_nav, currency) }
      : null
    : isNum(m.benchmark_return)
      ? { label: '导出基准收益', value: pctFraction(m.benchmark_return) }
      : null;

  return (
    <div className="tm-chart tm-chart-split">
      <p className="tm-split-note">
        <span className="tm-split-badge">独立刻度</span>
        日期对齐，纵轴分别缩放。收益差见「相对表现」，不直接比较两图斜率。
      </p>
      <SplitPlot
        rows={plotRows}
        dataKey={keyS}
        name={isNav ? `策略账本NAV${logScale ? '（对数）' : ''}` : '策略累计收益'}
        color={COLOR_PORTFOLIO}
        strokeWidth={2.2}
        unit={`单位 ${unitCore} · 独立纵轴`}
        kind={kind}
        currency={currency}
        syncId={syncId}
        logScale={logScale}
        reference={refS}
        referenceLabel="起始本金"
        wantZero={!isNav}
        exported={exportedS}
        dropped={droppedS}
      />
      <SplitPlot
        rows={plotRows}
        dataKey={keyB}
        name={isNav ? `基准同本金参考${logScale ? '（对数）' : ''}` : '基准累计收益'}
        color={COLOR_BENCHMARK}
        strokeWidth={1.6}
        unit={`单位 ${unitCore} · 独立纵轴`}
        kind={kind}
        currency={currency}
        syncId={syncId}
        logScale={logScale}
        reference={refB}
        referenceLabel="起始本金"
        wantZero={!isNav}
        exported={exportedB}
        dropped={droppedB}
      />
    </div>
  );
}

export function StrategyChart({
  strategy,
  mode,
  height = 330,
}: {
  strategy: Strategy;
  mode: ChartMode;
  height?: number;
}) {
  /* 每个挂载实例一个 syncId：同实例的上下两图联动，不与页面上其他图表互相干扰。 */
  const uid = useId();
  const currency = strategy.currency ?? null;
  const curve = useMemo(() => (Array.isArray(strategy.curve) ? strategy.curve : []), [strategy]);

  const data = useMemo<Row[]>(() => {
    if (mode === 'years') {
      return (strategy.years ?? []).map((y) => ({
        date: y.period + (y.partial_period ? '（未完整）' : ''),
        strategyPct: isNum(y.return) ? y.return * 100 : null,
        benchmarkPct: isNum(y.benchmark_return) ? y.benchmark_return * 100 : null,
      }));
    }
    return curve.map((p) => ({
      date: p.date,
      nav: p.portfolio_nav,
      benchmarkNav: p.benchmark_nav,
      matchedNav: p.matched_benchmark_nav,
      cum: isNum(p.cumulative_return) ? p.cumulative_return * 100 : null,
      benchmarkCum: isNum(p.benchmark_return) ? p.benchmark_return * 100 : null,
      rel: isNum(p.relative_return) ? p.relative_return * 100 : null,
      dd: isNum(p.drawdown) ? p.drawdown * 100 : null,
      cost: p.cumulative_cost,
      exposure: isNum(p.exposure) ? p.exposure * 100 : null,
    }));
  }, [curve, strategy, mode]);

  const tipKind: TipKind =
    mode === 'nav' || mode === 'lognav' || mode === 'costs'
      ? 'money'
      : mode === 'relative'
        ? 'pp'
        : mode === 'exposure'
          ? 'weight'
          : 'pct';

  const renderTip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: TipEntry[]; label?: string | number };
    return <ChartTooltip active={p.active} payload={p.payload} label={p.label} kind={tipKind} currency={currency} />;
  };

  /* nav / cumulative / lognav：上下分图，纵轴独立；单图高度 height 不适用，
     分图改用 .tm-split-canvas 的固定高度（桌面 320px / 手机 280px）。 */
  if (isSplitMode(mode)) {
    return (
      <SplitCharts strategy={strategy} mode={mode} rows={data} currency={currency} syncId={`tm-sync-${uid}`} />
    );
  }

  /* 纵轴 */
  let yAxis: ReactElement;
  if (mode === 'costs') {
    yAxis = <YAxis key="y" tickFormatter={axisMoney} tick={AXIS_TICK} stroke="#c9d1d9" width={64} />;
  } else if (mode === 'relative') {
    yAxis = <YAxis key="y" tickFormatter={axisPp} tick={AXIS_TICK} stroke="#c9d1d9" width={58} />;
  } else {
    yAxis = <YAxis key="y" tickFormatter={axisPct} tick={AXIS_TICK} stroke="#c9d1d9" width={54} />;
  }

  /* 系列 */
  const series: ReactElement[] = [];
  if (mode === 'relative') {
    series.push(
      <ReferenceLine key="zero" y={0} stroke="#9aa7b1" />,
      <Area key="rel" type="linear" dataKey="rel" name="累计收益差（百分点）" stroke={COLOR_NEG} fill={COLOR_NEG} fillOpacity={0.12} strokeWidth={1.6} dot={false} isAnimationActive={false} />,
    );
  } else if (mode === 'drawdown') {
    series.push(
      <ReferenceLine key="zero" y={0} stroke="#9aa7b1" />,
      <Area key="dd" type="linear" dataKey="dd" name="回撤" stroke={COLOR_NEG} fill={COLOR_NEG} fillOpacity={0.16} strokeWidth={1.4} dot={false} isAnimationActive={false} />,
    );
  } else if (mode === 'costs') {
    series.push(
      <Area key="cost" type="linear" dataKey="cost" name="累计建模交易成本" stroke={COLOR_COST} fill={COLOR_COST} fillOpacity={0.14} strokeWidth={1.5} dot={false} isAnimationActive={false} />,
    );
  } else if (mode === 'exposure') {
    series.push(
      <Area key="exp" type="linear" dataKey="exposure" name="仓位权重" stroke={COLOR_BENCHMARK} fill={COLOR_BENCHMARK} fillOpacity={0.14} strokeWidth={1.4} dot={false} isAnimationActive={false} />,
    );
  } else if (mode === 'years') {
    series.push(
      <ReferenceLine key="zero" y={0} stroke="#9aa7b1" />,
      <Bar key="sy" dataKey="strategyPct" name="策略年度收益" fill={COLOR_PORTFOLIO} isAnimationActive={false} />,
      <Bar key="by" dataKey="benchmarkPct" name="基准年度收益" fill={COLOR_BENCHMARK} isAnimationActive={false} />,
    );
  }

  return (
    <div className="tm-chart">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid stroke="#e3e7ec" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={mode === 'years' ? undefined : tickDate}
            tick={AXIS_TICK}
            stroke="#c9d1d9"
            minTickGap={mode === 'years' ? 0 : 56}
            interval={mode === 'years' ? 0 : 'preserveStartEnd'}
          />
          {yAxis}
          <Tooltip content={renderTip} cursor={{ stroke: '#9aa7b1', strokeDasharray: '3 3' }} />
          <Legend verticalAlign="top" align="right" height={28} wrapperStyle={{ fontSize: 12 }} />
          {series}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** 图表下方的口径脚注：窗口、起始本金、基准身份。 */
export function ChartFootnote({ strategy, mode }: { strategy: Strategy; mode: ChartMode }) {
  const ref = strategy.initial_reference;
  const bench = strategy.benchmark;
  const first = strategy.curve?.[0]?.date;
  const last = strategy.curve?.[strategy.curve.length - 1]?.date;
  return (
    <div className="tm-chart-foot">
      <span>
        区间 {first ?? UNAVAILABLE} — {last ?? UNAVAILABLE}
      </span>
      <span>
        起始本金{' '}
        {ref && isNum(ref.portfolio_nav)
          ? money(ref.portfolio_nav, strategy.currency)
          : strategy.basis === 'NORMALIZED_UNITS_NOT_CNY'
            ? `归一化 ${dec(strategy.metrics?.normalized_initial_units, 4)} 单位（无人民币口径）`
            : UNAVAILABLE}
      </span>
      <span>基准 {bench ? `${bench.name}（${bench.id}，不可直接投资的价格指数）` : UNAVAILABLE}</span>
      {mode === 'nav' || mode === 'lognav' ? (
        <span>起始本金单列；{(strategy.mark_clock_note ?? '估值时钟未复核').replace(/[。；]$/, '')}。不改写原始账本点。</span>
      ) : null}
      {isSplitMode(mode) ? (
        <span>策略与基准分图显示：日期轴相同，纵轴各自独立缩放（留白 6%），两图斜率不可直接互比。</span>
      ) : null}
      {mode === 'relative' ? <span>相对表现 = 策略累计收益 − 基准累计收益，单位百分点，不是风险调整 alpha。</span> : null}
      {mode === 'years' ? <span>年度首期以声明起始本金为基数；末年可能为不完整年度。</span> : null}
      {mode === 'costs' ? <span>成本为累计值（佣金 + 印花税 + 建模滑点），不是单日成本。</span> : null}
    </div>
  );
}

/** 模式切换按钮组；不可用模式显示为禁用并给出原因。 */
export function ChartModeBar({
  strategy,
  mode,
  onMode,
}: {
  strategy: Strategy;
  mode: ChartMode;
  onMode: (m: ChartMode) => void;
}) {
  return (
    <fieldset className="tm-modebar" aria-label="图表显示模式">
      {CHART_MODES.map((m) => {
        const ok = modeAvailable(strategy, m.id);
        return (
          <button
            key={m.id}
            type="button"
            className={'tm-mode' + (mode === m.id ? ' is-active' : '')}
            aria-pressed={mode === m.id}
            disabled={!ok}
            title={ok ? m.en : modeUnavailableReason(strategy, m.id)}
            onClick={() => onMode(m.id)}
          >
            {m.label}
          </button>
        );
      })}
    </fieldset>
  );
}
