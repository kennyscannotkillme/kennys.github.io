import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'HHH',
  description: 'Work, made visible. / 让工作可见。',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
