import { Professor, ProfessorError } from '@/types/professor';

interface CacheResult {
  professors: Professor[];
  errors: ProfessorError[];
  timestamp?: number;
}

let memoryCache: CacheResult | null = null;

export const getProfessorsFromCache = async (): Promise<CacheResult | null> => {
  return memoryCache;
};

export const setProfessorsCache = (data: CacheResult) => {
  memoryCache = { ...data, timestamp: Date.now() };
};

export const saveProfessorsToCache = async (data: CacheResult) => {
  setProfessorsCache(data);
};

export const isCacheFresh = (timestamp: number | undefined, maxAge: number): boolean => {
  if (!timestamp) return false;
  return (Date.now() - timestamp) < maxAge;
};
