import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Users, Info } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const base = 'flex flex-col items-center justify-center gap-1 text-xs';
  const inactive = 'text-muted-foreground';
  const active = 'text-primary';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t safe-bottom">
      <div className="mx-auto max-w-3xl grid grid-cols-3 h-16">
        <NavLink
          to="/home"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <HomeIcon className="h-5 w-5" />
          <span>Inicio</span>
        </NavLink>
        <NavLink
          to="/profesores"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <Users className="h-5 w-5" />
          <span>Profesores</span>
        </NavLink>
        <NavLink
          to="/acerca"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <Info className="h-5 w-5" />
          <span>Acerca de</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav; 