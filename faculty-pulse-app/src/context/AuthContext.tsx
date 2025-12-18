import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'STUDENT_FREE' | 'STUDENT_PRO' | 'ADMIN';
  evaluations_count?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    const initSession = async () => {
      // Check if we are returning from OAuth redirect
      // Supabase handles the hash parsing automatically in getSession() usually,
      // but explicitly checking helps debugging.
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Auth initialization error:", error);
      }
      
      if (session) {
        console.log("✅ Session found on init:", session.user.email);
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        console.log("⚠️ No active session on init");
        setIsLoading(false);
      }
    };

    initSession();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           await registerSession(session);
           await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const registerSession = async (session: Session) => {
    // Call the PostgreSQL function to mark this as the active session
    // We use the access_token signature as a simple unique ID for this session
    const tokenSignature = session.access_token.slice(-20);
    const device = navigator.userAgent;

    await supabase.rpc('register_session', {
      token_hash: tokenSignature,
      device: device
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
