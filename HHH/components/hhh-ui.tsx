'use client';
/** HHH 研究终端 — 共享展示组件（无数据计算） */
import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Info, Search, TriangleAlert } from 'lucide-react';
import { PENDING, UNAVAILABLE } from '@/components/hhh-data';

/* ── panel ──────────────────────────────────────────────── */

export function Panel({
  title,
  en,
  note,
  actions,
  children,
  id,
  dense,
}: {
  title: string;
  en?: string;
  note?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  dense?: boolean;
}) {
  const auto = useId();
  const headingId = id ?? auto;
  return (
    <section className={'tm-panel' + (dense ? ' is-dense' : '')} aria-labelledby={headingId}>
      <header className="tm-panel-head">
        <h2 id={headingId} lang="zh-Hans">
          {title}
        </h2>
        {en ? (
          <span className="tm-panel-en" lang="en">
            {en}
          </span>
        ) : null}
        {actions ? <div className="tm-panel-actions">{actions}</div> : null}
      </header>
      {note ? <p className="tm-panel-note">{note}</p> : null}
      <div className="tm-panel-body">{children}</div>
    </section>
  );
}

/* ── status pills ───────────────────────────────────────── */

export type Tone = 'ok' | 'warn' | 'flag' | 'info' | 'mute';

export function Pill({
  tone = 'mute',
  title,
  children,
  onClick,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button type="button" className={'tm-pill tone-' + tone + ' is-button'} title={title} onClick={onClick}>
        {children}
      </button>
    );
  }
  return (
    <span className={'tm-pill tone-' + tone} title={title}>
      {children}
    </span>
  );
}

/** 把导出里的状态常量映射成中文 + 语气，未知值原样显示而不假装正常。 */
const STATUS_TONE: Record<string, { zh: string; tone: Tone }> = {
  COMPLETE_VERIFIED: { zh: '账本已核对', tone: 'ok' },
  HISTORICAL_NET_PROFIT_CANDIDATE: { zh: '历史净利候选', tone: 'info' },
  NORMALIZED_HISTORY_RECONCILED_CAPACITY_UNVERIFIED: { zh: '归一化历史·容量未验证', tone: 'warn' },
  PASS_WITH_LIMITATIONS_NOT_ARCHIVAL_PIT: { zh: '有限通过·非归档PIT', tone: 'warn' },
  RESEARCH_EXPOSED_HISTORY: { zh: '开发期已暴露历史', tone: 'warn' },
  RESEARCH_EXPOSED_HISTORY_NOT_ARCHIVAL_PIT: { zh: '已暴露历史·非归档PIT', tone: 'warn' },
  PASS_WITH_LIMITATIONS: { zh: '有限通过', tone: 'warn' },
  DEVELOPMENT_BACKTEST: { zh: '开发期回测', tone: 'warn' },
  HISTORICAL_SIMULATION_NOT_LIVE: { zh: '历史模拟·非实盘', tone: 'warn' },
  UNVERIFIED_OPEN_EXECUTION: { zh: '开盘成交未验证', tone: 'flag' },
  PARTICIPATION_CAPPED_EXECUTION_ESTIMATE_NOT_QUEUE_VERIFIED: { zh: '限参与率估算·排队未验证', tone: 'warn' },
  UNVERIFIED: { zh: '未验证', tone: 'flag' },
  RISK_OFF_NO_BUY: { zh: '风控不买入', tone: 'flag' },
  PENDING_CURRENT_DATA: { zh: '等待完整数据', tone: 'warn' },
  NO_COMPLETED_FORWARD_PORTFOLIO_LEDGER: { zh: '无已完成前向账本', tone: 'flag' },
  Verified: { zh: '已核验', tone: 'ok' },
  Unavailable: { zh: '不可得', tone: 'flag' },
  DOCUMENT_CHECKED: { zh: '原文已核对', tone: 'ok' },
  OFFICIAL_DISCLOSURE_CHECKED: { zh: '官方披露已核对', tone: 'ok' },
  OFFICIAL_PRODUCT_PAGE_CHECKED: { zh: '官方产品页已核对', tone: 'info' },
  LOCAL_HISTORICAL_RESEARCH: { zh: '本地历史研究', tone: 'warn' },
  BROKER_INSTRUMENT_SNAPSHOT: { zh: '券商只读快照', tone: 'warn' },
  DATA_PENDING: { zh: '数据待补', tone: 'flag' },
  SNAPSHOT_DELAY_UNSPECIFIED: { zh: '时延未声明', tone: 'warn' },
  TECHNICAL_RESEARCH_HYPOTHESIS: { zh: '技术研究假设', tone: 'warn' },
  TECHNICAL_DEPENDENCY_NOT_COMMERCIAL_CONTRACT: { zh: '技术依赖·非商业合同', tone: 'warn' },
};

export function statusMeta(raw: string | null | undefined): { zh: string; tone: Tone; raw: string } {
  const key = typeof raw === 'string' ? raw.trim() : '';
  if (!key) return { zh: UNAVAILABLE, tone: 'flag', raw: '' };
  const hit = STATUS_TONE[key];
  if (hit) return { ...hit, raw: key };
  if (key.startsWith('DATA_PENDING')) return { zh: '数据待补', tone: 'flag', raw: key };
  return { zh: key, tone: 'warn', raw: key };
}

