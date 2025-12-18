import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission, AppFeature } from '@/lib/permissions';
import { PremiumLockScreen } from '@/components/PremiumLockScreen';
import { Navigate } from 'react-router-dom';

interface RequirePermissionProps {
  feature: AppFeature;
  children: React.ReactNode;
  redirectTo?: string;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ feature, children, redirectTo }) => {
  const { profile, isLoading, user } = useAuth();

  // 1. Wait for auth check to complete
  if (isLoading) {
    // Optional: Return a spinner or skeleton here if checking takes too long
    return null; 
  }

  // 2. If no user, definitely redirect
  if (!user) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    // If no redirect provided (e.g. modal), return null or specific fallback
    return null;
  }

  // 3. If user exists but profile failed to load (rare, but possible), treat as free tier
  const safeRole = profile?.role || 'STUDENT_FREE';

  if (!hasPermission(safeRole, feature)) {
    // Enterprise Gating: Show Lock Screen for scheduler, or redirect
    if (feature === 'access-scheduler') {
      return <PremiumLockScreen />;
    }
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return null; // Should not happen ideally
  }

  return <>{children}</>;
};
