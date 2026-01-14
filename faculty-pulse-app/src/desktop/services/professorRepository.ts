import { ProfessorMetrics } from '../../types/canonical';

interface ProfessorDBEntry {
  id: string;
  name: string;
  metrics: {
    quality: number;
    difficulty: number;
    wouldTakeAgain: number;
    sentiment: number;
    trust: number;
    tags: string[];
  };
  reviewCount: number;
}

class ProfessorRepository {
  private static instance: ProfessorRepository;
  private db: ProfessorDBEntry[] = [];
  private isLoaded = false;

  private constructor() { }

  public static getInstance(): ProfessorRepository {
    if (!ProfessorRepository.instance) {
      ProfessorRepository.instance = new ProfessorRepository();
    }
    return ProfessorRepository.instance;
  }

  public async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const response = await fetch('/professors-db.json');
      if (!response.ok) throw new Error('Failed to load professor database');
      this.db = await response.json();
      this.isLoaded = true;
      console.log(`📚 Professor DB loaded: ${this.db.length} entries`);
    } catch (error) {
      console.error('Error loading professor DB:', error);
      // Fallback to empty to prevent crashes
      this.db = [];
    }
  }

  public searchByName(name: string): ProfessorDBEntry | null {
    if (!name) return null;

    // Normalize input
    const cleanQuery = this.normalizeString(name);

    // Reject empty or very short queries (less than 3 chars)
    if (cleanQuery.length < 3) {
      console.log(`❌ Rejected short query: "${name}" (cleaned: "${cleanQuery}")`);
      return null;
    }

    // 1. Exact match (fast)
    const exact = this.db.find(p => p.name && this.normalizeString(p.name) === cleanQuery);
    if (exact) {
      console.log(`✅ Exact match for "${name}": ${exact.name}`);
      return exact;
    }

    // 2. Fuzzy / Partial match
    let bestMatch: ProfessorDBEntry | null = null;
    let maxScore = 0;

    const queryTokens = cleanQuery.split(' ').filter(t => t.length > 0);

    for (const prof of this.db) {
      if (!prof.name) continue; // Skip bad entries
      const profTokens = this.normalizeString(prof.name).split(' ').filter(t => t.length > 0);
      let score = 0;

      // Simple token intersection count
      queryTokens.forEach(qt => {
        // Skip very short tokens (< 2 chars) to avoid false matches
        if (qt.length < 2) return;

        if (profTokens.some(pt => pt.length >= 2 && (pt.includes(qt) || qt.includes(pt)))) {
          score++;
        }
      });

      // Boost if the last name matches (usually important)
      if (profTokens.length > 0 && queryTokens.length > 0) {
        if (profTokens[profTokens.length - 1] === queryTokens[queryTokens.length - 1]) {
          score += 0.5;
        }
      }

      if (score > maxScore && score >= 2) { // Threshold: at least 2 matching tokens usually
        maxScore = score;
        bestMatch = prof;
      }
    }

    if (bestMatch) {
      console.log(`🔍 Fuzzy match for "${name}": ${bestMatch.name} (score: ${maxScore})`);
    } else {
      console.log(`❌ No match found for "${name}"`);
    }

    return bestMatch;
  }

  public toCanonical(entry: ProfessorDBEntry): ProfessorMetrics {
    return {
      id: entry.id,
      name: entry.name,
      globalScore: entry.metrics.quality,
      difficulty: entry.metrics.difficulty,
      takeAgainPercent: entry.metrics.wouldTakeAgain,
      tags: entry.metrics.tags,
      sentimentScore: entry.metrics.sentiment,
      riskLevel: entry.metrics.trust < 0.7 ? 'HIGH' : entry.metrics.trust < 0.9 ? 'MEDIUM' : 'LOW',
      trust: entry.metrics.trust
    };
  }

  private normalizeString(str: string): string {
    if (!str) return "";
    return str
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9 ]/g, "") // Keep only alphanumeric and space
      .trim();
  }
}

export const professorRepo = ProfessorRepository.getInstance();
