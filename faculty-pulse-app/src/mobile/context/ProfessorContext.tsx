import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Filters, Professor } from '@/types/professor';

export interface ProfessorListState {
  searchTerm: string;
  filters: Filters;
  currentPage: number;
  itemsPerPage: number;
  scrollPosition: number;
}

const defaultFilters: Filters = {
  materia: '',
  promedio_minimo: 0,
  dificultad_maxima: 5,
  confiabilidad_minima: 0,
  sentimiento: '',
  tendencia: '',
  solo_con_analisis_avanzado: false,
  min_reviews: 0
};

const defaultState: ProfessorListState = {
  searchTerm: '',
  filters: defaultFilters,
  currentPage: 1,
  itemsPerPage: 10,
  scrollPosition: 0
};

interface ProfessorContextType {
  // UI State
  listState: ProfessorListState;
  setListState: (state: ProfessorListState) => void;
  updateListState: (partial: Partial<ProfessorListState>) => void;
  lastProfessorsPath: string;
  setLastProfessorsPath: (path: string) => void;
  
  // Data State (Persistence)
  professors: Professor[];
  setProfessors: (professors: Professor[]) => void;
  isLoadingData: boolean;
  setIsLoadingData: (loading: boolean) => void;
  dataLoaded: boolean; // Flag to prevent re-fetch
  setDataLoaded: (loaded: boolean) => void;
}

const ProfessorContext = createContext<ProfessorContextType | undefined>(undefined);

export const ProfessorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // UI State
  const [listState, setListState] = useState<ProfessorListState>(defaultState);
  const [lastProfessorsPath, setLastProfessorsPath] = useState<string>('/profesores');

  // Data State
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  const updateListState = (partial: Partial<ProfessorListState>) => {
    setListState(prev => ({ ...prev, ...partial }));
  };

  return (
    <ProfessorContext.Provider value={{
      listState,
      setListState,
      updateListState,
      lastProfessorsPath,
      setLastProfessorsPath,
      professors,
      setProfessors,
      isLoadingData,
      setIsLoadingData,
      dataLoaded,
      setDataLoaded
    }}>
      {children}
    </ProfessorContext.Provider>
  );
};

export const useProfessorContext = () => {
  const context = useContext(ProfessorContext);
  if (!context) {
    throw new Error('useProfessorContext must be used within a ProfessorProvider');
  }
  return context;
};
