'use client';
/** HHH 研究终端 — 研究证据 Evidence */
import { useMemo, useState } from 'react';
import { Database, ExternalLink } from 'lucide-react';
import {
  Bullets,
  Caveat,
  Disclosure,
  Metrics,
  Panel,
  Pill,
  SearchBox,
  Select,
  StatusPill,
  TableScroll,
} from '@/components/hhh-ui';
import {
  analytics,
  day,
  industry,
  industrySources,
  int,
  quantLab,
  stampUtc,
  strategies,
  text,
  textOr,
} from '@/components/hhh-data';

export default function Evidence() {
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('all');

  const grades = useMemo(() => {
    const set = new Set<string>();
    for (const s of industrySources) if (text(s.evidence_grade)) set.add(s.evidence_grade as string);
    return [...set].sort();
  }, []);

  const sources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return industrySources.filter((s) => {
      if (grade !== 'all' && s.evidence_grade !== grade) return false;
      if (!q) return true;
      return [s.id, s.title, s.url, s.path, s.verification, s.evidence_grade, s.scope]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
        .includes(q);
    });
  }, [query, grade]);

  const ca = quantLab?.corporate_actions;
  const pitCount = industrySources.filter((s) => s.pit_eligible === true).length;
  const datedCount = industrySources.filter((s) => text(s.published_at)).length;

  return (
    <div className="tm-module">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <h2 className="tm-strip-title">研究证据与局限</h2>
          <Pill tone="warn">非归档 PIT</Pill>
          <Pill tone="flag">尚未经过独立审计</Pill>
          <Pill tone="mute">只读 · 无凭据 · 无账户</Pill>
        </div>
        <p className="tm-strip-note">
          本页列出两个数据文件的全部来源、覆盖率、状态与可复现命令。
          <strong>所有内容为自研实现方的自述，不是独立审计结论</strong>；任何“通过”都需要外部复核。
        </p>
      </div>

      <Panel title="覆盖率概览" en="Coverage of both exported datasets">
        <Metrics
          columns={6}
          items={[
            { label: '产业来源条目', value: int(industrySources.length) },
            { label: '其中含发布日期', value: `${int(datedCount)} / ${int(industrySources.length)}` },
            { label: '可用于 PIT 的来源', value: `${int(pitCount)} / ${int(industrySources.length)}` },
            { label: '产业环节节点', value: int(industry?.stats?.layer_count) },
            { label: '公司条目', value: int(industry?.stats?.company_count) },
            { label: '含财务的公司', value: `${int(industry?.stats?.financial_count)} / ${int(industry?.stats?.company_count)}` },
            { label: '主题数', value: int(industry?.stats?.theme_count) },
            { label: '已填估值字段', value: int(industry?.stats?.valuation_count) },
            { label: '策略条目', value: int(strategies.length) },
            { label: '账本来源文件', value: int(analytics?.sources?.length) },
            { label: '产业数据截至', value: day(industry?.as_of) },
            { label: '账本导出时间', value: stampUtc(analytics?.generated_at) },
          ]}
        />
        <Caveat>
          <strong>快照日与估值日不同。</strong>composite 账本数据截至 {day(strategies.find((s) => s.id === 'composite')?.data_as_of)}，
          而本快照导出于 {stampUtc(analytics?.generated_at)}。导出时间新并不代表账本推进到了该日期。
          产业数据状态：{textOr(industry?.data_status)}。
        </Caveat>
      </Panel>

      <Panel title="公司行动解析队列" en="Corporate action queue; unresolved rows have zero consumed impact">
        {ca ? (
          <>
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
            <p className="tm-foot">{ca.note}</p>
            <Caveat>
              {int(ca.unresolved)} 条未解决事件对当前已消费路径的影响行数为 {int(ca.actual_ledger_or_feature_impact_rows)}，
              但这<strong>不等于</strong>它们永远无害；换窗口或换特征后必须重新核对。
            </Caveat>
          </>
        ) : (
          <Caveat>导出中没有公司行动队列。</Caveat>
        )}
      </Panel>

      <Panel title="策略局限与陈旧标记" en="Per-strategy declared limitations and stale marks">
        <TableScroll label="策略证据状态表">
          <table className="tm-table">
            <caption className="tm-sr">各策略的证据状态、执行口径、数据截止与局限条数</caption>
            <thead>
              <tr>
                <th scope="col">策略</th>
                <th scope="col">来源状态</th>
                <th scope="col">证据状态</th>
                <th scope="col">执行口径</th>
                <th scope="col">数据截至</th>
                <th scope="col" className="tm-num">来源文件</th>
                <th scope="col" className="tm-num">局限</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.name}</th>
                  <td>
                    <StatusPill value={s.source_status ?? s.status} />
                  </td>
                  <td>
                    <StatusPill value={s.evidence_status} />
                  </td>
                  <td className="tm-small">{textOr(s.execution)}</td>
                  <td>{day(s.data_as_of)}</td>
                  <td className="tm-num">{int(s.source_ids?.length ?? 0)}</td>
                  <td className="tm-num">{int(s.limitations?.length ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        {strategies.map((s) => (
          <Disclosure key={s.id} summary={`${s.name} — 局限清单（${s.limitations?.length ?? 0} 条）`}>
            <Bullets items={s.limitations} />
            {s.id === 'composite' ? (
              <Caveat>
                其中 20_STALE_VALUATION_MARKS 与 20_TERMINAL_POSITIONS_NOT_LIQUIDATED 表示：期末 20 个持仓未强制平仓，
                其估值沿用旧价。期末净值因此含有未实现、未成交的部分。
              </Caveat>
            ) : null}
          </Disclosure>
        ))}
      </Panel>

      <Panel
        title="产业证据来源"
        en="Industry source register with verification state and dates"
        actions={
          <div className="tm-filterbar">
            <Select
              label="证据等级"
              value={grade}
              onChange={setGrade}
              options={[{ value: 'all', label: '全部等级' }, ...grades.map((g) => ({ value: g, label: g }))]}
            />
            <SearchBox value={query} onChange={setQuery} label="搜索来源（标题、ID、链接或口径）" />
          </div>
        }
      >
        <p className="tm-foot" aria-live="polite">
          命中 {sources.length} / {industrySources.length} 条来源。
        </p>
        <TableScroll label="产业证据来源表">
          <table className="tm-table">
            <caption className="tm-sr">
              产业证据来源：ID、标题、链接或本地路径、发布日期、最后核对日期、核验方式、证据等级、PIT 可用性与口径说明
            </caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">标题 / 链接</th>
                <th scope="col">发布日期</th>
                <th scope="col">最后核对</th>
                <th scope="col">核验方式</th>
                <th scope="col">证据等级</th>
                <th scope="col">PIT</th>
                <th scope="col">口径说明</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="tm-mono">{s.id}</th>
                  <td>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="tm-extlink">
                        {s.title}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    ) : (
                      <span>
                        {s.title}
                        {s.path ? <span className="tm-mono tm-small"> · {s.path}</span> : null}
                      </span>
                    )}
                    {s.document_locator ? <div className="tm-small tm-muted">{s.document_locator}</div> : null}
                  </td>
                  <td className="tm-small">{s.published_at ? s.published_at.slice(0, 10) : <span className="tm-neg">无日期</span>}</td>
                  <td className="tm-small">{textOr(s.last_verified, '—')}</td>
                  <td>
                    <StatusPill value={s.verification} />
                  </td>
                  <td className="tm-small">{textOr(s.evidence_grade, '—')}</td>
                  <td className="tm-small">{s.pit_eligible ? '可用' : <span className="tm-neg">不可用</span>}</td>
                  <td className="tm-small">{textOr(s.scope ?? s.verification_note, '—')}</td>
                </tr>
              ))}
              {!sources.length ? (
                <tr>
                  <td colSpan={8} className="tm-empty">没有匹配的来源。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
        <Caveat>
          标记为「无日期」的官方产品页只能证明<strong>当前</strong>技术定位，不能用于历史 PIT 回测；
          不要把它们当成某个过去时点的已知信息。
        </Caveat>
      </Panel>

      <Panel title="账本来源文件与哈希" en="Ledger source files with SHA256 recorded at export time">
        <TableScroll label="账本来源文件表">
          <table className="tm-table">
            <caption className="tm-sr">portfolio-analytics.json 引用的源文件路径与导出时记录的 SHA256</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">路径</th>
                <th scope="col">SHA256（导出时记录）</th>
              </tr>
            </thead>
            <tbody>
              {(analytics?.sources ?? []).map((s) => (
                <tr key={s.id}>
                  <th scope="row" className="tm-mono">{s.id}</th>
                  <td className="tm-mono tm-small">{s.path}</td>
                  <td className="tm-mono tm-small tm-hash">{s.sha256}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        <p className="tm-foot">
          导出脚本在写出前重新校验过每个源文件的哈希（SOURCE_CHANGED_DURING_EXPORT 保护）。
          这些是<strong>本地研究产物</strong>路径，不含任何凭据、账户号或私有券商数据。
        </p>
      </Panel>

      <Panel title="可复现命令与输入指纹" en="Reproduction commands and input fingerprints">
        <Metrics
          columns={3}
          items={[
            { label: '产业导出命令', value: <code className="tm-mono">{textOr(industry?.reproduction_command)}</code> },
            { label: '账本导出脚本', value: <code className="tm-mono">scripts/export_hhh_workbench_analytics.py</code> },
            { label: '数据契约版本', value: `industry v${int(industry?.data_contract_version ?? industry?.schema_version)} · analytics v${int(analytics?.version)}` },
          ]}
        />
        {industry?.input_fingerprints?.length ? (
          <TableScroll label="产业输入指纹表">
            <table className="tm-table">
              <caption className="tm-sr">产业导出的输入文件与 SHA256</caption>
              <thead>
                <tr>
                  <th scope="col">输入文件</th>
                  <th scope="col">SHA256</th>
                </tr>
              </thead>
              <tbody>
                {industry.input_fingerprints.map((f) => (
                  <tr key={f.path}>
                    <th scope="row" className="tm-mono tm-small">{f.path}</th>
                    <td className="tm-mono tm-small tm-hash">{f.sha256}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : null}
      </Panel>

      <Panel title="方法与研究假设" en="Method notes and falsifiable hypotheses">
        <h4 className="tm-subhead">产业研究方法</h4>
        <Bullets items={industry?.method} />
        <p className="tm-foot">{textOr(industry?.coverage_note)}</p>
        <h4 className="tm-subhead">结论与假设</h4>
        {(industry?.conclusions ?? []).length ? (
          <div className="tm-conclusions">
            {industry.conclusions.map((c, i) => (
              <article key={c.title + i}>
                <h5>
                  {c.title}
                  <Pill tone={c.type === 'risk' ? 'flag' : 'info'}>{c.type}</Pill>
                </h5>
                <p>{c.body}</p>
                <p className="tm-small tm-muted">
                  来源：{c.source_ids?.length ? c.source_ids.join(', ') : '无关联来源'}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <Caveat>没有登记结论条目。</Caveat>
        )}
      </Panel>

      <Panel title="审计与边界声明" en="Audit status and hard boundaries">
        <Bullets
          items={[
            '本页与整个终端由实现方自述，不是独立审计；同上下文自评不得冒充第三方红队结论。',
            '所有策略结果为历史模拟，不是实盘账户净值；没有任何下单、改单或转账能力。',
            `live_ordering = ${String(analytics?.live_ordering)}；本次会话新回测 ${int(quantLab?.new_research_runs)} 次、新下载 ${int(quantLab?.new_downloads)} 次。`,
            '账本使用当前供应商历史版本，不是完整的公告点时（archival PIT）档案；开发期历史已暴露，不是全新盲测。',
            '产业页的产品页来源多数无发布日期，只能证明当前定位；上下游关系是技术依赖，不是已证实的客户、合同或供货份额。',
            '估值字段全部为空并给出原因；没有价格与一致预期时，不生成便宜 / 合理 / 昂贵 / 买入标签。',
            '本页不读取、不显示任何凭据、账户号、持仓快照或私有券商数据。',
          ]}
        />
      </Panel>

      <Panel title="下载原始数据" en="Download the exported JSON used by this page">
        <div className="tm-downloads">
          <a className="tm-download" href="portfolio-analytics.json" download="HHH-portfolio-analytics.json">
            <Database size={15} aria-hidden="true" />
            portfolio-analytics.json（策略账本导出）
          </a>
          <a className="tm-download" href="industry-research.json" download="HHH-industry-research.json">
            <Database size={15} aria-hidden="true" />
            industry-research.json（产业研究导出）
          </a>
          <a className="tm-download" href="research.json" download="HHH-research.json">
            <Database size={15} aria-hidden="true" />
            research.json（旧版研究曲线）
          </a>
        </div>
        <p className="tm-foot">
          下载的是本站 public/ 目录下的同源 JSON 文件，内容与页面显示完全一致，不含任何凭据。
        </p>
      </Panel>
    </div>
  );
}
