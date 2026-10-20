'use client';
/** HHH 研究终端 — 公司研究 Company */
import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Bullets,
  Caveat,
  Metrics,
  Panel,
  Pending,
  Pill,
  SearchBox,
  StatusPill,
  TableScroll,
  Tags,
} from '@/components/hhh-ui';
import {
  UNAVAILABLE,
  companies,
  dec,
  industrySourceById,
  int,
  isNum,
  layerById,
  marketLabel,
  pctValue,
  stampUtc,
  text,
  textOr,
  type Company,
  type FinancialPeriod,
  type ValuationBlock,
} from '@/components/hhh-data';

function SourceList({ ids, onEvidence }: { ids: string[] | null | undefined; onEvidence: () => void }) {
  const list = Array.isArray(ids) ? ids : [];
  if (!list.length) return <span className="tm-muted">{UNAVAILABLE}</span>;
  return (
    <ul className="tm-srclist">
      {list.map((id) => {
        const s = industrySourceById.get(id);
        if (!s) {
          return (
            <li key={id}>
              <span className="tm-muted">{id} · 来源未登记</span>
            </li>
          );
        }
        return (
          <li key={id}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : (
              <button type="button" className="tm-link" onClick={onEvidence}>
                {s.title}（本地文件 · 在研究证据页查看）
              </button>
            )}
            <span className="tm-srcmeta">
              {s.published_at ? `发布 ${s.published_at.slice(0, 10)}` : '无发布日期'} · 核对 {s.last_verified ?? UNAVAILABLE}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PeriodBlock({ label, p }: { label: string; p: FinancialPeriod | null | undefined }) {
  if (!p) {
    return (
      <div className="tm-period">
        <h4>{label}</h4>
        <Pending reason="该公司尚未核对此财务期间。" />
      </div>
    );
  }
  return (
    <div className="tm-period">
      <h4>{label}</h4>
      <dl>
        <div>
          <dt>财报期</dt>
          <dd>{textOr(p.fiscal_period)}</dd>
        </div>
        <div>
          <dt>期末日</dt>
          <dd>{textOr(p.period_end)}</dd>
        </div>
        <div>
          <dt>公布日</dt>
          <dd>{textOr(p.published_at)}</dd>
        </div>
        <div>
          <dt>总营收（百万美元）</dt>
          <dd>{int(p.revenue_usd_million)}</dd>
        </div>
        <div>
          <dt>毛利率</dt>
          <dd>{pctValue(p.gross_margin_pct, 1, false)}</dd>
        </div>
        <div>
          <dt>会计准则</dt>
          <dd>{textOr(p.accounting_standard)}</dd>
        </div>
        <div>
          <dt>核验</dt>
          <dd>
            <StatusPill value={p.verification} />
          </dd>
        </div>
      </dl>
    </div>
  );
}

function ValuationRow({ label, block }: { label: string; block: ValuationBlock | null | undefined }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{isNum(block?.value) ? dec(block?.value, 2) : <Pending />}</td>
      <td className="tm-small">{textOr(block?.as_of_date, '无同日基准')}</td>
      <td className="tm-small">{textOr(block?.forecast_period, '无预测期间')}</td>
      <td className="tm-small">{textOr(block?.reason, '—')}</td>
    </tr>
  );
}

export default function CompanyResearch({
  ticker,
  onTicker,
  onRoute,
}: {
  ticker: string;
  onTicker: (t: string) => void;
  onRoute: (r: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      [c.ticker, c.name, c.profile, c.market, ...(c.industry_position ?? []), ...(c.layer_ids ?? [])]
        .map((v) => String(v).toLowerCase())
        .join(' ')
        .includes(q),
    );
  }, [query]);

  const company: Company | null = companies.find((c) => c.ticker === ticker) ?? companies[0] ?? null;

  const historyData = useMemo(() => {
    const h = Array.isArray(company?.history) ? company!.history : [];
    return h.filter((p) => isNum(p.revenue_m)).map((p) => ({ label: p.period, revenue: p.revenue_m, date: p.date }));
  }, [company]);

  if (!company) return <Caveat>industry-research.json 中没有公司条目。</Caveat>;

  const fp = company.financial_periods ?? null;
  const hasRevenue = isNum(company.revenue_m);

  return (
    <div className="tm-module">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <label className="tm-strip-label" htmlFor="co-pick">
            公司
          </label>
          <select id="co-pick" className="tm-strip-select" value={company.ticker} onChange={(e) => onTicker(e.target.value)}>
            {companies.map((c) => (
              <option key={c.ticker} value={c.ticker}>
                {c.ticker} · {c.name}（{marketLabel(c.market)}）
              </option>
            ))}
          </select>
          <SearchBox value={query} onChange={setQuery} label="搜索公司（代码、名称、业务或环节）" />
          <StatusPill value={company.verification} onClick={() => onRoute('evidence')} />
        </div>
        <p className="tm-strip-note">
          覆盖 {companies.length} 家公司；当前筛选命中 {filtered.length} 家。缺财务的公司同样是完整条目，
          不会被从列表里剔除。
        </p>
      </div>

      {query.trim() ? (
        <fieldset className="tm-pickrow" aria-label="搜索结果">
          {filtered.slice(0, 24).map((c) => (
            <button
              key={c.ticker}
              type="button"
              className={'tm-chip' + (c.ticker === company.ticker ? ' is-active' : '')}
              onClick={() => onTicker(c.ticker)}
            >
              {c.ticker} · {c.name}
            </button>
          ))}
          {!filtered.length ? <span className="tm-muted">没有匹配的公司。</span> : null}
        </fieldset>
      ) : null}

      <Panel title={`${company.name}（${company.ticker}）`} en="Company profile and industry position">
        <div className="tm-profile">
          <Metrics
            columns={4}
            items={[
              { label: '市场', value: marketLabel(company.market) },
              { label: '业务定位', value: textOr(company.profile) },
              { label: '实体ID', value: textOr(company.entity_id) },
              { label: '财务核验', value: <StatusPill value={company.verification} /> },
            ]}
          />
          <div className="tm-profile-grid">
            <div>
              <h4>所处产业环节</h4>
              <Tags items={company.industry_position} />
              <ul className="tm-tags">
                {(company.layer_ids ?? []).map((id) => (
                  <li key={id}>
                    <button type="button" className="tm-link" onClick={() => onRoute('industry')}>
                      {layerById.get(id)?.name ?? id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>研究口径</h4>
              <p className="tm-small">{textOr(company.research_scope)}</p>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="财务摘要" en="Reported total company revenue and margins; not AI-only revenue">
        {hasRevenue ? (
          <>
            <Metrics
              columns={6}
              items={[
                { label: '最新报告期', value: textOr(company.period) },
                { label: '期末 / 公布', value: `${textOr(company.period_end)} / ${textOr(company.release_date)}` },
                { label: '公司总营收（百万）', value: `${int(company.revenue_m)} ${textOr(company.currency, '')}` },
                { label: '同比', value: pctValue(company.revenue_yoy_pct) },
                { label: '环比', value: pctValue(company.revenue_qoq_pct) },
                { label: `毛利率 · ${textOr(company.accounting_standard)}`, value: pctValue(company.gross_margin_pct, 1, false) },
                { label: '上季营收', value: int(company.previous_revenue_m) },
                { label: '去年同期营收', value: int(company.prior_year_revenue_m) },
                { label: '会计准则', value: textOr(company.accounting_standard) },
                { label: '美元口径', value: textOr(company.revenue_currency_basis) },
                { label: '毛利率口径', value: textOr(company.gross_margin_basis) },
                { label: '净利润 / EPS', value: <Pending reason="尚未核对该指标的完整官方财务期间与计量口径。" /> },
              ]}
            />
            <Bullets items={company.financial_notes} empty="" />
            {fp ? (
              <div className="tm-periods">
                <PeriodBlock label="最新季度" p={fp.latest} />
                <PeriodBlock label="上一季度" p={fp.prior_quarter} />
                <PeriodBlock label="去年同期" p={fp.year_ago} />
              </div>
            ) : null}
            <Caveat>
              以上为<strong>公司整体</strong>营收，不是 AI 业务收入，也不是股价回报。各公司按自身财年与报告币种展示，
              未做汇率换算，跨公司季度不自动对齐。
            </Caveat>
          </>
        ) : (
          <>
            <Caveat>
              {company.name} 的财务指标尚未核对到官方原文，全部为 null（不是 0）。该公司仍然是完整研究条目，
              产业定位、驱动、催化与风险在下方照常展示。
            </Caveat>
            <Pending reason={company.missing_metrics?.[0]?.reason} label="全部财务字段 DATA PENDING" />
          </>
        )}
      </Panel>

      <Panel title="营收历史" en="Disclosed quarterly revenue only; no forecast bars">
        {historyData.length ? (
          <>
            <div className="tm-chart">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={historyData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#e3e7ec" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b747d' }} stroke="#c9d1d9" />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b747d' }}
                    stroke="#c9d1d9"
                    width={64}
                    tickFormatter={(v: number) => (Number.isFinite(v) ? int(v) : '')}
                  />
                  <Tooltip
                    content={(props: unknown) => {
                      const p = props as {
                        active?: boolean;
                        label?: string | number;
                        payload?: { value?: number | string | null }[];
                      };
                      if (!p.active || !p.payload?.length) return null;
                      const v = p.payload[0]?.value;
                      const point = historyData.find((h) => h.label === p.label);
                      return (
                        <div className="tm-tip">
                          <div className="tm-tip-date">
                            {String(p.label ?? '')}
                            {point ? ` · 期末 ${point.date}` : ''}
                          </div>
                          <div className="tm-tip-row">
                            <span className="tm-tip-name">公司总营收</span>
                            <span className="tm-tip-value">
                              {typeof v === 'number' ? `${int(v)} 百万${company.currency ?? ''}` : UNAVAILABLE}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ fill: '#eef2f6' }}
                  />
                  <Legend verticalAlign="top" align="right" height={26} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="公司总营收（百万）" fill="#1f4e79" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <TableScroll label="营收历史表">
              <table className="tm-table">
                <caption className="tm-sr">{company.name} 已披露季度总营收</caption>
                <thead>
                  <tr>
                    <th scope="col">财报期</th>
                    <th scope="col">期末日</th>
                    <th scope="col">公布日</th>
                    <th scope="col" className="tm-num">总营收（百万）</th>
                    <th scope="col">来源</th>
                  </tr>
                </thead>
                <tbody>
                  {(company.history ?? []).map((h) => (
                    <tr key={h.period + h.date}>
                      <th scope="row">{h.period}</th>
                      <td>{h.date}</td>
                      <td>{textOr(h.release_date)}</td>
                      <td className="tm-num">{int(h.revenue_m)}</td>
                      <td className="tm-small">{(h.source_ids ?? []).join(', ') || UNAVAILABLE}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <p className="tm-foot">{textOr(company.history_semantics, '')}</p>
            {historyData.length < 3 ? (
              <Caveat>仅 {historyData.length} 个已披露观测点，不足以判断趋势；不补插其他季度。</Caveat>
            ) : null}
          </>
        ) : (
          <Caveat>该公司没有已核对的季度营收历史，不绘制任何曲线，也不补造数据点。</Caveat>
        )}
      </Panel>

      <Panel title="估值与一致预期" en="Valuation fields are pending with explicit reasons">
        <TableScroll label="估值字段表">
          <table className="tm-table">
            <caption className="tm-sr">估值与一致预期字段的可得性、基准日、预测期间与待补原因</caption>
            <thead>
              <tr>
                <th scope="col">字段</th>
                <th scope="col">数值</th>
                <th scope="col">基准日</th>
                <th scope="col">预测期间</th>
                <th scope="col">待补原因</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">NTM 市盈率</th>
                <td>{isNum(company.ntm_pe) ? dec(company.ntm_pe, 2) : <Pending />}</td>
                <td className="tm-small">无同日价格</td>
                <td className="tm-small">无预测期间</td>
                <td className="tm-small">
                  {textOr(
                    company.missing_metrics?.find((x) => x.metric === 'ntm_pe')?.reason,
                    company.valuation_status,
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">远期 EV/EBITDA</th>
                <td>{isNum(company.forward_ev_ebitda) ? dec(company.forward_ev_ebitda, 2) : <Pending />}</td>
                <td className="tm-small">无同日价格</td>
                <td className="tm-small">无预测期间</td>
                <td className="tm-small">
                  {textOr(company.missing_metrics?.find((x) => x.metric === 'forward_ev_ebitda')?.reason)}
                </td>
              </tr>
              <ValuationRow label="一致预期" block={company.consensus_expectations} />
              <ValuationRow label="历史估值区间" block={company.historical_valuation_range} />
            </tbody>
          </table>
        </TableScroll>
        <Caveat>
          本工作区不接入付费一致预期数据源，也不引用截图历史估值，因此<strong>不输出便宜 / 合理 / 昂贵 / 买入</strong>一类标签。
        </Caveat>

        {company.market_snapshot ? (
          <div className="tm-snapshot">
            <h4>券商只读行情快照</h4>
            <Metrics
              columns={5}
              items={[
                { label: '最新价', value: `${dec(company.market_snapshot.last, 2)} ${textOr(company.market_snapshot.currency, '')}` },
                { label: '前收', value: isNum(company.market_snapshot.prior_close) ? dec(company.market_snapshot.prior_close, 2) : UNAVAILABLE },
                { label: '交易所', value: textOr(company.market_snapshot.exchange) },
                { label: '快照时间', value: stampUtc(company.market_snapshot.as_of_utc) },
                { label: '状态', value: <StatusPill value={company.market_snapshot.status} /> },
              ]}
            />
            <Caveat>{company.market_snapshot.note}</Caveat>
          </div>
        ) : (
          <p className="tm-foot">该公司没有行情快照；不显示任何当前价格。</p>
        )}
      </Panel>

      <Panel title="驱动、催化与风险" en="Research hypotheses, not verified outcomes">
        <div className="tm-triple">
          <div>
            <h4>需求驱动</h4>
            <Bullets items={company.drivers} />
          </div>
          <div>
            <h4>催化剂</h4>
            <Bullets items={company.catalysts} />
          </div>
          <div>
            <h4>风险 / 证伪</h4>
            <Bullets items={company.risks} />
            {(company.risks?.length ?? 0) < 3 ? <Caveat>风险条目少于 3 条，梳理尚未完成。</Caveat> : null}
          </div>
        </div>
        {company.watchpoints?.length ? (
          <>
            <h4 className="tm-subhead">观察点</h4>
            <Bullets items={company.watchpoints} />
          </>
        ) : null}
        <Caveat>研究假设 · 后续以公司披露验证。</Caveat>
      </Panel>

      <Panel title="指标明细与待补项" en="Entity-level metric rows with status and evidence grade">
        <TableScroll label="指标明细表">
          <table className="tm-table">
            <caption className="tm-sr">{company.name} 的指标行：数值、单位、基准日、状态、证据等级与来源</caption>
            <thead>
              <tr>
                <th scope="col">指标</th>
                <th scope="col" className="tm-num">数值</th>
                <th scope="col">单位</th>
                <th scope="col">基准日</th>
                <th scope="col">状态</th>
                <th scope="col">证据等级</th>
                <th scope="col">来源</th>
                <th scope="col">待补原因</th>
              </tr>
            </thead>
            <tbody>
              {(company.metrics ?? []).map((row, i) => (
                <tr key={row.metric + i}>
                  <th scope="row" className="tm-mono">{row.metric}</th>
                  <td className="tm-num">{isNum(row.value) ? dec(row.value, 2) : <Pending />}</td>
                  <td className="tm-small">{textOr(row.unit, '—')}</td>
                  <td className="tm-small">{textOr(row.as_of_date, '—')}</td>
                  <td>
                    <StatusPill value={row.status} />
                  </td>
                  <td className="tm-small">{textOr(row.evidence_grade)}</td>
                  <td className="tm-small">{(row.source ?? []).join(', ') || '—'}</td>
                  <td className="tm-small">{textOr(row.reason, '—')}</td>
                </tr>
              ))}
              {!(company.metrics ?? []).length ? (
                <tr>
                  <td colSpan={8} className="tm-empty">该公司没有指标行。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
        <h4 className="tm-subhead">待补字段（{company.missing_metrics?.length ?? 0} 项）</h4>
        <TableScroll label="待补字段表">
          <table className="tm-table">
            <caption className="tm-sr">缺失字段与各自的待补原因</caption>
            <thead>
              <tr>
                <th scope="col">字段</th>
                <th scope="col">原因</th>
              </tr>
            </thead>
            <tbody>
              {(company.missing_metrics ?? []).map((mm, i) => (
                <tr key={mm.metric + i}>
                  <th scope="row" className="tm-mono">{mm.metric}</th>
                  <td>{mm.reason}</td>
                </tr>
              ))}
              {!(company.missing_metrics ?? []).length ? (
                <tr>
                  <td colSpan={2} className="tm-empty">没有登记待补字段。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
      </Panel>

      <Panel
        title="官方证据"
        en="Official filings and product pages for this company"
        actions={
          <button type="button" className="tm-link" onClick={() => onRoute('evidence')}>
            打开完整证据页
          </button>
        }
      >
        <SourceList ids={company.source_ids} onEvidence={() => onRoute('evidence')} />
        <Pill tone="mute">{text(company.valuation_status)}</Pill>
      </Panel>
    </div>
  );
}
