import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { Card } from '@/shared/ui/card';

interface AdUnitProps {
  slotId?: string;
  format?: 'banner' | 'rectangle';
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId = 'demo-slot', format = 'banner', className = '' }) => {
  const { profile } = useAuth();

  // 1. Enterprise Check: If user has 'remove-ads' permission, render NOTHING.
  if (hasPermission(profile?.role, 'remove-ads')) {
    return null;
  }

  // 2. Render Ad Placeholder (In production this would be Google AdSense / AdMob)
  return (
    <Card className={`overflow-hidden border-dashed border-2 border-muted-foreground/20 bg-muted/10 ${className}`}>
      <div className="flex flex-col items-center justify-center p-4 h-full min-h-[100px] text-center">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
          Publicidad
        </span>
        <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded text-muted-foreground text-xs p-4">
          Espacio publicitario ({format})
          <br />
          Optimizado por IA
        </div>
        <a href="/desktop/scheduler" className="text-[10px] text-primary mt-2 hover:underline">
          Ocultar anuncios con EvaluaProf Pro
        </a>
      </div>
    </Card>
  );
};
