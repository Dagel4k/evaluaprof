#!/usr/bin/env python3
"""
Script de Demostración del Sistema de Análisis Avanzado
Muestra las capacidades y resultados del análisis de profesores
"""

import json
import pandas as pd
from analysis_utils import ProfessorAnalysisUtils

def demo_basic_analysis():
    """Demuestra el análisis básico de un profesor"""
    print("=" * 60)
    print("🎓 DEMOSTRACIÓN: ANÁLISIS DE PROFESOR")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    # Analizar un profesor específico
    prof_id = "Aaron_Cuen_Marquez"
    analysis = utils.analyze_temporal_trends(prof_id)
    
    print(f"\n📊 Análisis de: {analysis['name']}")
    print(f"   • Tendencia: {analysis['trend_direction']}")
    print(f"   • Fuerza de tendencia: {analysis['trend_strength']:.2f}")
    
    # Mostrar datos del profesor
    prof_data = utils.professors[prof_id]
    print(f"\n📈 Métricas Clave:")
    print(f"   • Calidad Bayesiana: {prof_data['bayes']['quality_bayes']:.2f}")
    print(f"   • Calidad con decaimiento: {prof_data['decay']['quality_now']:.2f}")
    print(f"   • Número de reseñas: {prof_data['bayes']['n_reviews']}")
    print(f"   • Tasa de recomendación: {prof_data['recommendation']['p']:.1%}")
    print(f"   • Intervalo Wilson: [{prof_data['recommendation']['wilson_95'][0]:.1%}, {prof_data['recommendation']['wilson_95'][1]:.1%}]")
    print(f"   • Score de confianza: {prof_data['integrity']['trust_score']:.2f}")
    print(f"   • Índice de equidad: {prof_data['grades']['equidad']:.2f}")

def demo_recommendations():
    """Demuestra el sistema de recomendaciones"""
    print("\n" + "=" * 60)
    print("🎯 DEMOSTRACIÓN: SISTEMA DE RECOMENDACIONES")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    # Recomendaciones generales
    print("\n🏆 TOP 10 PROFESORES (Recomendaciones Generales):")
    recommendations = utils.generate_recommendation(max_difficulty=3.0)
    
    for i, rec in enumerate(recommendations[:10], 1):
        print(f"{i:2d}. {rec['name'][:30]:<30} | Calidad: {rec['quality']:.2f} | Dificultad: {rec['difficulty']:.2f} | Confianza: {rec['trust']:.2f}")
    
    # Recomendaciones por materia específica
    print(f"\n📚 TOP 5 PROFESORES PARA 'PROPIEDAD DE LOS MATERIALES':")
    subject_recs = utils.generate_recommendation(
        subject="PROPIEDAD DE LOS MATERIALES",
        max_difficulty=3.0
    )
    
    for i, rec in enumerate(subject_recs[:5], 1):
        print(f"{i}. {rec['name'][:30]:<30} | Score: {rec['score']:.2f}")

def demo_comparison():
    """Demuestra el sistema de comparaciones"""
    print("\n" + "=" * 60)
    print("⚖️ DEMOSTRACIÓN: COMPARACIÓN DE PROFESORES")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    # Comparar algunos profesores
    professors_to_compare = [
        "Aaron_Cuen_Marquez",
        "ALAN_BRITO",
        "Jesus_Antonio_Felix_de_la_Rocha"
    ]
    
    print(f"\n🔍 Comparando profesores:")
    for prof_id in professors_to_compare:
        if prof_id in utils.professors:
            prof_data = utils.professors[prof_id]
            print(f"   • {prof_data['name']}: Calidad={prof_data['bayes']['quality_bayes']:.2f}, Reseñas={prof_data['bayes']['n_reviews']}")
    
    # Generar comparación
    comparison = utils.compare_professors(professors_to_compare)
    
    print(f"\n📊 Análisis de Pareto entre estos profesores:")
    pareto_efficient = comparison['pareto_analysis']['efficient']
    if pareto_efficient:
        for prof_id in pareto_efficient:
            prof_name = utils.professors[prof_id]['name']
            print(f"   ⭐ {prof_name} (Eficiente en Pareto)")
    else:
        print("   No hay profesores eficientes en este subconjunto")

def demo_anomaly_detection():
    """Demuestra la detección de anomalías"""
    print("\n" + "=" * 60)
    print("🔍 DEMOSTRACIÓN: DETECCIÓN DE ANOMALÍAS")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    # Detectar anomalías
    anomalies = utils.detect_anomalies()
    
    print(f"\n🚨 ANOMALÍAS DETECTADAS:")
    print(f"   • Alta varianza: {len(anomalies['high_variance'])} profesores")
    print(f"   • Baja confianza: {len(anomalies['low_trust'])} profesores")
    print(f"   • Patrones sospechosos: {len(anomalies['suspicious_patterns'])} profesores")
    
    # Mostrar algunos ejemplos
    if anomalies['high_variance']:
        print(f"\n📊 Ejemplos de alta varianza:")
        for anomaly in anomalies['high_variance'][:3]:
            print(f"   • {anomaly['name']}: varianza={anomaly['variance']:.2f}, n={anomaly['n_reviews']}")
    
    if anomalies['suspicious_patterns']:
        print(f"\n⚠️ Ejemplos de patrones sospechosos:")
        for anomaly in anomalies['suspicious_patterns'][:3]:
            print(f"   • {anomaly['name']}: dup_rate={anomaly['dup_rate']:.3f}, burst_days={anomaly['burst_days']}")

