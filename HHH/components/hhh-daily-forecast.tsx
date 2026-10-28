'use client';
/**
 * HHH 研究终端 — 每日预测 Daily Forecast
 *
 * 主栏目是「全 A 股三期限预期收益」（components/hhh-return-journal.tsx，数据来自
 * public/expected-return.json，契约见 docs/HHH_EXPECTED_RETURN_V1.md）。原有的全 A 股
 * 综合评分选股名单不再是主栏目，但完整保留在下方带标签的折叠存档中；板块 ETF、
 * 市场线索与既有主题预测/历史个股档案均原样保留。
 *
 * 数据来源：public/daily-forecast.json（由 scripts/hhh_daily_forecast.py 导出，
 * 契约见 docs/HHH_DAILY_FORECAST.md）。该文件在前端构建时可能尚未生成，因此本
 * 模块在运行时以相对地址 ./daily-forecast.json 取数，并显式区分
 * 「加载中 / 读取失败 / 暂无数据」三种状态，不内置任何种子数值。
 *
 * 本文件不做经济推导：强度分、5/20 日收益、实际结果全部由 Python 计算；前端只做
 * 格式化（契约规定的「小数 → 百分比」单位展示）、排序与筛选。缺值一律显示
 * 「暂无数据」，不用 0 代替。
 */
import ReturnJournal from './hhh-return-journal';
import ModelIterations from './hhh-model-iterations';
import StockJournal from './hhh-stock-journal';
import MarketContext from './hhh-market-context';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Caveat, Metrics, Panel, Pill, StatusPill, TableScroll } from '@/components/hhh-ui';
import { dec, isNum, pctFraction } from '@/components/hhh-data';

/* ── 数据契约（daily-forecast.json） ─────────────────────── */

interface DFMember {
  ticker: string;
  name: string;
  reference_close: number | null;
  return_5d: number | null;
  return_20d: number | null;
}

interface DFSector {
  id: string;
  name: string;
  rank: number | null;
  score: number | null;
  bias: string | null;
  status: string | null;
  return_5d: number | null;
  return_20d: number | null;
  members: DFMember[];
}

interface DFRecord {
  id: string;
  created_at: string | null;
  signal_date: string | null;
  target_date: string | null;
  data_status: string | null;
  sectors: DFSector[];
}

interface DFOutcomeSector {
  id: string;
  actual_return: number | null;
  actual_bias: string | null;
  matched: boolean | null;
  status: string | null;
}

interface DFOutcome {
  forecast_id: string;
  evaluated_at: string | null;
  sectors: DFOutcomeSector[];
}

interface DFWatchItem {
  ticker: string;
  name: string;
  rank: number | null;
  score: number | null;
  reference_close: number | null;
}

interface DFWatchlist {
  id: string;
  created_at: string | null;
  signal_date: string | null;
  target_date: string | null;
  items: DFWatchItem[];
  source_sha256: string | null;
}

interface DFMethod {
  id: string | null;
  label: string | null;
  description: string | null;
}

interface DailyForecastData {
  schema_version?: number | string | null;
  generated_at?: string | null;
  method?: DFMethod | null;
  records?: DFRecord[];
  outcomes?: DFOutcome[];
  historical_watchlists?: DFWatchlist[];
}

/* ── 显示层工具 ─────────────────────────────────────────── */

const NO_DATA = '暂无数据';
const ALL = '__all__';
const JSON_PATH = './daily-forecast.json';

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function strOr(v: unknown): string {
  return str(v) || NO_DATA;
}

/** 日期取前 10 位；不补全、不猜测。 */
function dayText(v: unknown): string {
  const s = str(v);
  return /^\d{8}$/.test(s) ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : s ? s.slice(0, 10) : NO_DATA;
}

/** 时间戳原样展示（保留导出里的偏移量），不改写时区标签。 */
function tsText(v: unknown): string {
  const s = str(v);
  if (!s) return NO_DATA;
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? s : date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) + ' 北京时间';
}

/** 小数收益 → 百分比，单位展示由契约规定；缺值显示暂无数据。 */
function pct(v: number | null | undefined): string {
  return isNum(v) ? pctFraction(v) : NO_DATA;
}

