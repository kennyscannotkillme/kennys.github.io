// Public activity is an explicit, curated snapshot; never a process heartbeat.
export const allowedStatus = ['active', 'done', 'queued', 'blocked'];
const allowedKeys = new Set(['version', 'updated_at', 'timezone', 'current_id', 'entries']);
const entryKeys = new Set(['id', 'observed_at', 'kind', 'status', 'owner', 'title', 'detail', 'evidence']);
const safeString = (s) => typeof s === 'string' && s.length < 1500 && !/(?:[A-Z]:[\\/]|file:\/\/|Bearer\s+|(?:api[_-]?key|password|cookie|access[_-]?token)\s*[:=])/i.test(s);
const translated = (v) => v && Object.keys(v).length === 2 && safeString(v.zh) && safeString(v.en);
export function validateActivity(data) {
  if (!data || Object.keys(data).some(k => !allowedKeys.has(k)) || data.version !== 1 ||
      !Number.isFinite(Date.parse(data.updated_at)) || data.timezone !== 'Australia/Sydney' ||
      !Array.isArray(data.entries) || data.entries.length > 300) return false;
  const ids = new Set();
  for (const e of data.entries) {
    if (!e || typeof e !== 'object' || Object.keys(e).some(k => !entryKeys.has(k)) || !/^[a-z0-9-]+$/.test(e.id) || ids.has(e.id) ||
        !Number.isFinite(Date.parse(e.observed_at)) || Date.parse(e.observed_at) > Date.parse(data.updated_at) ||
        !allowedStatus.includes(e.status) || !['design','code','test','research','publish'].includes(e.kind) ||
        !['Codex','Claude','Python'].includes(e.owner) || !translated(e.title) ||
        !translated(e.detail) || !translated(e.evidence)) return false;
    ids.add(e.id);
  }
  return ids.has(data.current_id);
}
export function activityDays(data) {
  return [...new Set(data.entries.map(e => new Intl.DateTimeFormat('en-CA', { timeZone: data.timezone, year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date(e.observed_at))))];
}
