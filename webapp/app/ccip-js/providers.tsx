'use client';

import { ReactNode } from 'react';
import { ConfigProvider } from '@/components/ConfigProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}
