'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAnalysisRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/analytics');
  }, [router]);

  return null;
}
