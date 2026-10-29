'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getStoredUser } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getStoredUser();
      if (user?.primary_role?.toLowerCase() === 'baker' && !user.is_superadmin) {
        router.replace('/admin/production');
      } else {
        router.replace('/admin/dashboard');
      }
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-maroon-950 dark:border-cream-100 bg-cream-50 dark:bg-maroon-900 p-2 shadow-neo flex items-center justify-center overflow-hidden">
          <img src="/logo.svg" alt="Bakelicious ERP" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-black text-maroon-950 dark:text-cream-100 font-serif tracking-tight">
          Bakelicious ERP
        </h1>
        <p className="text-xs font-bold text-maroon-700 dark:text-cream-300 uppercase tracking-widest">
          Loading Management System...
        </p>
      </div>
    </div>
  );
}
