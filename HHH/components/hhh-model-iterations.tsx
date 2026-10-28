'use client';
/** Read-only research results. Python supplies every metric and comparison. */
import { useEffect, useId, useState } from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import styles from './hhh-model-iterations.module.css';

interface ModelMetrics {
  mse?: number | null;
  rank_ic?: number | null;
  pool_mse?: number | null;
  pool_rank_ic?: number | null;
  net_return?: number | null;
}
interface Comparison {
  period: string;
  days: number;
  lag_sessions: number;
  dates?: number | null;
  v1_original?: ModelMetrics;
  v1_same_p?: ModelMetrics;
  c2?: ModelMetrics;
  v13?: ModelMetrics;
  vs_v1?: { mse_improvement?: number | null; rank_ic_change?: number | null; net_return_change?: number | null };
  vs_same_p_v1?: { pool_mse_improvement?: number | null; pool_rank_ic_change?: number | null; net_return_change?: number | null };
  vs_c2?: { pool_mse_improvement?: number | null; pool_rank_ic_change?: number | null; net_return_change?: number | null };
  baselines?: {
    m0_mse?: number | null;
    zero_mse?: number | null;
    median_mse?: number | null;
    low_vol20_net_return?: number | null;
    high_mom20_net_return?: number | null;
    low_r5_net_return?: number | null;
    laggard_net_return?: number | null;
    v13_mse_improvement_vs_m0?: number | null;
    v13_net_change_vs_low_vol20?: number | null;
  };
  failed_original_gates?: string[];
}
interface IterationData {
  schema_version: number;
  generated_at?: string;
  current_daily_model_id?: string;
  iteration?: {
    id?: string;
    model_id?: string;
    date?: string;
    status?: string;
    adopted?: boolean;
    adoption_reason_zh?: string;
    original_gate_passed?: number | null;
    original_gate_total?: number | null;
    method_zh?: string;
    selection_pool_zh?: string;
    summary_zh?: string;
    limitations_zh?: string[];
    links?: { label: string; url: string }[];
  };
  windows: { id: string; label: string; date_start?: string; date_end?: string; dates?: number | null }[];
  comparisons: Comparison[];
}

