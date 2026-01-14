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

  // 1. Loading state: Only block if we are checking auth and don't know if a user exists yet
  if (isLoading && !user) {
    return null;
  }

  // 2. Unauthenticated state
  if (!user) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return null;
  }

  // 3. Authenticated but profile missing/loading: Default to STUDENT_FREE
  const safeRole = profile?.role || 'STUDENT_FREE';

  // 4. Permission check
  if (!hasPermission(safeRole, feature)) {
    // Special case: If user is trying to access scheduler, show premium lock screen
    if (feature === 'access-scheduler') {
      return <PremiumLockScreen />;
    }

    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return null;
  }

  return <>{children}</>;
};
