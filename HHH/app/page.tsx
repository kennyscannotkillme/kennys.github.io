'use client';
/**
 * HHH 工作区入口。
 *
 * 默认进入新的六模块研究终端（components/terminal-workbench.tsx）。
 * 原有的策略净值 / 工作记录 / 原工作区 / 研究来源页面完整保留在
 * components/legacy-workbench.tsx，由终端右上角的「旧版工作台」进入。
 */
import TerminalWorkbench from '@/components/terminal-workbench';

export default function Home() {
  return <TerminalWorkbench />;
}
