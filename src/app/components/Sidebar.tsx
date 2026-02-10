'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiBarChart2, FiBookOpen, FiSettings, FiShield } from 'react-icons/fi';
import { FaBook } from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: FiGrid, name: 'Dashboard', path: '/' },
    // { icon: FiBarChart2, name: 'Analytics', path: '/analytics' },
    { icon: FiBookOpen, name: 'My Books', path: '/books' },
    { icon: FiSettings, name: 'Settings', path: '/settings' },
  ];

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-24 p-4 transition-all duration-300 ease-in-out hover:w-80 md:block group">
        <div className="flex h-full flex-col rounded-[28px] bg-surface-container py-6 text-on-surface overflow-hidden shadow-lg border border-outline-variant/30">
          <div className="mb-8 flex items-center h-12">
            <div className="flex h-12 w-16 shrink-0 items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-sm">
                <FaBook className="text-xl" />
              </div>
            </div>
            <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap ml-2">
              <h1 className="text-lg font-bold tracking-tight text-on-surface">Expense Pilot</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center rounded-full h-12 transition-all duration-200 overflow-hidden ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center ml-1">
                    <item.icon className="text-2xl" />
                  </div>
                  <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap ml-4 font-medium">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="rounded-[20px] bg-tertiary-container p-5 text-on-tertiary-container shadow-inner">
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">Pro Tip</p>
              <p className="mt-2 text-sm leading-relaxed">
                Separate your expenses into different books for cleaner analytics.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline-variant bg-surface-container-low px-2 pb-4 pt-2 md:hidden">
        <div className="grid grid-cols-4 gap-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className="group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 transition-colors"
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant group-hover:bg-surface-container-highest'
                  }`}
                >
                  <item.icon className="text-lg" />
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isActive ? 'text-on-surface' : 'text-on-surface-variant'
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
