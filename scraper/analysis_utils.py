#!/usr/bin/env python3
"""
Utilidades para Análisis Específicos de Profesores
Funciones auxiliares para comparaciones y análisis detallados
"""

import json
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns

class ProfessorAnalysisUtils:
    def __init__(self, results_file: str = 'advanced_analysis_results.json'):
        """Inicializa las utilidades con los resultados del análisis"""
        with open(results_file, 'r', encoding='utf-8') as f:
            self.results = json.load(f)
        
        self.professors = self.results['professors']
        self.global_stats = self.results['global_stats']
    
    def compare_professors(self, professor_ids: List[str]) -> Dict[str, Any]:
        """Compara múltiples profesores en detalle"""
        comparison_data = {
            'professors': {},
            'metrics_comparison': {},
            'common_subjects': [],
            'pareto_analysis': {}
        }
        
        # Extraer datos de cada profesor
        for prof_id in professor_ids:
            if prof_id in self.professors:
                prof_data = self.professors[prof_id]
                comparison_data['professors'][prof_id] = {
                    'name': prof_data.get('name', ''),
                    'quality_bayes': prof_data.get('bayes', {}).get('quality_bayes'),
                    'difficulty_now': prof_data.get('decay', {}).get('difficulty_now'),
                    'quality_now': prof_data.get('decay', {}).get('quality_now'),
                    'n_reviews': prof_data.get('bayes', {}).get('n_reviews', 0),
                    'recommendation_rate': prof_data.get('recommendation', {}).get('p', 0),
                    'wilson_interval': prof_data.get('recommendation', {}).get('wilson_95', [0, 0]),
                    'trust_score': prof_data.get('integrity', {}).get('trust_score', 0),
                    'equidad': prof_data.get('grades', {}).get('equidad', 0),
                    'z_mean': prof_data.get('subject_norm', {}).get('z_mean', 0),
                    'sentiment_avg': prof_data.get('nlp', {}).get('sentiment', {}).get('avg', 0)
                }
        
        # Análisis de materias en común
        comparison_data['common_subjects'] = self._find_common_subjects(professor_ids)
        
        # Análisis de Pareto entre los profesores comparados
        comparison_data['pareto_analysis'] = self._pareto_analysis_subset(professor_ids)
        
        return comparison_data
    
    def _find_common_subjects(self, professor_ids: List[str]) -> List[Dict]:
        """Encuentra materias en común entre los profesores"""
        subject_data = {}
        
        for prof_id in professor_ids:
            if prof_id in self.professors:
                prof_data = self.professors[prof_id]
                subjects = prof_data.get('subject_norm', {}).get('per_subject', [])
                
                for subject_info in subjects:
                    subject_name = subject_info.get('materia', '')
                    if subject_name not in subject_data:
                        subject_data[subject_name] = []
                    
                    subject_data[subject_name].append({
                        'professor_id': prof_id,
                        'z_decayed': subject_info.get('z_decayed', 0),
                        'n': subject_info.get('n', 0)
                    })
        
        # Filtrar materias que tienen al menos 2 profesores
        common_subjects = []
        for subject, profs in subject_data.items():
            if len(profs) >= 2:
                common_subjects.append({
                    'materia': subject,
                    'professors': profs,
                    'z_diff': profs[1]['z_decayed'] - profs[0]['z_decayed'] if len(profs) >= 2 else 0
                })
        
        return common_subjects
    
    def _pareto_analysis_subset(self, professor_ids: List[str]) -> Dict:
        """Análisis de Pareto para un subconjunto de profesores"""
        points = []
        efficient = []
        
        for prof_id in professor_ids:
            if prof_id in self.professors:
                prof_data = self.professors[prof_id]
                quality = prof_data.get('decay', {}).get('quality_now')
                difficulty = prof_data.get('decay', {}).get('difficulty_now')
                
                if quality is not None and difficulty is not None:
                    point = {
                        'id': prof_id,
                        'name': prof_data.get('name', ''),
                        'quality': quality,
                        'difficulty': difficulty
                    }
                    points.append(point)
        
        # Ordenar por dificultad (ascendente)
        points.sort(key=lambda x: x['difficulty'])
        
        # Encontrar frontera de Pareto
        max_quality = 0
        for point in points:
            if point['quality'] >= max_quality:
                efficient.append(point['id'])
                max_quality = point['quality']
        
        return {
            'efficient': efficient,
            'points': points
        }
    
    def generate_recommendation(self, subject: str = None, max_difficulty: float = 3.0) -> List[Dict]:
        """Genera recomendaciones de profesores basadas en criterios"""
        recommendations = []
        
        for prof_id, prof_data in self.professors.items():
            if 'error' in prof_data:
                continue
            
            # Criterios de filtrado
            quality = prof_data.get('bayes', {}).get('quality_bayes')
            difficulty = prof_data.get('decay', {}).get('difficulty_now')
            trust = prof_data.get('integrity', {}).get('trust_score', 0)
            n_reviews = prof_data.get('bayes', {}).get('n_reviews', 0)
            
            if (quality is not None and difficulty is not None and 
                difficulty <= max_difficulty and trust >= 0.6 and n_reviews >= 3):
                
                # Verificar si imparte la materia específica
                subjects = prof_data.get('subject_norm', {}).get('per_subject', [])
                teaches_subject = True
                if subject:
                    teaches_subject = any(s.get('materia', '').upper() == subject.upper() 
                                        for s in subjects)
                
                if teaches_subject:
                    score = (quality * 0.4 + 
                           (1 - difficulty/5) * 0.3 + 
                           trust * 0.2 + 
                           min(n_reviews/20, 1) * 0.1)
                    
                    recommendations.append({
                        'professor_id': prof_id,
                        'name': prof_data.get('name', ''),
                        'quality': quality,
                        'difficulty': difficulty,
                        'trust': trust,
                        'n_reviews': n_reviews,
                        'score': score,
                        'subjects': [s.get('materia', '') for s in subjects]
                    })
        
        # Ordenar por score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        return recommendations[:10]  # Top 10
    
    def analyze_temporal_trends(self, professor_id: str) -> Dict:
        """Analiza tendencias temporales de un profesor específico"""
        if professor_id not in self.professors:
            return {'error': 'Profesor no encontrado'}
        
        prof_data = self.professors[professor_id]
        trend_data = prof_data.get('trend', {})
        
        analysis = {
            'professor_id': professor_id,
            'name': prof_data.get('name', ''),
            'trend_period': trend_data.get('period', 'semester'),
            'quality_ewma': trend_data.get('quality_ewma', []),
            'forecast': trend_data.get('forecast', {}),
            'trend_direction': 'stable',
            'trend_strength': 0
        }
        
        # Determinar dirección de la tendencia
        ewma_data = trend_data.get('quality_ewma', [])
        if len(ewma_data) >= 2:
            recent_values = [point['v'] for point in ewma_data[-3:]]
            if len(recent_values) >= 2:
                slope = recent_values[-1] - recent_values[0]
                if slope > 0.5:
                    analysis['trend_direction'] = 'increasing'
                elif slope < -0.5:
                    analysis['trend_direction'] = 'decreasing'
                else:
                    analysis['trend_direction'] = 'stable'
                
                analysis['trend_strength'] = abs(slope)
        
        return analysis
    
    def detect_anomalies(self) -> Dict[str, List]:
        """Detecta anomalías en los datos de profesores"""
        anomalies = {
            'high_variance': [],
            'low_trust': [],
            'suspicious_patterns': [],
            'outliers': []
        }
        
        for prof_id, prof_data in self.professors.items():
            if 'error' in prof_data:
                continue
            
            # Detectar alta varianza en calidades
            qualities = []
            for review in prof_data.get('calificaciones', []):
                if review.get('puntaje_calidad_general'):
                    qualities.append(float(review['puntaje_calidad_general']))
            
            if len(qualities) >= 5:
                variance = np.var(qualities)
                if variance > 2.0:  # Alta varianza
                    anomalies['high_variance'].append({
                        'professor_id': prof_id,
                        'name': prof_data.get('name', ''),
                        'variance': variance,
                        'n_reviews': len(qualities)
                    })
            
            # Detectar baja confianza
            trust = prof_data.get('integrity', {}).get('trust_score', 0)
            if trust < 0.5:
                anomalies['low_trust'].append({
                    'professor_id': prof_id,
                    'name': prof_data.get('name', ''),
                    'trust_score': trust
                })
            
            # Detectar patrones sospechosos
            integrity = prof_data.get('integrity', {})
            if (integrity.get('dup_rate', 0) > 0.1 or 
                integrity.get('burst_days', []) or 
                integrity.get('low_variance_flag', False)):
                anomalies['suspicious_patterns'].append({
                    'professor_id': prof_id,
                    'name': prof_data.get('name', ''),
                    'dup_rate': integrity.get('dup_rate', 0),
                    'burst_days': len(integrity.get('burst_days', [])),
                    'low_variance': integrity.get('low_variance_flag', False)
                })
        
        return anomalies
    
    def generate_subject_report(self, subject: str) -> Dict:
        """Genera un reporte detallado para una materia específica"""
        subject_stats = self.results['subject_stats'].get(subject.upper(), {})
        
        if not subject_stats:
            return {'error': f'No hay datos suficientes para la materia {subject}'}
        
        # Encontrar profesores que imparten esta materia
        subject_professors = []
        for prof_id, prof_data in self.professors.items():
            subjects = prof_data.get('subject_norm', {}).get('per_subject', [])
            for subj_info in subjects:
                if subj_info.get('materia', '').upper() == subject.upper():
                    subject_professors.append({
                        'professor_id': prof_id,
                        'name': prof_data.get('name', ''),
                        'quality_bayes': prof_data.get('bayes', {}).get('quality_bayes'),
                        'difficulty_now': prof_data.get('decay', {}).get('difficulty_now'),
                        'z_decayed': subj_info.get('z_decayed', 0),
                        'n_reviews': prof_data.get('bayes', {}).get('n_reviews', 0),
                        'trust_score': prof_data.get('integrity', {}).get('trust_score', 0)
                    })
                    break
        
        # Ordenar por calidad
        subject_professors.sort(key=lambda x: x.get('quality_bayes', 0), reverse=True)
        
        return {
            'subject': subject,
            'global_stats': subject_stats,
            'professors': subject_professors,
            'n_professors': len(subject_professors),
            'avg_quality': np.mean([p.get('quality_bayes', 0) for p in subject_professors]),
            'avg_difficulty': np.mean([p.get('difficulty_now', 0) for p in subject_professors])
        }
    
    def plot_comparison_chart(self, professor_ids: List[str], figsize=(15, 10)):
        """Crea un gráfico de comparación entre profesores"""
        if len(professor_ids) < 2:
            print("Se necesitan al menos 2 profesores para comparar")
            return
        
        comparison_data = self.compare_professors(professor_ids)
        
        fig, axes = plt.subplots(2, 2, figsize=figsize)
        
        # 1. Calidad vs Dificultad
        profs_data = comparison_data['professors']
        qualities = [profs_data[pid]['quality_bayes'] for pid in professor_ids if pid in profs_data]
        difficulties = [profs_data[pid]['difficulty_now'] for pid in professor_ids if pid in profs_data]
        names = [profs_data[pid]['name'] for pid in professor_ids if pid in profs_data]
        
        axes[0, 0].scatter(difficulties, qualities, s=100, alpha=0.7)
        for i, name in enumerate(names):
            axes[0, 0].annotate(name[:15], (difficulties[i], qualities[i]), 
                               xytext=(5, 5), textcoords='offset points')
        axes[0, 0].set_xlabel('Dificultad')
        axes[0, 0].set_ylabel('Calidad Bayesiana')
        axes[0, 0].set_title('Calidad vs Dificultad')
        axes[0, 0].grid(True, alpha=0.3)
        
        # 2. Radar chart de métricas
        metrics = ['quality_bayes', 'trust_score', 'equidad', 'recommendation_rate']
        metric_names = ['Calidad', 'Confianza', 'Equidad', 'Recomendación']
        
        angles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()
        angles += angles[:1]  # Cerrar el círculo
        
        for i, prof_id in enumerate(professor_ids):
            if prof_id in profs_data:
                values = [profs_data[prof_id][metric] for metric in metrics]
                values += values[:1]  # Cerrar el círculo
                
                axes[0, 1].plot(angles, values, 'o-', linewidth=2, label=profs_data[prof_id]['name'][:15])
                axes[0, 1].fill(angles, values, alpha=0.25)
        
        axes[0, 1].set_xticks(angles[:-1])
        axes[0, 1].set_xticklabels(metric_names)
        axes[0, 1].set_title('Comparación de Métricas')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # 3. Barras de confianza
        trust_scores = [profs_data[pid]['trust_score'] for pid in professor_ids if pid in profs_data]
        axes[1, 0].bar(range(len(names)), trust_scores, alpha=0.7)
        axes[1, 0].set_xticks(range(len(names)))
        axes[1, 0].set_xticklabels([name[:15] for name in names], rotation=45)
        axes[1, 0].set_ylabel('Score de Confianza')
        axes[1, 0].set_title('Confianza por Profesor')
        axes[1, 0].grid(True, alpha=0.3)
        
        # 4. Número de reseñas
        n_reviews = [profs_data[pid]['n_reviews'] for pid in professor_ids if pid in profs_data]
        axes[1, 1].bar(range(len(names)), n_reviews, alpha=0.7, color='green')
        axes[1, 1].set_xticks(range(len(names)))
        axes[1, 1].set_xticklabels([name[:15] for name in names], rotation=45)
        axes[1, 1].set_ylabel('Número de Reseñas')
        axes[1, 1].set_title('Número de Reseñas por Profesor')
        axes[1, 1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.show()
    
    def export_comparison_report(self, professor_ids: List[str], output_file: str = 'comparison_report.json'):
        """Exporta un reporte de comparación detallado"""
        comparison_data = self.compare_professors(professor_ids)
        
        # Añadir análisis temporal
        temporal_analysis = {}
        for prof_id in professor_ids:
            temporal_analysis[prof_id] = self.analyze_temporal_trends(prof_id)
        
        comparison_data['temporal_analysis'] = temporal_analysis
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(comparison_data, f, ensure_ascii=False, indent=2)
        
        print(f"Reporte de comparación exportado a {output_file}")
        return comparison_data

def main():
    """Función principal para demostrar las utilidades"""
    try:
        utils = ProfessorAnalysisUtils()
        
        # Ejemplo: Comparar algunos profesores
        sample_professors = list(utils.professors.keys())[:3]
        print(f"Comparando profesores: {sample_professors}")
        
        # Generar comparación
        comparison = utils.compare_professors(sample_professors)
        
        # Crear gráfico de comparación
        utils.plot_comparison_chart(sample_professors)
        
        # Generar recomendaciones
        recommendations = utils.generate_recommendation(max_difficulty=3.0)
        print(f"\nTop 5 recomendaciones:")
        for i, rec in enumerate(recommendations[:5], 1):
            print(f"{i}. {rec['name']}: Calidad={rec['quality']:.2f}, Dificultad={rec['difficulty']:.2f}")
        
        # Detectar anomalías
        anomalies = utils.detect_anomalies()
        print(f"\nAnomalías detectadas:")
        print(f"  - Alta varianza: {len(anomalies['high_variance'])}")
        print(f"  - Baja confianza: {len(anomalies['low_trust'])}")
        print(f"  - Patrones sospechosos: {len(anomalies['suspicious_patterns'])}")
        
    except FileNotFoundError:
        print("❌ Error: No se encontró el archivo 'advanced_analysis_results.json'")
        print("Ejecuta primero el script de análisis avanzado")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
