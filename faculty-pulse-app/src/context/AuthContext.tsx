import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'STUDENT_FREE' | 'STUDENT_PRO' | 'ADMIN';
  evaluations_count?: number;
  access_count?: number;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Definitive safety timeout: ensure app loads within 10s no matter what
    const safetyTimer = setTimeout(() => {
      console.log("🕒 10s Safety Timeout: Forcing isLoading = false");
      setIsLoading(prev => {
        if (prev) console.warn("⚠️ App was stuck in loading! Forcing resolution.");
        return false;
      });
    }, 10000);

    // DEV MODE: Create mock user with full permissions
    if (import.meta.env.VITE_DEV_MODE === 'true') {
      console.log('🔧 DEV MODE: Creating mock user with STUDENT_PRO role');
      const mockUser = {
        id: 'dev-user-local',
        email: 'dev@local.test',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      } as User;

      const mockProfile: Profile = {
        id: 'dev-user-local',
        email: 'dev@local.test',
        full_name: 'Developer (Local)',
        role: 'STUDENT_PRO',
        evaluations_count: 0
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setIsLoading(false);
      return; // Skip normal auth flow in dev mode
    }

    // 1. Get initial session
    const initSession = async () => {
      console.log("🔍 Starting initSession...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Auth initialization error:", error);
          setIsLoading(false);
          return;
        }

        if (session) {
          console.log("✅ Session found on init:", session.user.email);
          setSession(session);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          if (window.location.hash && window.location.hash.includes('access_token')) {
            console.log("⏳ OAuth hash detected, waiting for event...");
          } else {
            console.log("ℹ️ No session on init");
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("❌ Fatal error in initSession:", err);
        setIsLoading(false);
      }
    };

    initSession();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth change event [${event}] for:`, session?.user?.email ?? 'none');

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          console.log(`🔄 Processing ${event} for ${session.user.id}`);
          try {
            // Background tasks
            registerSession(session).catch(e => console.warn("Tracking error:", e));
            await fetchProfile(session.user.id);
          } catch (e) {
            console.error("❌ Error in auth listener handler:", e);
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("👋 User signed out");
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log(`📥 Fetching profile for ${userId}...`);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn(`⚠️ Profile fetch returned error: ${error.message} (Code: ${error.code})`);
        // If profile doesn't exist, we still need to stop loading
        setIsLoading(false);
        return;
      }

      if (data) {
        let profileData = data as Profile;
        console.log("✅ Profile loaded for:", profileData.email);

        // --- AUTO-PRO LOGIC (Private Beta) ---
        if (profileData.role === 'STUDENT_FREE') {
          console.log(`🚀 Private Beta: Auto-upgrading ${profileData.email} to PRO`);
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'STUDENT_PRO' })
            .eq('id', userId)
            .select()
            .single();

          if (!updateError && updated) {
            profileData = updated as Profile;
          }
        }

        setProfile(profileData);
      } else {
        console.log("ℹ️ No profile data returned (but no error)");
      }
    } catch (e) {
      console.error('❌ Exception in fetchProfile:', e);
    } finally {
      setIsLoading(false);
      console.log("🏁 fetchProfile finished");
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };


  const registerSession = async (session: Session) => {
    try {
      // Call the PostgreSQL function to mark this as the active session
      // We use the access_token signature as a simple unique ID for this session
      const tokenSignature = session.access_token.slice(-20);
      const device = navigator.userAgent;

      await supabase.rpc('register_session', {
        token_hash: tokenSignature,
        device: device
      });

      // Increment access count for tracking (Private Beta)
      // This might fail if the user hasn't run the SQL migration yet
      await supabase.rpc('increment_access_count', { user_id: session.user.id });
    } catch (e) {
      console.warn("Tracking/registerSession failed (silent):", e);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, signOut, refreshProfile }}>
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
