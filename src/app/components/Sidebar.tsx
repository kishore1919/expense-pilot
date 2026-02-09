'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiBarChart2, FiBookOpen, FiSettings } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: FiGrid, name: 'Dashboard', path: '/' },
    { icon: FiBarChart2, name: 'Analytics', path: '/analytics' },
    { icon: FiBookOpen, name: 'My Books', path: '/books' },
    { icon: FiSettings, name: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 p-5 md:block">
        <div className="surface-strong flex h-full flex-col p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <FaBook className="text-xl" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Expense Pilot</h1>
              <p className="text-xs text-slate-500">Track spending with clarity</p>
            </div>
          </div>

          <nav className="mt-8 flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-[0_12px_25px_rgba(15,118,110,0.35)]'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="text-lg" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Tip</p>
            <p className="mt-2 text-sm text-slate-700">Create one book per budget. It keeps analytics cleaner.</p>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-3 left-3 right-3 z-40 md:hidden">
        <div className="surface-strong grid grid-cols-4 gap-2 p-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-semibold transition ${
                  isActive ? 'bg-teal-700 text-white' : 'text-slate-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="mb-1 text-base" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
