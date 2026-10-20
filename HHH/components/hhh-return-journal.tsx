'use client';
/**
 * HHH 研究终端 — 全 A 股三期限预期收益日志（主栏目）
 *
 * 数据来源：public/expected-return.json（由 scripts/hhh_expected_return.py 导出，
 * 契约见 docs/HHH_EXPECTED_RETURN_V1.md）。该文件在前端构建时可能尚未生成，因此
 * 本模块在运行时以相对地址 ./expected-return.json 取数，并显式区分
 * 「加载中 / 读取失败 / 暂无记录」三种状态，不内置任何种子数值。
 *
 * 本文件不做经济推导：预期收益、预测百分位、名次、实际收益、验证指标全部由
 * Python 写入 JSON；前端只做格式化（契约规定的「小数 → 百分比」单位展示）、
 * 按期限分栏、历史记录回看与结果匹配（forecast_id → ticker → days）。
 * 缺值一律显式标注，不用 0 代替。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TableScroll } from './hhh-ui';

/* ── 数据契约（expected-return.json / schema_version 1） ─── */

interface ERMethod {
  id?: string | null;
  label?: string | null;
  description?: string | null;
  return_basis?: string | null;
}

interface ERCandidate {
  ticker?: string | null;
  name?: string | null;
  rank?: number | null;
  percentile?: number | null;
  reference_close?: number | null;
  expected_return?: number | null;
}

interface ERRecordHorizon {
  days?: number | null;
  exit_date?: string | null;
  candidates?: ERCandidate[] | null;
}

interface ERUniverseCounts {
  input_count?: number | null;
  eligible_count?: number | null;
  excluded_count?: number | null;
}

interface ERRecord {
  id?: string | null;
  created_at?: string | null;
  signal_date?: string | null;
  entry_date?: string | null;
  lag_sessions?: number | null;
  model_version?: string | null;
  model_bundle?: string | null;
  training_cutoff?: string | null;
  ranked_count?: number | null;
  universe_counts?: ERUniverseCounts | null;
  estimate_status?: string | null;
  horizons?: ERRecordHorizon[] | null;
}

interface ERObsHorizon {
  days?: number | null;
  exit_date?: string | null;
  exit_close?: number | null;
  realized_return?: number | null;
  status?: string | null;
}

interface ERObsItem {
  ticker?: string | null;
  entry_open?: number | null;
  current_return?: number | null;
  status?: string | null;
  horizons?: ERObsHorizon[] | null;
}

interface ERObservation {
  forecast_id?: string | null;
  as_of?: string | null;
  evaluated_at?: string | null;
  items?: ERObsItem[] | null;
}

interface ERMetric {
  days?: number | null;
  lag_sessions?: number | null;
  dates?: number | null;
  rows?: number | null;
  mae?: number | null;
  rmse?: number | null;
  baseline_mae?: number | null;
  baseline_rmse?: number | null;
  zero_mae?: number | null;
  zero_rmse?: number | null;
  rank_ic?: number | null;
  top20_mean_return?: number | null;
  top20_after_cost_scenario?: number | null;
  top20_coverage?: number | null;
}

interface ERValidation {
  methodology?: string | null;
  baseline_comparison?: string | null;
  folds?: unknown;
  metrics?: ERMetric[] | null;
}

interface ExpectedReturnData {
  schema_version?: number | string | null;
  generated_at?: string | null;
  method?: ERMethod | null;
  records?: ERRecord[] | null;
  observations?: ERObservation[] | null;
  validation?: ERValidation | null;
}

/* ── 显示层工具（无计算，只做格式化） ──────────────────── */

