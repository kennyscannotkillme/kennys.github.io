'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {Activity,Aperture,ArrowUpRight,ArrowRight,BookOpen,ChartNoAxesCombined,Check,Circle,Code2,Database,ExternalLink,FileClock,FlaskConical,FolderOpen,Globe2,Grid2X2,History,Layers3,LockKeyhole,Moon,Pause,PenLine,Play,RefreshCw,ShieldCheck,Sigma,Sun,TriangleAlert,TrendingUp,Wallet,Waves,X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tooltip,TooltipContent,TooltipProvider,TooltipTrigger} from '@/components/ui/tooltip';
import {Sheet,SheetClose,SheetContent,SheetDescription,SheetHeader,SheetTitle} from '@/components/ui/sheet';
import activitySeed from '@/public/activity.json';
import researchSeed from '@/public/research.json';
import {validateActivity} from '@/lib/activity.mjs';
import {validateResearch,privateWorkspaceUrl,chartPaths} from '@/lib/research.mjs';

type Lang='zh'|'en';
type View='research'|'activity'|'workspace'|'sources';
type Point={date:string;strategy:number;benchmark:number};
type Candidate={id:string;name:string;status:string;data_as_of:string;basis:string;period?:string[]|null;capacity?:string;curve:Point[];metrics:Record<string,number|null>};
const candidateIcons={gen2:Layers3,s2:Waves,s3:Sigma,g1:TrendingUp};
const kindIcons={design:PenLine,code:Code2,test:ShieldCheck,research:FlaskConical,publish:Globe2};
const g1Method={
 zh:['只在指数与个股20日EMA高于60日EMA×1.001时找机会；按个股趋势强度排名。',
 '每5个交易日评估；持仓仍在合格前10名则保留，换仓先比较预期收益和费用。',
 '只选一只，目标为信号日净值的20%；下一交易日10:01价格仅作模拟参考，买卖都受5%分钟参与率限制。',
 '预期收益由此前已结算的20日历史结果校准；不足则不买。保留T+1、分红、涨跌停、延迟退出与真实费用。'],
 en:['Look for trends only when both index and stock EMA20 exceed EMA60 × 1.001; rank by stock trend strength.',
 'Review every 5 trading sessions. Retain a holding in the qualified top 10; compare expected improvement with switching costs.',
 'One stock, targeting 20% of signal-day NAV. Next-session 10:01 is a simulated reference; both sides obey a 5% minute-participation cap.',
 'Calibrate expectations only from earlier resolved 20-session outcomes; otherwise do not buy. Keep T+1, dividends, price limits, delayed exits and costs.']
};
const modules=[
  {slug:'overview',zh:'总览',en:'Overview',icon:Grid2X2},
  {slug:'ai-quant',zh:'量化选股',en:'Quant research',icon:ChartNoAxesCombined},
  {slug:'shadow-demo',zh:'研究沙盒',en:'Research sandbox',icon:FlaskConical},
  {slug:'daily-review',zh:'每日复盘',en:'Daily review',icon:FileClock},
  {slug:'global-market-data',zh:'全球市场',en:'Global markets',icon:Globe2},
  {slug:'global-analysis',zh:'全局分析',en:'Global analysis',icon:Layers3},
  {slug:'ibkr',zh:'IBKR 独立账本',en:'IBKR ledger',icon:Wallet},
  {slug:'a-share',zh:'A股独立账本',en:'A-share ledger',icon:Waves},
  {slug:'ibkr-quality',zh:'IBKR 数据状态',en:'IBKR data quality',icon:ShieldCheck},
  {slug:'a-share-quality',zh:'A股数据状态',en:'A-share data quality',icon:Database},
  {slug:'audit',zh:'数据溯源',en:'Data lineage',icon:History},
  {slug:'settings',zh:'本地设置',en:'Local settings',icon:Aperture},
];
const labels={
 zh:{research:'策略净值',activity:'工作记录',workspace:'原工作区',sources:'研究来源',about:'说明',detail:'详情',close:'关闭',refresh:'刷新快照',language:'English',motion:'减少动效',resume:'开启动效',night:'夜间',day:'日间',strategy:'策略 · 扣费收益',benchmark:'科创50 · 同时钟价格指数',warning:'历史模拟，不是今天的信号；查看口径与限制',offline:'连接中断，保留上次快照',private:'仅在你的电脑上开放',blocked:'资金账本暂缺公司行动数据',history:'开发期历史回放，非全新盲测',capacity:'分钟参与率约束的模拟成交，不保证真实排队成交',unit:'单位净值；不是千万元资金账本。原始策略为50股组合，容量未验证',normalized:'单位净值',money:'模拟资金',cost:'总费用',exposure:'平均实际仓位',trades:'平仓交易',drawdown:'最大回撤',cashBenchmark:'现金暴露匹配基准',return:'扣费收益',source:'来源',snapshot:'已发布快照，不代表持续运行的后台进程。时间仅为记录时间。',privacy:'这里只公开脱敏模拟研究。券商账户、持仓与凭据仍保留在本机；没有自动下单。',noProfit:'尚无充分验证的可部署盈利策略。星标仅用于筛选参考项目。',different:'各候选区间与资金口径不同，不直接按终值排名。',gen2Benchmark:'科创50仅为补充参考。Gen2原始基准是沪深300，原基准尾部缺5个区间。',cutoff:'数据截止',period:'评价区间',open:'打开原功能',download:'下载脱敏研究曲线',net:'净利润'},
 en:{research:'Strategy equity',activity:'Work log',workspace:'Original workspace',sources:'Research sources',about:'About',detail:'Details',close:'Close',refresh:'Refresh snapshots',language:'中文',motion:'Reduce motion',resume:'Enable motion',night:'Night',day:'Day',strategy:'Strategy · net return',benchmark:'STAR50 · same-clock price index',warning:'Historical simulation, not a current signal. View methodology and limits',offline:'Offline, retaining last snapshot',private:'Available only on your computer',blocked:'Capital ledger awaits corporate-action data',history:'Exposed development history, not a new blind test',capacity:'Participation-capped simulated execution; real queue fills are not guaranteed',unit:'Normalized NAV, not a CNY10M ledger. Original 50-stock portfolio; capacity unverified',normalized:'Normalized NAV',money:'Simulated capital',cost:'Total costs',exposure:'Mean actual exposure',trades:'Closed trades',drawdown:'Maximum drawdown',cashBenchmark:'Cash-exposure matched benchmark',return:'Net return',source:'Source',snapshot:'Published snapshots, not a continuous worker monitor. Timestamps are observation times only.',privacy:'Only sanitized simulated research is public. Broker accounts, positions and credentials remain local. No automated ordering.',noProfit:'No sufficiently validated deployable profitable strategy yet. Stars are only a reference filter.',different:'Candidate periods and capital conventions differ; terminal values are not directly ranked.',gen2Benchmark:'STAR50 is an additional reference. Gen2 originally used CSI300, with 5 missing terminal intervals.',cutoff:'Data cutoff',period:'Evaluation period',open:'Open original function',download:'Download sanitized research curves',net:'Net profit'}
};
function Control({label,children,onClick,active=false,className=''}:{label:string;children:ReactNode;onClick:()=>void;active?:boolean;className?:string}){
 return <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} aria-pressed={active} onClick={onClick} className={'icon-control '+className+(active?' selected':'')}/>}>{children}</TooltipTrigger><TooltipContent sideOffset={12}>{label}</TooltipContent></Tooltip>;
}
function Mark({status}:{status:string}){return status==='done'?<Check size={16}/>:status==='active'?<span className="status-point"/>:status==='blocked'?<TriangleAlert size={16}/>:<Circle size={13}/>;}
function Curve({candidate,benchmark,onPoint}:{candidate:Candidate;benchmark:boolean;onPoint:(p:Point|null)=>void}){
 const [index,setIndex]=useState<number|null>(null);
 const shape=chartPaths(candidate.curve,benchmark);
 if(!shape)return <div className="curve-empty"><TriangleAlert size={48} strokeWidth={.8}/></div>;
 const point=index===null?null:candidate.curve[index];
 const update=(i:number|null)=>{setIndex(i);onPoint(i===null?null:candidate.curve[i]);};
 return <button type="button" className="curve-interaction" aria-label={candidate.name+' '+candidate.period?.join(' – ')}
 onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();update(Math.max(0,Math.min(candidate.curve.length-1,Math.round(((e.clientX-r.left)/r.width*800-12)/776*(candidate.curve.length-1)))));}}
 onPointerLeave={()=>update(null)} onBlur={()=>update(null)}
 onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update(Math.max(0,Math.min(candidate.curve.length-1,(index??candidate.curve.length-1)+(e.key==='ArrowLeft'?-1:1))));}}}>
 <svg className="equity-curve" viewBox="0 0 800 260" aria-hidden="true"><defs><linearGradient id="nav-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="currentColor" stopOpacity=".09"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
 {[50,100,150,200].map(y=><line key={y} x1="12" x2="788" y1={y} y2={y} className="chart-grid"/>)}
 <line x1="12" x2="788" y1={shape.zero} y2={shape.zero} className="zero-line"/>
 {benchmark?<path d={shape.benchmark} className="benchmark-path"/>:null}
 <path d={shape.strategy+' L788,245 L12,245 Z'} fill="url(#nav-fill)"/><path d={shape.strategy} className="strategy-path"/>
 {point&&index!==null?<g><line x1={shape.x(index)} x2={shape.x(index)} y1="18" y2="242" className="crosshair"/><circle cx={shape.x(index)} cy={shape.y(point.strategy)} r="4" className="chart-point"/></g>:null}
 </svg></button>;
}
export default function Home(){
 const [lang,setLang]=useState<Lang>('zh'),[view,setView]=useState<View>('research');
 const [panel,setPanel]=useState<'result'|'entry'|'about'|'private'|'method'|null>(null);
 const [activity,setActivity]=useState(activitySeed),[research,setResearch]=useState(researchSeed);
 const [id,setId]=useState('g1'),[entryId,setEntryId]=useState(activitySeed.current_id);
 const [night,setNight]=useState(false),[motion,setMotion]=useState(true),[benchmark,setBenchmark]=useState(true);
 const [network,setNetwork]=useState<'ok'|'loading'|'error'>('ok');
 const [local,setLocal]=useState(false),[embedded,setEmbedded]=useState<string|null>(null),[point,setPoint]=useState<Point|null>(null);
 const abortRef=useRef<AbortController|null>(null),w=labels[lang];
 const candidates=research.candidates as Candidate[],candidate=candidates.find(c=>c.id===id)??candidates[0];
 const entry=activity.entries.find(e=>e.id===entryId)??activity.entries[0];
 const pct=(n:number|null|undefined)=>n==null?'—':(n>0?'+':'')+(n*100).toFixed(2)+'%';
 const number=(n:number|null|undefined)=>n==null?'—':new Intl.NumberFormat(lang==='zh'?'zh-CN':'en-GB',{maximumFractionDigits:2}).format(n);
 const date=(d:string)=>d.slice(0,4)+'.'+d.slice(4,6)+'.'+d.slice(6,8);
 const time=(d:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:activity.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d));
 const refresh=useCallback(async()=>{
  abortRef.current?.abort();const controller=new AbortController();abortRef.current=controller;
  setNetwork('loading');const timeout=setTimeout(()=>controller.abort(),10000);
  try{
   const [a,r]=await Promise.all(['activity.json','research.json'].map(async path=>{const res=await fetch(new URL(path,window.location.href),{cache:'no-store',signal:controller.signal});if(!res.ok)throw Error('snapshot');return res.json();}));
   if(!validateActivity(a)||!validateResearch(r))throw Error('invalid snapshot');
   const nextActivity=a as typeof activitySeed, nextResearch=r as typeof researchSeed;
   setActivity(prev=>Date.parse(nextActivity.updated_at)>=Date.parse(prev.updated_at)?nextActivity:prev);
   setResearch(prev=>Date.parse(nextResearch.exported_at)>=Date.parse(prev.exported_at)?nextResearch:prev);setNetwork('ok');
  }catch{if(abortRef.current===controller)setNetwork('error');}finally{clearTimeout(timeout);}
 },[]);
 useEffect(()=>{
  const timer=setTimeout(()=>{
   setLocal(['localhost','127.0.0.1','[::1]'].includes(window.location.hostname));
   try{const p=JSON.parse(localStorage.getItem('hhh.preferences.v1')??'null');if(p?.lang==='en'||p?.lang==='zh')setLang(p.lang);if(typeof p?.night==='boolean')setNight(p.night);setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&p?.motion!==false);}catch{setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
   void refresh();
  },0);const poll=setInterval(()=>{if(!document.hidden)void refresh();},20000);
  return()=>{clearTimeout(timer);clearInterval(poll);abortRef.current?.abort();};
 },[refresh]);
 useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.documentElement.classList.toggle('dark',night);document.documentElement.dataset.motion=motion?'on':'off';},[lang,night,motion]);
 function preference(next:Partial<{lang:Lang;night:boolean;motion:boolean}>){const p={lang,night,motion,...next};setLang(p.lang);setNight(p.night);setMotion(p.motion);try{localStorage.setItem('hhh.preferences.v1',JSON.stringify(p));}catch{/* Optional device preference only. */}}
 function navigate(next:View){setView(next);setPanel(null);setEmbedded(null);setPoint(null);}
 function openModule(slug:string){const url=privateWorkspaceUrl(window.location.hostname,slug);if(url)setEmbedded(url);else setPanel('private');}
 function openEntry(key:string){setEntryId(key);setPanel('entry');}
 const value=point?point.strategy/100:candidate.metrics.net_return;
 const title=view==='research'?w.research:view==='activity'?w.activity:view==='sources'?w.sources:w.workspace;
 return <TooltipProvider delay={350}><main className={'hhh quiet-shell '+(!motion?'still ':'')+(panel?'panel-open':'')} data-testid="workbench">
 <div className="atmosphere" aria-hidden="true"><div className="ambient ambient-cool"/><div className="ambient ambient-warm"/><div className="refraction r-one"/><div className="refraction r-two"/></div>
 <header className="topbar"><Control label="HHH" onClick={()=>navigate('research')}><Aperture strokeWidth={1.15}/></Control><div className="top-actions">
 <Control label={w.language} onClick={()=>preference({lang:lang==='zh'?'en':'zh'})}><Globe2 strokeWidth={1.25}/></Control>
 <Control label={network==='error'?w.offline:w.refresh} onClick={()=>void refresh()}><RefreshCw strokeWidth={1.25} className={network==='loading'?'spinning':''}/></Control></div></header>
 <section className={'stage quiet-stage '+(embedded?'embedded-stage':'')} aria-label={title}><h1 className="sr-only">{title}</h1>
 <div className="sheet-stack"><div className="under-sheet" aria-hidden="true"/><article className="now-sheet glass research-sheet">
 <div className="canvas-toolbar">
 {view==='research'?<div className="candidate-switcher">{candidates.map(c=>{const Icon=candidateIcons[c.id as keyof typeof candidateIcons];return <Control key={c.id} label={c.name} active={c.id===candidate.id} onClick={()=>{setId(c.id);setPoint(null);}}><Icon strokeWidth={1.2}/></Control>;})}</div>:<div className="section-symbol" aria-hidden="true">{view==='activity'?<Activity/>:view==='sources'?<FolderOpen/>:<Grid2X2/>}</div>}
 <Control label={embedded?w.close:w.warning} onClick={()=>embedded?setEmbedded(null):setPanel(view==='research'?'result':'about')}>{embedded?<X strokeWidth={1.2}/>:<TriangleAlert strokeWidth={1.1}/>}</Control>
 </div>
 {view==='research'?<>
 <div className="equity-heading"><div className="equity-number" aria-label={candidate.name+' '+w.return+' '+pct(value)}>{pct(value)}</div><time className="curve-date">{point?date(point.date):candidate.period?.map(date).join(' — ')??date(candidate.data_as_of)}</time></div>
 <Curve key={candidate.id+'-'+benchmark} candidate={candidate} benchmark={benchmark} onPoint={setPoint}/>
 <div className="sheet-bottom chart-bottom"><div className="process-icons"><Control label={candidate.name+' / '+w.strategy} active onClick={()=>setPanel('result')}><TrendingUp strokeWidth={1.3}/></Control><span className="hairline"/><Control label={w.benchmark} active={benchmark} onClick={()=>setBenchmark(!benchmark)}><Waves strokeWidth={1.3}/></Control>{candidate.id==='g1'?<Control label={lang==='zh'?'G1 · 方法':'G1 · Method'} onClick={()=>setPanel('method')}><BookOpen strokeWidth={1.2}/></Control>:null}</div><Control label={w.detail} onClick={()=>setPanel('result')}><ArrowUpRight strokeWidth={1.1}/></Control></div>
 </>:null}
 {view==='activity'?<div className="activity-canvas">{activity.entries.map((item,i)=>{const Icon=kindIcons[item.kind as keyof typeof kindIcons];return <button className="activity-node" key={item.id} onClick={()=>openEntry(item.id)} aria-label={item.title[lang]+' / '+item.status}><span className="node-index">{String(i+1).padStart(2,'0')}</span><span className={'node-symbol '+item.status}><Icon size={30} strokeWidth={1}/></span><span className="node-status"><Mark status={item.status}/></span><time>{time(item.observed_at)}</time></button>;})}</div>:null}
 {view==='workspace'&&!embedded?<div className="module-grid">{modules.map(m=><Control key={m.slug} label={m[lang]+' / '+(local?w.open:w.private)} className="module-control" onClick={()=>openModule(m.slug)}><m.icon strokeWidth={1.1}/>{!local?<LockKeyhole className="module-lock"/>:null}</Control>)}</div>:null}
 {view==='workspace'&&embedded?<iframe className="private-frame" title={w.workspace} src={embedded}/>:null}
 {view==='sources'?<div className="source-list">{research.references.map((r,i)=><a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="source-row" aria-label={r.name+': '+r.mechanism} title={r.name+' / '+r.mechanism}><Code2 strokeWidth={1}/><span>{String(i+1).padStart(2,'0')}</span><span className="stars-number">{number(r.stars_observed)}</span><span aria-hidden="true">☆</span><ArrowUpRight strokeWidth={1}/></a>)}</div>:null}
 </article></div>
 <div className="quiet-rail" aria-label={w.activity}>{activity.entries.slice(0,3).map(item=>{const Icon=kindIcons[item.kind as keyof typeof kindIcons];return <button key={item.id} onClick={()=>openEntry(item.id)} aria-label={item.title[lang]+' / '+item.status} title={item.title[lang]}><Icon size={18} strokeWidth={1.2}/><span className="rail-line"/><Mark status={item.status}/><ArrowRight size={16} strokeWidth={1.1}/></button>;})}</div>
 </section>
 <footer className="bottom-bar"><Control label={w.snapshot+' '+time(activity.updated_at)} onClick={()=>setPanel('about')}><FileClock strokeWidth={1.1}/></Control>
 <nav className="dock glass" aria-label="HHH">
 <Control label={w.research} active={view==='research'} onClick={()=>navigate('research')}><ChartNoAxesCombined strokeWidth={1.2}/></Control>
 <Control label={w.activity} active={view==='activity'} onClick={()=>navigate('activity')}><Activity strokeWidth={1.2}/></Control>
 <Control label={w.workspace} active={view==='workspace'} onClick={()=>navigate('workspace')}><Grid2X2 strokeWidth={1.2}/></Control>
 <Control label={w.sources} active={view==='sources'} onClick={()=>navigate('sources')}><FolderOpen strokeWidth={1.2}/></Control></nav>
 <div className="appearance"><Control label={motion?w.motion:w.resume} onClick={()=>preference({motion:!motion})}>{motion?<Pause strokeWidth={1.2}/>:<Play strokeWidth={1.2}/>}</Control><Control label={night?w.day:w.night} onClick={()=>preference({night:!night})}>{night?<Sun strokeWidth={1.2}/>:<Moon strokeWidth={1.2}/>}</Control></div></footer>
 <div className="sr-only" aria-live="polite">{network==='error'?w.offline:''}</div>
 <Sheet open={panel!==null} onOpenChange={open=>{if(!open)setPanel(null);}}><SheetContent className="detail-sheet glass" showCloseButton={false}>
 <SheetClose render={<Button variant="ghost" size="icon" className="close-sheet" aria-label={w.close}/>}><X strokeWidth={1.3}/></SheetClose>
 <SheetHeader><SheetTitle>{panel==='method'?(lang==='zh'?'G1 · 趋势与耐心':'G1 · Trend & patience'):panel==='result'?candidate.name:panel==='entry'?entry.title[lang]:panel==='private'?w.private:w.about}</SheetTitle><SheetDescription>{panel==='result'||panel==='method'?w.history:panel==='entry'?entry.detail[lang]:w.privacy}</SheetDescription></SheetHeader>
 <div className="drawer-body">{panel==='result'?<>
 <p className="result-warning"><TriangleAlert size={18}/>{candidate.curve.length?(candidate.basis==='NORMALIZED_UNITS_NOT_CNY'?w.unit:w.capacity):w.blocked}</p>
 <dl className="result-metrics"><div><dt>{w.cutoff}</dt><dd>{date(candidate.data_as_of)}</dd></div><div><dt>{w.period}</dt><dd>{candidate.period?.map(date).join(' — ')??'—'}</dd></div>
 <div><dt>{candidate.basis==='NORMALIZED_UNITS_NOT_CNY'?w.normalized:w.money}</dt><dd>{candidate.basis==='CNY_SIMULATED_CAPITAL'?'¥':''}{number(candidate.metrics.initial_nav)} → {candidate.basis==='CNY_SIMULATED_CAPITAL'?'¥':''}{number(candidate.metrics.final_nav)}</dd></div>
 {candidate.basis==='CNY_SIMULATED_CAPITAL'?<div><dt>{w.net}</dt><dd>¥{number(candidate.metrics.profit_cny)}</dd></div>:null}
 {([['net_return',w.return],['benchmark_return',w.benchmark],['matched_benchmark_return',w.cashBenchmark],['max_drawdown',w.drawdown],['mean_position_weight',w.exposure]] as const).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{pct(candidate.metrics[key])}</dd></div>)}
 <div><dt>{w.trades}</dt><dd>{number(candidate.metrics.trades)}</dd></div><div><dt>{w.cost}</dt><dd>{candidate.basis==='CNY_SIMULATED_CAPITAL'?'¥':''}{number(candidate.metrics.total_cost)}</dd></div></dl>
 {candidate.id==='g1'?<><dl className="result-metrics"><div><dt>{lang==='zh'?'非税摩擦 +50% · 终值':'Non-tax friction +50% · final NAV'}</dt><dd>¥{number(candidate.metrics.stress_final_nav)}</dd></div><div><dt>{lang==='zh'?'延用旧价的估值记录':'Stale valuation marks'}</dt><dd>{number(candidate.metrics.stale_marks)}</dd></div></dl><p className="footnote">{lang==='zh'?'仅8笔平仓交易。期末仍有未平仓股票；成员与分红按有效日期处理，并非完整公告历史版本库。':'Only 8 closed trades. An open position remains at the end; membership and dividends use effective dates, not a complete archive of publication vintages.'}</p></>:null}
 <p className="footnote">{w.different}</p>{candidate.id==='gen2'?<p className="footnote">{w.gen2Benchmark}</p>:null}<p className="footnote">{w.noProfit}</p>
 <a className="text-action" href="research.json" download="HHH-research.json"><Database size={17}/>{w.download}<ArrowUpRight size={16}/></a>
 </>:null}
 {panel==='entry'?<><div className="detail-meta"><Mark status={entry.status}/><time>{new Date(entry.observed_at).toLocaleString(lang==='zh'?'zh-CN':'en-GB',{timeZone:activity.timezone})}</time></div><div className="evidence"><ShieldCheck size={19}/><p>{entry.evidence[lang]}</p></div><p className="footnote">{w.snapshot}</p></>:null}
 {panel==='method'?<><p className="result-warning"><TriangleAlert size={18}/>{lang==='zh'?'G1仅在科创板历史上小幅盈利，未跑赢科创50；不能直接实盘。':'G1 showed a small historical STAR-stock profit but underperformed STAR50; not approved for live use.'}</p>{g1Method[lang].map((line,i)=><p className="method-line" key={line}><span>{String(i+1).padStart(2,'0')}</span>{line}</p>)}<p className="footnote">{lang==='zh'?'后续范围已扩大为全A股，目标是扣费后跑赢科创50。G1旧成绩不随范围改变。':'Future research covers all A-shares, aiming to beat STAR50 after costs. G1 history is not relabeled.'}</p><a className="text-action" href="https://github.com/QuantConnect/Lean/blob/master/Algorithm.Python/FuturesMomentumAlgorithm.py" target="_blank" rel="noopener noreferrer"><Code2 size={18}/>LEAN<ArrowUpRight size={16}/></a><p className="footnote">{lang==='zh'?'仅借鉴趋势机制，并非复现原期货策略收益。':'Trend mechanism adapted only; not a reproduction of the original futures returns.'}</p></>:null}
 {panel==='about'||panel==='private'?<><p className="result-warning"><Globe2 size={18}/>{lang==='zh'?'全 A 股选股 → 扣费后争取跑赢科创50':'All A-shares → aim to beat STAR50 after costs'}</p><p className="footnote">{date(research.operations.entry_date)} · {lang==='zh'?'预测尚未开放：实盘可行性和全A股新鲜数据未通过。先模拟，不自动下单。':'Prediction not enabled: execution feasibility and fresh all-A-share inputs have not passed. Simulation first; no automated orders.'}</p><p className="footnote">{lang==='zh'?'日线截止':'Daily through'} {date(research.operations.daily_max_date)} · {lang==='zh'?'执行分钟截止':'Execution minutes through'} {date(research.operations.minute_max_date)}</p><p className="footnote">{w.snapshot}</p><p className="footnote">{w.noProfit}</p><a className="text-action" href="https://github.com/kennyscannotkillme/kennys.github.io/tree/main/HHH" target="_blank" rel="noopener noreferrer"><Code2 size={18}/>{w.source}<ExternalLink size={16}/></a></>:null}
 </div></SheetContent></Sheet>
 </main></TooltipProvider>;
}
