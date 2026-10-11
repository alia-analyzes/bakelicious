'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getStoredUser, hasPermission, hasAnyPermission, isSuperAdmin, isBaker, refreshUserProfile, logout } from '@/lib/auth';
import { ShieldAlert, ArrowLeft, Home, LogOut, ChefHat } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredAnyPermission?: string[];
  superAdminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredAnyPermission,
  superAdminOnly
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [authorized, setAuthorized] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.push('/admin/login');
        return;
      }

      let user = getStoredUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // If user data in localStorage is from before migration or missing effective_permissions, refresh from server
      if (!user.effective_permissions && !user.is_superadmin) {
        const refreshed = await refreshUserProfile();
        if (refreshed) {
          user = refreshed;
        }
      }

      setUserRole(user.primary_role || user.role || 'Staff');

      // If a Baker lands on the main business dashboard, redirect them automatically to their Kitchen Workspace
      if (isBaker() && pathname === '/admin/dashboard') {
        router.replace('/admin/production');
        return;
      }

      // Super Admin bypasses all checks
      if (isSuperAdmin()) {
        setAuthorized(true);
        setAuthed(true);
        return;
      }

      // Permission checks
      if (superAdminOnly && !isSuperAdmin()) {
        setAuthorized(false);
        setAuthed(true);
        return;
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        setAuthorized(false);
        setAuthed(true);
        return;
      }

      if (requiredAnyPermission && requiredAnyPermission.length > 0 && !hasAnyPermission(requiredAnyPermission)) {
        setAuthorized(false);
        setAuthed(true);
        return;
      }

      setAuthorized(true);
      setAuthed(true);
    };

    checkAuth();
  }, [router, pathname, requiredPermission, requiredAnyPermission, superAdminOnly]);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-maroon-700 dark:border-cream-100 border-t-transparent"></div>
          <p className="text-xs font-bold text-maroon-900 dark:text-cream-200">Verifying Security &amp; Permissions...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-cream-200 dark:bg-maroon-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-cream-100 dark:bg-maroon-900 rounded-3xl p-8 border border-cream-300 dark:border-maroon-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 mx-auto flex items-center justify-center border border-rose-300 dark:border-rose-800 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-maroon-100 dark:bg-maroon-800 text-maroon-900 dark:text-cream-200 border border-maroon-300 dark:border-maroon-700 uppercase tracking-wider inline-block mb-2">
              Logged in as: {userRole}
            </span>
            <h2 className="text-2xl font-black font-serif text-maroon-950 dark:text-cream-100">
              Access Restricted
            </h2>
            <p className="text-xs text-charcoal-muted dark:text-cream-300/80 font-medium mt-1">
              Your account (<strong>{userRole}</strong>) does not have permission to view or manage this section of the Bakelicious ERP. Please switch accounts or log in as Super Admin.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5 justify-center">
            {isBaker() && (
              <Link
                href="/admin/production"
                className="px-4 py-2.5 bg-maroon-700 hover:bg-maroon-800 text-cream-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <ChefHat className="w-4 h-4" />
                <span>Go to Kitchen Baking Queue</span>
              </Link>
            )}

            <button
              onClick={logout}
              className="px-4 py-2.5 bg-cream-200 dark:bg-maroon-800 hover:bg-cream-300 dark:hover:bg-maroon-700 text-maroon-900 dark:text-cream-100 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-cream-300 dark:border-maroon-700"
            >
              <LogOut className="w-4 h-4 text-maroon-700 dark:text-cream-300" />
              <span>Sign In with a Different Account (e.g. Super Admin)</span>
            </button>

            <Link
              href="/"
              className="text-[11px] font-bold text-charcoal-muted dark:text-cream-300/70 hover:underline pt-1"
            >
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
