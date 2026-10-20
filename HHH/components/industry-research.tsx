'use client';
/**
 * HHH 研究终端 — 产业全景 Industry
 *
 * 数据：public/industry-research.json（scripts/export_hhh_industry.py 生成）。
 * 本组件只做筛选、排序与格式化；不计算任何财务或经济指标。
 * 层号按主题（theme_layers）取值，不把全局节点数冒充某个行业的完整层数。
 */
import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, RotateCcw } from 'lucide-react';
import {
  Caveat,
  Disclosure,
  Panel,
  Pending,
  Pill,
  SearchBox,
  SortButton,
  StatusPill,
  TableScroll,
  type SortDir,
} from '@/components/hhh-ui';
import {
  UNAVAILABLE,
  companyByTicker,
  dec,
  industry,
  industrySourceById,
  int,
  isNum,
  layerById,
  layers,
  marketLabel,
  pctValue,
  text,
  textOr,
  themes,
  type Layer,
  type Theme,
} from '@/components/hhh-data';

const CUSTOM_KEY = 'hhh.industry.custom-themes.v1';

interface CustomTheme {
  id: string;
  name: string;
  layer_ids: string[];
}

type SortKey = 'layer' | 'name' | 'group' | 'market' | 'signal' | 'grade' | 'verified';

function readCustomThemes(): CustomTheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CUSTOM_KEY) ?? 'null');
    return Array.isArray(parsed) ? parsed.filter((t): t is CustomTheme =>
      !!t && typeof t === 'object' && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.layer_ids)) : [];
  } catch { return []; }
}

function layerOrder(code: string): number {
  const m = /^L(\d+)$/.exec(text(code));
  return m ? Number(m[1]) : 9999;
}

function layerCode(l: Layer, themeId: string): string {
  return text(l.theme_layers?.[themeId]) || text(l.layer) || UNAVAILABLE;
}

function marketsOf(l: Layer): string[] {
  return [...new Set((l.companies ?? []).map((c) => text(c.market)).filter(Boolean))];
}

