'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'email' | 'demo';
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithDemoUser: (email?: string, name?: string) => void;
  signOut: () => Promise<void>;
  isSupabaseLive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Check localStorage for stored session
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('spendwise_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          setUser(null);
        }
      }
    }

    // 2. Check Supabase auth if connected
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@gmail.com',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            provider: (session.user.app_metadata?.provider as any) || 'google',
            created_at: session.user.created_at,
          };
          setUser(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('spendwise_user', JSON.stringify(profile));
          }
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || 'user@gmail.com',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            avatar_url: session.user.user_metadata?.avatar_url,
            provider: (session.user.app_metadata?.provider as any) || 'google',
            created_at: session.user.created_at,
          };
          setUser(profile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('spendwise_user', JSON.stringify(profile));
          }
        } else {
          setUser(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('spendwise_user');
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        alert(`Google Sign-In Error: ${error.message}`);
      }
    } else {
      // Prompt for user's Gmail in demo/local mode to personalize immediately!
      const userEmail = prompt('Enter your Gmail address to personalize your account:', 'viswaravindren@gmail.com');
      if (userEmail) {
        const namePart = userEmail.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        signInWithDemoUser(userEmail, formattedName);
      }
    }
  };

  const signInWithDemoUser = (email = 'viswaravindren@gmail.com', name = 'Viswa Ravindren') => {
    const profile: UserProfile = {
      id: `usr-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email,
      name,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=10b981&textColor=ffffff`,
      provider: 'google',
      created_at: new Date().toISOString(),
    };
    setUser(profile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('spendwise_user', JSON.stringify(profile));
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spendwise_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithDemoUser,
        signOut,
        isSupabaseLive: isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

