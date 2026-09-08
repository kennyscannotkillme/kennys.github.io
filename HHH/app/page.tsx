'use client';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight, ArrowRight, Check, CheckCheck, Circle, Code2, FileText, Globe2, History, House, Info, Layers3, Moon, Pause, PenLine, Play, Radio, RefreshCw, ShieldCheck, Sparkles, Sun, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import seed from '@/public/activity.json';
import { validateActivity, activityDays } from '@/lib/activity.mjs';

type Lang = 'zh' | 'en';
type Panel = 'history' | 'detail' | 'about' | 'milestones' | null;
const words = {
  zh: { language:'Switch to English', history:'记录', now:'现在', milestones:'节点', detail:'详情', about:'关于 HHH', home:'回到现在', updated:'记录于', snapshot:'最近记录', current:'当前节点', title:'让工作可见。', subtitle:'HHH / 一个可见的过程', motion:'减少动效', resume:'开启动效', dark:'夜间', light:'日间', refresh:'刷新记录', offline:'连接中断 · 保留快照', updating:'读取中', done:'已完成', queued:'待续', active:'进行中', blocked:'受阻', readOnly:'只读', close:'关闭', records:'条记录', days:'天', owner:'执行', evidence:'依据', today:'全部', design:'设计', code:'实现', test:'验证', publish:'发布', research:'研究', next:'展开', noData:'这一天暂无记录', timeNote:'显示已发布的工作快照，不代表后台进程持续运行。记录时间不是任务起止时间。', aboutText:'HHH 把真实工作留下一层痕迹。Claude 提供设计建议，Codex 实现交互。', privacy:'公开内容经过整理；不包含账户、凭据或原始数据。', keyboard:'Tab 切换 · Enter 展开 · Esc 返回', source:'源代码', refreshOk:'已读取最新快照', error:'新记录不可用 · 保留上次快照' },
  en: { language:'切换中文', history:'Log', now:'Now', milestones:'Milestones', detail:'Detail', about:'About HHH', home:'Back to now', updated:'Recorded', snapshot:'Last recorded', current:'Current step', title:'Work, made visible.', subtitle:'HHH / A visible process', motion:'Reduce motion', resume:'Enable motion', dark:'Night', light:'Day', refresh:'Refresh records', offline:'Offline / Saved snapshot', updating:'Reading', done:'Done', queued:'Queued', active:'Active', blocked:'Blocked', readOnly:'Read-only', close:'Close', records:'records', days:'days', owner:'By', evidence:'Evidence', today:'All', design:'Design', code:'Build', test:'Verify', publish:'Publish', research:'Research', next:'Explore', noData:'No records on this day', timeNote:'Published work snapshots, not a continuous process monitor. Record times are not task start or end times.', aboutText:'HHH gives real work a quiet, visible trace. Design advice by Claude. Interactions built by Codex.', privacy:'Curated public records only. No accounts, credentials or raw data.', keyboard:'Tab to move · Enter to open · Esc to return', source:'Source', refreshOk:'Latest snapshot retrieved', error:'New records unavailable / Last snapshot retained' },
};
const kindIcons = { design:PenLine, code:Code2, test:ShieldCheck, research:FileText, publish:Radio };
function IconControl({ label, children, onClick, active, className='' }: { label:string; children:ReactNode; onClick:()=>void; active?:boolean; className?:string }) {
  return <Tooltip><TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} aria-pressed={active} onClick={onClick} className={'icon-control '+className+(active?' selected':'')} />}>{children}</TooltipTrigger><TooltipContent sideOffset={10}>{label}</TooltipContent></Tooltip>;
}
function StatusMark({ status }: {status:string}) {
  return status==='done' ? <Check size={17} strokeWidth={1.45}/> : status==='active' ? <span className="status-point" /> : status==='blocked' ? <X size={15}/> : <Circle size={13} strokeWidth={1.2}/>;
}
export default function Home() {
  const [lang,setLang]=useState<Lang>('zh');
  const [data,setData]=useState(seed);
  const [panel,setPanel]=useState<Panel>(null);
  const [selected,setSelected]=useState(seed.current_id);
  const [day,setDay]=useState('all');
  const [night,setNight]=useState(false);
  const [motion,setMotion]=useState(true);
  const [network,setNetwork]=useState<'ok'|'loading'|'error'>('ok');
  const [message,setMessage]=useState('');
  const controller=useRef<AbortController|null>(null);
  const w=words[lang];
  const current=data.entries.find(e=>e.id===data.current_id)!;
  const entry=data.entries.find(e=>e.id===selected)??current;
  const done=data.entries.filter(e=>e.status==='done').length;
  const days=activityDays(data) as string[];
  const dateOf=(d:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:data.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(d));
  const dateLabel=(d:string)=>new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-GB',{timeZone:data.timezone,month:'2-digit',day:'2-digit'}).format(new Date(d));
  const timeLabel=(d:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:data.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(d));
  const fullDate=(d:string)=>new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-GB',{timeZone:data.timezone,dateStyle:'medium',timeStyle:'short'}).format(new Date(d));
  const refresh=useCallback(async (manual=false) => {
    controller.current?.abort();
    const abort=new AbortController(); controller.current=abort;
    if(manual) setNetwork('loading');
    const timeout=setTimeout(()=>abort.abort(),10000);
    try {
      const result=await fetch(new URL('activity.json',window.location.href),{cache:'no-store',signal:abort.signal});
      if(!result.ok) throw new Error('feed');
      const payload:unknown=await result.json();
      if(!validateActivity(payload)) throw new Error('schema');
      const next=payload as typeof seed;
      setData(prev=>Date.parse(next.updated_at)>=Date.parse(prev.updated_at)?next:prev);
      setNetwork('ok');
      if(manual) setMessage('refreshOk');
    } catch {
      if(controller.current===abort) {setNetwork('error'); if(manual)setMessage('error');}
    } finally {clearTimeout(timeout);}
  },[]);
  useEffect(()=>{
    queueMicrotask(()=>{
    try {
      const saved=JSON.parse(localStorage.getItem('hhh.preferences.v1')??'null');
      if(saved?.lang==='en'||saved?.lang==='zh')setLang(saved.lang);
      if(typeof saved?.night==='boolean')setNight(saved.night);
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setMotion(!reduced && saved?.motion!==false);
    }catch {setMotion(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);}
    });
    const initial=setTimeout(()=>void refresh(),0);
    const timer=setInterval(()=>{if(!document.hidden)void refresh();},20000);
    return()=>{clearTimeout(initial);clearInterval(timer);controller.current?.abort();};
  },[refresh]);
  useEffect(()=>{
    document.documentElement.lang=lang==='zh'?'zh-CN':'en';
    document.documentElement.classList.toggle('dark',night);
    document.documentElement.dataset.motion=motion?'on':'off';
  },[lang,night,motion]);
  useEffect(()=>{if(!message)return;const t=setTimeout(()=>setMessage(''),3500);return()=>clearTimeout(t);},[message]);
  function preference(next:Partial<{lang:Lang;night:boolean;motion:boolean}>){
    const p={lang,night,motion,...next};setLang(p.lang);setNight(p.night);setMotion(p.motion);
    try{localStorage.setItem('hhh.preferences.v1',JSON.stringify(p));}catch{/* Optional preferences may be disabled. */}
  }
  function detail(id:string){setSelected(id);setPanel('detail');}
  const visible=data.entries.filter(e=>e.id!==data.current_id).slice(0,3);
  const history=data.entries.filter(e=>day==='all'||dateOf(e.observed_at)===day).slice().sort((a,b)=>Date.parse(b.observed_at)-Date.parse(a.observed_at));
  return <TooltipProvider delay={300}>
    <main className={'hhh '+(!motion?'still ':'')+(panel?'panel-open':'')} data-testid="workbench">
      <div className="atmosphere" aria-hidden="true"><div className="ambient ambient-cool"/><div className="ambient ambient-warm"/><div className="refraction r-one"/><div className="refraction r-two"/></div>
      <header className="topbar">
        <button className="wordmark" onClick={()=>{setPanel(null);setDay('all');}} aria-label="HHH">HHH</button>
        <div className="top-actions">
          <IconControl label={w.language} onClick={()=>preference({lang:lang==='zh'?'en':'zh'})}><Globe2 strokeWidth={1.35}/><span className="language-indicator">{lang==='zh'?'EN':'中'}</span></IconControl>
          <IconControl label={w.history} onClick={()=>setPanel('history')} active={panel==='history'}><History strokeWidth={1.35}/></IconControl>
        </div>
      </header>
      <section className="stage" aria-label={w.now}>
        <div className="sheet-stack">
          <div className="under-sheet" aria-hidden="true"/>
          <article className="now-sheet glass" onPointerMove={e=>{
            if(!motion||e.pointerType==='touch')return;
            const r=e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
            e.currentTarget.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
          }}>
            <div className="orbital" aria-hidden="true"><i/><i/><i/><div className="caustic"/></div>
            <div className="sheet-copy" key={lang}>
              <button className="eyebrow" onClick={()=>detail(current.id)}><span className="status-point"/>{w.snapshot}<ArrowUpRight size={12}/></button>
              <h1>{w.title}</h1>
              <p className="hero-subtitle">{current.title[lang]}<span className="subtitle-divider">/</span>{w[current.status as keyof typeof w]}</p>
            </div>
            <div className="sheet-bottom">
              <div className="process-icons" aria-label={w.milestones}>
                <IconControl label={w.design} onClick={()=>detail('hhh-design')}><Sparkles strokeWidth={1.2}/></IconControl>
                <span className="hairline"/>
                <IconControl label={w.code} onClick={()=>detail(current.id)}><Code2 strokeWidth={1.2}/></IconControl>
                <span className="hairline"/>
                <IconControl label={w.milestones} onClick={()=>setPanel('milestones')}><CheckCheck strokeWidth={1.2}/></IconControl>
              </div>
              <button className="explore" onClick={()=>detail(current.id)} aria-label={w.detail}><ArrowUpRight strokeWidth={1.1}/></button>
            </div>
          </article>
        </div>
        <div className="strata" aria-label={w.history}>
          {visible.map((item,i)=><button key={item.id} className={'stratum glass stratum-'+i} style={{'--i':i} as CSSProperties} onClick={()=>detail(item.id)} aria-label={item.title[lang]+' / '+w[item.status as keyof typeof w]}>
            <span className={'stratum-mark '+item.status}><StatusMark status={item.status}/></span>
            <span className="stratum-title">{item.title[lang]}</span>
            <time dateTime={item.observed_at}>{dateLabel(item.observed_at)}<span> / </span>{timeLabel(item.observed_at)}</time>
            <ArrowRight className="row-arrow" size={18} strokeWidth={1.2}/>
          </button>)}
        </div>
      </section>
      <footer className="bottom-bar">
        <button className={'timestamp '+(network==='error'?'offline':'')} onClick={()=>setPanel('about')} title={fullDate(data.updated_at)+' · Australia/Sydney'}><span className="connection-dot"/>{w.updated} {timeLabel(data.updated_at)}<span className="sr-only"> {network==='error'?w.offline:w.timeNote}</span></button>
        <nav className="dock glass" aria-label="HHH">
          <IconControl label={w.home} onClick={()=>setPanel(null)} active={panel===null}><House strokeWidth={1.3}/></IconControl>
          <IconControl label={w.history} onClick={()=>setPanel('history')} active={panel==='history'}><Layers3 strokeWidth={1.3}/></IconControl>
          <IconControl label={w.milestones} onClick={()=>setPanel('milestones')} active={panel==='milestones'}><CheckCheck strokeWidth={1.3}/></IconControl>
          <IconControl label={w.about} onClick={()=>setPanel('about')} active={panel==='about'}><Info strokeWidth={1.3}/></IconControl>
        </nav>
        <div className="appearance">
          <IconControl label={motion?w.motion:w.resume} onClick={()=>preference({motion:!motion})} active={!motion}>{motion?<Pause strokeWidth={1.25}/>:<Play strokeWidth={1.25}/>}</IconControl>
          <IconControl label={night?w.light:w.dark} onClick={()=>preference({night:!night})}>{night?<Sun strokeWidth={1.25}/>:<Moon strokeWidth={1.25}/>}</IconControl>
        </div>
      </footer>
      <div className="announcement" aria-live="polite">{message?w[message as keyof typeof w]:''}</div>
      <Sheet open={panel!==null} onOpenChange={open=>{if(!open)setPanel(null);}}>
        <SheetContent className="detail-sheet glass" showCloseButton={false}>
          <SheetClose render={<Button variant="ghost" size="icon" className="close-sheet" aria-label={w.close}/> }><X strokeWidth={1.4}/></SheetClose>
          <SheetHeader>
            <span className="drawer-kicker">HHH / {panel==='detail'?entry.owner:w.readOnly}</span>
            <SheetTitle>{panel==='detail'?entry.title[lang]:panel==='history'?w.history:panel==='milestones'?w.milestones:w.about}</SheetTitle>
            <SheetDescription>{panel==='about'?w.aboutText:panel==='detail'?entry.detail[lang]:w.timeNote}</SheetDescription>
          </SheetHeader>
          <div className="drawer-body">
            {panel==='detail'?<>
              <div className="detail-meta"><span><StatusMark status={entry.status}/>{w[entry.status as keyof typeof w]}</span><time dateTime={entry.observed_at}>{fullDate(entry.observed_at)}</time></div>
              <div className="evidence"><ShieldCheck size={19} strokeWidth={1.2}/><div><h3>{w.evidence}</h3><p>{entry.evidence[lang]}</p></div></div>
              <p className="footnote">{w.timeNote}</p>
            </>:null}
            {panel==='history'?<>
              <div className="history-tools"><select aria-label={lang==='zh'?'选择日期':'Choose date'} value={day} onChange={e=>setDay(e.target.value)}><option value="all">{w.today}</option>{days.map(d=><option key={d} value={d}>{d}</option>)}</select><IconControl label={w.refresh} onClick={()=>refresh(true)}><RefreshCw size={17} className={network==='loading'?'spinning':''}/></IconControl></div>
              <ol className="timeline">{history.map(item=>{const Icon=kindIcons[item.kind as keyof typeof kindIcons];return <li key={item.id}><button onClick={()=>detail(item.id)}><span className="timeline-icon"><Icon size={18} strokeWidth={1.4}/></span><span><strong>{item.title[lang]}</strong><small>{timeLabel(item.observed_at)} · {item.owner} · {w[item.status as keyof typeof w]}</small></span><ArrowUpRight size={16}/></button></li>;})}</ol>
            </>:null}
            {panel==='milestones'?<>
              <div className="totals"><div><strong>{done}</strong><span>{w.done}</span></div><div><strong>{data.entries.length}</strong><span>{w.records}</span></div><div><strong>{days.length}</strong><span>{w.days}</span></div></div>
              <div className="milestone-list">{data.entries.map(item=><button key={item.id} onClick={()=>detail(item.id)}><StatusMark status={item.status}/><span>{item.title[lang]}</span><small>{w[item.status as keyof typeof w]}</small></button>)}</div>
            </>:null}
            {panel==='about'?<>
              <div className="evidence"><ShieldCheck size={21} strokeWidth={1.2}/><p>{w.privacy}</p></div>
              <p className="footnote">{w.timeNote}</p>
              <div className="about-record"><span>{w.updated}</span><time>{fullDate(data.updated_at)}</time><small>Australia/Sydney</small></div>
              <button className="text-action" onClick={()=>refresh(true)}><RefreshCw size={16}/>{network==='loading'?w.updating:w.refresh}<ArrowUpRight size={15}/></button>
              <a className="text-action" href="https://github.com/kennyscannotkillme/kennys.github.io/tree/main/HHH" target="_blank" rel="noopener noreferrer"><Code2 size={16}/>{w.source}<ExternalLink size={15}/></a>
              <p className="footnote keyboard-note">{w.keyboard}</p>
            </>:null}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  </TooltipProvider>;
}
