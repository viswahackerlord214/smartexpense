'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useExpense } from '@/context/ExpenseContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  PiggyBank,
  Smartphone,
  BookOpen,
  Settings,
  Bell,
  Sparkles,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/analytics', label: 'Analytics', icon: PieChart },
  { href: '/budgets', label: 'Budgets', icon: PiggyBank },
  { href: '/shortcuts-guide', label: 'iOS Shortcuts', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { transactions, pendingCount, setActiveCategorizeId } = useExpense();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const pendingTxn = transactions.find((t) => t.status === 'pending_categorization');

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                ₹
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  SpendWise
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Auto
                  </span>
                </span>
                <span className="text-[11px] text-zinc-400 hidden sm:block">Automated SMS Expense Engine</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800/90 text-white border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center space-x-2.5">
            {/* Actionable Pending Categorization Pill */}
            {pendingCount > 0 && pendingTxn && (
              <button
                onClick={() => setActiveCategorizeId(pendingTxn.id)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-zinc-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 animate-pulse hover:opacity-95 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{pendingCount} to Categorize</span>
              </button>
            )}

            {/* User Profile / Google Sign In */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1 pl-2 pr-2.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition text-xs"
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-6 h-6 rounded-full border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <span className="font-medium text-zinc-200 hidden sm:inline truncate max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 animate-fade-in space-y-1">
                    <div className="px-3 py-2 border-b border-zinc-800/80">
                      <div className="text-xs font-bold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <span>Personalized Account</span>
                      </div>
                    </div>

                    <Link
                      href="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-zinc-300 hover:bg-zinc-900 transition"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Account Settings</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/20 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold shadow-sm transition active:scale-95"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1">
            {user && (
              <div className="flex items-center space-x-3 px-3 py-2 mb-2 rounded-xl bg-zinc-900">
                {user.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-zinc-400 truncate">{user.email}</div>
                </div>
              </div>
            )}

            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Fixed Bottom Navigation Bar for iPhone/PWA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 flex items-center justify-around safe-bottom">
        {NAV_LINKS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