const JSON_PATH = './expected-return.json';
const NO_DATA = '暂无数据';
const AWAIT_QUOTE = '待行情';
const FIRST_N = 5;
const EXPAND_N = 20;

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function strOr(v: unknown): string {
  return str(v) || NO_DATA;
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/** 20261023 / 2026-10-23T… → 2026-10-23；不补全、不猜测。 */
function dayText(v: unknown): string {
  const s = str(v);
  if (!s) return NO_DATA;
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s.slice(0, 10);
}

/** 时间戳按北京时间展示；无法解析时原样显示，不改写时区标签。 */
function tsText(v: unknown): string {
  const s = str(v);
  if (!s) return NO_DATA;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const shown = d.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return shown + ' 北京时间';
}

/** 小数收益 → 百分比。单位展示由契约规定（expected_return 为小数）。 */
function pct(v: unknown, digits = 2, signed = true): string {
  if (!isNum(v)) return NO_DATA;
  const s = (v * 100).toFixed(digits);
  return (signed && v > 0 ? '+' : '') + s + '%';
}

/** 实际收益缺失时说「待行情」，不显示 0。 */
function actualPct(v: unknown): string {
  return isNum(v) ? pct(v) : AWAIT_QUOTE;
}

function dec(v: unknown, digits = 2): string {
  return isNum(v) ? v.toFixed(digits) : NO_DATA;
}

function priceText(v: unknown): string {
  return isNum(v) ? '¥ ' + v.toFixed(2) : NO_DATA;
}

function intText(v: unknown): string {
  return isNum(v) ? String(Math.round(v)) : NO_DATA;
}

/** 复用终端既有的涨跌配色（.tm-pos / .tm-neg），不新增颜色。 */
function signClass(v: unknown): string {
  if (!isNum(v) || v === 0) return '';
  return v > 0 ? ' tm-pos' : ' tm-neg';
}

/** 状态常量大小写不敏感；未知值原样显示，不假装正常。 */
const STATUS_ZH: Record<string, string> = {
  waitingentry: '等待入场日',
  waiting_entry: '等待入场日',
  pendingentry: '等待入场日',
  tracking: '跟踪中',
  open: '未到期',
  pending: '待行情',
  completed: '已到期',
  complete: '已到期',
  resolved: '已到期',
  missing: '行情缺失',
  unavailable: '行情缺失',
};

function statusText(v: unknown): string {
  const s = str(v);
  if (!s) return NO_DATA;
  return STATUS_ZH[s.toLowerCase()] ?? s;
}

function foldsText(v: unknown): string {
  if (Array.isArray(v)) return String(v.length) + ' 折';
  if (isNum(v)) return String(Math.round(v)) + ' 折';
  const s = str(v);
  return s || NO_DATA;
}

/* ── 取数（相对地址 + AbortController，不走构建期 import） ─ */

type LoadState = 'loading' | 'ready' | 'error';

function useExpectedReturn() {
  const [data, setData] = useState<ExpectedReturnData | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(JSON_PATH, { signal: ac.signal, cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();
        if (!alive) return;
        setData(json && typeof json === 'object' ? (json as ExpectedReturnData) : null);
        setState('ready');
      } catch (e) {
        if (ac.signal.aborted || !alive) return;
        setData(null);
        setError(e instanceof Error ? e.message : String(e));
        setState('error');
      }
    })();
    return () => {
      alive = false;
      ac.abort();
    };
  }, [nonce]);

  const reload = useCallback(() => {
    setState('loading');
    setError('');
    setNonce((n) => n + 1);
  }, []);

  return { data, state, error, reload };
}

/* ── 单只候选卡片 ───────────────────────────────────────── */

