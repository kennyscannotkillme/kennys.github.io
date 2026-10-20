'use client';
/**
 * HHH 研究终端 — 外壳与七个模块的路由
 *
 * 顶部固定导航：总览 / 每日预测 / 产业全景 / 量化研究 / 策略表现 / 公司研究 / 研究证据。
 * 策略、主题、公司三项选择由本组件集中持有，切换模块时不会被重置。
 * 旧版工作台（策略净值 / 工作记录 / 原工作区 / 研究来源）保留为辅助入口。
 *
 * 路由与 URL hash 双向同步：#daily、#industry 等可直接深链并支持刷新恢复；
 * 默认模块仍是总览（无 hash 时），未知 hash 不改变当前模块。
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  Aperture,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  FileCheck2,
  FlaskConical,
  LayoutGrid,
  Network,
} from 'lucide-react';
import Dashboard from '@/components/hhh-dashboard';
import DailyForecast from '@/components/hhh-daily-forecast';
import IndustryResearch from '@/components/industry-research';
import QuantLab from '@/components/hhh-quant-lab';
import Portfolio from '@/components/hhh-portfolio';
import CompanyResearch from '@/components/hhh-company';
import Evidence from '@/components/hhh-evidence';
import LegacyWorkbench from '@/components/legacy-workbench';
import {
  analytics,
  companies,
  day,
  defaultStrategyId,
  industry,
  stampUtc,
  strategyById,
  themes,
} from '@/components/hhh-data';

type Route = 'dashboard' | 'daily' | 'industry' | 'quant' | 'portfolio' | 'company' | 'evidence';

const ROUTES: { id: Route; label: string; en: string; icon: typeof LayoutGrid }[] = [
  { id: 'dashboard', label: '总览', en: 'Dashboard', icon: LayoutGrid },
  { id: 'daily', label: '每日预测', en: 'Daily Forecast', icon: CalendarDays },
  { id: 'industry', label: '产业全景', en: 'Industry', icon: Network },
  { id: 'quant', label: '量化研究', en: 'Quant Lab', icon: FlaskConical },
  { id: 'portfolio', label: '策略表现', en: 'Portfolio', icon: ChartNoAxesCombined },
  { id: 'company', label: '公司研究', en: 'Company', icon: Building2 },
  { id: 'evidence', label: '研究证据', en: 'Evidence', icon: FileCheck2 },
];

function isRoute(v: string): v is Route {
  return ROUTES.some((r) => r.id === v);
}

function subscribeRoute(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}
function currentRoute(): Route {
  const hash = window.location.hash.slice(1);
  return isRoute(hash) ? hash : 'dashboard';
}
function setRoute(route: Route) {
  window.location.hash = route === 'dashboard' ? '' : route;
}

export default function TerminalWorkbench() {
  const route = useSyncExternalStore(subscribeRoute, currentRoute, (): Route => 'dashboard');
  const [strategyId, setStrategyId] = useState(defaultStrategyId);
  const [themeId, setThemeId] = useState(themes.find(t => t.id === 'photonics')?.id ?? themes[0]?.id ?? '');
  const [ticker, setTicker] = useState(companies[0]?.ticker ?? '');
  const [legacy, setLegacy] = useState(false);

  /* 旧版工作台会切换 html 的 dark/lang；离开时恢复终端的浅色排版 */
  useEffect(() => {
    if (!legacy) {
      document.documentElement.classList.remove('dark');
      document.documentElement.lang = 'zh-CN';
    }
  }, [legacy]);

  useEffect(() => {
    if (route !== 'dashboard') window.scrollTo({ top: 0, behavior: 'auto' });
  }, [route]);

  const go = useCallback((next: string) => {
    if (isRoute(next)) setRoute(next);
  }, []);

  const openCompany = useCallback((t: string) => {
    setTicker(t);
    setRoute('company');
  }, []);

  if (legacy) return <LegacyWorkbench onExit={() => setLegacy(false)} />;

  const strategy = strategyById(strategyId);

  return (
    <div className="tm-shell" data-testid="hhh-terminal">
      <header className="tm-topbar">
        <div className="tm-brand">
          <Aperture size={18} strokeWidth={1.3} aria-hidden="true" />
          <span className="tm-wordmark">HHH</span>
          <span className="tm-brand-sub">研究终端</span>
        </div>
        <nav className="tm-nav" aria-label="主导航">
          {ROUTES.map((r) => (
            <button
              key={r.id}
              type="button"
              className={'tm-navitem' + (route === r.id ? ' is-active' : '')}
              aria-current={route === r.id ? 'page' : undefined}
              title={r.en}
              onClick={() => setRoute(r.id)}
            >
              <r.icon size={14} strokeWidth={1.5} aria-hidden="true" />
              <span>{r.label}</span>
            </button>
          ))}
        </nav>
        <div className="tm-topmeta">
          <span title="模拟账本数据截止日，不是导出时间">账本至 {day(strategy?.data_as_of)}</span>
          <span className="tm-dot" aria-hidden="true" />
          <span title="产业研究数据截止日">产业至 {day(industry?.as_of)}</span>
          <span className="tm-dot" aria-hidden="true" />
          <span title="本快照的生成时间，与数据截止日不同">导出 {stampUtc(analytics?.generated_at)}</span>
          <button type="button" className="tm-legacy" onClick={() => setLegacy(true)}>
            旧版工作台
          </button>
        </div>
      </header>

      <main className="tm-main" id="tm-main">
        {route === 'dashboard' ? (
          <Dashboard strategy={strategy} strategyId={strategyId} onStrategy={setStrategyId} onRoute={go} />
        ) : null}
        {route === 'daily' ? <DailyForecast onRoute={go} /> : null}
        {route === 'industry' ? (
          <IndustryResearch key={themeId} themeId={themeId} onTheme={setThemeId} onCompany={openCompany} onRoute={go} />
        ) : null}
        {route === 'quant' ? <QuantLab strategyId={strategyId} onStrategy={setStrategyId} onRoute={go} /> : null}
        {route === 'portfolio' ? (
          <Portfolio key={strategyId} strategy={strategy} strategyId={strategyId} onStrategy={setStrategyId} onRoute={go} />
        ) : null}
        {route === 'company' ? <CompanyResearch ticker={ticker} onTicker={setTicker} onRoute={go} /> : null}
        {route === 'evidence' ? <Evidence /> : null}
      </main>

      <footer className="tm-footer">
        <span>HHH · 数据日期见各栏目</span>
        <button type="button" className="tm-link" onClick={() => setRoute('evidence')}>
          查看证据、局限与可复现命令
        </button>
      </footer>
    </div>
  );
}