export function StatusPill({
  value,
  onClick,
  prefix,
}: {
  value: string | null | undefined;
  onClick?: () => void;
  prefix?: string;
}) {
  const meta = statusMeta(value);
  return (
    <Pill tone={meta.tone} title={meta.raw || undefined} onClick={onClick}>
      {prefix ? prefix + ' ' : ''}
      {meta.zh}
    </Pill>
  );
}

/* ── missing-data markers ───────────────────────────────── */

export function Pending({ reason, label = PENDING }: { reason?: string | null; label?: string }) {
  return (
    <span className="tm-pending" title={reason ?? undefined}>
      <TriangleAlert size={12} aria-hidden="true" />
      <span>{label}</span>
      {reason ? <span className="tm-pending-reason">{reason}</span> : null}
    </span>
  );
}

export function Caveat({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'info' }) {
  return (
    <p className={'tm-caveat tone-' + tone}>
      <TriangleAlert size={14} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Hint({ en }: { en: string }) {
  return (
    <span className="tm-hint" title={en} aria-label={en} role="note">
      <Info size={13} aria-hidden="true" />
    </span>
  );
}

/* ── metric grid ────────────────────────────────────────── */

export function Metrics({
  items,
  columns,
}: {
  items: { label: string; value: ReactNode; note?: string; en?: string }[];
  columns?: number;
}) {
  return (
    <dl className="tm-metrics" style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
      {items.map((it) => (
        <div key={it.label}>
          <dt title={it.en}>{it.label}</dt>
          <dd>{it.value}</dd>
          {it.note ? <small>{it.note}</small> : null}
        </div>
      ))}
    </dl>
  );
}

/* ── tables ─────────────────────────────────────────────── */

export function TableScroll({ children, label }: { children: ReactNode; label?: string }) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users need focus to horizontally scroll wide tables.
    <section className="tm-scroll" aria-label={label ?? '可横向滚动的数据表'} tabIndex={0}>
      {children}
    </section>
  );
}

export type SortDir = 'asc' | 'desc';

export function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={'tm-sort' + (active ? ' is-active' : '')}
      onClick={onClick}
      aria-label={`按${label}排序，当前${active ? (dir === 'asc' ? '升序' : '降序') : '未排序'}`}
    >
      <span>{label}</span>
      {active ? (
        dir === 'asc' ? (
          <ChevronUp size={12} aria-hidden="true" />
        ) : (
          <ChevronDown size={12} aria-hidden="true" />
        )
      ) : (
        <ChevronDown size={12} aria-hidden="true" className="tm-sort-idle" />
      )}
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  label,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="tm-search">
      <label htmlFor={id} className="tm-sr">
        {label}
      </label>
      <Search size={14} aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder ?? label}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className="tm-select">
      <label htmlFor={id} className={hideLabel ? 'tm-sr' : undefined}>
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── pager ──────────────────────────────────────────────── */

export function Pager({
  page,
  pageCount,
  total,
  onPage,
  unit = '行',
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (p: number) => void;
  unit?: string;
}) {
  return (
    <div className="tm-pager">
      <span aria-live="polite">
        共 {total} {unit} · 第 {pageCount === 0 ? 0 : page + 1} / {pageCount} 页
      </span>
      <button type="button" onClick={() => onPage(Math.max(0, page - 1))} disabled={page <= 0} aria-label="上一页">
        上一页
      </button>
      <button
        type="button"
        onClick={() => onPage(Math.min(pageCount - 1, page + 1))}
        disabled={page >= pageCount - 1}
        aria-label="下一页"
      >
        下一页
      </button>
    </div>
  );
}

/* ── collapsible ────────────────────────────────────────── */

export function Disclosure({
  summary,
  children,
  defaultOpen,
}: {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="tm-disclosure">
      <button type="button" className="tm-disclosure-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        <span>{summary}</span>
      </button>
      {open ? <div className="tm-disclosure-body">{children}</div> : null}
    </div>
  );
}

/* ── misc ───────────────────────────────────────────────── */

export function Tags({ items, empty = UNAVAILABLE }: { items: string[] | null | undefined; empty?: string }) {
  const list = Array.isArray(items) ? items.filter((x) => typeof x === 'string' && x.trim()) : [];
  if (!list.length) return <span className="tm-muted">{empty}</span>;
  return (
    <ul className="tm-tags">
      {list.map((t, i) => (
        <li key={t + i}>{t}</li>
      ))}
    </ul>
  );
}

export function Bullets({ items, empty = UNAVAILABLE }: { items: string[] | null | undefined; empty?: string }) {
  const list = Array.isArray(items) ? items.filter((x) => typeof x === 'string' && x.trim()) : [];
  if (!list.length) return <p className="tm-muted">{empty}</p>;
  return (
    <ul className="tm-bullets">
      {list.map((t, i) => (
        <li key={t + i}>{t}</li>
      ))}
    </ul>
  );
}