const MISSING = '未取得';
const GATE_LABELS: Record<string, string> = {
  rmse_no_worse_than_m0: 'RMSE 不高于历史均值基线',
  rmse_no_worse_than_zero: 'RMSE 不高于零预测基线',
  positive_mean_rank_ic: '平均排序相关性为正',
  rank_ic_descriptive_95pct_lower_positive: '排序相关性的描述性 95% 区间下界为正',
  positive_observed_top20_after_friction: 'Top20 扣成本后的均值为正',
  positive_same_pool_stress_excess: '同候选池的压力成本超额收益为正',
  corrected_primary_market_lower_positive: '校正后的主要市场比较区间下界为正',
  positive_matched_top20_improvement_vs_v1: '同候选池 Top20 收益高于 V1',
  positive_matched_top20_improvement_vs_v2b: '同候选池 Top20 收益高于 V2B',
  positive_matched_top20_improvement_vs_v3s: '同候选池 Top20 收益高于 V3S',
  positive_excess_in_two_thirds_qualified_months: '至少三分之二的合格月份有正超额收益',
  recent60_positive_same_pool_stress_excess: '最近 60 日的同候选池压力成本超额收益为正',
  high_mom20_positive_stress_contrast: '压力成本下胜过高动量基线',
  high_mom20_corrected_lower_positive: '对高动量基线的校正区间下界为正',
  high_mom20_recent60_positive_stress_contrast: '最近 60 日压力成本下胜过高动量基线',
  low_r5_positive_stress_contrast: '压力成本下胜过近 5 日低收益基线',
  low_r5_corrected_lower_positive: '对近 5 日低收益基线的校正区间下界为正',
  low_r5_recent60_positive_stress_contrast: '最近 60 日压力成本下胜过近 5 日低收益基线',
  low_vol20_positive_stress_contrast: '压力成本下胜过低波动基线',
  low_vol20_corrected_lower_positive: '对低波动基线的校正区间下界为正',
  low_vol20_recent60_positive_stress_contrast: '最近 60 日压力成本下胜过低波动基线',
  up_positive_same_pool_stress_excess: '上涨状态中的同候选池压力成本超额收益为正',
  down_positive_same_pool_stress_excess: '下跌状态中的同候选池压力成本超额收益为正',
  laggard_positive_stress_contrast: '压力成本下胜过落后股基线',
  laggard_corrected_lower_positive: '对落后股基线的校正区间下界为正',
  laggard_recent60_positive_stress_contrast: '最近 60 日压力成本下胜过落后股基线',
  mse_at_least_1pct_below_m0: 'MSE 至少比历史均值基线低 1%',
  mse_no_worse_than_zero: 'MSE 不高于零预测基线',
  mse_no_worse_than_training_median: 'MSE 不高于训练期中位数基线',
  recent60_mse_no_worse_than_m0: '最近 60 日 MSE 不高于历史均值基线',
  pool_expert_corrected_mse_improvement_lower_positive: '候选池误差改善的校正区间下界为正',
  pool_expert_corrected_rank_ic_lower_positive: '候选池排序相关性的校正区间下界为正',
};
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const label = (value: unknown) => typeof value === 'string' && value.trim() ? value : MISSING;
const count = (value: unknown) => isNumber(value) ? String(value) : MISSING;
const mse = (value: unknown) => isNumber(value) ? value.toPrecision(10) : MISSING;
const decimal = (value: unknown) => isNumber(value) ? value.toFixed(6) : MISSING;
function percent(value: unknown, digits = 4, unit = '%') {
  if (!isNumber(value)) return MISSING;
  // Only unit formatting: source returns/deltas are fractions, never derived here.
  const shown = value * 100;
  const text = shown !== 0 && Math.abs(shown) < 10 ** -digits ? shown.toExponential(3) : shown.toFixed(digits);
  return `${value > 0 ? '+' : ''}${text}${unit}`;
}
function date(value: unknown) {
  const text = label(value);
  return /^\d{8}$/.test(text) ? `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}` : text;
}
function safeUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (/^https:\/\//i.test(value)) return value;
  if (/^(\.\/|\/(?!\/))/.test(value) && !value.includes('..') && !value.includes('\\')) return value;
  return undefined;
}

