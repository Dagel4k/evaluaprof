#!/usr/bin/env python3
"""
Dashboard de Visualización para Análisis Avanzado de Profesores
Muestra gráficos interactivos y tablas con los resultados del análisis
"""

import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime

def load_results():
    """Load analysis results"""
    with open('advanced_analysis_results.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def create_dataframe(results):
    """Create DataFrame from results"""
    data = []
    
    for prof_id, prof_data in results['professors'].items():
        if 'error' in prof_data:
            continue
            
        row = {
            'professor_id': prof_id,
            'name': prof_data.get('nombre', ''),
            'n_reviews': prof_data.get('n_reviews', 0),
            'quality_decayed': prof_data.get('decay_analysis', {}).get('quality_decayed'),
            'difficulty_decayed': prof_data.get('decay_analysis', {}).get('difficulty_decayed'),
            'quality_bayes': prof_data.get('bayes_analysis', {}).get('quality_bayes'),
            'difficulty_bayes': prof_data.get('bayes_analysis', {}).get('difficulty_bayes'),
            'recommendation_rate': prof_data.get('recommendation_analysis', {}).get('rate'),
            'wilson_low': prof_data.get('recommendation_analysis', {}).get('wilson_interval', [None, None])[0],
            'wilson_high': prof_data.get('recommendation_analysis', {}).get('wilson_interval', [None, None])[1],
            'trust_score': prof_data.get('integrity_analysis', {}).get('trust_score'),
            'n_comments': prof_data.get('nlp_analysis', {}).get('n_comments', 0),
            'overall_sentiment': prof_data.get('nlp_analysis', {}).get('sentiment', {}).get('overall'),
            'n_grades': prof_data.get('grades_analysis', {}).get('n_grades', 0),
            'equity_index': prof_data.get('grades_analysis', {}).get('equity_index')
        }
        
        # Calculate composite score (quality - difficulty + trust bonus)
        if row['quality_bayes'] is not None and row['difficulty_decayed'] is not None:
            base_score = row['quality_bayes'] - row['difficulty_decayed']
            trust_bonus = (row['trust_score'] or 0) * 0.5
            row['composite_score'] = base_score + trust_bonus
        else:
            row['composite_score'] = None
            
        data.append(row)
    
    df = pd.DataFrame(data)
    
    # Convert numeric columns
    numeric_cols = ['quality_decayed', 'difficulty_decayed', 'quality_bayes', 
                   'difficulty_bayes', 'recommendation_rate', 'wilson_low', 
                   'wilson_high', 'trust_score', 'overall_sentiment', 
                   'equity_index', 'composite_score']
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    return df

def plot_pareto_frontier(results, df):
    """Plot Pareto frontier"""
    plt.figure(figsize=(12, 8))
    
    # Plot all points
    valid_points = df.dropna(subset=['quality_bayes', 'difficulty_decayed'])
    
    plt.scatter(valid_points['difficulty_decayed'], valid_points['quality_bayes'], 
               alpha=0.6, s=50, c='lightblue', label='Todos los profesores')
    
    # Plot Pareto frontier
    pareto_points = results.get('pareto_frontier', [])
    if pareto_points:
        pareto_x = [p['x_diff'] for p in pareto_points]
        pareto_y = [p['y_qual'] for p in pareto_points]
        plt.scatter(pareto_x, pareto_y, c='red', s=100, marker='o', 
                   label='Frontera de Pareto', zorder=5)
        
        # Connect Pareto points
        plt.plot(pareto_x, pareto_y, 'r-', linewidth=2, alpha=0.7)
    
    plt.xlabel('Dificultad (menor es mejor)')
    plt.ylabel('Calidad Bayesiana')
    plt.title('Frontera de Pareto: Calidad vs Dificultad')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('pareto_frontier.png', dpi=300, bbox_inches='tight')
    plt.show()

def plot_quality_distribution(df):
    """Plot quality distribution"""
    plt.figure(figsize=(15, 5))
    
    # Quality distribution
    plt.subplot(1, 3, 1)
    valid_quality = df['quality_bayes'].dropna()
    plt.hist(valid_quality, bins=20, alpha=0.7, color='skyblue', edgecolor='black')
    plt.xlabel('Calidad Bayesiana')
    plt.ylabel('Frecuencia')
    plt.title('Distribución de Calidad')
    plt.axvline(valid_quality.mean(), color='red', linestyle='--', 
                label=f'Media: {valid_quality.mean():.2f}')
    plt.legend()
    
    # Difficulty distribution
    plt.subplot(1, 3, 2)
    valid_difficulty = df['difficulty_decayed'].dropna()
    plt.hist(valid_difficulty, bins=20, alpha=0.7, color='lightcoral', edgecolor='black')
    plt.xlabel('Dificultad')
    plt.ylabel('Frecuencia')
    plt.title('Distribución de Dificultad')
    plt.axvline(valid_difficulty.mean(), color='red', linestyle='--', 
                label=f'Media: {valid_difficulty.mean():.2f}')
    plt.legend()
    
    # Trust score distribution
    plt.subplot(1, 3, 3)
    valid_trust = df['trust_score'].dropna()
    plt.hist(valid_trust, bins=20, alpha=0.7, color='lightgreen', edgecolor='black')
    plt.xlabel('Trust Score')
    plt.ylabel('Frecuencia')
    plt.title('Distribución de Trust Score')
    plt.axvline(valid_trust.mean(), color='red', linestyle='--', 
                label=f'Media: {valid_trust.mean():.2f}')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('distributions.png', dpi=300, bbox_inches='tight')
    plt.show()

def plot_temporal_analysis(results):
    """Plot temporal analysis"""
    plt.figure(figsize=(15, 10))
    
    # Sample a few professors for temporal analysis
    professors = list(results['professors'].items())[:3]
    
    for i, (prof_id, prof_data) in enumerate(professors):
        trends = prof_data.get('trends_analysis', {})
        quality_trend = trends.get('quality_trend')
        
        if quality_trend and quality_trend.get('series'):
            plt.subplot(2, 2, i+1)
            
            series = quality_trend['series']
            ewma = quality_trend['ewma']
            sigma = quality_trend['sigma']
            
            x = range(len(series))
            plt.plot(x, series, 'o-', label='Calidad Real', alpha=0.7)
            plt.plot(x, ewma, 'r-', label='EWMA', linewidth=2)
            
            # Plot confidence bands
            upper_band = [e + 2*sigma for e in ewma]
            lower_band = [e - 2*sigma for e in ewma]
            plt.fill_between(x, lower_band, upper_band, alpha=0.2, color='red', 
                           label='Banda de Confianza')
            
            plt.xlabel('Período')
            plt.ylabel('Calidad')
            plt.title(f'Tendencia Temporal - {prof_data.get("nombre", prof_id)}')
            plt.legend()
            plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('temporal_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

def plot_recommendation_analysis(df):
    """Plot recommendation analysis"""
    plt.figure(figsize=(12, 8))
    
    # Recommendation rate vs quality
    valid_data = df.dropna(subset=['recommendation_rate', 'quality_bayes'])
    
    plt.scatter(valid_data['recommendation_rate'], valid_data['quality_bayes'], 
               alpha=0.6, s=50)
    
    # Add trend line
    z = np.polyfit(valid_data['recommendation_rate'], valid_data['quality_bayes'], 1)
    p = np.poly1d(z)
    plt.plot(valid_data['recommendation_rate'], p(valid_data['recommendation_rate']), 
            "r--", alpha=0.8)
    
    plt.xlabel('Tasa de Recomendación')
    plt.ylabel('Calidad Bayesiana')
    plt.title('Relación: Recomendación vs Calidad')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('recommendation_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

def plot_subject_analysis(results):
    """Plot subject analysis"""
    subject_stats = results.get('subject_stats', {})
    
    if not subject_stats:
        print("No hay estadísticas por materia disponibles")
        return
    
    # Prepare data
    subjects = []
    quality_means = []
    difficulty_means = []
    n_reviews = []
    
    for subject, stats in subject_stats.items():
        if stats['n_reviews'] >= 5:  # Only subjects with enough reviews
            subjects.append(subject)
            quality_means.append(stats['mu_quality'])
            difficulty_means.append(stats['mu_difficulty'])
            n_reviews.append(stats['n_reviews'])
    
    if not subjects:
        print("No hay materias con suficientes reseñas")
        return
    
    # Create plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Quality by subject
    bars1 = ax1.bar(range(len(subjects)), quality_means, color='skyblue', alpha=0.7)
    ax1.set_xlabel('Materia')
    ax1.set_ylabel('Calidad Promedio')
    ax1.set_title('Calidad por Materia')
    ax1.set_xticks(range(len(subjects)))
    ax1.set_xticklabels(subjects, rotation=45, ha='right')
    
    # Add value labels on bars
    for bar, value in zip(bars1, quality_means):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                f'{value:.2f}', ha='center', va='bottom')
    
    # Difficulty by subject
    bars2 = ax2.bar(range(len(subjects)), difficulty_means, color='lightcoral', alpha=0.7)
    ax2.set_xlabel('Materia')
    ax2.set_ylabel('Dificultad Promedio')
    ax2.set_title('Dificultad por Materia')
    ax2.set_xticks(range(len(subjects)))
    ax2.set_xticklabels(subjects, rotation=45, ha='right')
    
    # Add value labels on bars
    for bar, value in zip(bars2, difficulty_means):
        ax2.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                f'{value:.2f}', ha='center', va='bottom')
    
    plt.tight_layout()
    plt.savefig('subject_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()

def export_top_professors(df, n=10):
    """Export top professors to CSV"""
    # Filter valid composite scores
    valid_df = df.dropna(subset=['composite_score'])
    
    if valid_df.empty:
        print("No hay profesores con puntaje compuesto válido")
        return
    
    # Get top professors
    top_professors = valid_df.nlargest(n, 'composite_score')
    
    # Select relevant columns
    export_cols = ['name', 'composite_score', 'quality_bayes', 'difficulty_decayed', 
                  'recommendation_rate', 'trust_score', 'n_reviews']
    
    export_df = top_professors[export_cols].copy()
    export_df.columns = ['Nombre', 'Puntaje_Compuesto', 'Calidad_Bayes', 'Dificultad', 
                        'Tasa_Recomendacion', 'Trust_Score', 'N_Resenas']
    
    # Save to CSV
    export_df.to_csv('top_professors.csv', index=False, encoding='utf-8')
    print(f"Top {n} profesores exportados a 'top_professors.csv'")
    
    # Print summary
    print("\n=== TOP PROFESORES ===")
    for i, (_, row) in enumerate(export_df.iterrows(), 1):
        print(f"{i}. {row['Nombre']}: {row['Puntaje_Compuesto']:.2f} "
              f"(Calidad: {row['Calidad_Bayes']:.2f}, Dificultad: {row['Dificultad']:.2f})")

def generate_summary_report(results, df):
    """Generate summary report"""
    print("\n" + "="*50)
    print("REPORTE DE ANÁLISIS AVANZADO")
    print("="*50)
    
    # Global statistics
    global_stats = results.get('global_stats', {})
    print(f"\n📊 ESTADÍSTICAS GLOBALES:")
    print(f"   • Total de reseñas: {global_stats.get('total_reviews', 0):,}")
    print(f"   • Calidad promedio: {global_stats.get('mu_quality', 0):.2f}")
    print(f"   • Dificultad promedio: {global_stats.get('mu_difficulty', 0):.2f}")
    print(f"   • Tasa de recomendación: {global_stats.get('recommendation_rate', 0):.1%}")
    
    # Professor statistics
    valid_professors = df.dropna(subset=['quality_bayes'])
    print(f"\n👨‍🏫 ESTADÍSTICAS DE PROFESORES:")
    print(f"   • Profesores analizados: {len(valid_professors)}")
    print(f"   • Calidad promedio: {valid_professors['quality_bayes'].mean():.2f}")
    print(f"   • Dificultad promedio: {valid_professors['difficulty_decayed'].mean():.2f}")
    print(f"   • Trust score promedio: {valid_professors['trust_score'].mean():.2f}")
    
    # Pareto frontier
    pareto_points = results.get('pareto_frontier', [])
    print(f"\n🏆 FRONTERA DE PARETO:")
    print(f"   • Profesores eficientes: {len(pareto_points)}")
    if pareto_points:
        best_quality = max(p['y_qual'] for p in pareto_points)
        best_difficulty = min(p['x_diff'] for p in pareto_points)
        print(f"   • Mejor calidad: {best_quality:.2f}")
        print(f"   • Menor dificultad: {best_difficulty:.2f}")
    
    # Subject analysis
    subject_stats = results.get('subject_stats', {})
    print(f"\n📚 ANÁLISIS POR MATERIAS:")
    print(f"   • Materias analizadas: {len(subject_stats)}")
    if subject_stats:
        best_subject = max(subject_stats.items(), key=lambda x: x[1]['mu_quality'])
        print(f"   • Mejor materia (calidad): {best_subject[0]} ({best_subject[1]['mu_quality']:.2f})")

def main():
    """Main function"""
    try:
        # Load results
        results = load_results()
        
        # Create DataFrame
        df = create_dataframe(results)
        
        print(f"DataFrame creado con {len(df)} profesores")
        print(f"Columnas: {list(df.columns)}")
        
        # Generate visualizations
        print("\nGenerando visualizaciones...")
        
        plot_pareto_frontier(results, df)
        plot_quality_distribution(df)
        plot_temporal_analysis(results)
        plot_recommendation_analysis(df)
        plot_subject_analysis(results)
        
        # Export top professors
        export_top_professors(df)
        
        # Generate summary report
        generate_summary_report(results, df)
        
        print("\n✅ Dashboard completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error en el dashboard: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
