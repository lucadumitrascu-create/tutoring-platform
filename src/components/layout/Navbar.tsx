'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/types/database';

const studentLinks = [
  { href: '/dashboard', label: 'Acasă' },
  { href: '/groups', label: 'Grupuri' },
  { href: '/homework', label: 'Teme' },
  { href: '/profile', label: 'Profil' },
];

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
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', authUser.id) as { data: { group_id: string }[] | null };

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m) => m.group_id);
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .in('group_id', groupIds) as { data: { id: string }[] | null };

        if (assignments && assignments.length > 0) {
          const { data: submissions } = await supabase
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
    <nav className="sticky top-0 z-50 bg-paper border-b border-sketch">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="text-xl font-bold font-hand text-sketch-dark flex-shrink-0">
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
                    ? 'bg-[#f0e8d8] text-sketch-dark'
                    : 'text-ink-light hover:bg-[#f0e8d8] hover:text-ink'
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
                    ? 'bg-[#f0e8d8] text-sketch-dark'
                    : 'text-ink-light hover:bg-[#f0e8d8] hover:text-ink'
                }`}
              >
                Panou Admin
              </Link>
            )}
          </div>

          {/* Right: User + logout */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-ink">{user?.full_name || 'Student'}</p>
              <p className="text-xs text-ink-muted">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-ink-lighter hover:text-ink font-medium px-3 py-2 min-h-[44px] rounded-lg hover:bg-[#f0e8d8] transition-all active:scale-95"
            >
              Deconectare
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink-lighter hover:bg-[#f0e8d8] active:scale-95 transition-all relative"
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
          <div className="pb-4 border-t border-sketch-light mt-2 pt-3">
            <div className="space-y-1">
              {studentLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors active:scale-95 ${
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'bg-[#f0e8d8] text-sketch-dark'
                      : 'text-ink-light hover:bg-[#f0e8d8]'
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
                      ? 'bg-[#f0e8d8] text-sketch-dark'
                      : 'text-ink-light hover:bg-[#f0e8d8]'
                  }`}
                >
                  Panou Admin
                </Link>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-sketch-light px-3">
              <p className="text-sm font-medium text-ink">{user?.full_name}</p>
              <p className="text-xs text-ink-muted mb-3">{user?.email}</p>
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
