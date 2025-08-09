import { Professor } from '@/types/professor';

export interface AIAnalysisResult {
  summary: string
  overallRating: number
  teachingStyle: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  studentAdvice: string
  difficultyAssessment: string
}

export class AIAnalysisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  private getApiKey(): string {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey) return envApiKey;
    const storedApiKey = localStorage.getItem('openai_api_key');
    const storedEnc = localStorage.getItem('openai_api_key_enc_v1');
    return storedApiKey || (storedEnc ? '' : '');
  }

  private async makeRequest(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres un asistente especializado en análisis académico.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 600
        }),
        // Explicitly avoid sending cookies
        credentials: 'omit',
        referrerPolicy: 'no-referrer'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return text;
    } finally {
      clearTimeout(timeout);
    }
  }

  private formatProfessorData(professor: Professor): string {
    const subjects = [...new Set(professor.calificaciones.map(c => c.materia))];
    const recentReviews = professor.calificaciones.slice(0, 5);
    
    return `
DATOS DEL PROFESOR:
- Nombre: ${professor.nombre}
- Universidad: ${professor.universidad}
${professor.ciudad ? `- Ciudad: ${professor.ciudad}` : ''}
- Departamento: ${professor.departamento}
- Calidad General: ${professor.calidad_general}/10
- Porcentaje de Recomendación: ${professor.porcentaje_recomienda}%
- Nivel de Dificultad: ${professor.nivel_dificultad}/5
- Número de Calificaciones: ${professor.numero_calificaciones}

CARACTERÍSTICAS (ETIQUETAS):
${professor.etiquetas.map(tag => `- ${tag}`).join('\n')}

MATERIAS IMPARTIDAS:
${subjects.map(subject => `- ${subject}`).join('\n')}

RESEÑAS RECIENTES:
${recentReviews.map(review => `
Materia: ${review.materia}
Calificación: ${review.puntaje_calidad_general}/10
${review.tipo_calificacion ? `Tipo: ${review.tipo_calificacion}` : ''}
${review.asistencia ? `Asistencia: ${review.asistencia}` : ''}
${review.calificacion_recibida ? `Calificación Recibida: ${review.calificacion_recibida}` : ''}
${review.interes_clase ? `Interés en Clase: ${review.interes_clase}` : ''}
Fecha: ${review.fecha}
Comentario: ${review.comentario}
${review.etiquetas_comentario && review.etiquetas_comentario.length > 0 ? `Etiquetas: ${review.etiquetas_comentario.join(', ')}` : ''}
`).join('\n')}
    `.trim();
  }

  public async analyzeProfessor(professor: any): Promise<AIAnalysisResult> {
    const prompt = `Analiza al profesor ${professor.nombre} de ${professor.universidad}...`;
    const text = await this.makeRequest(prompt);
    // Dummy mapping for now
    return {
      summary: text.slice(0, 200),
      overallRating: 8.0,
      teachingStyle: 'Interactivo',
      strengths: ['Claridad', 'Organización'],
      weaknesses: ['Ritmo rápido'],
      recommendations: ['Estudiar con anticipación'],
      studentAdvice: 'Participa activamente en clase',
      difficultyAssessment: 'Moderada'
    };
  }

  async getQuickAnalysis(professor: Professor): Promise<string> {
    const professorData = this.formatProfessorData(professor);
    
    const prompt = `
${professorData}

Proporciona un análisis rápido y conciso (máximo 3 párrafos) del profesor, incluyendo:
1. Evaluación general de su desempeño
2. Principales fortalezas y áreas de mejora
3. Recomendación para estudiantes

Responde en español de manera clara y directa.
    `;

    return await this.makeRequest(prompt);
  }
}

export const aiAnalysisService = new AIAnalysisService(); 