function Help({ zh, en }: { zh: string; en: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={styles.help}>
      <button type="button" aria-label={`${zh} / ${en}`} title={`${zh}\n${en}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} onBlur={() => setOpen(false)}>
        <Info size={15} aria-hidden="true" />
      </button>
      {open ? <span id={id} role="note" className={styles.tooltip}>{zh}<br /><span lang="en">{en}</span></span> : null}
    </span>
  );
}

function MetricCard({ title, en, note, oldName, newName, before, after, change, changeText, format }: {
  title: string; en: string; note: string; oldName: string; newName: string;
  before: unknown; after: unknown; change: unknown; changeText: string; format: (value: unknown) => string;
}) {
  const direction = isNumber(change) ? change > 0 ? styles.better : change < 0 ? styles.worse : '' : '';
  return (
    <article className={styles.metric}>
      <header><h4>{title}</h4><Help zh={note} en={en} /></header>
      <dl className={styles.pair}>
        <div><dt>{oldName}</dt><dd title={isNumber(before) ? String(before) : undefined}>{format(before)}</dd></div>
        <div><dt>{newName}</dt><dd title={isNumber(after) ? String(after) : undefined}>{format(after)}</dd></div>
      </dl>
      <p className={`${styles.delta} ${direction}`}><span>{changeText}</span><strong>{isNumber(change) ? (title === '排序相关性' ? `${change > 0 ? '+' : ''}${decimal(change)}` : percent(change, 5, title === '预测误差 MSE' ? '%' : ' 个百分点')) : MISSING}</strong></p>
    </article>
  );
}

export default function ModelIterations() {
  const [data, setData] = useState<IterationData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [period, setPeriod] = useState('full');
  const [days, setDays] = useState(1);
  const [lag, setLag] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('./model-iterations.json', { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error('Results unavailable');
        const json: unknown = await response.json();
        if (!json || typeof json !== 'object') throw new Error('Invalid results');
        const next = json as IterationData;
        if (next.schema_version !== 1 || !Array.isArray(next.windows) || !Array.isArray(next.comparisons)) throw new Error('Unsupported results');
        if (controller.signal.aborted) return;
        setData(next);
        setState('ready');
      } catch {
        if (controller.signal.aborted) return;
        setData(null);
        setState('error');
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  const iteration = data?.iteration;
  const window = data?.windows.find((item) => item.id === period);
  const row = data?.comparisons.find((item) => item.period === period && item.days === days && item.lag_sessions === lag);
  const gates = Array.isArray(row?.failed_original_gates) ? row.failed_original_gates : [];
  const limitations = Array.isArray(iteration?.limitations_zh) ? iteration.limitations_zh : [];
  const links = Array.isArray(iteration?.links) ? iteration.links : [];

  return (
    <details className={`research-archive ${styles.root}`} data-testid="hhh-model-iterations">
      <summary title="模型迭代与采用记录 / Model iteration and adoption record">
        <span>模型迭代 · {iteration?.id ? `${iteration.id} 研究对照` : '研究对照'}</span>
        {typeof iteration?.adopted === 'boolean' ? <small>{iteration.adopted ? '已采用研究版本' : '未替换每日模型'}</small> : null}
      </summary>
      <div className={styles.body}>
        {state !== 'ready' ? (
          <output className="er-state" aria-live="polite">
            {state === 'loading' ? '正在读取模型迭代结果…' : '模型迭代结果未取得。'}
            {state === 'error' ? <button className="er-retry" type="button" onClick={() => { setState('loading'); setAttempt((value) => value + 1); }}>重新读取</button> : null}
          </output>
        ) : (
          <>
            <div className={styles.status}>
              <div className="er-badges"><span className="er-badge is-model">研究结果</span><span className="er-badge">{date(iteration?.date)}</span><span className="er-badge">原实验门槛通过 {count(iteration?.original_gate_passed)} / {count(iteration?.original_gate_total)} 组</span></div>
              <p>{label(iteration?.summary_zh)}</p>
              <p className={styles.reason}><strong>采用决定：</strong>{label(iteration?.adoption_reason_zh)}</p>
            </div>

            <div className={styles.controls}>
              <fieldset><legend>比较窗口</legend><div>{(data?.windows ?? []).map((item) => <button key={item.id} type="button" aria-pressed={period === item.id} onClick={() => setPeriod(item.id)}>{item.label}</button>)}</div></fieldset>
              <fieldset><legend>卖出期限</legend><div>{[1, 3, 5].map((value) => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>T+{value}</button>)}</div></fieldset>
              <fieldset><legend>信号至入场</legend><div>{[1, 2].map((value) => <button key={value} type="button" aria-pressed={lag === value} onClick={() => setLag(value)}>{value} 个交易日</button>)}</div></fieldset>
            </div>
            <p className={styles.window} aria-live="polite">{label(window?.label)} · {date(window?.date_start)} — {date(window?.date_end)} · {count(row?.dates)} 个评分日 · T+{days} · 入场延迟 {lag} 日</p>

            {!row ? <output className="er-state" aria-live="polite">此窗口、期限与入场延迟的结果未取得。</output> : (
              <>
                <section className={styles.comparison} aria-label="与当前每日V1的完整方案比较">
                  <h3>与当前每日 V1 比较</h3>
                  <p className={styles.note}>误差与排序：相同的全部合格股票。Top20 收益：V1 从全部合格股票中选股，V13 从筛选候选池中选股，是整套规则的比较。</p>
                  <p className={styles.note}>{label(iteration?.selection_pool_zh)} 收益统一扣除 0.31%（31bp）往返成本情景。</p>
                  <div className={styles.metrics}>
                    <MetricCard title="预测误差 MSE" en="Mean squared error on the same full-E sample; lower is better. Positive reduction means improvement." note="同一全 E 样本的均方误差，越低越好；正的相对降幅表示改善。" oldName="每日 V1" newName="研究 V13" before={row.v1_original?.mse} after={row.v13?.mse} change={row.vs_v1?.mse_improvement} changeText="相对降幅" format={mse} />
                    <MetricCard title="排序相关性" en="Daily RankIC on the same full-E sample; higher is better. This is not a return." note="同一全 E 样本的日度 RankIC，越高越好；不是收益率。" oldName="每日 V1" newName="研究 V13" before={row.v1_original?.rank_ic} after={row.v13?.rank_ic} change={row.vs_v1?.rank_ic_change} changeText="相关性变化" format={decimal} />
                    <MetricCard title="每批 Top20 净均值" en="Mean Top20 batch return after a 31 bp round-trip cost scenario; V1 selects from E, V13 from P. Not cumulative portfolio return." note="每批 Top20 收益扣除 0.31%（31bp）往返成本情景后取均值；V1 从全部合格股票 E 选股，V13 从筛选候选池 P 选股。不是累计组合收益。" oldName="V1 · 全部合格" newName="V13 · 筛选池" before={row.v1_original?.net_return} after={row.v13?.net_return} change={row.vs_v1?.net_return_change} changeText="收益差" format={percent} />
                  </div>
                </section>

                <section className={styles.comparison} aria-label="相对V8 C2的新增特征增量">
                  <h3>新增特征增量 · 对 V8 C2</h3>
                  <p className={styles.note}>固定相同筛选候选池，对照 V8 C2 与 V13，单独看新增特征的增量。</p>
                  <div className={styles.metrics}>
                    <MetricCard title="预测误差 MSE" en="Matched P-pool mean squared error; positive relative reduction means V13 improves over V8 C2." note="同一筛选候选池 P 的均方误差；相对降幅为正表示 V13 比 V8 C2 改善。" oldName="V8 C2 · 筛选池" newName="V13 · 筛选池" before={row.c2?.pool_mse} after={row.v13?.pool_mse} change={row.vs_c2?.pool_mse_improvement} changeText="相对降幅" format={mse} />
                    <MetricCard title="排序相关性" en="Matched P-pool daily RankIC; higher is better." note="同一筛选候选池 P 的日度 RankIC，越高越好。" oldName="V8 C2 · 筛选池" newName="V13 · 筛选池" before={row.c2?.pool_rank_ic} after={row.v13?.pool_rank_ic} change={row.vs_c2?.pool_rank_ic_change} changeText="相关性变化" format={decimal} />
                    <MetricCard title="每批 Top20 净均值" en="Matched P-pool Top20 mean batch return after 31 bp; V13 minus V8 C2." note="相同筛选候选池 P 内选 Top20，扣 0.31%（31bp）后的批次均值；收益差为 V13 减 V8 C2。" oldName="V8 C2 · 筛选池" newName="V13 · 筛选池" before={row.c2?.net_return} after={row.v13?.net_return} change={row.vs_c2?.net_return_change} changeText="收益差" format={percent} />
                  </div>
                </section>

                <details className={styles.detail}>
                  <summary>同候选池的 V1 诊断</summary>
                  <p className={styles.note}>把 V1 限定到相同筛选候选池作诊断，区别于上方网页 V1 的原始全部合格股票选股规则。</p>
                  <div className={styles.metrics}>
                    <MetricCard title="预测误差 MSE" en="V1 and V13 mean squared error on the same P pool." note="V1 与 V13 在相同筛选候选池 P 的均方误差。" oldName="V1 · 同筛选池" newName="V13 · 筛选池" before={row.v1_same_p?.mse} after={row.v13?.pool_mse} change={row.vs_same_p_v1?.pool_mse_improvement} changeText="相对降幅" format={mse} />
                    <MetricCard title="每批 Top20 净均值" en="V1 and V13 select Top20 from the same P pool, after 31 bp." note="V1 与 V13 都在筛选候选池 P 中选 Top20，使用相同 0.31%（31bp）成本情景。" oldName="V1 · 同筛选池" newName="V13 · 筛选池" before={row.v1_same_p?.net_return} after={row.v13?.net_return} change={row.vs_same_p_v1?.net_return_change} changeText="收益差" format={percent} />
                  </div>
                  <p className={styles.note}>同候选池的 V1 排序相关性：{decimal(row.v1_same_p?.rank_ic)}。仅展示正式结果中保存的指标。</p>
                </details>

                <details className={styles.detail}>
                  <summary>简单基线与未通过项目</summary>
                  <dl className={styles.baselines}>
                    <div><dt>历史均值 M0 · MSE</dt><dd>{mse(row.baselines?.m0_mse)}</dd></div>
                    <div><dt>零预测 · MSE</dt><dd>{mse(row.baselines?.zero_mse)}</dd></div>
                    <div><dt>中位数预测 · MSE</dt><dd>{mse(row.baselines?.median_mse)}</dd></div>
                    <div><dt>V13 相对 M0 误差降幅</dt><dd>{percent(row.baselines?.v13_mse_improvement_vs_m0, 5)}</dd></div>
                    <div><dt>低波动 Top20 · 扣费均值</dt><dd>{percent(row.baselines?.low_vol20_net_return)}</dd></div>
                    <div><dt>高动量 Top20 · 扣费均值</dt><dd>{percent(row.baselines?.high_mom20_net_return)}</dd></div>
                    <div><dt>低近 5 日收益 · 扣费均值</dt><dd>{percent(row.baselines?.low_r5_net_return)}</dd></div>
                    <div><dt>落后股 · 扣费均值</dt><dd>{percent(row.baselines?.laggard_net_return)}</dd></div>
                    <div><dt>V13 对低波动收益差</dt><dd>{percent(row.baselines?.v13_net_change_vs_low_vol20, 5, ' 个百分点')}</dd></div>
                  </dl>
                  <p className={styles.note}>原实验门槛保留原判定；渐进式研究版本采用另行记录。</p>
                  {gates.length ? <ul className={styles.list}>{gates.map((item, index) => <li key={index} title={item}>{GATE_LABELS[item] ?? '其他原实验检查项未通过（见原始报告）'}</li>)}</ul> : <p className={styles.note}>未通过项目明细：{MISSING}。</p>}
                </details>
              </>
            )}

            <details className={styles.detail}>
              <summary>方法、样本与证据</summary>
              <p>{label(iteration?.method_zh)}</p>
              <dl className={styles.meta}><div><dt>当前每日模型</dt><dd>{label(data?.current_daily_model_id)}</dd></div><div><dt>本次研究模型</dt><dd>{label(iteration?.model_id)}</dd></div><div><dt>结果生成时间</dt><dd>{label(data?.generated_at)}</dd></div></dl>
              {limitations.length ? <ul className={styles.list}>{limitations.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p>样本边界：{MISSING}。</p>}
              <div className={styles.links}>{links.length ? links.map((item, index) => { const href = safeUrl(item.url); return href ? <a key={index} href={href} target="_blank" rel="noreferrer">{label(item.label)}<ArrowUpRight size={13} aria-hidden="true" /></a> : <span key={index}>{label(item.label)} · 链接未取得</span>; }) : <span>论文与报告链接：{MISSING}</span>}</div>
            </details>
          </>
        )}
      </div>
    </details>
  );
}
