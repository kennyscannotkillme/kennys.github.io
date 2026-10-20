'use client';
/** HHH 研究终端 — 总览 Dashboard */
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
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
  Caveat,
  Metrics,
  Panel,
  StatusPill,
  TableScroll,
} from '@/components/hhh-ui';
import {
  UNAVAILABLE,
  analytics,
  basisLabel,
  day,
  dec,
  industry,
  int,
  isCapitalBasis,
  isNum,
  money,
  pctFraction,
  points,
  ratio,
  stampUtc,
  strategies,
  type Strategy,
} from '@/components/hhh-data';

export default function Dashboard({
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

  if (!strategy) {
    return <Caveat>未能从 public/portfolio-analytics.json 读取到任何策略。</Caveat>;
  }

  const m = strategy.metrics ?? ({} as Strategy['metrics']);
  const capital = isCapitalBasis(strategy);
  const effectiveMode = modeAvailable(strategy, mode) ? mode : firstAvailableMode(strategy, mode);
  const switched = effectiveMode !== mode;

  return (
    <div className="tm-module">
      {/* 顶部：策略选择 + 口径标注 */}
      <div className="tm-strip">
        <div className="tm-strip-main">
          <label className="tm-strip-label" htmlFor="dash-strategy">
            策略
          </label>
          <select
            id="dash-strategy"
            className="tm-strip-select"
            value={strategyId}
            onChange={(e) => onStrategy(e.target.value)}
          >
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}（{s.period?.[0]} — {s.period?.[1]}）
              </option>
            ))}
          </select>
          <StatusPill value={strategy.status} onClick={() => onRoute('evidence')} />
          <StatusPill value={strategy.evidence_status} onClick={() => onRoute('evidence')} />
        </div>
        <dl className="tm-strip-dates">
          <div>
            <dt>来源数据截至</dt>
            <dd>{day(strategy.data_as_of)}</dd>
          </div>
          <div>
            <dt>本页导出于</dt>
            <dd>{stampUtc(analytics?.generated_at)}</dd>
          </div>
          <div>
            <dt>产业数据截至</dt>
            <dd>{day(industry?.as_of)}</dd>
          </div>
        </dl>
      </div>

      {/* 两张大白卡 */}
      {capital ? (
        <div className="tm-money-row">
          <article className="tm-money-card">
            <h3>策略期末净值 / 元</h3>
            <p className="tm-money-value">{money(m.final_nav, strategy.currency)}</p>
            <dl className="tm-money-meta">
              <div>
                <dt>起始本金</dt>
                <dd>{money(m.initial_nav, strategy.currency)}</dd>
              </div>
              <div>
                <dt>净利润</dt>
                <dd className={'tm-' + (isNum(m.profit_cny) && m.profit_cny < 0 ? 'neg' : 'pos')}>
                  {isNum(m.profit_cny) ? (m.profit_cny > 0 ? '+' : '') + money(m.profit_cny, strategy.currency) : UNAVAILABLE}
                </dd>
              </div>
              <div>
                <dt>净收益率（已扣费）</dt>
                <dd className={'tm-' + (isNum(m.net_return) && m.net_return < 0 ? 'neg' : 'pos')}>
                  {pctFraction(m.net_return)}
                </dd>
              </div>
            </dl>
            <p className="tm-money-foot">
              {strategy.name} · {basisLabel(strategy)} · 区间 {strategy.period?.[0]} — {strategy.period?.[1]}
            </p>
          </article>

          <article className="tm-money-card is-benchmark">
            <h3>基准期末参考值 / 元</h3>
            <p className="tm-money-value">{money(m.benchmark_final_nav, strategy.currency)}</p>
            <dl className="tm-money-meta">
              <div>
                <dt>同期基准收益</dt>
                <dd>{pctFraction(m.benchmark_return)}</dd>
              </div>
              <div>
                <dt>累计收益差</dt>
                <dd className="tm-neg">
                  {isNum(m.net_return) && isNum(m.benchmark_return)
                    ? points(strategy.curve?.[strategy.curve.length - 1]?.relative_return)
                    : UNAVAILABLE}
                </dd>
              </div>
              <div>
                <dt>现金暴露匹配基准</dt>
                <dd>{money(m.matched_benchmark_final_nav, strategy.currency)}</dd>
              </div>
            </dl>
            <p className="tm-money-foot">
              {strategy.benchmark?.name ?? UNAVAILABLE}（{strategy.benchmark?.id ?? UNAVAILABLE}）· 价格指数，不可直接投资、无载体费用。
            </p>
          </article>
        </div>
      ) : (
        <div className="tm-money-row">
          <article className="tm-money-card">
            <h3>归一化组合单位</h3>
            <p className="tm-money-value">
              {dec(m.normalized_initial_units, 4)} → {dec(m.normalized_final_units, 4)}
            </p>
            <dl className="tm-money-meta">
              <div>
                <dt>净收益率</dt>
                <dd className={'tm-' + (isNum(m.net_return) && m.net_return < 0 ? 'neg' : 'pos')}>
                  {pctFraction(m.net_return)}
                </dd>
              </div>
              <div>
                <dt>年化（CAGR）</dt>
                <dd>{pctFraction(m.cagr)}</dd>
              </div>
              <div>
                <dt>人民币金额</dt>
                <dd className="tm-muted">{UNAVAILABLE}</dd>
              </div>
            </dl>
            <p className="tm-money-foot">
              {strategy.name} · {basisLabel(strategy)} · 区间 {strategy.period?.[0]} — {strategy.period?.[1]}
            </p>
          </article>
          <article className="tm-money-card is-benchmark">
            <h3>同期基准（归一化）</h3>
            <p className="tm-money-value">{pctFraction(m.benchmark_return)}</p>
            <dl className="tm-money-meta">
              <div>
                <dt>累计收益差</dt>
                <dd>{points(strategy.curve?.[strategy.curve.length - 1]?.relative_return)}</dd>
              </div>
              <div>
                <dt>最大回撤</dt>
                <dd className="tm-neg">{pctFraction(m.max_drawdown, 2, false)}</dd>
              </div>
              <div>
                <dt>基准期末金额</dt>
                <dd className="tm-muted">{UNAVAILABLE}</dd>
              </div>
            </dl>
            <p className="tm-money-foot">没有可核对的原始人民币资金账本，因此不金额化，也不反推起始本金。</p>
          </article>
        </div>
      )}

      {/* 主图 */}
      <Panel
        title="策略与基准曲线"
        en="Strategy versus same-initial-capital benchmark"
        actions={<ChartModeBar strategy={strategy} mode={effectiveMode} onMode={setMode} />}
      >
        {switched ? <Caveat>{modeUnavailableReason(strategy, mode)}</Caveat> : null}
        <StrategyChart strategy={strategy} mode={effectiveMode} height={310} />
        <ChartFootnote strategy={strategy} mode={effectiveMode} />
      </Panel>

      {/* 小指标 */}
      <Panel title="核心指标" en="Headline metrics, all precomputed in Python" dense>
        <Metrics
          columns={6}
          items={[
            { label: '年化 CAGR', value: pctFraction(m.cagr), en: analytics?.metric_definitions?.cagr },
            { label: '最大回撤', value: pctFraction(m.max_drawdown, 2, false) },
            { label: '回撤最长天数', value: isNum(m.drawdown_duration_days) ? `${int(m.drawdown_duration_days)} 天` : UNAVAILABLE },
            { label: 'Sharpe', value: ratio(m.sharpe), en: analytics?.metric_definitions?.sharpe },
            { label: 'Sortino', value: ratio(m.sortino), en: analytics?.metric_definitions?.sortino },
            { label: '盈利因子 Profit Factor', value: ratio(m.profit_factor), en: analytics?.metric_definitions?.profit_factor },
            { label: '胜率', value: pctFraction(m.win_rate, 2, false), en: analytics?.metric_definitions?.win_rate },
            { label: '平均盈亏比', value: ratio(m.payoff_ratio) },
            { label: '已平仓笔数', value: int(m.trades) },
            { label: '总成本', value: capital ? money(m.total_cost, strategy.currency) : UNAVAILABLE },
            { label: '双边换手', value: ratio(m.turnover_two_way), en: analytics?.metric_definitions?.turnover_two_way },
            { label: '平均仓位', value: pctFraction(m.mean_position_weight, 2, false) },
          ]}
        />
      </Panel>

      {/* 年度结果 */}
      <Panel title="年度结果" en="Yearly results from the exported ledger">
        <TableScroll label="年度结果表">
          <table className="tm-table">
            <caption className="tm-sr">
              {strategy.name} 年度结果：期初、期末、利润、收益率与同期基准收益率
            </caption>
            <thead>
              <tr>
                <th scope="col">年度</th>
                <th scope="col">区间</th>
                <th scope="col" className="tm-num">
                  {capital ? '期初净值' : '期初单位'}
                </th>
                <th scope="col" className="tm-num">
                  {capital ? '期末净值' : '期末单位'}
                </th>
                <th scope="col" className="tm-num">
                  {capital ? '利润' : '单位变动'}
                </th>
                <th scope="col" className="tm-num">
                  策略收益
                </th>
                <th scope="col" className="tm-num">
                  基准收益
                </th>
              </tr>
            </thead>
            <tbody>
              {(strategy.years ?? []).map((y) => (
                <tr key={y.period}>
                  <th scope="row">
                    {y.period}
                    {y.partial_period ? <span className="tm-flagtext">不完整</span> : null}
                  </th>
                  <td>
                    {y.first_date} — {y.last_date}
                  </td>
                  <td className="tm-num">{capital ? money(y.start_nav, strategy.currency) : dec(y.start_nav, 4)}</td>
                  <td className="tm-num">{capital ? money(y.final_nav, strategy.currency) : dec(y.final_nav, 4)}</td>
                  <td className={'tm-num tm-' + (y.profit < 0 ? 'neg' : 'pos')}>
                    {capital ? (y.profit > 0 ? '+' : '') + money(y.profit, strategy.currency) : dec(y.profit, 4)}
                  </td>
                  <td className={'tm-num tm-' + (y.return < 0 ? 'neg' : 'pos')}>{pctFraction(y.return)}</td>
                  <td className="tm-num">{pctFraction(y.benchmark_return)}</td>
                </tr>
              ))}
              {!(strategy.years ?? []).length ? (
                <tr>
                  <td colSpan={7} className="tm-empty">
                    导出中没有年度分组。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
        <p className="tm-foot">{analytics?.metric_definitions?.months}</p>
      </Panel>

      <div className="tm-jump">
        <button type="button" className="tm-link" onClick={() => onRoute('portfolio')}>
          查看完整策略表现（交易、持仓、成本、稳健性）
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="tm-link" onClick={() => onRoute('industry')}>
          查看产业全景
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
        <button type="button" className="tm-link" onClick={() => onRoute('evidence')}>
          查看研究证据与局限
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
