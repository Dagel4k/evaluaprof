import React from 'react';
import { Outlet } from 'react-router-dom';

const DesktopLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar Area - Hidden on Mobile */}
      <aside className="w-64 border-r bg-muted/20 p-4 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight text-primary">EvaluaProf</h1>
          <p className="text-sm text-muted-foreground">Scheduler v1.0</p>
        </div>

        <nav className="space-y-2">
          <div className="px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium text-sm">
            Mi Horario
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pb-24 lg:pb-0">
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/95 backdrop-blur z-30">
          <div className="flex items-center gap-3">
            <h1 className="lg:hidden text-lg font-bold tracking-tight text-primary">EvaluaProf</h1>
            <div className="hidden lg:block h-4 w-[1px] bg-border mx-2" />
            <h2 className="font-semibold text-sm sm:text-base text-muted-foreground lg:text-foreground">Constructor de Horario</h2>
          </div>
        </header>
        <div className="p-0 sm:p-6 px-1 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DesktopLayout;