export default function IndustryResearch({
  themeId,
  onTheme,
  onCompany,
  onRoute,
}: {
  themeId: string;
  onTheme: (id: string) => void;
  onCompany: (ticker: string) => void;
  onRoute: (r: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [market, setMarket] = useState(() => themes.find(t => t.id === themeId)?.default_market || 'ALL');
  const [grade, setGrade] = useState('all');
  const [signal, setSignal] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('layer');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [custom, setCustom] = useState<CustomTheme[]>(readCustomThemes);
  const [draftName, setDraftName] = useState('');
  const [draftLayers, setDraftLayers] = useState<string[]>([]);
  const [growth, setGrowth] = useState('');
  const [multiple, setMultiple] = useState('');

  function persist(next: CustomTheme[]) {
    setCustom(next);
    try {
      window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
    } catch {
      /* 浏览器拒绝存储时仅影响本地偏好 */
    }
  }

  const allThemes: (Theme & { custom?: boolean })[] = useMemo(
    () => [
      ...themes,
      ...custom.map((c) => ({
        id: c.id,
        name: c.name,
        layer_ids: c.layer_ids,
        description: '用户在本浏览器自建的分类视图；只是重新排列既有节点，不是新的证据或新的产业结论。',
        default_market: 'ALL',
        custom: true as const,
      })),
    ],
    [custom],
  );

  const theme = allThemes.find((t) => t.id === themeId) ?? allThemes[0] ?? null;

  const themeLayers = useMemo(() => {
    if (!theme) return [];
    const ids = Array.isArray(theme.layer_ids) ? theme.layer_ids : [];
    return ids.map((id) => layerById.get(id)).filter((l): l is Layer => !!l);
  }, [theme]);

  const marketOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of themeLayers) for (const mk of marketsOf(l)) set.add(mk);
    return [...set].sort();
  }, [themeLayers]);

  const gradeOptions = useMemo(() => [...new Set(themeLayers.map((l) => text(l.evidence_grade)).filter(Boolean))].sort(), [themeLayers]);
  const signalOptions = useMemo(() => [...new Set(themeLayers.map((l) => text(l.signal)).filter(Boolean))].sort(), [themeLayers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = themeLayers.filter((l) => {
      if (market !== 'ALL' && !marketsOf(l).includes(market)) return false;
      if (grade !== 'all' && l.evidence_grade !== grade) return false;
      if (signal !== 'all' && l.signal !== signal) return false;
      if (!q) return true;
      const hay = [
        l.id,
        l.name,
        l.group,
        l.role,
        l.supply_demand,
        l.bottleneck,
        l.watch,
        l.signal,
        l.evidence_grade,
        ...(l.catalysts ?? []),
        ...(l.risks ?? []),
        ...(l.companies ?? []).map((c) => `${c.ticker} ${c.name} ${c.market}`),
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const key = (l: Layer): string | number => {
      switch (sortKey) {
        case 'layer':
          return layerOrder(layerCode(l, theme?.id ?? ''));
        case 'name':
          return text(l.name);
        case 'group':
          return text(l.group);
        case 'market':
          return marketsOf(l).join(',');
        case 'signal':
          return text(l.signal);
        case 'grade':
          return text(l.evidence_grade);
        case 'verified':
          return text(l.last_verified);
        default:
          return 0;
      }
    };
    return [...filtered].sort((a, b) => {
      const ka = key(a);
      const kb = key(b);
      if (typeof ka === 'number' && typeof kb === 'number') return (ka - kb) * dir;
      return String(ka).localeCompare(String(kb), 'zh-CN') * dir;
    });
  }, [themeLayers, query, market, grade, signal, sortKey, sortDir, theme]);

  function sortBy(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(k);
      setSortDir('asc');
    }
  }

  function reset() {
    setQuery('');
    setMarket(theme?.default_market ?? 'ALL');
    setGrade('all');
    setSignal('all');
    setSortKey('layer');
    setSortDir('asc');
    setExpanded(null);
  }

  /* 估值情景：纯网格查找，前端不做任何乘除 */
  const scenario = industry?.scenario ?? null;
  const growthKey = growth || (scenario?.growth_rates?.length ? String(scenario.growth_rates[0]) : '');
  const multipleKey = multiple || (scenario?.multiple_changes?.length ? String(scenario.multiple_changes[0]) : '');
  const hit =
    scenario?.points?.find(
      (p) => String(p.growth_pct) === growthKey && String(p.multiple_change_pct) === multipleKey,
    ) ?? null;

  const head = (label: string, k: SortKey) => (
    <SortButton label={label} active={sortKey === k} dir={sortDir} onClick={() => sortBy(k)} />
  );

  return (
    <div className="tm-module ind-root">
      <div className="tm-strip">
        <div className="tm-strip-main">
          <h2 className="tm-strip-title">{textOr(industry?.title, '产业链全景')}</h2>
          <Pill tone="mute">{textOr(industry?.subtitle, '')}</Pill>
          <Pill tone="warn">数据截至 {textOr(industry?.as_of)}</Pill>
          <Pill tone="info">数据日期见各项来源</Pill>
        </div>
        <p className="tm-strip-note">
          共 {int(industry?.stats?.layer_count)} 个产业环节节点、{int(industry?.stats?.company_count)} 家公司、
          {int(industry?.stats?.theme_count)} 个主题。{textOr(industry?.coverage_note, '')}
        </p>
      </div>

      {/* 主题选择 */}
      <fieldset className="ind-themes" aria-label="主题选择">
        {allThemes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={'ind-theme' + (t.id === theme?.id ? ' is-active' : '') + (t.custom ? ' is-custom' : '')}
            aria-pressed={t.id === theme?.id}
            title={t.description}
            onClick={() => onTheme(t.id)}
          >
            <span>{t.name}</span>
            <small>{t.layer_ids.length} 节点</small>
          </button>
        ))}
      </fieldset>
      {theme ? <p className="tm-foot">{theme.description}</p> : null}
      {theme && (theme as { custom?: boolean }).custom ? (
        <Caveat>
          这是<strong>你在本浏览器自建</strong>的分类，只是把既有节点重新编组，<strong>不是新的证据、不是新的产业结论</strong>，
          也不会写入数据文件或与他人共享。
        </Caveat>
      ) : null}

      {/* 筛选条 */}
      <div className="ind-filters">
        <SearchBox value={query} onChange={setQuery} label="全局搜索（环节、公司、瓶颈、催化剂、风险）" />
        <div className="tm-select">
          <label htmlFor="ind-market">市场</label>
          <select id="ind-market" value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="ALL">全部市场</option>
            {marketOptions.map((mk) => (
              <option key={mk} value={mk}>
                {marketLabel(mk)}
              </option>
            ))}
          </select>
        </div>
        <div className="tm-select">
          <label htmlFor="ind-grade">证据等级</label>
          <select id="ind-grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="all">全部等级</option>
            {gradeOptions.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="tm-select">
          <label htmlFor="ind-signal">信号</label>
          <select id="ind-signal" value={signal} onChange={(e) => setSignal(e.target.value)}>
            <option value="all">全部信号</option>
            {signalOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="ind-reset" onClick={reset}>
          <RotateCcw size={13} aria-hidden="true" />
          重置筛选
        </button>
        <span className="ind-count" aria-live="polite">
          显示 {rows.length} / {themeLayers.length} 个节点
        </span>
        <a className="tm-link" href="./industry-panorama.csv" download>下载完整 CSV</a>
      </div>

      {/* 主表 */}
      <TableScroll label="产业链节点表，可横向滚动">
        <table className="ind-table">
          <colgroup>{[50,190,180,210,150,140,130,180,110,180,160,180,220,190,90,190,120].map((width,i)=><col key={i} style={{width}} />)}</colgroup>
          <caption className="tm-sr">
            {theme?.name ?? '产业'} 主题下的产业链节点：层号、环节、分组、代表公司、市场、角色、供需、瓶颈、观察、催化剂、风险、
            增长预期、信号、估值、证据等级与最后核对日期
          </caption>
          <thead>
            <tr>
              <th scope="col" className="ind-sticky ind-sticky-1">
                {head('层', 'layer')}
              </th>
              <th scope="col" className="ind-sticky ind-sticky-2">
                {head('产业环节', 'name')}
              </th>
              <th scope="col">核心瓶颈 / 观察</th>
              <th scope="col">代表公司</th>
              <th scope="col">估值 / 口径日期</th>
              <th scope="col">{head('信号', 'signal')}</th>
              <th scope="col">资料来源</th>
              <th scope="col">技术作用</th>
              <th scope="col">{head('市场', 'market')}</th>
              <th scope="col">供需</th>
              <th scope="col">核心观察</th>
              <th scope="col">催化剂</th>
              <th scope="col">风险 / 证伪</th>
              <th scope="col">增长预期</th>
              <th scope="col">{head('分组', 'group')}</th>
              <th scope="col">{head('证据等级', 'grade')}</th>
              <th scope="col">{head('最后核对', 'verified')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const open = expanded === l.id;
              return (
                <Fragment key={l.id}>
                  <tr className={open ? 'is-open' : undefined}>
                    <td className="ind-sticky ind-sticky-1 ind-code">{layerCode(l, theme?.id ?? '')}</td>
                    <th scope="row" className="ind-sticky ind-sticky-2">
                      <button
                        type="button"
                        className="ind-expand"
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : l.id)}
                      >
                        {open ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
                        <span>{l.name}</span>
                      </button>
                    </th>
                    <td title={textOr(l.bottleneck)}><div className="ind-clamp">{textOr(l.bottleneck)}</div></td>
                    <td>
                      <ul className="ind-cos">
                        {(l.companies ?? []).map((c) => (
                          <li key={c.ticker}>
                            <button
                              type="button"
                              className="ind-token"
                              title={`${c.name}（${marketLabel(c.market)}）· 打开公司研究页`}
                              onClick={() => onCompany(c.ticker)}
                            >
                              {c.ticker}
                            </button>
                          </li>
                        ))}
                        {!(l.companies ?? []).length ? <li className="tm-muted">{UNAVAILABLE}</li> : null}
                      </ul>
                    </td>
                    <td className="tm-small" title={l.valuation?.reason ?? undefined}>
                      {isNum(l.valuation?.value) ? (
                        `${dec(l.valuation?.value, 2)} ${textOr(l.valuation?.unit, '')}`
                      ) : (
                        <button type="button" className="tm-link" onClick={()=>setExpanded(open ? null : l.id)}>FPE · DATA PENDING</button>
                      )}
                      <div className="tm-muted">日期 / 期间：未核验</div>
                    </td>
                    <td className="tm-small" title={l.signal_reason}><div className={'ind-signal '+(l.signal==='已披露营收增长'?'is-growth':'')}>{textOr(l.signal)}</div></td>
                    <td className="tm-small"><button type="button" className="tm-link" aria-label={`${l.name} 来源与日期`} onClick={()=>setExpanded(open ? null : l.id)}>查看 {l.source_ids?.length ?? 0} 项来源</button><div className="tm-muted">{textOr(l.last_verified)}</div></td>
                    <td className="tm-small" title={textOr(l.role)}><div className="ind-clamp">{textOr(l.role)}</div></td>
                    <td className="tm-small">{marketsOf(l).map(marketLabel).join(' / ') || UNAVAILABLE}</td>
                    <td className="tm-small" title={textOr(l.supply_demand)}><div className="ind-clamp">{textOr(l.supply_demand)}</div></td>
                    <td className="tm-small" title={textOr(l.watch)}><div className="ind-clamp">{textOr(l.watch)}</div></td>
                    <td className="tm-small" title={(l.catalysts ?? []).join('；')}><div className="ind-clamp">{(l.catalysts ?? []).join('；') || UNAVAILABLE}</div></td>
                    <td className="tm-small" title={(l.risks ?? []).join('；')}><div className="ind-clamp">{(l.risks ?? []).join('；') || UNAVAILABLE}</div></td>
                    <td className="tm-small" title={textOr(l.growth_expectations)}><div className="ind-clamp">{textOr(l.growth_expectations)}</div></td>
                    <td>{textOr(l.group)}</td>
                    <td className="tm-small" title={textOr(l.evidence_grade)}><div className="ind-clamp">{textOr(l.evidence_grade)}</div></td>
                    <td className="tm-small">{textOr(l.last_verified)}</td>
                  </tr>
                  {open ? (
                    <tr className="ind-detail-row">
                      <td colSpan={17} aria-label={`${l.name}技术关系与证据详情`}>
                        <div className="ind-detail">
                          <div className="ind-detail-col">
                            <h4>技术上下游</h4>
                            <p className="tm-small">
                              关系性质：{l.relationship_type} —— 这是<strong>技术依赖</strong>，不是已证实的客户、合同或供货份额。
                            </p>
                            <div className="ind-rel">
                              <div>
                                <h5>上游（本环节依赖）</h5>
                                {(l.upstream ?? []).length ? (
                                  <ul className="tm-tags">
                                    {l.upstream.map((id) => (
                                      <li key={id}>{layerById.get(id)?.name ?? id}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="tm-muted">本导出未登记上游节点</span>
                                )}
                              </div>
                              <div>
                                <h5>下游（依赖本环节）</h5>
                                {(l.downstream ?? []).length ? (
                                  <ul className="tm-tags">
                                    {l.downstream.map((id) => (
                                      <li key={id}>{layerById.get(id)?.name ?? id}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="tm-muted">本导出未登记下游节点</span>
                                )}
                              </div>
                            </div>
                            <h4>所属主题层号</h4>
                            <ul className="tm-tags">
                              {Object.entries(l.theme_layers ?? {}).map(([tid, code]) => (
                                <li key={tid}>
                                  {themes.find((t) => t.id === tid)?.name ?? tid}：{code}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="ind-detail-col">
                            <h4>判断与证伪</h4>
                            <dl className="ind-kv">
                              <div>
                                <dt>角色</dt>
                                <dd>{textOr(l.role)}</dd>
                              </div>
                              <div>
                                <dt>瓶颈</dt>
                                <dd>{textOr(l.bottleneck)}</dd>
                              </div>
                              <div>
                                <dt>核心观察</dt>
                                <dd>{textOr(l.watch)}</dd>
                              </div>
                              <div>
                                <dt>信号依据</dt>
                                <dd>{textOr(l.signal_reason)}</dd>
                              </div>
                              <div>
                                <dt>主张性质</dt>
                                <dd>
                                  <StatusPill value={l.claim_status} />
                                </dd>
                              </div>
                            </dl>
                            <h5>证伪条件</h5>
                            <ul className="tm-bullets">
                              {(l.invalidation ?? l.risks ?? []).map((r, i) => (
                                <li key={r + i}>{r}</li>
                              ))}
                            </ul>
                            {(l.risks?.length ?? 0) < 3 ? <Caveat>风险条目少于 3 条，梳理尚未完成。</Caveat> : null}
                          </div>

                          <div className="ind-detail-col">
                            <h4>来源与日期</h4>
                            <ul className="tm-srclist">
                              {(l.source_ids ?? []).map((id) => {
                                const s = industrySourceById.get(id);
                                if (!s)
                                  return (
                                    <li key={id}>
                                      <span className="tm-muted">{id} · 未登记</span>
                                    </li>
                                  );
                                return (
                                  <li key={id}>
                                    {s.url ? (
                                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                                        {s.title}
                                        <ExternalLink size={12} aria-hidden="true" />
                                      </a>
                                    ) : (
                                      <button type="button" className="tm-link" onClick={() => onRoute('evidence')}>
                                        {s.title}（本地文件）
                                      </button>
                                    )}
                                    <span className="tm-srcmeta">
                                      {s.published_at ? `发布 ${s.published_at.slice(0, 10)}` : '无发布日期'} · 核对{' '}
                                      {textOr(s.last_verified, '—')} · {s.pit_eligible ? 'PIT 可用' : 'PIT 不可用'}
                                    </span>
                                  </li>
                                );
                              })}
                              {!(l.source_ids ?? []).length ? <li className="tm-muted">本节点未关联来源</li> : null}
                            </ul>
                            <h4>估值</h4>
                            <Pending reason={l.valuation?.reason ?? undefined} />
                            <h4>相关公司</h4>
                            <ul className="ind-cos">
                              {(l.companies ?? []).map((c) => {
                                const co = companyByTicker.get(c.ticker);
                                return (
                                  <li key={c.ticker}>
                                    <button type="button" className="ind-token is-wide" onClick={() => onCompany(c.ticker)}>
                                      {c.ticker} · {c.name}
                                      {co && isNum(co.revenue_yoy_pct) ? (
                                        <span className="ind-token-meta">同比 {pctValue(co.revenue_yoy_pct, 1)}</span>
                                      ) : (
                                        <span className="ind-token-meta">财务待补</span>
                                      )}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {!rows.length ? (
              <tr>
                <td colSpan={17} className="tm-empty">
                  没有符合当前筛选条件的节点。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableScroll>
      <p className="tm-foot">
        层号来自各主题自己的顺序（theme_layers）；同一个节点在不同主题下层号不同，这是按主题重新编号，不是重复计数。
        点击公司代码进入公司研究页；点击环节名称展开技术上下游与来源。
      </p>

      {/* 自定义主题 */}
      <Disclosure summary={`自定义分类（本浏览器保存，${custom.length} 个）`}>
        <Caveat>
          自定义分类只是<strong>重新编组既有节点</strong>的个人视图，保存在你自己的浏览器里。
          它不产生新证据、不改变任何数据文件，也不代表新的产业结论。
        </Caveat>
        <div className="ind-builder">
          <div className="tm-select">
            <label htmlFor="ind-custom-name">分类名称</label>
            <input
              id="ind-custom-name"
              type="text"
              value={draftName}
              placeholder="例如：我的光模块观察组"
              onChange={(e) => setDraftName(e.target.value)}
            />
          </div>
          <fieldset className="ind-picker">
            <legend>选择要纳入的既有节点（{draftLayers.length} 个已选）</legend>
            {layers.map((l) => (
              <label key={l.id} className="ind-pick">
                <input
                  type="checkbox"
                  checked={draftLayers.includes(l.id)}
                  onChange={(e) =>
                    setDraftLayers((prev) => (e.target.checked ? [...prev, l.id] : prev.filter((x) => x !== l.id)))
                  }
                />
                <span>
                  {l.name}
                  <small>{l.group}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="ind-builder-actions">
            <button
              type="button"
              className="tm-button"
              disabled={!draftName.trim() || draftLayers.length === 0}
              onClick={() => {
                const id = 'custom-' + Date.now().toString(36);
                persist([...custom, { id, name: draftName.trim(), layer_ids: draftLayers }]);
                setDraftName('');
                setDraftLayers([]);
                onTheme(id);
              }}
            >
              保存为自定义分类
            </button>
            <button
              type="button"
              className="tm-button is-quiet"
              onClick={() => {
                setDraftName('');
                setDraftLayers([]);
              }}
            >
              清空选择
            </button>
          </div>
          {custom.length ? (
            <ul className="ind-customlist">
              {custom.map((c) => (
                <li key={c.id}>
                  <button type="button" className="tm-link" onClick={() => onTheme(c.id)}>
                    {c.name}（{c.layer_ids.length} 节点）
                  </button>
                  <button
                    type="button"
                    className="tm-button is-quiet"
                    onClick={() => {
                      const next = custom.filter((x) => x.id !== c.id);
                      persist(next);
                      if (themeId === c.id) onTheme(themes[0]?.id ?? '');
                    }}
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Disclosure>

      {/* 估值敏感性 */}
      {scenario?.points?.length ? (
        <Panel title="增长兑现，还要看估值" en="Predefined sensitivity grid; lookup only, never a forecast">
          <div className="ind-scenario">
            <div className="ind-scenario-controls">
              <div className="tm-select">
                <label htmlFor="sc-growth">每股收益增长假设</label>
                <select id="sc-growth" value={growthKey} onChange={(e) => setGrowth(e.target.value)}>
                  {scenario.growth_rates.map((g) => (
                    <option key={g} value={String(g)}>
                      {pctValue(g, 0)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tm-select">
                <label htmlFor="sc-mult">市盈率变化假设</label>
                <select id="sc-mult" value={multipleKey} onChange={(e) => setMultiple(e.target.value)}>
                  {scenario.multiple_changes.map((mm) => (
                    <option key={mm} value={String(mm)}>
                      {pctValue(mm, 0)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ind-scenario-out" aria-live="polite">
              <div>
                <span>归一化价格指数</span>
                <strong>{hit ? dec(hit.price_index, 1) : UNAVAILABLE}</strong>
                <small>假设起点 = {int(scenario.base_index)}</small>
              </div>
              <div>
                <span>对应回报</span>
                <strong className={hit && hit.return_pct < 0 ? 'tm-neg' : 'tm-pos'}>
                  {hit ? pctValue(hit.return_pct, 1) : UNAVAILABLE}
                </strong>
                <small>{scenario.formula}</small>
              </div>
            </div>
            {!hit ? <Caveat>所选组合不在预计算网格内，请改选其它假设。</Caveat> : null}
            <ul className="tm-bullets">
              {(scenario.assumptions ?? []).map((a, i) => (
                <li key={a + i}>{a}</li>
              ))}
            </ul>
            <Caveat>
              状态 {textOr(scenario.status)}：这是<strong>用户自选假设</strong>下的归一化推演，起点 100 不是任何公司的股价。
              前端只在预计算网格中查表，不做乘除；结果不是目标价、不是概率、不是交易信号。
            </Caveat>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
