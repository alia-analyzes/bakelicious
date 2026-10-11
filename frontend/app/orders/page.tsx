'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/orders');
  }, [router]);

  return null;
}
