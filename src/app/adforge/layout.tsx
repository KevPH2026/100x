import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100x — DTC广告素材，100倍效率',
  description: '上传品牌信息，AI自动生成多平台广告素材。30秒，8张，即拿即用。',
  icons: { icon: '/favicon.svg' },
};

export default function AdForgeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
