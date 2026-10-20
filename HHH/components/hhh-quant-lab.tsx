'use client';
/** HHH 研究终端 — 量化研究 Quant Lab（只读研究记录，没有训练/重跑入口） */
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  Bullets,
  Caveat,
  Disclosure,
  Metrics,
  Panel,
  Pill,
  StatusPill,
  TableScroll,
} from '@/components/hhh-ui';
import {
  UNAVAILABLE,
  analytics,
  analyticsSourceById,
  basisLabel,
  dec,
  int,
  isCapitalBasis,
  isNum,
  money,
  pctFraction,
  quantLab,
  ratio,
  strategies,
  strategyById,
  text,
} from '@/components/hhh-data';

export default function QuantLab({
  strategyId,
  onStrategy,
  onRoute,
}: {
  strategyId: string;
  onStrategy: (id: string) => void;
  onRoute: (r: string) => void;
}) {
  const [watchIndex, setWatchIndex] = useState(0);

  if (!quantLab) return <Caveat>导出中没有 quant_lab 区块。</Caveat>;

  const watchlists = Array.isArray(quantLab.forward_watchlists) ? quantLab.forward_watchlists : [];
  const watch = watchlists[Math.min(watchIndex, Math.max(0, watchlists.length - 1))] ?? null;
  const ca = quantLab.corporate_actions;

  function openStrategy(id: string) {
    onStrategy(id);
    onRoute('portfolio');
  }

  return (
    <div className="tm-module">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <h2 className="tm-strip-title">量化研究实验室</h2>
          <Pill tone="warn">RESEARCH_ONLY · 研究用途</Pill>
          <Pill tone="flag">未获准实盘</Pill>
          <Pill tone="mute">本次新回测 {int(quantLab.new_research_runs)} 次 · 新下载 {int(quantLab.new_downloads)} 次</Pill>
        </div>
        <p className="tm-strip-note">
          本页只读展示既有实验记录，<strong>没有任何训练、重跑、调参或下单控件</strong>。
          live_ordering = {String(quantLab.live_ordering)}。
        </p>
      </div>

      <Panel title="因子与组合规则" en="Factor definitions and weighting; no new fit">
        <TableScroll label="因子表">
          <table className="tm-table">
            <caption className="tm-sr">因子定义、公式与机制说明</caption>
            <thead>
              <tr>
                <th scope="col">因子</th>
                <th scope="col">公式</th>
                <th scope="col">机制说明</th>
              </tr>
            </thead>
            <tbody>
              {quantLab.factors.map((f) => (
                <tr key={f.id}>
                  <th scope="row">{f.name}</th>
                  <td className="tm-mono">{f.formula}</td>
                  <td>{f.mechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="tm-foot">加权方式：{quantLab.factor_weighting}（等权百分位，未做新的拟合）。</p>
      </Panel>

      <Panel title="实验卡片" en="Experiment cards; open a card to see its full ledger">
        <div className="tm-cards">
          {quantLab.experiments.map((exp) => {
            const s = strategies.find((x) => x.id === exp.id) ?? null;
            const cap = isCapitalBasis(s);
            return (
              <article className="tm-card" key={exp.id}>
                <header className="tm-card-head">
                  <h3>{exp.name}</h3>
                  <StatusPill value={exp.status} onClick={() => onRoute('evidence')} />
                </header>
                <p className="tm-card-mech">{exp.mechanism}</p>
                <dl className="tm-card-meta">
                  <div>
                    <dt>区间</dt>
                    <dd>
                      {exp.period?.[0]} — {exp.period?.[1]}
                    </dd>
                  </div>
                  <div>
                    <dt>口径</dt>
                    <dd>{basisLabel(s)}</dd>
                  </div>
                  <div>
                    <dt>净收益率</dt>
                    <dd className={isNum(s?.metrics?.net_return) && s!.metrics.net_return! < 0 ? 'tm-neg' : 'tm-pos'}>
                      {pctFraction(s?.metrics?.net_return)}
                    </dd>
                  </div>
                  <div>
                    <dt>最大回撤</dt>
                    <dd className="tm-neg">{pctFraction(s?.metrics?.max_drawdown, 2, false)}</dd>
                  </div>
                  <div>
                    <dt>Sharpe</dt>
                    <dd>{ratio(s?.metrics?.sharpe)}</dd>
                  </div>
                  <div>
                    <dt>已平仓</dt>
                    <dd>{int(s?.metrics?.trades)}</dd>
                  </div>
                  <div>
                    <dt>总成本</dt>
                    <dd>{cap ? money(s?.metrics?.total_cost, s?.currency) : UNAVAILABLE}</dd>
                  </div>
                  <div>
                    <dt>容量</dt>
                    <dd><StatusPill value={s?.capacity?.status ?? 'UNAVAILABLE'} /></dd>
                  </div>
                </dl>
                <footer className="tm-card-foot">
                  <button type="button" className="tm-link" onClick={() => openStrategy(exp.id)}>
                    打开完整策略表现
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </button>
                  <span className="tm-small">{exp.source_ids.length} 个来源文件</span>
                </footer>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="实验对照表" en="Experiment table with mechanism, status and sources">
        <TableScroll label="实验对照表">
          <table className="tm-table">
            <caption className="tm-sr">实验机制、状态、区间、稳健性与来源文件</caption>
            <thead>
              <tr>
                <th scope="col">实验</th>
                <th scope="col">机制</th>
                <th scope="col">区间</th>
                <th scope="col">状态</th>
                <th scope="col" className="tm-num">净收益</th>
                <th scope="col" className="tm-num">回撤</th>
                <th scope="col">稳健性变体</th>
                <th scope="col">容量</th>
                <th scope="col">来源</th>
              </tr>
            </thead>
            <tbody>
              {quantLab.experiments.map((exp) => {
                const s = strategies.find((x) => x.id === exp.id) ?? null;
                return (
                  <tr key={exp.id} className={exp.id === strategyId ? 'is-current' : undefined}>
                    <th scope="row">
                      <button type="button" className="tm-link" onClick={() => openStrategy(exp.id)}>
                        {exp.name}
                      </button>
                    </th>
                    <td className="tm-small">{exp.mechanism}</td>
                    <td className="tm-small">
                      {exp.period?.[0]} — {exp.period?.[1]}
                    </td>
                    <td>
                      <StatusPill value={exp.status} />
                    </td>
                    <td className="tm-num">{pctFraction(s?.metrics?.net_return)}</td>
                    <td className="tm-num">{pctFraction(s?.metrics?.max_drawdown, 2, false)}</td>
                    <td className="tm-small">
                      {s?.robustness?.length
                        ? s.robustness.map((r) => `${r.name} ${pctFraction(r.net_return)}`).join('；')
                        : UNAVAILABLE}
                    </td>
                    <td className="tm-small">{text(s?.capacity?.status) || UNAVAILABLE}</td>
                    <td className="tm-small">{exp.source_ids.join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableScroll>
      </Panel>

      <Panel
        title="前向观察名单"
        en="Historical forward watchlists; observations, not orders"
        actions={
          watchlists.length > 1 ? (
            <div className="tm-select">
              <label htmlFor="watch-pick">观察批次</label>
              <select id="watch-pick" value={String(watchIndex)} onChange={(e) => setWatchIndex(Number(e.target.value))}>
                {watchlists.map((w, i) => (
                  <option key={w.signal_date + i} value={String(i)}>
                    评分日 {w.signal_date} → 目标交易日 {w.intended_session}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
      >
        <Caveat>
          前向验证状态：<strong>{quantLab.forward_validation_status}</strong> —— 没有已完成的前向组合账本。
          名单是<strong>历史观察</strong>（freshness = {watch?.freshness ?? UNAVAILABLE}，scope = {watch?.scope ?? UNAVAILABLE}），
          不是当前信号，也不是下单指令；forward_performance 为 null，未回填实际表现。
        </Caveat>
        {watch ? (
          <>
            <Metrics
              columns={5}
              items={[
                { label: '状态', value: <StatusPill value={watch.status} /> },
                { label: '评分收盘日', value: watch.signal_date },
                { label: '目标交易日', value: watch.intended_session },
                { label: '风险开关', value: watch.risk_on ? '趋势条件满足' : '风控：不买入' },
                { label: '参与排序股票数', value: int(watch.eligible_ranked_count) },
              ]}
            />
            <p className="tm-foot">池内中位动量 {pctFraction(watch.breadth_median_momentum)}。评分不是上涨概率。</p>
            <TableScroll label="观察名单表">
              <table className="tm-table">
                <caption className="tm-sr">观察名单前若干名及其因子分位、参考收盘与风险标记</caption>
                <thead>
                  <tr>
                    <th scope="col">名次</th>
                    <th scope="col">代码</th>
                    <th scope="col">名称</th>
                    <th scope="col" className="tm-num">综合分</th>
                    <th scope="col" className="tm-num">动量</th>
                    <th scope="col" className="tm-num">PB</th>
                    <th scope="col" className="tm-num">波动</th>
                    <th scope="col" className="tm-num">趋势分位</th>
                    <th scope="col" className="tm-num">估值分位</th>
                    <th scope="col" className="tm-num">低波分位</th>
                    <th scope="col" className="tm-num">参考收盘</th>
                    <th scope="col">风险标记</th>
                  </tr>
                </thead>
                <tbody>
                  {watch.items.map((it) => (
                    <tr key={it.ticker}>
                      <th scope="row">{it.rank}</th>
                      <td>{it.ticker}</td>
                      <td>{it.name}</td>
                      <td className="tm-num">{ratio(it.score, 3)}</td>
                      <td className="tm-num">{pctFraction(it.momentum)}</td>
                      <td className="tm-num">{ratio(it.pb, 4)}</td>
                      <td className="tm-num">{ratio(it.volatility, 4)}</td>
                      <td className="tm-num">{ratio(it.trend_percentile, 3)}</td>
                      <td className="tm-num">{ratio(it.value_percentile, 3)}</td>
                      <td className="tm-num">{ratio(it.lowvol_percentile, 3)}</td>
                      <td className="tm-num">{isNum(it.reference_close) ? '¥' + dec(it.reference_close, 2) : UNAVAILABLE}</td>
                      <td className="tm-small tm-neg">{it.risk_flags.join('；')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            <p className="tm-foot">
              来源文件：{watch.source_id}（{analyticsSourceById.get(watch.source_id)?.path ?? UNAVAILABLE}）。
              参考收盘不是买入限价；开盘可成交性、停牌与涨跌停均未验证。
            </p>
          </>
        ) : (
          <Caveat>导出中没有前向观察名单。</Caveat>
        )}
      </Panel>

      <Panel title="公司行动队列" en="Corporate action resolution queue">
        <Metrics
          columns={5}
          items={[
            { label: '事件总数', value: int(ca.total) },
            { label: '已解决', value: int(ca.resolved) },
            { label: '未解决', value: <span className="tm-neg">{int(ca.unresolved)}</span> },
            { label: '影响已消费账本/特征的行数', value: int(ca.actual_ledger_or_feature_impact_rows) },
            { label: '状态', value: <StatusPill value={ca.status} /> },
          ]}
        />
        <TableScroll label="公司行动分类表">
          <table className="tm-table">
            <caption className="tm-sr">公司行动分类计数</caption>
            <thead>
              <tr>
                <th scope="col">分类</th>
                <th scope="col" className="tm-num">数量</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ca.classifications ?? {}).map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td className="tm-num">{int(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="tm-foot">
          {ca.note} 来源：{ca.source_id}（{analyticsSourceById.get(ca.source_id)?.path ?? UNAVAILABLE}）。
        </p>
      </Panel>

      <Panel title="风险、成本与容量汇总" en="Per-strategy risk, cost and capacity summary">
        <TableScroll label="风险成本容量汇总表">
          <table className="tm-table">
            <caption className="tm-sr">各策略的成本、换手、仓位、容量与局限条数</caption>
            <thead>
              <tr>
                <th scope="col">策略</th>
                <th scope="col" className="tm-num">总成本</th>
                <th scope="col" className="tm-num">双边换手</th>
                <th scope="col" className="tm-num">平均仓位</th>
                <th scope="col" className="tm-num">回撤天数</th>
                <th scope="col">容量状态</th>
                <th scope="col" className="tm-num">局限条数</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <button type="button" className="tm-link" onClick={() => openStrategy(s.id)}>
                      {s.name}
                    </button>
                  </th>
                  <td className="tm-num">{isCapitalBasis(s) ? money(s.metrics?.total_cost, s.currency) : UNAVAILABLE}</td>
                  <td className="tm-num">{ratio(s.metrics?.turnover_two_way)}</td>
                  <td className="tm-num">{pctFraction(s.metrics?.mean_position_weight, 2, false)}</td>
                  <td className="tm-num">{int(s.metrics?.drawdown_duration_days)}</td>
                  <td>
                    <StatusPill value={s.capacity?.status} />
                  </td>
                  <td className="tm-num">{int(s.limitations?.length ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <Disclosure summary="逐策略局限清单">
          {strategies.map((s) => (
            <div className="tm-limit-block" key={s.id}>
              <h4>{s.name}</h4>
              <Bullets items={s.limitations} />
            </div>
          ))}
        </Disclosure>
      </Panel>

      <Panel title="当前选中策略" en="Currently selected strategy across modules">
        <p className="tm-foot">
          模块之间共享同一个策略选择。当前为 <strong>{strategyById(strategyId)?.name ?? UNAVAILABLE}</strong>，
          切换后总览与策略表现同步更新。
        </p>
        <p className="tm-foot">
          本页所有数值来自 {analytics?.scope}，由 scripts/export_hhh_workbench_analytics.py 生成。
        </p>
      </Panel>
    </div>
  );
}