/** 强度分为 0..100 的刻度，不是概率。 */
function scoreText(v: number | null | undefined): string {
  return isNum(v) ? dec(v, 1) : NO_DATA;
}

function closeText(v: number | null | undefined): string {
  return isNum(v) ? '¥' + dec(v, 2) : NO_DATA;
}

function rankText(v: number | null | undefined): string {
  return isNum(v) ? String(v) : NO_DATA;
}

function signClass(v: number | null | undefined): string | undefined {
  if (!isNum(v) || v === 0) return undefined;
  return v > 0 ? 'tm-pos' : 'tm-neg';
}

const BIAS_LABEL: Record<string, { zh: string; cls: string }> = {
  偏强: { zh: '偏强', cls: 'is-up' },
  偏弱: { zh: '偏弱', cls: 'is-down' },
  震荡: { zh: '震荡', cls: 'is-flat' },
  upward: { zh: '走强', cls: 'is-up' },
  up: { zh: '走强', cls: 'is-up' },
  downward: { zh: '走弱', cls: 'is-down' },
  down: { zh: '走弱', cls: 'is-down' },
  sideways: { zh: '横向', cls: 'is-flat' },
  flat: { zh: '横向', cls: 'is-flat' },
};

function Bias({ value }: { value: string | null | undefined }) {
  const raw = str(value);
  const hit = BIAS_LABEL[raw.toLowerCase()];
  if (!raw) return <span className="tm-muted">{NO_DATA}</span>;
  return (
    <span className={'tm-df-bias ' + (hit?.cls ?? 'is-none')} title={raw}>
      {hit?.zh ?? raw}
    </span>
  );
}

const SECTOR_STATUS: Record<string, { zh: string; tone: 'ok' | 'warn' | 'flag' | 'info' }> = {
  estimated: { zh: '规则估计', tone: 'info' },
  available: { zh: '成分数据完整', tone: 'ok' },
  ok: { zh: '成分数据完整', tone: 'ok' },
  unavailable: { zh: '成分数据不可用', tone: 'flag' },
  partial: { zh: '成分数据不完整', tone: 'warn' },
};

function SectorStatus({ value }: { value: string | null | undefined }) {
  const raw = str(value);
  if (!raw) return <span className="tm-muted">{NO_DATA}</span>;
  const hit = SECTOR_STATUS[raw.toLowerCase()];
  return (
    <Pill tone={hit?.tone ?? 'warn'} title={raw}>
      {hit?.zh ?? raw}
    </Pill>
  );
}

function matchedText(v: boolean | null | undefined): string {
  if (v === true) return '方向一致';
  if (v === false) return '方向不一致';
  return NO_DATA;
}

/* ── 取数（相对地址 + abort，不走构建期 import） ────────── */

type LoadState = 'loading' | 'ready' | 'error';

