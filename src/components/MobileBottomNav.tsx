'use client';

import {
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  RectangleStackIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { FC } from 'react';

interface MobileBottomNavProps {
  activeNavItem: string;
  onNavChange: (item: string) => void;
}

const MobileBottomNav: FC<MobileBottomNavProps> = ({
  activeNavItem,
  onNavChange,
}) => {
  const navItems = [
    {
      id: 'Clients',
      label: 'Clients',
      icon: UserGroupIcon,
      ariaLabel: 'Navigate to Clients',
    },
    {
      id: 'Projects',
      label: 'Projects',
      icon: RectangleStackIcon,
      ariaLabel: 'Navigate to Projects',
    },
    {
      id: 'Tasks',
      label: 'Tasks',
      icon: ClipboardDocumentListIcon,
      ariaLabel: 'Navigate to Tasks',
    },
    {
      id: 'Notes',
      label: 'Notes',
      icon: DocumentTextIcon,
      ariaLabel: 'Navigate to Notes',
    },
    {
      id: 'Calendar',
      label: 'Calendar',
      icon: CalendarIcon,
      ariaLabel: 'Navigate to Calendar',
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation - Only visible on small screens */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-3 shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-950 dark:shadow-slate-950/50 md:hidden"
        aria-label="Mobile navigation"
        role="navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNavItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavChange(item.id)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-all ${
                isActive
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/50'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Spacer to prevent content from being hidden under fixed nav */}
      <div className="h-20 md:hidden" />
    </>
  );
};

export default MobileBottomNav;
