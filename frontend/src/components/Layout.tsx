'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/authStore';
import { PiggyBank, LayoutDashboard, PlusCircle, Menu, X, LogOut, User } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tandas/crear', label: 'Nueva Tanda', icon: PlusCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900 hidden sm:block">Tandas</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User + Logout (desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-gray-700">{user?.nombre}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Salir</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
            <div className="px-6 sm:px-8 lg:px-10 py-3 space-y-1">
              {navItems.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMobileMenu(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <hr className="my-2 border-gray-100" />
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                {user?.nombre}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6 sm:py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