function PickCard({
  candidate,
  days,
  exitDate,
  item,
}: {
  candidate: ERCandidate;
  days: number | null;
  exitDate: string;
  item: ERObsItem | null;
}) {
  const horizonResult =
    arr<ERObsHorizon>(item?.horizons).find((h) => isNum(h?.days) && isNum(days) && h.days === days) ?? null;
  const realized = horizonResult?.realized_return;
  const label = isNum(days) ? `T+${days} 实际收益` : '实际收益';

  return (
    <article className="er-pick">
      <div className="er-pick-top">
        <span className="er-rank" aria-label="预测名次">
          {isNum(candidate?.rank) ? Math.round(candidate.rank) : '—'}
        </span>
        <span className="er-pick-name">
          {strOr(candidate?.name)}
          <small className="er-code">{strOr(candidate?.ticker)}</small>
        </span>
      </div>

      <div className="er-pair">
        <div className="er-pair-cell is-expect">
          <span className="er-pair-label">预期收益</span>
          <strong className={'er-pair-value' + signClass(candidate?.expected_return)}>
            {isNum(candidate?.expected_return) ? pct(candidate.expected_return) : NO_DATA}
          </strong>
          <small>模型估计值</small>
        </div>
        <div className="er-pair-cell is-actual">
          <span className="er-pair-label">{label}</span>
          <strong className={'er-pair-value' + signClass(realized)}>{actualPct(realized)}</strong>
          <small>{statusText(horizonResult?.status ?? item?.status)}</small>
        </div>
      </div>

      <p className="er-pct">
        预测百分位 <strong>{dec(candidate?.percentile, 2)}</strong> <span>/ 100</span>
        <span className="er-pct-note">全市场排名刻度</span>
      </p>

      <dl className="er-pick-facts">
        <div>
          <dt>信号日参考价</dt>
          <dd>{priceText(candidate?.reference_close)}</dd>
        </div>
        <div>
          <dt>入场日开盘价</dt>
          <dd>{isNum(item?.entry_open) ? priceText(item.entry_open) : str(item?.status).toLowerCase() === 'unavailable' ? '行情缺失' : '等待开盘'}</dd>
        </div>
        <div>
          <dt>卖出日</dt>
          <dd>{exitDate}</dd>
        </div>
        <div>
          <dt>卖出日收盘价</dt>
          <dd>{isNum(horizonResult?.exit_close) ? priceText(horizonResult.exit_close) : AWAIT_QUOTE}</dd>
        </div>
      </dl>

      <p className="er-pick-foot">
        当前价格收益 <span className={signClass(item?.current_return).trim() || undefined}>{actualPct(item?.current_return)}</span>
      </p>
    </article>
  );
}

/* ── 模块 ───────────────────────────────────────────────── */