def demo_subject_analysis():
    """Demuestra el análisis por materias"""
    print("\n" + "=" * 60)
    print("📚 DEMOSTRACIÓN: ANÁLISIS POR MATERIAS")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    # Analizar una materia específica
    subject = "PROPIEDAD DE LOS MATERIALES"
    subject_report = utils.generate_subject_report(subject)
    
    if 'error' not in subject_report:
        print(f"\n📖 Reporte para: {subject}")
        print(f"   • Número de profesores: {subject_report['n_professors']}")
        print(f"   • Calidad promedio: {subject_report['avg_quality']:.2f}")
        print(f"   • Dificultad promedio: {subject_report['avg_difficulty']:.2f}")
        
        print(f"\n🏆 TOP 3 PROFESORES EN ESTA MATERIA:")
        for i, prof in enumerate(subject_report['professors'][:3], 1):
            print(f"{i}. {prof['name']}: Calidad={prof['quality_bayes']:.2f}, Z-score={prof['z_decayed']:.2f}")
    else:
        print(f"❌ {subject_report['error']}")

def demo_global_stats():
    """Demuestra las estadísticas globales"""
    print("\n" + "=" * 60)
    print("🌍 DEMOSTRACIÓN: ESTADÍSTICAS GLOBALES")
    print("=" * 60)
    
    utils = ProfessorAnalysisUtils()
    
    print(f"\n📊 ESTADÍSTICAS DEL DATASET:")
    print(f"   • Total de profesores: {len(utils.professors)}")
    print(f"   • Calidad promedio global: {utils.global_stats['mu_quality']:.2f}")
    print(f"   • Dificultad promedio global: {utils.global_stats['mu_difficulty']:.2f}")
    print(f"   • Tasa de recomendación global: {utils.global_stats['recommendation_rate']:.1%}")
    
    # Análisis de distribución
    qualities = []
    difficulties = []
    trust_scores = []
    
    for prof_data in utils.professors.values():
        if 'error' not in prof_data:
            if prof_data.get('bayes', {}).get('quality_bayes'):
                qualities.append(prof_data['bayes']['quality_bayes'])
            if prof_data.get('decay', {}).get('difficulty_now'):
                difficulties.append(prof_data['decay']['difficulty_now'])
            if prof_data.get('integrity', {}).get('trust_score'):
                trust_scores.append(prof_data['integrity']['trust_score'])
    
    if qualities:
        print(f"\n📈 DISTRIBUCIÓN DE CALIDADES:")
        print(f"   • Media: {sum(qualities)/len(qualities):.2f}")
        print(f"   • Mediana: {sorted(qualities)[len(qualities)//2]:.2f}")
        print(f"   • Rango: {min(qualities):.2f} - {max(qualities):.2f}")
    
    if trust_scores:
        print(f"\n🔒 DISTRIBUCIÓN DE CONFIANZA:")
        print(f"   • Media: {sum(trust_scores)/len(trust_scores):.2f}")
        print(f"   • Alta confianza (≥0.8): {sum(1 for s in trust_scores if s >= 0.8)}")
        print(f"   • Baja confianza (<0.5): {sum(1 for s in trust_scores if s < 0.5)}")

def main():
    """Función principal de demostración"""
    print("🎓 SISTEMA DE ANÁLISIS AVANZADO DE PROFESORES")
    print("=" * 60)
    print("Este script demuestra las capacidades del sistema de análisis")
    print("que implementa 10 técnicas estadísticas avanzadas.")
    
    try:
        # Cargar utilidades
        utils = ProfessorAnalysisUtils()
        
        # Ejecutar demostraciones
        demo_global_stats()
        demo_basic_analysis()
        demo_recommendations()
        demo_comparison()
        demo_anomaly_detection()
        demo_subject_analysis()
        
        print("\n" + "=" * 60)
        print("✅ DEMOSTRACIÓN COMPLETADA")
        print("=" * 60)
        print("\n📁 Archivos generados:")
        print("   • advanced_analysis_results.json - Resultados completos")
        print("   • top_professors.csv - Ranking de profesores")
        print("   • comparison_report.json - Comparaciones")
        
        print("\n🎯 Próximos pasos:")
        print("   1. Ejecuta 'python visualization_dashboard.py' para gráficos")
        print("   2. Usa 'python analysis_utils.py' para análisis específicos")
        print("   3. Consulta el README_ANALISIS_AVANZADO.md para más detalles")
        
    except FileNotFoundError:
        print("❌ Error: No se encontró el archivo 'advanced_analysis_results.json'")
        print("Ejecuta primero: python advanced_analysis.py")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
