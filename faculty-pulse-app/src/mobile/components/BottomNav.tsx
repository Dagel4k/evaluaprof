import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Users, Info, Calendar, UserCircle } from 'lucide-react';
import { useProfessorContext } from '@/mobile/context/ProfessorContext';

export const BottomNav: React.FC = () => {
  const base = 'flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs px-1';
  const inactive = 'text-muted-foreground/70 hover:text-muted-foreground';
  const active = 'text-primary font-medium';
  
  const { lastProfessorsPath } = useProfessorContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t safe-bottom shadow-lg">
      <div className="mx-auto max-w-md grid grid-cols-5 h-16">
        <NavLink
          to="/home"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <HomeIcon className="h-5 w-5 mb-0.5" />
          <span>Inicio</span>
        </NavLink>
        <NavLink
          to={lastProfessorsPath}
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <Users className="h-5 w-5 mb-0.5" />
          <span>Profesores</span>
        </NavLink>
        <NavLink
          to="/desktop/scheduler"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <Calendar className="h-5 w-5 mb-0.5" />
          <span>Horario</span>
        </NavLink>
        <NavLink
          to="/acerca"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <Info className="h-5 w-5 mb-0.5" />
          <span>Acerca</span>
        </NavLink>
        <NavLink
          to="/settings/profile"
          className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
        >
          <UserCircle className="h-5 w-5 mb-0.5" />
          <span>Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav; 