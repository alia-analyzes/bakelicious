'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyClientsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/clients');
  }, [router]);

  return null;
}