export default function ReturnJournal() {
  const { data, state, error, reload } = useExpectedReturn();
  const [picked, setPicked] = useState('');
  const [tab, setTab] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* 契约已要求 newest first，这里只做显示层的稳定排序。 */
  const records = useMemo(() => {
    const list = arr<ERRecord>(data?.records).filter((r) => r && str(r.id));
    return list.slice().sort((a, b) => {
      const sa = str(a?.signal_date);
      const sb = str(b?.signal_date);
      if (sa !== sb) return sa < sb ? 1 : -1;
      const ca = str(a?.created_at);
      const cb = str(b?.created_at);
      if (ca !== cb) return ca < cb ? 1 : -1;
      return 0;
    });
  }, [data]);

  const record = useMemo(
    () => records.find((r) => str(r?.id) === picked) ?? records[0] ?? null,
    [records, picked],
  );

  const horizons = useMemo(() => {
    const list = arr<ERRecordHorizon>(record?.horizons).slice();
    return list.sort((a, b) => {
      const da = isNum(a?.days) ? a.days : Number.POSITIVE_INFINITY;
      const db = isNum(b?.days) ? b.days : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [record]);

  /* 同一记录可能有多次观察，取 as_of 最新的一条。 */
  const observation = useMemo(() => {
    const id = str(record?.id);
    if (!id) return null;
    const list = arr<ERObservation>(data?.observations).filter((o) => str(o?.forecast_id) === id);
    if (!list.length) return null;
    return list.slice().sort((a, b) => str(b?.as_of).localeCompare(str(a?.as_of)) || str(b?.evaluated_at).localeCompare(str(a?.evaluated_at)))[0] ?? null;
  }, [data, record]);

  const itemByTicker = useMemo(() => {
    const m = new Map<string, ERObsItem>();
    for (const it of arr<ERObsItem>(observation?.items)) {
      const t = str(it?.ticker);
      if (t) m.set(t, it);
    }
    return m;
  }, [observation]);

  /* 验证指标按当前记录的行情滞后筛选；没有对应 lag 时如实留空。 */
  const validation = data?.validation ?? null;
  const metrics = useMemo(() => {
    const lag = record?.lag_sessions;
    const all = arr<ERMetric>(validation?.metrics);
    const hit = isNum(lag) ? all.filter((m) => isNum(m?.lag_sessions) && m.lag_sessions === lag) : [];
    return hit.slice().sort((a, b) => {
      const da = isNum(a?.days) ? a.days : Number.POSITIVE_INFINITY;
      const db = isNum(b?.days) ? b.days : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [validation, record]);

  const activeTab = useMemo(() => {
    const available = horizons.map((h) => (isNum(h?.days) ? h.days : null)).filter(isNum);
    if (tab !== null && available.includes(tab)) return tab;
    return available[0] ?? null;
  }, [horizons, tab]);

  const toggleExpand = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const method = data?.method ?? null;
  const counts = record?.universe_counts ?? null;
  const recordId = str(record?.id);

  return (
    <section className="er-journal" aria-label="全A股三期限预期收益" data-testid="hhh-return-journal">
      <div className="er-heading">
        <div>
          <h1>全 A 股 · 三期限预期收益</h1>
          <p>
            每日用最新行情重排沪、深、北 A 股。三个期限独立选股，每天的名单与预测永久留档。
          </p>
        </div>
        {records.length ? (
          <label className="er-pick-history">
            历史记录
            <select
              aria-label="预期收益历史记录"
              value={recordId}
              onChange={(e) => {
                setPicked(e.target.value);
                setExpanded({});
              }}
            >
              {records.map((r) => (
                <option key={str(r?.id)} value={str(r?.id)}>
                  行情 {dayText(r?.signal_date)} → T {dayText(r?.entry_date)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {state === 'loading' ? (
        <output className="er-state" aria-live="polite">
          正在读取预期收益记录…
        </output>
      ) : null}

      {state === 'error' ? (
        <output className="er-state is-error" aria-live="polite">
          暂时无法读取预期收益记录（{error || '连接未完成'}）。
          <button type="button" className="er-retry" onClick={reload}>
            重新读取
          </button>
        </output>
      ) : null}

      {state === 'ready' && !record ? (
        <output className="er-state" aria-live="polite">
          尚未生成预期收益记录：{NO_DATA}。下方存档仍可查看原有综合评分名单。
          <button type="button" className="er-retry" onClick={reload}>
            重新读取
          </button>
        </output>
      ) : null}

      {record ? (
        <>
          <div className="er-badges">
            <span className="er-badge is-model">
              {str(record.estimate_status).toUpperCase() === 'MODEL_ESTIMATE' ? '模型估计值' : strOr(record.estimate_status)}
            </span>
            <span className="er-badge">收益回归 V1</span>
            <span className="er-badge">
              信号至入场 {isNum(record.lag_sessions) ? `${Math.round(record.lag_sessions)} 个交易日` : NO_DATA}
            </span>
          </div>

          <dl className="er-dates">
            <div>
              <dt>行情截至</dt>
              <dd>{dayText(record.signal_date)}</dd>
            </div>
            <div>
              <dt>入场参考日 T</dt>
              <dd>{dayText(record.entry_date)}</dd>
            </div>
            <div>
              <dt>参与排名</dt>
              <dd>{intText(record.ranked_count ?? counts?.eligible_count)} 只</dd>
            </div>
            <div>
              <dt>模型训练截止</dt>
              <dd>{dayText(record.training_cutoff)}</dd>
            </div>
          </dl>

          {horizons.length ? (
            <div className="er-tabs" role="group" aria-label="卖出期限">
              {horizons.map((h) =>
                isNum(h?.days) ? (
                  <button
                    key={h.days}
                    type="button"
                    aria-pressed={activeTab === h.days}
                    aria-controls={`er-h-${h.days}`}
                    onClick={() => setTab(h.days as number)}
                  >
                    T+{h.days} 卖出
                  </button>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="er-horizons">
            {horizons.length ? (
              horizons.map((h, hi) => {
                const days = isNum(h?.days) ? h.days : null;
                const key = recordId + '::' + (days ?? 'na') + '::' + hi;
                const open = !!expanded[key];
                const cands = arr<ERCandidate>(h?.candidates);
                const shown = cands.slice(0, open ? EXPAND_N : FIRST_N);
                const exitDate = dayText(h?.exit_date);
                return (
                  <section
                    className={'er-horizon' + (days !== null && activeTab !== days ? ' is-mobile-hidden' : '')}
                    key={key}
                    id={days !== null ? `er-h-${days}` : undefined}
                    aria-label={days !== null ? `T+${days} 卖出` : '卖出期限'}
                  >
                    <header>
                      <h2>{days !== null ? `T+${days} 卖出` : '卖出期限'}</h2>
                      <span>卖出日 {exitDate}</span>
                    </header>
                    {shown.length ? (
                      shown.map((c, ci) => (
                        <PickCard
                          key={str(c?.ticker) + '-' + ci}
                          candidate={c}
                          days={days}
                          exitDate={exitDate}
                          item={itemByTicker.get(str(c?.ticker)) ?? null}
                        />
                      ))
                    ) : (
                      <p className="er-state is-inline">该期限没有候选记录：{NO_DATA}。</p>
                    )}
                    {cands.length > FIRST_N ? (
                      <button
                        type="button"
                        className="er-more"
                        aria-expanded={open}
                        onClick={() => toggleExpand(key)}
                      >
                        {open
                          ? `收起，仅看前 ${FIRST_N} 名`
                          : `展开前 ${Math.min(EXPAND_N, cands.length)} 名`}
                      </button>
                    ) : null}
                  </section>
                );
              })
            ) : (
              <p className="er-state is-inline">该记录没有期限明细：{NO_DATA}。</p>
            )}
          </div>

          <p className="er-obs">
            {observation ? (
              <>
                结果行情截至 {dayText(observation.as_of)} · 评估时间 {tsText(observation.evaluated_at)}；
                每日预测保留，到期收益另行追加。
              </>
            ) : (
              <>记录 {strOr(record.id)} 尚未登记任何实际结果：{AWAIT_QUOTE}。入场与到期行情可得后另行追加。</>
            )}
          </p>

          <details className="er-notes">
            <summary>口径、日期与模型信息</summary>
            <dl className="er-defs">
              <div>
                <dt>模型</dt>
                <dd>
                  {strOr(record.model_version ?? method?.id)}
                  {str(method?.label) ? ` · ${str(method?.label)}` : ''}
                </dd>
              </div>
              <div>
                <dt>模型参数包</dt>
                <dd className="er-mono">{strOr(record.model_bundle)}</dd>
              </div>
              <div>
                <dt>记录编号 / 生成时间</dt>
                <dd>
                  <span className="er-mono">{strOr(record.id)}</span> · {tsText(record.created_at)}
                </dd>
              </div>
              <div>
                <dt>信号日 S → 入场日 T</dt>
                <dd>
                  {dayText(record.signal_date)} → {dayText(record.entry_date)}（行情滞后{' '}
                  {isNum(record.lag_sessions) ? `${Math.round(record.lag_sessions)} 个交易日` : NO_DATA}）
                </dd>
              </div>
              <div>
                <dt>训练截止</dt>
                <dd>{dayText(record.training_cutoff)}（预测日不早于该截止日）</dd>
              </div>
              <div>
                <dt>样本数量</dt>
                <dd>
                  输入 {intText(counts?.input_count)} · 合格 {intText(counts?.eligible_count)} · 排除{' '}
                  {intText(counts?.excluded_count)}
                </dd>
              </div>
              {str(method?.description) ? (
                <div>
                  <dt>方法说明</dt>
                  <dd>{str(method?.description)}</dd>
                </div>
              ) : null}
              {str(method?.return_basis) ? (
                <div>
                  <dt>收益口径</dt>
                  <dd>{str(method?.return_basis)}</dd>
                </div>
              ) : null}
              {str(data?.generated_at) ? (
                <div>
                  <dt>导出时间</dt>
                  <dd>{tsText(data?.generated_at)}</dd>
                </div>
              ) : null}
            </dl>
            <ul className="er-bullets">
              <li>预期收益估算复权入场开盘至指定卖出日收盘的价格收益，尚未扣除费用。</li>
              <li>预测百分位是同一截面内的排名刻度（满分 100），与预期收益率是两个独立字段。</li>
              <li>信号日参考价是记录生成时的收盘价，不是委托价；入场日开盘价在开盘后才写入。</li>
              <li>实际收益只在对应到期日行情可得后登记；缺失一律显示「{AWAIT_QUOTE}」，不用 0 代替。</li>
              <li>名单在记录生成时固定，历史记录回看时显示当时的原始候选与当时的参考价格。</li>
            </ul>
          </details>

          <details className="er-notes">
            <summary>历史验证 · {str(validation?.baseline_comparison) || '与基线对照'}</summary>
            <p className="er-valnote">
              以下为建模时一次性完成的月度滚动 walk-forward 开发期验证结果，按当前记录的行情滞后{' '}
              {isNum(record.lag_sessions) ? `lag=${Math.round(record.lag_sessions)}` : NO_DATA} 筛选显示。
              它是基于供应商历史数据的因果重建，不是盲样本外证据，也不会回填到上方的实际结果中。
              {str(validation?.methodology) ? ' ' + str(validation?.methodology) : ''}
              {validation && validation.folds !== undefined && validation.folds !== null
                ? ` 折数：${foldsText(validation.folds)}。`
                : ''}
            </p>
            {metrics.length ? (
              <>
                <TableScroll label="初始验证指标表">
                  <table className="tm-table er-metrics">
                    <caption className="tm-sr">
                      按期限列出的评分日期数、样本行数、MAE / RMSE 与两个基线的对照、日度 RankIC、Top20 收益与结果覆盖
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">期限</th>
                        <th scope="col" className="tm-num">评分日数</th>
                        <th scope="col" className="tm-num">样本行数</th>
                        <th scope="col" className="tm-num">MAE</th>
                        <th scope="col" className="tm-num">基线 MAE</th>
                        <th scope="col" className="tm-num">零基线 MAE</th>
                        <th scope="col" className="tm-num">RMSE</th>
                        <th scope="col" className="tm-num">基线 RMSE</th>
                        <th scope="col" className="tm-num">零基线 RMSE</th>
                        <th scope="col" className="tm-num">日度 RankIC</th>
                        <th scope="col" className="tm-num">Top20 平均收益</th>
                        <th scope="col" className="tm-num">Top20 扣摩擦情景</th>
                        <th scope="col" className="tm-num">Top20 结果覆盖</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, mi) => (
                        <tr key={(isNum(m?.days) ? m.days : 'na') + '-' + mi}>
                          <th scope="row">{isNum(m?.days) ? `T+${m.days}` : NO_DATA}</th>
                          <td className="tm-num">{intText(m?.dates)}</td>
                          <td className="tm-num">{intText(m?.rows)}</td>
                          <td className="tm-num">{pct(m?.mae, 3, false)}</td>
                          <td className="tm-num">{pct(m?.baseline_mae, 3, false)}</td>
                          <td className="tm-num">{pct(m?.zero_mae, 3, false)}</td>
                          <td className="tm-num">{pct(m?.rmse, 3, false)}</td>
                          <td className="tm-num">{pct(m?.baseline_rmse, 3, false)}</td>
                          <td className="tm-num">{pct(m?.zero_rmse, 3, false)}</td>
                          <td className="tm-num">{dec(m?.rank_ic, 4)}</td>
                          <td className={'tm-num' + signClass(m?.top20_mean_return)}>{pct(m?.top20_mean_return)}</td>
                          <td className={'tm-num' + signClass(m?.top20_after_cost_scenario)}>
                            {pct(m?.top20_after_cost_scenario)}
                          </td>
                          <td className="tm-num">{pct(m?.top20_coverage, 2, false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
                <ul className="er-bullets">
                  <li>MAE / RMSE 以收益单位按百分比展示；与「基线」（按期限与滞后分组的历史均值 M0）和「零基线」并列，低者更准，本页不做汇总判定。</li>
                  <li>Top20 在剔除缺失结果之前就已选定；结果覆盖为已获得到期行情的比例，缺标签的个股保留在历史名单中。</li>
                  <li>扣摩擦情景为固定 31bp 往返假设（双边佣金 0.03% + 双边滑点 0.1% + 卖出印花税 0.05%），是情景数，不是实际成交或账户净值。</li>
                  <li>开发期验证与每日前向记录分别保存；每日记录从首次发布开始累计。</li>
                </ul>
              </>
            ) : (
              <p className="er-state is-inline">
                当前信号至入场间隔下的验证指标：{NO_DATA}。
              </p>
            )}
          </details>
        </>
      ) : null}
    </section>
  );
}
