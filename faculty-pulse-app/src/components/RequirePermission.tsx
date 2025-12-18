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
  const { profile, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  if (!hasPermission(profile?.role, feature)) {
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
