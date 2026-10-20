'use client';
/** HHH 研究终端 — 策略表现 Portfolio */
import { useMemo, useState } from 'react';
import {
  ChartFootnote,
  ChartModeBar,
  StrategyChart,
  firstAvailableMode,
  modeAvailable,
  modeUnavailableReason,
  type ChartMode,
} from '@/components/hhh-chart';
import {
  Bullets,
  Caveat,
  Disclosure,
  Metrics,
  Pager,
  Panel,
  Pill,
  SearchBox,
  StatusPill,
  TableScroll,
} from '@/components/hhh-ui';
import {
  UNAVAILABLE,
  analytics,
  basisLabel,
  day,
  dec,
  int,
  isCapitalBasis,
  isNum,
  money,
  pctFraction,
  points,
  ratio,
  strategies,
  text,
  type Strategy,
} from '@/components/hhh-data';

const TRADES_PER_PAGE = 25;

function monthCell(value: number | null | undefined): string {
  return isNum(value) ? (value * 100).toFixed(1) : '';
}

export default function Portfolio({
  strategy,
  strategyId,
  onStrategy,
  onRoute,
}: {
  strategy: Strategy | null;
  strategyId: string;
  onStrategy: (id: string) => void;
  onRoute: (r: string) => void;
}) {
  const [mode, setMode] = useState<ChartMode>('nav');
  const [tradeQuery, setTradeQuery] = useState('');
  const [tradePage, setTradePage] = useState(0);

  const trades = useMemo(() => {
    const all = Array.isArray(strategy?.trades) ? strategy!.trades : [];
    const q = tradeQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) =>
      [t.ticker, t.entry_date, t.exit_date, t.id].some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [strategy, tradeQuery]);

  const monthGrid = useMemo(() => {
    const rows = Array.isArray(strategy?.months) ? strategy!.months : [];
    const byYear = new Map<string, Map<string, number | null>>();
    for (const r of rows) {
      const mm = r.period.slice(5, 7);
      if (!byYear.has(r.year)) byYear.set(r.year, new Map());
      byYear.get(r.year)!.set(mm, isNum(r.return) ? r.return : null);
    }
    return [...byYear.entries()].map(([year, cells]) => ({ year, cells }));
  }, [strategy]);

  if (!strategy) return <Caveat>未能读取策略数据。</Caveat>;

  const m = strategy.metrics ?? ({} as Strategy['metrics']);
  const capital = isCapitalBasis(strategy);
  const effectiveMode = modeAvailable(strategy, mode) ? mode : firstAvailableMode(strategy, mode);
  const switched = effectiveMode !== mode;
  const pageCount = Math.max(1, Math.ceil(trades.length / TRADES_PER_PAGE));
  const page = Math.min(tradePage, pageCount - 1);
  const pageTrades = trades.slice(page * TRADES_PER_PAGE, page * TRADES_PER_PAGE + TRADES_PER_PAGE);
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  return (
    <div className="tm-module">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <label className="tm-strip-label" htmlFor="pf-strategy">
            策略
          </label>
          <select id="pf-strategy" className="tm-strip-select" value={strategyId} onChange={(e) => onStrategy(e.target.value)}>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <StatusPill value={strategy.status} onClick={() => onRoute('evidence')} />
          <Pill tone="mute">{basisLabel(strategy)}</Pill>
          <Pill tone="warn">{strategy.execution ?? 'HISTORICAL_SIMULATION_NOT_LIVE'}</Pill>
        </div>
        <dl className="tm-strip-dates">
          <div>
            <dt>账本区间</dt>
            <dd>
              {strategy.period?.[0]} — {strategy.period?.[1]}
            </dd>
          </div>
          <div>
            <dt>数据截至</dt>
            <dd>{day(strategy.data_as_of)}</dd>
          </div>
        </dl>
      </div>

      <Panel
        title="曲线"
        en="All chart modes read exported columns directly"
        actions={<ChartModeBar strategy={strategy} mode={effectiveMode} onMode={setMode} />}
      >
        {switched ? <Caveat>{modeUnavailableReason(strategy, mode)}</Caveat> : null}
        <StrategyChart strategy={strategy} mode={effectiveMode} height={330} />
        <ChartFootnote strategy={strategy} mode={effectiveMode} />
      </Panel>

      <Panel title="完整指标" en="Full metric block with exported definitions">
        <Metrics
          columns={5}
          items={[
            { label: '起始本金', value: capital ? money(m.initial_nav, strategy.currency) : dec(m.normalized_initial_units, 4) },
            { label: '期末净值', value: capital ? money(m.final_nav, strategy.currency) : dec(m.normalized_final_units, 4) },
            { label: '净利润', value: capital ? money(m.profit_cny, strategy.currency) : UNAVAILABLE },
            { label: '净收益率', value: pctFraction(m.net_return) },
            { label: '年化 CAGR', value: pctFraction(m.cagr), en: analytics?.metric_definitions?.cagr },
            { label: '基准期末值', value: capital ? money(m.benchmark_final_nav, strategy.currency) : UNAVAILABLE },
            { label: '基准收益', value: pctFraction(m.benchmark_return) },
            { label: '匹配基准收益', value: pctFraction(m.matched_benchmark_return) },
            { label: '期末累计收益差', value: points(strategy.curve?.[strategy.curve.length - 1]?.relative_return) },
            { label: '最大回撤', value: pctFraction(m.max_drawdown, 2, false) },
            { label: '回撤最长天数', value: isNum(m.drawdown_duration_days) ? `${int(m.drawdown_duration_days)} 天` : UNAVAILABLE },
            { label: 'Sharpe', value: ratio(m.sharpe), en: analytics?.metric_definitions?.sharpe },
            { label: 'Sortino', value: ratio(m.sortino), en: analytics?.metric_definitions?.sortino },
            { label: '盈利因子 Profit Factor', value: ratio(m.profit_factor), note: text(m.profit_factor_status) || undefined },
            { label: '胜率', value: pctFraction(m.win_rate, 2, false) },
            { label: '平均盈亏比', value: ratio(m.payoff_ratio) },
            { label: '平均盈利', value: capital ? money(m.average_win, strategy.currency) : UNAVAILABLE },
            { label: '平均亏损', value: capital ? money(m.average_loss, strategy.currency) : UNAVAILABLE },
            { label: '已平仓 / 盈 / 亏', value: `${int(m.trades)} / ${int(m.winning_trades)} / ${int(m.losing_trades)}` },
            { label: '买入次数 / 成交笔数', value: `${int(m.entries)} / ${int(m.fills)}` },
            { label: '双边换手', value: ratio(m.turnover_two_way) },
            { label: '年化换手', value: ratio(m.turnover_annualized) },
            { label: '平均仓位', value: pctFraction(m.mean_position_weight, 2, false) },
            { label: '期末仓位', value: pctFraction(m.final_position_weight, 2, false) },
            { label: '总成本', value: capital ? money(m.total_cost, strategy.currency) : UNAVAILABLE },
          ]}
        />
        <Caveat>
          {analytics?.metric_definitions?.comparison}
        </Caveat>
      </Panel>

      <Panel title="年度与月度" en="Yearly table and monthly heatmap">
        <TableScroll label="年度结果表">
          <table className="tm-table">
            <caption className="tm-sr">{strategy.name} 年度结果</caption>
            <thead>
              <tr>
                <th scope="col">年度</th>
                <th scope="col">区间</th>
                <th scope="col" className="tm-num">期初</th>
                <th scope="col" className="tm-num">期末</th>
                <th scope="col" className="tm-num">{capital ? '利润' : '变动'}</th>
                <th scope="col" className="tm-num">策略收益</th>
                <th scope="col" className="tm-num">基准收益</th>
              </tr>
            </thead>
            <tbody>
              {(strategy.years ?? []).map((y) => (
                <tr key={y.period}>
                  <th scope="row">
                    {y.period}
                    {y.partial_period ? <span className="tm-flagtext">不完整</span> : null}
                  </th>
                  <td>{y.first_date} — {y.last_date}</td>
                  <td className="tm-num">{capital ? money(y.start_nav, strategy.currency) : dec(y.start_nav, 4)}</td>
                  <td className="tm-num">{capital ? money(y.final_nav, strategy.currency) : dec(y.final_nav, 4)}</td>
                  <td className={'tm-num tm-' + (y.profit < 0 ? 'neg' : 'pos')}>
                    {capital ? money(y.profit, strategy.currency) : dec(y.profit, 4)}
                  </td>
                  <td className={'tm-num tm-' + (y.return < 0 ? 'neg' : 'pos')}>{pctFraction(y.return)}</td>
                  <td className="tm-num">{pctFraction(y.benchmark_return)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>

        <h3 className="tm-subhead">月度收益热力表（%）</h3>
        <TableScroll label="月度收益热力表">
          <table className="tm-table tm-heat">
            <caption className="tm-sr">{strategy.name} 月度收益率，空格表示该月不在账本区间内</caption>
            <thead>
              <tr>
                <th scope="col">年</th>
                {months.map((mm) => (
                  <th key={mm} scope="col" className="tm-num">
                    {Number(mm)}月
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  {months.map((mm) => {
                    const v = row.cells.get(mm);
                    const has = v !== undefined && isNum(v);
                    return (
                      <td
                        key={mm}
                        className={'tm-num' + (has ? (v! < 0 ? ' heat-neg' : v! > 0 ? ' heat-pos' : ' heat-zero') : ' heat-none')}
                        title={has ? `${row.year}-${mm} ${pctFraction(v)}` : `${row.year}-${mm} 不在账本区间`}
                      >
                        {has ? monthCell(v) : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {!monthGrid.length ? (
                <tr>
                  <td colSpan={13} className="tm-empty">导出中没有月度分组。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
        <p className="tm-foot">{analytics?.metric_definitions?.months}　空白格表示该月不在账本区间内，不是 0% 收益。</p>
      </Panel>

      <Panel title="成本拆解" en="Modeled trading cost breakdown">
        {strategy.costs ? (
          <>
            <Metrics
              columns={5}
              items={[
                { label: '佣金', value: money(strategy.costs.commission, strategy.costs.currency ?? strategy.currency) },
                { label: '印花税', value: money(strategy.costs.stamp_duty, strategy.costs.currency ?? strategy.currency) },
                { label: '滑点（建模）', value: money(strategy.costs.slippage, strategy.costs.currency ?? strategy.currency) },
                { label: '合计', value: money(strategy.costs.total, strategy.costs.currency ?? strategy.currency) },
                { label: '市场冲击', value: isNum(strategy.costs.market_impact) ? money(strategy.costs.market_impact, strategy.currency) : UNAVAILABLE },
              ]}
            />
            <Caveat>
              成本为<strong>累计</strong>值，不是单笔或单日。滑点口径 {text(strategy.costs.slippage_kind) || UNAVAILABLE}：
              来自固定模型，不是观察到的真实成交价差；状态 {text(strategy.costs.status) || UNAVAILABLE}。市场冲击未建模。
            </Caveat>
          </>
        ) : (
          <Caveat>该策略的导出不含人民币成本拆解（归一化口径），此处不以 0 代替。</Caveat>
        )}
      </Panel>

      <Panel title="回撤区段" en="Drawdown episodes from running peak">
        {strategy.drawdown ? (
          <>
            <Metrics
              columns={3}
              items={[
                { label: '最大回撤', value: pctFraction(m.max_drawdown, 2, false) },
                { label: '最长回撤天数', value: `${int(strategy.drawdown.maximum_duration_calendar_days)} 天` },
                { label: '期末是否仍在水下', value: strategy.drawdown.terminal_underwater ? '是' : '否' },
              ]}
            />
            <TableScroll label="回撤区段表">
              <table className="tm-table">
                <caption className="tm-sr">{strategy.name} 回撤区段</caption>
                <thead>
                  <tr>
                    <th scope="col">高水位日</th>
                    <th scope="col">结束日</th>
                    <th scope="col" className="tm-num">自然日</th>
                    <th scope="col">是否恢复</th>
                  </tr>
                </thead>
                <tbody>
                  {strategy.drawdown.episodes.map((e, i) => (
                    <tr key={e.peak_date + i}>
                      <th scope="row">{e.peak_date}</th>
                      <td>{e.end_date}</td>
                      <td className="tm-num">{int(e.calendar_days)}</td>
                      <td>{e.recovered ? '已恢复' : <span className="tm-neg">未恢复（期末截尾）</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </>
        ) : (
          <Caveat>导出中没有回撤区段明细。</Caveat>
        )}
      </Panel>

      <Panel
        title="已平仓交易"
        en="Simulated closed positions, not broker executions"
        actions={<SearchBox value={tradeQuery} onChange={(v) => { setTradeQuery(v); setTradePage(0); }} label="搜索交易（代码或日期）" />}
      >
        {trades.length ? (
          <>
            <TableScroll label="已平仓交易表">
              <table className="tm-table">
                <caption className="tm-sr">{strategy.name} 已平仓交易明细</caption>
                <thead>
                  <tr>
                    <th scope="col">编号</th>
                    <th scope="col">代码</th>
                    <th scope="col">买入日</th>
                    <th scope="col">卖出日</th>
                    <th scope="col" className="tm-num">数量</th>
                    <th scope="col" className="tm-num">现金分红</th>
                    <th scope="col" className="tm-num">净损益</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTrades.map((t) => (
                    <tr key={t.id}>
                      <th scope="row">{t.id}</th>
                      <td>{t.ticker}</td>
                      <td>{t.entry_date}</td>
                      <td>{t.exit_date}</td>
                      <td className="tm-num">{int(t.quantity)}</td>
                      <td className="tm-num">{money(t.cash_distributions, strategy.currency)}</td>
                      <td className={'tm-num tm-' + (t.net_pnl < 0 ? 'neg' : 'pos')}>{money(t.net_pnl, strategy.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <Pager page={page} pageCount={pageCount} total={trades.length} onPage={setTradePage} unit="笔" />
            <p className="tm-foot">
              口径 SIMULATED_CLOSED_POSITION_NOT_BROKER_EXECUTION：模拟账本的已平仓记录，不是券商成交回报。
              期末未平仓的部分不在此表，见下方期末持仓与归因。
            </p>
          </>
        ) : (
          <Caveat>该策略导出中没有已平仓交易明细。</Caveat>
        )}
      </Panel>

      <Panel title="期末持仓" en="Terminal simulated holdings, historical valuation marks">
        {strategy.terminal_positions?.length ? (
          <>
            <TableScroll label="期末持仓表">
              <table className="tm-table">
                <caption className="tm-sr">{strategy.name} 期末模拟持仓</caption>
                <thead>
                  <tr>
                    <th scope="col">代码</th>
                    <th scope="col" className="tm-num">股数</th>
                    <th scope="col" className="tm-num">市值</th>
                    <th scope="col" className="tm-num">占净值</th>
                    <th scope="col">估值日</th>
                  </tr>
                </thead>
                <tbody>
                  {strategy.terminal_positions.map((p) => (
                    <tr key={p.ticker}>
                      <th scope="row">{p.ticker}</th>
                      <td className="tm-num">{int(p.quantity)}</td>
                      <td className="tm-num">{money(p.market_value, strategy.currency)}</td>
                      <td className="tm-num">{pctFraction(p.weight, 2, false)}</td>
                      <td>{p.as_of}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <Caveat>
              期末持仓为<strong>历史模拟</strong>结果，不是券商官方持仓快照，也不是当前仓位。未强制平仓，部分估值沿用旧价。
            </Caveat>
          </>
        ) : (
          <Caveat>该策略期末没有未平仓头寸，或导出中未提供持仓明细。</Caveat>
        )}
      </Panel>

      <Panel title="归因与稳健性" en="Attribution, stress variants and capacity">
        {strategy.attribution ? (
          <>
            <Metrics
              columns={4}
              items={[
                { label: '归因状态', value: strategy.attribution.status },
                { label: '已平仓现金净损益', value: money(strategy.attribution.closed_positions_net_pnl, strategy.currency) },
                { label: '未平仓及余项', value: money(strategy.attribution.open_positions_and_residual_pnl, strategy.currency) },
                { label: '未平仓价格损益', value: isNum(strategy.attribution.open_price_pnl) ? money(strategy.attribution.open_price_pnl, strategy.currency) : UNAVAILABLE },
              ]}
            />
            <p className="tm-foot">{strategy.attribution.note}</p>
            <Caveat>
              因子归因与行业归因均为 null，未接入；不以任何方式推测归因结构。
            </Caveat>
          </>
        ) : (
          <Caveat>该策略导出中没有归因块。</Caveat>
        )}

        <h3 className="tm-subhead">稳健性变体</h3>
        {strategy.robustness?.length ? (
          <TableScroll label="稳健性变体表">
            <table className="tm-table">
              <caption className="tm-sr">{strategy.name} 稳健性重模拟结果</caption>
              <thead>
                <tr>
                  <th scope="col">变体</th>
                  <th scope="col" className="tm-num">期末净值</th>
                  <th scope="col" className="tm-num">净收益率</th>
                  <th scope="col">方法</th>
                  <th scope="col">状态</th>
                </tr>
              </thead>
              <tbody>
                {strategy.robustness.map((r, i) => (
                  <tr key={r.name + i}>
                    <th scope="row">{r.name}</th>
                    <td className="tm-num">{capital ? money(r.final_nav, strategy.currency) : dec(r.final_nav, 4)}</td>
                    <td className="tm-num">{pctFraction(r.net_return)}</td>
                    <td className="tm-small">{text(r.method) || UNAVAILABLE}</td>
                    <td className="tm-small">{text(r.status) || text(r.note) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : (
          <Caveat>该策略没有导出稳健性变体。</Caveat>
        )}

        <h3 className="tm-subhead">容量</h3>
        <Metrics
          columns={3}
          items={[
            { label: '容量状态', value: <StatusPill value={strategy.capacity?.status} /> },
            { label: '估算容量（人民币）', value: isNum(strategy.capacity?.estimated_cny) ? money(strategy.capacity?.estimated_cny, 'CNY') : UNAVAILABLE },
            { label: '行业暴露', value: strategy.industry_exposure?.status ?? UNAVAILABLE },
          ]}
        />
        <p className="tm-foot">
          {strategy.capacity?.note ?? ''} {strategy.industry_exposure?.reason ?? ''}
        </p>
      </Panel>

      <Panel title="局限与口径" en="Declared limitations from the export">
        <Bullets items={strategy.limitations} empty="导出中没有列出局限。" />
        <Disclosure summary="指标定义（来自导出的 metric_definitions）">
          <dl className="tm-defs">
            {Object.entries(analytics?.metric_definitions ?? {}).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Disclosure>
      </Panel>

      <Panel title="策略对照" en="Side-by-side comparison; windows and units differ">
        <Caveat>
          各策略的<strong>区间、执行时钟与资金口径都不同</strong>，下表按原样并列，<strong>不按期末净值排名</strong>。
          Gen2 只有归一化单位，没有人民币金额，空列即为不可得。
        </Caveat>
        <TableScroll label="策略对照表">
          <table className="tm-table">
            <caption className="tm-sr">五个策略的区间、口径与指标对照，不构成排名</caption>
            <thead>
              <tr>
                <th scope="col">策略</th>
                <th scope="col">区间</th>
                <th scope="col">资金口径</th>
                <th scope="col" className="tm-num">期末净值</th>
                <th scope="col" className="tm-num">净收益率</th>
                <th scope="col" className="tm-num">CAGR</th>
                <th scope="col" className="tm-num">最大回撤</th>
                <th scope="col" className="tm-num">Sharpe</th>
                <th scope="col" className="tm-num">已平仓</th>
                <th scope="col">状态</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => {
                const cap = isCapitalBasis(s);
                return (
                  <tr key={s.id} className={s.id === strategyId ? 'is-current' : undefined}>
                    <th scope="row">
                      <button type="button" className="tm-link" onClick={() => onStrategy(s.id)}>
                        {s.name}
                      </button>
                    </th>
                    <td className="tm-small">
                      {s.period?.[0]} — {s.period?.[1]}
                    </td>
                    <td className="tm-small">{basisLabel(s)}</td>
                    <td className="tm-num">
                      {cap ? money(s.metrics?.final_nav, s.currency) : `${dec(s.metrics?.normalized_final_units, 4)} 单位`}
                    </td>
                    <td className="tm-num">{pctFraction(s.metrics?.net_return)}</td>
                    <td className="tm-num">{pctFraction(s.metrics?.cagr)}</td>
                    <td className="tm-num">{pctFraction(s.metrics?.max_drawdown, 2, false)}</td>
                    <td className="tm-num">{ratio(s.metrics?.sharpe)}</td>
                    <td className="tm-num">{int(s.metrics?.trades)}</td>
                    <td>
                      <StatusPill value={s.status} onClick={() => onRoute('evidence')} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </Panel>
    </div>
  );
}
