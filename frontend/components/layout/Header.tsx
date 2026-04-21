"use client";

import Link from 'next/link';
import { Package, Bell, Map, LayoutDashboard, Box, LogIn, LogOut, UserCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = Cookies.get('auth_token');
    const userRole = Cookies.get('auth_role') ?? '';
    setIsLoggedIn(!!token);
    setRole(userRole);
  }, [pathname]); // re-check on every route change

  const handleLogout = () => {
    Cookies.remove('auth_token');
    Cookies.remove('auth_role');
    Cookies.remove('auth_name');
    setIsLoggedIn(false);
    toast.success('Signed out successfully.', {
      style: {
        background: '#0f172a',
        color: '#f8fafc',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '12px',
      },
      iconTheme: { primary: '#ef4444', secondary: '#fff' },
    });
    router.push('/login');
  };

  const dashboardHref =
    role === 'admin'
      ? '/admin/dashboard'
      : role === 'supplier'
      ? '/supplier/dashboard'
      : '/dashboard';

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Orders', href: '/orders', icon: Box },
    { label: 'Tracking', href: '/track', icon: Map },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 duration-200">
            <div className="rounded-xl flex items-center justify-center bg-primary/10 p-2 text-primary shadow-inner">
              <Package className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              SupplySync
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button className="relative p-2.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
            </button>
          )}

          <div className="h-6 w-px bg-border/50 hidden sm:block" />

          {isLoggedIn ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-border hover:bg-muted transition-all duration-200"
              >
                <UserCircle className="h-4 w-4 text-primary" />
                <span className="capitalize">{role} Portal</span>
              </Link>
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full text-destructive border border-destructive/30 hover:bg-destructive/10 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
