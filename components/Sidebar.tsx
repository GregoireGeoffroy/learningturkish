"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
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
  X,
  Shield // Admin
} from 'lucide-react';
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
};

// Replace this with your actual admin email
const ADMIN_EMAILS = ['test1@test.com']; // The email you use to log in

const navItems: NavItem[] = [
  { label: 'Learn', href: '/learn', icon: BookOpen, requiresAuth: true },
  { label: 'Practice', href: '/practice', icon: PenTool, requiresAuth: true },
  { label: 'Leaderboards', href: '/leaderboards', icon: Trophy, requiresAuth: true },
  { label: 'Quests', href: '/quests', icon: Target, requiresAuth: true },
  { label: 'Shop', href: '/shop', icon: ShoppingBag, requiresAuth: true },
  { label: 'Profile', href: '/profile', icon: User, requiresAuth: true },
  { label: 'Settings', href: '/settings', icon: Settings, requiresAuth: true },
  { label: 'Help', href: '/help', icon: HelpCircle, requiresAuth: false },
  { label: 'Admin', href: '/admin/lessons', icon: Shield, requiresAuth: true, requiresAdmin: true },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleToggleSidebar = () => setIsOpen(!isOpen);
  
  const handleAuth = async () => {
    if (user) {
      await signOut();
    } else {
      router.push('/auth/login');
    }
  };

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  // Filter nav items based on auth state and admin status
  const visibleNavItems = navItems.filter(item => 
    (!item.requiresAuth || user) && (!item.requiresAdmin || isAdmin)
  );

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
            {visibleNavItems.map((item) => {
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
            onClick={handleAuth}
            className="flex items-center gap-4 px-3 py-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors duration-200"
            tabIndex={0}
            aria-label={user ? 'Log out' : 'Log in'}
          >
            {user ? <LogOut size={20} /> : <LogIn size={20} />}
            <span className={`${!isOpen && 'lg:hidden'}`}>
              {user ? 'Log out' : 'Log in'}
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar; 