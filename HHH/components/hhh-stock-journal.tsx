'use client';
import { useEffect, useState } from 'react';
import { TableScroll } from './hhh-ui';

type Horizon = { days:number; exit_date:string; exit_close?:number|null; realized_return?:number|null; status?:string };
type Candidate = { ticker:string; name:string; sector_name?:string; coverage_note?:string; rank:number|null; score:number|null; reference_close:number|null; expected_return?:number|null; selected?:boolean };
type RecordRow = {id:string;created_at:string;signal_date:string;entry_date:string;ranked_count?:number;risk_on?:boolean;horizons:Horizon[];candidates:Candidate[]};
type Observation = {forecast_id:string;as_of:string;items:{ticker:string;entry_open:number|null;current_return:number|null;status:string;horizons:Horizon[]}[]};
type Journal = {method:{id:string;label:string;description:string;return_basis:string};universe_count?:number;records:RecordRow[];observations:Observation[]};
const date = (s?:string) => s && /^\d{8}$/.test(s) ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6)}` : s || '—';
const number = (n?:number|null) => typeof n==='number' && Number.isFinite(n) ? n.toFixed(2) : '—';
const percent = (n?:number|null) => typeof n==='number' && Number.isFinite(n) ? `${n>0?'+':''}${(n*100).toFixed(2)}%` : '待行情';
const states:Record<string,string> = {WaitingEntry:'等待入场日',Tracking:'跟踪中',Completed:'已到期',Unavailable:'行情缺失'};

export default function StockJournal({etf=false}:{etf?:boolean}) {
 const [data,setData]=useState<Journal|null>(null);
 const [error,setError]=useState(false);
 const [selected,setSelected]=useState('');
 const [horizon,setHorizon]=useState(1);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const controller=new AbortController();
  fetch(etf?'./etf-forecast.json':'./all-a-daily.json',{cache:'no-store',signal:controller.signal})
   .then(r=>{if(!r.ok)throw Error();return r.json()})
   .then(value=>{const j=value as Journal;if(!j||!Array.isArray(j.records)||!Array.isArray(j.observations))throw Error();setData(j);setError(false)})
   .catch(e=>{if(e.name!=='AbortError')setError(true)});
  return ()=>controller.abort();
 },[etf,retry]);
 const price=(n?:number|null)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(etf?3:2):'—';
 const record=data?.records.find(r=>r.id===selected)??data?.records[0];
 const obs=data?.observations.filter(o=>o.forecast_id===record?.id).sort((a,b)=>b.as_of.localeCompare(a.as_of))[0];
 const candidates=record?.candidates.filter(c=>c.rank!=null).slice(0,5)??[];
 const count=record?.ranked_count??data?.universe_count;
 return <section className="stock-journal" aria-label={etf?'板块ETF观察':'全A股每日选股'}>
  <div className="stock-heading"><div><h1>{etf?'板块 ETF 观察':'全 A 股 · 每日选股'}</h1><p>{etf?'板块归属与代表 ETF，单独查看':'在沪、深、北 A 股中筛选；重点行业不限制选股范围'}</p></div>
   {record&&<label>历史记录<select aria-label={etf?'ETF历史记录':'全A股历史记录'} value={record.id} onChange={e=>setSelected(e.target.value)}>{data?.records.map(r=><option value={r.id} key={r.id}>行情 {date(r.signal_date)} → T {date(r.entry_date)}</option>)}</select></label>}
  </div>
  {!record&&<output>{error?'暂时无法读取本栏数据。':'正在读取记录…'}{error&&<button onClick={()=>setRetry(n=>n+1)}>重新读取</button>}</output>}
  {record&&<>
   <div className="stock-dates"><div><span>行情截至</span><strong>{date(record.signal_date)}</strong></div><div><span>入场日 T</span><strong>{date(record.entry_date)}</strong></div><div><span>{etf?'观察 ETF':'参与排名'}</span><strong>{count??'—'} {etf?'只':'股'}</strong></div><div><span>规则</span><strong>{data?.method.id}</strong></div></div>
   {!etf&&<p className="stock-status">综合分排名，满分 100。现有模型未提供预期收益率；下方三个期限跟踪同一批股票的到期收益。{record.risk_on===false?'当前模型状态：空仓观察。':''}</p>}
   <div className="stock-tabs" aria-label="退出期限">{[1,3,5].map(d=><button key={d} aria-pressed={horizon===d} onClick={()=>setHorizon(d)}>T+{d} 卖出</button>)}</div>
   <div className="stock-horizons">{record.horizons.map(h=><section className={`stock-horizon ${horizon!==h.days?'is-mobile-hidden':''}`} key={h.days} aria-label={`${etf?'ETF ':''}T+${h.days}卖出`}>
    <header><h2>T+{h.days} 卖出</h2><span>{date(h.exit_date)}</span></header>
    {candidates.map(c=>{const item=obs?.items.find(x=>x.ticker===c.ticker);const result=item?.horizons.find(x=>x.days===h.days);return <article className="stock-pick" key={c.ticker}>
     <div className="stock-pick-top"><div className="stock-pick-name">{c.rank}. {etf?c.sector_name:c.name}<small>{c.ticker}{etf?` / ${c.name}`:''}</small></div><div className="stock-score">{number(c.score)}<small>{etf?'趋势分':'综合分'} / 100</small></div></div>
     <dl><div><dt>信号日参考价</dt><dd>¥ {price(c.reference_close)}</dd></div><div><dt>入场日开盘价</dt><dd>{item?.entry_open!=null?`¥ ${price(item.entry_open)}`:'等待开盘'}</dd></div><div><dt>当前价格收益</dt><dd>{percent(item?.current_return)}</dd></div><div><dt>T+{h.days} 到期收益</dt><dd>{percent(result?.realized_return)}</dd></div></dl>
     <p className="tm-foot">{states[result?.status??item?.status??'WaitingEntry']??'行情缺失'}</p>
    </article>})}
   </section>)}</div>
   <details className="research-archive"><summary>{etf?'查看板块与 ETF 完整目录':'查看前 20 名与当时参考价格'}</summary><TableScroll label={etf?'ETF完整目录':'全市场综合排名'}><table className="tm-table"><thead><tr><th>排名</th><th>{etf?'板块 / ETF':'股票'}</th><th>代码</th><th>分数</th><th>参考价</th></tr></thead><tbody>{record.candidates.map(c=><tr key={c.ticker}><td>{c.rank??'—'}</td><th scope="row">{etf?c.sector_name:c.name}{etf&&<small className="tm-muted" style={{display:'block'}}>{c.name}{c.coverage_note?` · ${c.coverage_note}`:''}</small>}</th><td>{c.ticker}</td><td>{number(c.score)}</td><td>{price(c.reference_close)}</td></tr>)}</tbody></table></TableScroll></details>
   <details className="stock-notes"><summary>计算方式与记录时间</summary><p>{data?.method.description}</p><p>T 为下一未开盘交易日，T+1／3／5 为此后第 1／3／5 个交易日。{data?.method.return_basis}</p><p>记录生成于 {record.created_at}。{obs?`结果行情截至 ${date(obs.as_of)}。`:''}日期记录保留当时分数与价格，后续行情另存结果。</p></details>
  </>}
 </section>;
}
