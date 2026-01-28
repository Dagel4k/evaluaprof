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
  avatar_url?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Definitive safety timeout: ensure app loads within 5s no matter what
    const safetyTimer = setTimeout(() => {
      console.log("🕒 5s Safety Timeout Check...");
      setIsLoading(prev => {
        if (prev) {
          console.warn("⚠️ Auth flow still pending. Forcing UI to load.");
          return false;
        }
        return false;
      });
    }, 5000);

    // 0. PRERENDER BYPASS (Critical for SEO build)
    if (navigator.userAgent.includes('EvaluaProf-Prerender')) {
      console.log('🤖 Prerender detected: Bypassing auth flow.');
      setIsLoading(false);
      return;
    }

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

    // 1. Initial State Check
    // Rely primarily on onAuthStateChange for the first event
    console.log("🚀 AuthProvider mounted. Hash present:", !!window.location.hash);

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
    console.log(`📥 [fetchProfile] Fetching for ${userId}...`);

    // Safety check: if fetch takes too long, we don't want to block forever
    const fetchPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    try {
      // 5 second timeout for DB call
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase fetch timeout")), 5000)
      );

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.warn(`⚠️ [fetchProfile] DB error: ${error.message} (Code: ${error.code})`);

        // If we have no profile, create a skeleton one so the app doesn't think we are a GUEST
        if (!profile) {
          console.log("ℹ️ [fetchProfile] Using skeleton profile as fallback");
          setProfile({
            id: userId,
            email: user?.email || '',
            full_name: '',
            role: 'STUDENT_FREE' // Default to FREE for beta
          } as Profile);
        }
        return;
      }

      if (data) {
        let profileData = data as Profile;
        console.log("✅ [fetchProfile] Success. Role:", profileData.role);

        // --- AUTO-PRO LOGIC (Private Beta) ---
        if (profileData.role === 'STUDENT_FREE') {
          console.log(`🚀 [fetchProfile] Private Beta: Auto-upgrading ${profileData.email} to PRO`);
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'STUDENT_PRO' })
            .eq('id', userId)
            .select()
            .single();

          if (!updateError && updated) {
            console.log("💎 [fetchProfile] Auto-upgrade successful");
            profileData = updated as Profile;
          } else {
            console.warn("❌ [fetchProfile] Auto-upgrade failed:", updateError);
          }
        }

        setProfile(profileData);
      } else {
        console.log("ℹ️ [fetchProfile] No data found for this ID");
        // Row might not exist yet if registration just happened
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: '',
          role: 'STUDENT_FREE'
        } as Profile);
      }
    } catch (e: any) {
      console.error('❌ [fetchProfile] Exception:', e.message || e);
      // Fallback
      if (!profile) {
        setProfile({ id: userId, email: user?.email || '', full_name: '', role: 'STUDENT_FREE' } as Profile);
      }
    } finally {
      setIsLoading(false);
      console.log("🏁 [fetchProfile] Execution completed");
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
    console.log("🚪 [signOut] Initiating process...");
    setIsLoggingOut(true);

    // 1. Clear local state IMMEDIATELY for snappy UI response
    setProfile(null);
    setUser(null);
    setSession(null);

    try {
      // 2. Clear remote session with a 3s safety timeout
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Supabase logout timeout")), 3000)
      );

      await Promise.race([logoutPromise, timeoutPromise]);
      console.log("✅ [signOut] Supabase session cleared");
    } catch (e: any) {
      console.warn("⚠️ [signOut] Partial logout (remote failed, but local cleared):", e.message || e);
    } finally {
      // 3. Ensure we stop the global loaders
      setIsLoggingOut(false);
      setIsLoading(false);
      console.log("🏁 [signOut] Process finished");
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isLoading, isLoggingOut, signOut, refreshProfile }}>
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
