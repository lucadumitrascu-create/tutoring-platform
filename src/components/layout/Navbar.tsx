'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/types/database';

const studentLinks: { href: string; label: string }[] = [];
// Empty - all navigation is on dashboard cards

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAssignments, setPendingAssignments] = useState(0);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single() as { data: User | null };

      setUser(profile);

      // Count assignments without submissions for this student
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberships } = await (supabase as any)
        .from('group_members')
        .select('group_id')
        .eq('user_id', authUser.id) as { data: { group_id: string }[] | null };

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m) => m.group_id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: assignments } = await (supabase as any)
          .from('assignments')
          .select('id')
          .in('group_id', groupIds) as { data: { id: string }[] | null };

        if (assignments && assignments.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: submissions } = await (supabase as any)
            .from('assignment_submissions')
            .select('assignment_id')
            .eq('student_id', authUser.id) as { data: { assignment_id: string }[] | null };

          const submittedIds = new Set((submissions ?? []).map((s) => s.assignment_id));
          const pending = assignments.filter((a) => !submittedIds.has(a.id));
          setPendingAssignments(pending.length);
        }
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold text-primary-700 flex-shrink-0">
            TutorPlatform
          </Link>

          {/* Desktop links */}
          <div className="hidden sm:flex items-center gap-1">
            {studentLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {link.label}
                {(link.href === '/dashboard' || link.href === '/homework') && pendingAssignments > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {pendingAssignments}
                  </span>
                )}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 min-h-[44px] flex items-center rounded-lg text-sm font-medium transition-all active:scale-95 ${
                  pathname.startsWith('/admin')
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Panou Admin
              </Link>
            )}
          </div>

          {/* Right: User + logout */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Student'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2 min-h-[44px] rounded-lg hover:bg-gray-100 transition-all active:scale-95"
            >
              Deconectare
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 active:scale-95 transition-all relative"
          >
            {pendingAssignments > 0 && !menuOpen && (
              <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full" />
            )}
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-out ${menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pb-4 border-t border-gray-100 mt-2 pt-3">
            <div className="space-y-1">
              {studentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors active:scale-95 ${
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                  {link.href === '/dashboard' && pendingAssignments > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                      {pendingAssignments}
                    </span>
                  )}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors active:scale-95 ${
                    pathname.startsWith('/admin')
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Panou Admin
                </Link>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 px-3">
              <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
              <p className="text-xs text-gray-400 mb-3">{user?.email}</p>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 font-medium py-2 min-h-[44px] active:scale-95 transition-all"
              >
                Deconectare
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
