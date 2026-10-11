'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyProductionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/production');
  }, [router]);

  return null;
}
