'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyAuditLogsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/audit-logs');
  }, [router]);

  return null;
}
