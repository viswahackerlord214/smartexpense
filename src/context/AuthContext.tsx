'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string; // Supabase Auth UUID
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'email' | 'google';
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; sessionCreated: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isSupabaseLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const mapSupabaseUser = useCallback((sbUser: any): UserProfile => {
    return {
      id: sbUser.id,
      email: sbUser.email || '',
      name:
        sbUser.user_metadata?.full_name ||
        sbUser.user_metadata?.name ||
        sbUser.email?.split('@')[0] ||
        'User',
      avatar_url: sbUser.user_metadata?.avatar_url,
      provider: (sbUser.app_metadata?.provider as any) || 'email',
      created_at: sbUser.created_at,
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // 2. Real-time auth state listener (persists across tabs and refreshes)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mapSupabaseUser]);

  // Email and Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase authentication is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(mapSupabaseUser(data.user));
        router.refresh();
        return { success: true };
      }

      return { success: false, error: 'Sign in failed. Please verify credentials.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred.' };
    }
  };

  // Sign Up with Email, Password & Full Name
  const signUp = async (email: string, password: string, fullName: string) => {
    if (!supabase) {
      return { success: false, sessionCreated: false, error: 'Supabase authentication is not configured.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        return { success: false, sessionCreated: false, error: error.message };
      }

      const hasSession = Boolean(data.session && data.user);
      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        router.refresh();
      }

      return {
        success: true,
        sessionCreated: hasSession,
      };
    } catch (err: any) {
      return { success: false, sessionCreated: false, error: err.message || 'Registration failed.' };
    }
  };

  // Password Reset Email
  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { success: false, error: 'Supabase authentication is not configured.' };
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    if (!supabase) return;
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  // Sign Out
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithEmail,
        signUp,
        resetPassword,
        signInWithGoogle,
        signOut,
        isSupabaseLive: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
