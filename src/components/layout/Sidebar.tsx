'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/types/database';

const adminLinks = [
  {
    href: '/admin',
    label: 'Panou',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    exact: true,
  },
  {
    href: '/admin/groups',
    label: 'Grupuri',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    href: '/admin/materials',
    label: 'Materiale',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
  },
  {
    href: '/admin/assignments',
    label: 'Teme',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
      </svg>
    ),
  },
  {
    href: '/admin/students',
    label: 'Elevi',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
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
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const isActive = (link: typeof adminLinks[0]) => {
    if (link.exact) return pathname === link.href;
    return pathname === link.href || pathname.startsWith(link.href + '/');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/admin" className="text-xl font-bold font-hand text-sketch-dark">
          TutorPlatform
        </Link>
        <p className="text-xs text-ink-muted mt-0.5">Panou Admin</p>
      </div>

      {/* Links */}
      <div className="flex-1 px-3 space-y-1">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97] ${
              isActive(link)
                ? 'bg-[#f0e8d8] text-sketch-dark'
                : 'text-ink-light hover:bg-[#f0e8d8] hover:text-ink'
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>

      {/* User info + logout */}
      <div className="p-4 border-t border-sketch">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#f0e8d8] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-sketch-dark">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.full_name || 'Admin'}</p>
            <p className="text-xs text-ink-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 w-full text-left text-sm text-ink-lighter hover:text-red-600 font-medium px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-[#f0e8d8] transition-all duration-150 active:scale-[0.97]"
        >
          Deconectare
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-paper border-b border-sketch flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="text-lg font-bold font-hand text-sketch-dark">
          TutorPlatform
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-ink-lighter hover:bg-[#f0e8d8] transition-colors active:scale-95"
        >
          {mobileOpen ? (
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

      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${mobileOpen ? 'bg-black/30 pointer-events-auto' : 'bg-transparent pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-paper border-r border-sketch flex flex-col transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-paper border-r border-sketch">
        {sidebarContent}
      </aside>
    </>
  );
}
