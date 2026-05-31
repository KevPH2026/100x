import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100x — DTC广告素材，100倍效率',
  description: '上传品牌信息，AI自动生成多平台广告素材。不是贴Logo，是理解你的品牌。',
  icons: { icon: '/favicon.svg' },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
