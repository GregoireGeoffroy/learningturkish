"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, // Learn
  PenTool, // Practice
  Trophy, // Leaderboards
  Target, // Quests
  ShoppingBag, // Shop
  User, // Profile
  Settings, // Settings
  HelpCircle, // Help
  LogIn,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: 'Learn', href: '/learn', icon: BookOpen },
  { label: 'Practice', href: '/practice', icon: PenTool },
  { label: 'Leaderboards', href: '/leaderboards', icon: Trophy },
  { label: 'Quests', href: '/quests', icon: Target },
  { label: 'Shop', href: '/shop', icon: ShoppingBag },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Replace with your auth logic
  const pathname = usePathname();

  const handleToggleSidebar = () => setIsOpen(!isOpen);
  const handleLogin = () => setIsLoggedIn(!isLoggedIn);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={handleToggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary-600 lg:hidden"
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gray-50 dark:bg-gray-900
          transition-all duration-300 ease-in-out z-40
          ${isOpen ? 'w-64' : 'w-0 lg:w-16'}
          border-r border-gray-200 dark:border-gray-700
        `}
      >
        <nav className="h-full pt-16 pb-4 px-4 flex flex-col">
          {/* Navigation Items */}
          <div className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-4 px-3 py-2 rounded-lg
                    transition-colors duration-200
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-primary-600' : ''}
                  `}
                  tabIndex={0}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={20} />
                  <span className={`${!isOpen && 'lg:hidden'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Auth Button */}
          <button
            onClick={handleLogin}
            className="flex items-center gap-4 px-3 py-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200"
            tabIndex={0}
            aria-label={isLoggedIn ? 'Log out' : 'Log in'}
          >
            {isLoggedIn ? <LogOut size={20} /> : <LogIn size={20} />}
            <span className={`${!isOpen && 'lg:hidden'}`}>
              {isLoggedIn ? 'Log out' : 'Log in'}
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar; 