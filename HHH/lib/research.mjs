export function validateResearch(v) {
  if (!v || v.version !== 1 || v.scope !== 'PUBLIC_SIMULATED_RESEARCH_ONLY' || v.live_ordering !== false || !Array.isArray(v.candidates)) return false;
  if (!v.operations || !/^\d{8}$/.test(v.operations.entry_date) || !/^\d{8}$/.test(v.operations.daily_max_date) || !/^\d{8}$/.test(v.operations.minute_max_date)) return false;
  if (v.objective?.universe !== 'ALL_A_SHARES' || v.objective?.benchmark !== '000688.SH') return false;
  const ids = new Set();
  return v.candidates.every(c => {
    if (!['gen2','s2','s3','g1'].includes(c.id) || ids.has(c.id) || c.automated_ordering !== false || !Array.isArray(c.curve)) return false;
    ids.add(c.id);
    if (!['NORMALIZED_UNITS_NOT_CNY','CNY_SIMULATED_CAPITAL'].includes(c.basis) || !/^\d{8}$/.test(c.data_as_of) || !c.metrics) return false;
    if (c.status === 'LEDGER_DATA_BLOCKED' && c.curve.length) return false;
    let prev = '';
    return c.curve.every(p => { const ok = /^\d{8}$/.test(p.date) && p.date > prev && Number.isFinite(p.strategy) && Number.isFinite(p.benchmark); prev=p.date; return ok; });
  });
}
export function privateWorkspaceUrl(hostname, slug) {
  const pages = ['overview','ibkr','a-share','ai-quant','shadow-demo','daily-review','global-market-data','global-analysis','ibkr-quality','a-share-quality','audit','settings'];
  return ['localhost','127.0.0.1','[::1]'].includes(hostname) && pages.includes(slug) ? `http://localhost:8501/?page=${slug}&hhh_embed=1` : null;
}
export function chartPaths(points, showBenchmark=true) {
  if (!points.length) return null;
  const values=points.flatMap(p=>showBenchmark?[p.strategy,p.benchmark]:[p.strategy]);
  const lo=Math.min(0,...values),hi=Math.max(0,...values),span=hi-lo||1;
  const y=v=>228-(v-lo)/span*190, x=i=>12+i/Math.max(1,points.length-1)*776;
  const line=key=>points.map((p,i)=>`${i?'L':'M'}${x(i).toFixed(2)},${y(p[key]).toFixed(2)}`).join(' ');
  return {strategy:line('strategy'),benchmark:line('benchmark'),zero:y(0),x,y};
}