function useDailyForecast() {
  const [data, setData] = useState<DailyForecastData | null>(null);
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
        const json = (await res.json()) as DailyForecastData;
        if (!alive) return;
        setData(json && typeof json === 'object' ? json : null);
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

/* ── 模块 ───────────────────────────────────────────────── */

export default function DailyForecast({ onRoute }: { onRoute?: (r: string) => void }) {
  const { data, state, error, reload } = useDailyForecast();
  const [picked, setPicked] = useState('');
  const [theme, setTheme] = useState(ALL);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  /* 记录按日期倒序；契约已要求 newest first，这里只做显示层的稳定排序。 */
  const records = useMemo(() => {
    const list = arr<DFRecord>(data?.records).filter((r) => r && str(r.id));
    return list.slice().sort((a, b) => {
      const sa = str(a.signal_date);
      const sb = str(b.signal_date);
      if (sa !== sb) return sa < sb ? 1 : -1;
      const ca = str(a.created_at);
      const cb = str(b.created_at);
      if (ca !== cb) return ca < cb ? 1 : -1;
      return 0;
    });
  }, [data]);

  const current = useMemo(
    () => records.find((r) => r.id === picked) ?? records[0] ?? null,
    [records, picked],
  );

  const outcomeById = useMemo(() => {
    const m = new Map<string, DFOutcome>();
    for (const o of arr<DFOutcome>(data?.outcomes)) {
      const id = str(o?.forecast_id);
      if (id) m.set(id, o);
    }
    return m;
  }, [data]);

  const currentOutcome = current ? outcomeById.get(current.id) ?? null : null;

  const themeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of records) {
      for (const s of arr<DFSector>(r.sectors)) {
        const key = str(s?.id) || str(s?.name);
        if (key && !seen.has(key)) seen.set(key, str(s?.name) || key);
      }
    }
    return [{ value: ALL, label: '全部主题' }, ...[...seen].map(([value, label]) => ({ value, label }))];
  }, [records]);

  /* 排名升序；缺名次的排在后面，再按强度分降序。纯显示层排序。 */
  const sectors = useMemo(() => {
    const list = arr<DFSector>(current?.sectors).slice().sort((a, b) => {
      const ra = isNum(a?.rank) ? Number(a.rank) : Number.POSITIVE_INFINITY;
      const rb = isNum(b?.rank) ? Number(b.rank) : Number.POSITIVE_INFINITY;
      if (ra !== rb) return ra - rb;
      const sa = isNum(a?.score) ? Number(a.score) : Number.NEGATIVE_INFINITY;
      const sb = isNum(b?.score) ? Number(b.score) : Number.NEGATIVE_INFINITY;
      return sb - sa;
    });
    if (theme === ALL) return list;
    return list.filter((s) => (str(s?.id) || str(s?.name)) === theme);
  }, [current, theme]);

  const outcomeSectorById = useMemo(() => {
    const m = new Map<string, DFOutcomeSector>();
    for (const s of arr<DFOutcomeSector>(currentOutcome?.sectors)) {
      const id = str(s?.id);
      if (id) m.set(id, s);
    }
    return m;
  }, [currentOutcome]);

  const watchlists = useMemo(() => arr<DFWatchlist>(data?.historical_watchlists), [data]);
  const method = data?.method ?? null;

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const recordLabel = useCallback(
    (r: DFRecord) => `评分日 ${dayText(r.signal_date)} → 目标交易日 ${dayText(r.target_date)}`,
    [],
  );

  const controls = (
    <div className="tm-df-controls">
      {records.length ? (
        <div className="tm-select">
          <label htmlFor="df-record">记录</label>
          <select id="df-record" value={current?.id ?? ''} onChange={(e) => setPicked(e.target.value)}>
            {records.map((r) => (
              <option key={r.id} value={r.id}>
                {recordLabel(r)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {themeOptions.length > 1 ? (
        <div className="tm-select">
          <label htmlFor="df-theme">主题</label>
          <select id="df-theme" value={theme} onChange={(e) => setTheme(e.target.value)}>
            {themeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <button type="button" className="tm-button is-quiet tm-df-reload" onClick={reload} disabled={state === 'loading'}>
        <RefreshCw size={13} aria-hidden="true" />
        <span>{state === 'loading' ? '读取中' : '重新读取'}</span>
      </button>
    </div>
  );

  return (
    <div className="tm-module tm-df-root" data-testid="hhh-daily-forecast">
      <ReturnJournal />
      <ModelIterations />
      <details className="research-archive"><summary>原综合评分 · 历史存档</summary><div className="tm-module">
        <p className="tm-foot">
          这是被预期收益模型取代之前的原栏目，原样保留：排名依据是综合评分，不输出预期收益率。
          两套名单各自独立记录，互不回填。
        </p>
        <StockJournal />
      </div></details>
      <details className="research-archive"><summary>板块 ETF · 代表代码与趋势</summary><div className="tm-module"><StockJournal etf /></div></details>
      <MarketContext />
      <details className="research-archive"><summary>重点产业观察 · 既有预测与历史个股档案</summary><div className="tm-module">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <h2 className="tm-strip-title">每日预测</h2>
          <Pill tone="info">A 股代表篮子</Pill>
          <Pill tone="mute">趋势强度 0–100</Pill>
        </div>
        <dl className="tm-strip-dates">
          <div>
            <dt>记录时间</dt>
            <dd title={str(current?.created_at) || undefined}>{tsText(current?.created_at)}</dd>
          </div>
          <div>
            <dt>行情截至</dt>
            <dd>{dayText(current?.signal_date)}</dd>
          </div>
          <div>
            <dt>目标交易日</dt>
            <dd>{dayText(current?.target_date)}</dd>
          </div>
        </dl>
        <p className="tm-strip-note">
          每天保留当时的判断，收盘后追加结果。选择日期可回看历史记录。
        </p>
      </div>

      {state === 'loading' ? (
        <Panel title="主题强度" en="Sector strength" dense>
          <p className="tm-df-state" aria-live="polite">
            正在读取每日记录…
          </p>
        </Panel>
      ) : null}

      {state === 'error' ? (
        <Panel title="主题强度" en="Sector strength" dense actions={controls}>
          <Caveat>
            暂时无法读取每日记录（{error || '连接未完成'}），请点击重新读取。
          </Caveat>
        </Panel>
      ) : null}

      {state === 'ready' && !records.length ? (
        <Panel title="主题强度" en="Sector strength" dense actions={controls}>
          <Caveat>
            尚未生成板块预测记录。已有个股记录可在下方查看。
          </Caveat>
        </Panel>
      ) : null}

      {state === 'ready' && current ? (
        <>
          <Panel
            title="主题强度"
            en="Sector outlook"
            actions={controls}
            note={
              <>
                按趋势强度排序，点击板块查看代表股。
              </>
            }
          >
            <TableScroll label="主题强度表">
              <table className="tm-table tm-df-table">
                <caption className="tm-sr">所选记录的主题名次、强度分、方向、5/20 日收益与成分数据状态</caption>
                <thead>
                  <tr>
                    <th scope="col">主题</th>
                    <th scope="col" className="tm-num">名次</th>
                    <th scope="col" className="tm-num">强度分</th>
                    <th scope="col">方向</th>
                    <th scope="col" className="tm-num">5日收益</th>
                    <th scope="col" className="tm-num">20日收益</th>
                    <th scope="col">成分状态</th>
                    <th scope="col" className="tm-num">成分数</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.length ? (
                    sectors.map((s) => {
                      const sid = str(s?.id) || str(s?.name);
                      const key = current.id + '::' + sid;
                      const open = !!expanded[key];
                      const members = arr<DFMember>(s?.members);
                      return (
                        <Fragment key={key}>
                          <tr className={open ? 'is-current' : undefined}>
                            <th scope="row">
                              <button
                                type="button"
                                className="tm-df-toggle"
                                aria-expanded={open}
                                onClick={() => toggle(key)}
                              >
                                {open ? (
                                  <ChevronUp size={13} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={13} aria-hidden="true" />
                                )}
                                <span>{strOr(s?.name)}</span>
                              </button>
                            </th>
                            <td data-label="排名" className="tm-num">{rankText(s?.rank)}</td>
                            <td data-label="强度分" className="tm-num">{scoreText(s?.score)}</td>
                            <td data-label="方向">
                              <Bias value={s?.bias} />
                            </td>
                            <td data-label="5日收益" className={'tm-num ' + (signClass(s?.return_5d) ?? '')}>{pct(s?.return_5d)}</td>
                            <td data-label="20日收益" className={'tm-num ' + (signClass(s?.return_20d) ?? '')}>{pct(s?.return_20d)}</td>
                            <td data-label="状态">
                              <SectorStatus value={s?.status} />
                            </td>
                            <td data-label="代表股" className="tm-num">{members.length ? String(members.length) : NO_DATA}</td>
                          </tr>
                          {open ? (
                            <tr className="tm-df-memberrow">
                              <td colSpan={8}>
                                <div className="tm-df-members">
                                  <h3 className="tm-df-memberhead">
                                    {strOr(s?.name)} · 代表性成分（评分日 {dayText(current.signal_date)}）
                                  </h3>
                                  {members.length ? (
                                    <TableScroll label={strOr(s?.name) + ' 成分表'}>
                                      <table className="tm-table">
                                        <caption className="tm-sr">成分代码、名称、参考收盘与 5/20 日收益</caption>
                                        <thead>
                                          <tr>
                                            <th scope="col">代码</th>
                                            <th scope="col">名称</th>
                                            <th scope="col" className="tm-num">参考收盘</th>
                                            <th scope="col" className="tm-num">5日收益</th>
                                            <th scope="col" className="tm-num">20日收益</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {members.map((m, i) => (
                                            <tr key={str(m?.ticker) + '-' + i}>
                                              <th scope="row" className="tm-mono">
                                                {strOr(m?.ticker)}
                                              </th>
                                              <td>{strOr(m?.name)}</td>
                                              <td className="tm-num">{closeText(m?.reference_close)}</td>
                                              <td className={'tm-num ' + (signClass(m?.return_5d) ?? '')}>
                                                {pct(m?.return_5d)}
                                              </td>
                                              <td className={'tm-num ' + (signClass(m?.return_20d) ?? '')}>
                                                {pct(m?.return_20d)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </TableScroll>
                                  ) : (
                                    <p className="tm-df-state">成分明细：{NO_DATA}。</p>
                                  )}
                                  <p className="tm-foot">
                                    参考收盘是导出记录中的评分日价格，不是委托价；成分篮子在记录生成时已固定。
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="tm-empty" colSpan={8}>
                        该记录在当前主题筛选下没有数据：{NO_DATA}。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableScroll>
          </Panel>

          <Panel
            title="结果验证"
            en="Outcomes recorded separately and matched by record id"
            note={<>结果按记录编号单独匹配，不写回预测记录；目标交易日收盘数据可得后才评估。</>}
          >
            {currentOutcome ? (
              <>
                <Metrics
                  columns={4}
                  items={[
                    { label: '对应记录', value: <span className="tm-mono">{strOr(currentOutcome.forecast_id)}</span> },
                    { label: '目标交易日', value: dayText(current.target_date) },
                    { label: '评估时间', value: tsText(currentOutcome.evaluated_at), en: 'evaluated_at' },
                    { label: '验证状态', value: <Pill tone="ok">已记录结果</Pill> },
                  ]}
                />
                <TableScroll label="结果验证表">
                  <table className="tm-table tm-df-table">
                    <caption className="tm-sr">各主题在目标交易日的实际收益、实际方向与方向比对</caption>
                    <thead>
                      <tr>
                        <th scope="col">主题</th>
                        <th scope="col">预测方向</th>
                        <th scope="col" className="tm-num">实际收益</th>
                        <th scope="col">实际方向</th>
                        <th scope="col">方向比对</th>
                        <th scope="col">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectors.length ? (
                        sectors.map((s) => {
                          const sid = str(s?.id) || str(s?.name);
                          const o = outcomeSectorById.get(sid) ?? null;
                          return (
                            <tr key={'outcome-' + sid}>
                              <th scope="row">{strOr(s?.name)}</th>
                              <td>
                                <Bias value={s?.bias} />
                              </td>
                              <td className={'tm-num ' + (signClass(o?.actual_return) ?? '')}>
                                {pct(o?.actual_return)}
                              </td>
                              <td>
                                <Bias value={o?.actual_bias} />
                              </td>
                              <td>{o ? matchedText(o.matched) : NO_DATA}</td>
                              <td>{o?.status ? <StatusPill value={o.status} /> : <span className="tm-muted">{NO_DATA}</span>}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="tm-empty" colSpan={6}>
                            当前主题筛选下没有可比对的主题：{NO_DATA}。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </TableScroll>
                <p className="tm-foot">
                  逐主题比对按记录编号列出，本页不汇总命中率；累计统计只能由 Python 在样本足够时计算。
                </p>
              </>
            ) : (
              <>
                <Pill tone="warn">待收盘验证</Pill>
                <p className="tm-foot">
                  记录 {strOr(current.id)} 的目标交易日为 {dayText(current.target_date)}，
                  结果尚未记录：待收盘验证。
                </p>
              </>
            )}
          </Panel>

          <Panel title="历史记录" en="All recorded forecasts, newest first" dense>
            <ul className="tm-df-history">
              {records.map((r) => {
                const o = outcomeById.get(r.id) ?? null;
                const active = r.id === current.id;
                return (
                  <li key={r.id} className={active ? 'is-active' : undefined}>
                    <button
                      type="button"
                      className="tm-df-histbtn"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setPicked(r.id)}
                    >
                      <span className="tm-df-histdate">{recordLabel(r)}</span>
                      <span className="tm-df-histmeta">
                        记录 {strOr(r.id)} · 生成 {tsText(r.created_at)} · 主题{' '}
                        {arr<DFSector>(r.sectors).length}
                      </span>
                    </button>
                    <span className="tm-df-histtags">
                      <StatusPill value={r.data_status} />
                      {o ? (
                        <Pill tone="ok" title={str(o.evaluated_at) || undefined}>
                          已验证 {dayText(o.evaluated_at)}
                        </Pill>
                      ) : (
                        <Pill tone="warn">待收盘验证</Pill>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </>
      ) : null}

      {state === 'ready' && watchlists.length ? (
        <Panel
          title="原有个股记录"
          en="Stock watchlists"
          note={
            <>
              原综合策略的个股排名，保留当时的分数与参考价格。综合分按百分位展示，满分 100。
            </>
          }
        >
          {watchlists.map((w, wi) => {
            const items = arr<DFWatchItem>(w?.items);
            return (
              <section className="tm-df-watch" key={str(w?.id) || 'watch-' + wi}>
                <h3 className="tm-subhead">
                  {dayText(w?.target_date)} · 行情截至 {dayText(w?.signal_date)}
                </h3>
                <p className="tm-foot">生成时间 {tsText(w?.created_at)}。</p>
                {items.length ? (
                  <TableScroll label={strOr(w?.id) + ' 个股名单'}>
                    <table className="tm-table">
                      <caption className="tm-sr">原综合排名名单的名次、代码、名称、综合分与参考收盘</caption>
                      <thead>
                        <tr>
                          <th scope="col" className="tm-num">名次</th>
                          <th scope="col">代码</th>
                          <th scope="col">名称</th>
                          <th scope="col" className="tm-num">综合分</th>
                          <th scope="col" className="tm-num">参考收盘</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, i) => (
                          <tr key={str(it?.ticker) + '-' + i}>
                            <th scope="row" className="tm-num">
                              {rankText(it?.rank)}
                            </th>
                            <td className="tm-mono">{strOr(it?.ticker)}</td>
                            <td>{strOr(it?.name)}</td>
                            <td className="tm-num">{isNum(it?.score) ? dec(it.score * 100, 2) : NO_DATA}</td>
                            <td className="tm-num">{closeText(it?.reference_close)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                ) : (
                  <p className="tm-df-state">名单明细：{NO_DATA}。</p>
                )}
                <details className="tm-foot"><summary>记录来源</summary><p className="tm-hash">{strOr(w?.source_sha256)}</p></details>
              </section>
            );
          })}
        </Panel>
      ) : null}

      <details className="tm-df-method">
        <summary>方法说明与口径</summary>
        <div className="tm-df-methodbody">
          <dl className="tm-defs">
            <div>
              <dt>{strOr(method?.id)}</dt>
              <dd>
                {strOr(method?.label)}
                {str(method?.description) ? ' — ' + str(method?.description) : ''}
              </dd>
            </div>
          </dl>
          <ul className="tm-bullets">
            <li>强度分是 0..100 的趋势强弱刻度，不是上涨概率，也不是预期涨跌幅。</li>
            <li>覆盖范围是明确列名的 A股代表性成分篮子，不是官方行业指数，也不是全球行业指数。</li>
            <li>首次实时跟踪从本页最早一条记录开始；此前没有同口径的事前主题记录，本页也不回填历史预测。</li>
            <li>任一必需成分或交易日缺失即整主题标注不可用，不做静默调权。</li>
            <li>结果验证在目标交易日收盘数据可得后单独记录，按记录编号匹配，不修改原预测记录。</li>
            <li>全部数值由 Python 计算（scripts/hhh_daily_forecast.py）；本页只做格式化、排序与筛选。</li>
            <li>模型状态 RESEARCH_ONLY；本页没有训练、调参或下单控件。</li>
          </ul>
          {onRoute ? (
            <button type="button" className="tm-link" onClick={() => onRoute('evidence')}>
              查看证据、局限与可复现命令
              <ArrowUpRight size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </details>
      </div></details>
    </div>
  );
}
