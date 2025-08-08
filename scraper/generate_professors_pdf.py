#!/usr/bin/env python3
"""
Professional PDF Generator for Professor Evaluations
====================================================

This script generates a comprehensive PDF report from enriched professor data.
Features:
- Professional layout with headers and footers
- Statistical visualizations
- Color-coded ratings
- Organized sections for easy reading
- Summary statistics and insights

Author: AI Assistant
Date: January 2025
"""

import json
import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.backends.backend_pdf import PdfPages
import seaborn as sns
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Set up matplotlib for better PDF output
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 10
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300

class ProfessorPDFGenerator:
    """Professional PDF generator for professor evaluation data."""
    
    def __init__(self, data_folder):
        """Initialize the PDF generator with data folder path."""
        self.data_folder = Path(data_folder)
        self.professors_data = []
        self.colors = {
            'primary': '#2E4A6B',      # Professional dark blue
            'secondary': '#4A90A4',    # Medium blue
            'accent': '#87CEEB',       # Light blue
            'success': '#28A745',      # Green for good ratings
            'warning': '#FFC107',      # Yellow for medium ratings
            'danger': '#DC3545',       # Red for poor ratings
            'light_gray': '#F8F9FA',   # Light background
            'dark_gray': '#6C757D'     # Text gray
        }
        
    def load_professor_data(self):
        """Load all professor JSON files from the data folder."""
        print("Loading professor data...")
        json_files = list(self.data_folder.glob("*.json"))
        
        for file_path in json_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    # Skip invalid or empty files
                    if 'nombre' in data and 'universidad' in data:
                        self.professors_data.append(data)
                    else:
                        print(f"Skipping invalid file: {file_path.name}")
            except (json.JSONDecodeError, KeyError) as e:
                print(f"Error loading {file_path.name}: {e}")
                
        print(f"Loaded {len(self.professors_data)} professor profiles")
        return len(self.professors_data)
    
    def get_rating_color(self, rating):
        """Get color based on rating value."""
        if rating is None:
            return self.colors['dark_gray']
        if rating >= 7:
            return self.colors['success']
        elif rating >= 5:
            return self.colors['warning']
        else:
            return self.colors['danger']
    
    def create_header(self, fig, title, subtitle=""):
        """Create a professional header for each page."""
        fig.suptitle(title, fontsize=16, fontweight='bold', color=self.colors['primary'])
        if subtitle:
            fig.text(0.5, 0.95, subtitle, ha='center', fontsize=12, color=self.colors['dark_gray'])
        
        # Add a decorative line
        fig.text(0.1, 0.93, '─' * 80, ha='left', fontsize=8, color=self.colors['accent'])
    
    def create_footer(self, fig, page_num):
        """Create a professional footer for each page."""
        timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        fig.text(0.1, 0.02, f"Generated on {timestamp}", fontsize=8, color=self.colors['dark_gray'])
        fig.text(0.9, 0.02, f"Page {page_num}", ha='right', fontsize=8, color=self.colors['dark_gray'])
        
        # Add decorative line
        fig.text(0.1, 0.04, '─' * 80, ha='left', fontsize=8, color=self.colors['accent'])
    
    def create_title_page(self, pdf):
        """Create an attractive title page."""
        fig, ax = plt.subplots(figsize=(8.5, 11))
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        
        # Main title
        ax.text(0.5, 0.7, 'EVALUACIÓN DE PROFESORES', 
                ha='center', va='center', fontsize=28, fontweight='bold',
                color=self.colors['primary'])
        
        # Subtitle
        ax.text(0.5, 0.6, 'Reporte Integral de Análisis Académico', 
                ha='center', va='center', fontsize=16,
                color=self.colors['secondary'])
        
        # University name
        if self.professors_data:
            university = self.professors_data[0].get('universidad', 'Universidad')
            ax.text(0.5, 0.5, university, 
                    ha='center', va='center', fontsize=14, 
                    color=self.colors['dark_gray'])
        
        # Statistics box
        total_profs = len(self.professors_data)
        total_reviews = sum(prof.get('n_reviews', 0) for prof in self.professors_data)
        
        # Create a professional info box
        box = patches.FancyBboxPatch((0.2, 0.25), 0.6, 0.15,
                                   boxstyle="round,pad=0.02",
                                   facecolor=self.colors['light_gray'],
                                   edgecolor=self.colors['primary'],
                                   linewidth=2)
        ax.add_patch(box)
        
        ax.text(0.5, 0.35, 'ESTADÍSTICAS DEL REPORTE', 
                ha='center', va='center', fontsize=12, fontweight='bold',
                color=self.colors['primary'])
        
        ax.text(0.5, 0.31, f'Profesores analizados: {total_profs:,}', 
                ha='center', va='center', fontsize=11,
                color=self.colors['dark_gray'])
        
        ax.text(0.5, 0.28, f'Total de evaluaciones: {total_reviews:,}', 
                ha='center', va='center', fontsize=11,
                color=self.colors['dark_gray'])
        
        # Date
        ax.text(0.5, 0.15, f'Generado el {datetime.now().strftime("%d de %B, %Y")}', 
                ha='center', va='center', fontsize=12,
                color=self.colors['secondary'])
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def create_summary_page(self, pdf):
        """Create a summary statistics page."""
        fig = plt.figure(figsize=(8.5, 11))
        self.create_header(fig, "RESUMEN EJECUTIVO", "Estadísticas Generales del Cuerpo Docente")
        
        # Prepare data for analysis
        quality_ratings = []
        recommendation_rates = []
        review_counts = []
        trust_scores = []
        
        for prof in self.professors_data:
            # Quality ratings
            bayes_quality = prof.get('bayes_analysis', {}).get('quality_bayes')
            if bayes_quality is not None:
                quality_ratings.append(bayes_quality)
            
            # Recommendation rates
            rec_analysis = prof.get('recommendation_analysis', {})
            if rec_analysis.get('rate') is not None:
                recommendation_rates.append(rec_analysis['rate'] * 100)
            
            # Review counts
            n_reviews = prof.get('n_reviews', 0)
            if n_reviews > 0:
                review_counts.append(n_reviews)
            
            # Trust scores
            trust_score = prof.get('integrity_analysis', {}).get('trust_score')
            if trust_score is not None:
                trust_scores.append(trust_score * 100)
        
        # Create subplots
        gs = fig.add_gridspec(3, 2, hspace=0.4, wspace=0.3, 
                             left=0.1, right=0.9, top=0.85, bottom=0.15)
        
        # Quality distribution
        if quality_ratings:
            ax1 = fig.add_subplot(gs[0, 0])
            ax1.hist(quality_ratings, bins=20, color=self.colors['secondary'], alpha=0.7, edgecolor='white')
            ax1.set_title('Distribución de Calidad Docente', fontweight='bold', color=self.colors['primary'])
            ax1.set_xlabel('Calificación de Calidad')
            ax1.set_ylabel('Número de Profesores')
            ax1.grid(True, alpha=0.3)
            
            # Add statistics
            mean_quality = np.mean(quality_ratings)
            ax1.axvline(mean_quality, color=self.colors['danger'], linestyle='--', 
                       label=f'Promedio: {mean_quality:.1f}')
            ax1.legend()
        
        # Recommendation rates
        if recommendation_rates:
            ax2 = fig.add_subplot(gs[0, 1])
            ax2.hist(recommendation_rates, bins=15, color=self.colors['accent'], alpha=0.7, edgecolor='white')
            ax2.set_title('Tasas de Recomendación', fontweight='bold', color=self.colors['primary'])
            ax2.set_xlabel('Porcentaje de Recomendación')
            ax2.set_ylabel('Número de Profesores')
            ax2.grid(True, alpha=0.3)
            
            mean_rec = np.mean(recommendation_rates)
            ax2.axvline(mean_rec, color=self.colors['danger'], linestyle='--',
                       label=f'Promedio: {mean_rec:.1f}%')
            ax2.legend()
        
        # Review counts distribution
        if review_counts:
            ax3 = fig.add_subplot(gs[1, 0])
            ax3.hist(review_counts, bins=20, color=self.colors['success'], alpha=0.7, edgecolor='white')
            ax3.set_title('Distribución de Evaluaciones', fontweight='bold', color=self.colors['primary'])
            ax3.set_xlabel('Número de Evaluaciones')
            ax3.set_ylabel('Número de Profesores')
            ax3.grid(True, alpha=0.3)
            ax3.set_yscale('log')  # Log scale for better visualization
        
        # Trust scores
        if trust_scores:
            ax4 = fig.add_subplot(gs[1, 1])
            ax4.hist(trust_scores, bins=15, color=self.colors['warning'], alpha=0.7, edgecolor='white')
            ax4.set_title('Puntajes de Confiabilidad', fontweight='bold', color=self.colors['primary'])
            ax4.set_xlabel('Puntaje de Confianza (%)')
            ax4.set_ylabel('Número de Profesores')
            ax4.grid(True, alpha=0.3)
        
        # Summary statistics table
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('off')
        
        # Create summary statistics
        stats_data = []
        if quality_ratings:
            stats_data.append(['Calidad Promedio', f'{np.mean(quality_ratings):.2f}', f'(σ = {np.std(quality_ratings):.2f})'])
        if recommendation_rates:
            stats_data.append(['Recomendación Promedio', f'{np.mean(recommendation_rates):.1f}%', f'(σ = {np.std(recommendation_rates):.1f}%)'])
        if review_counts:
            stats_data.append(['Evaluaciones Promedio', f'{np.mean(review_counts):.0f}', f'(máx = {np.max(review_counts)})'])
        if trust_scores:
            stats_data.append(['Confiabilidad Promedio', f'{np.mean(trust_scores):.1f}%', f'(σ = {np.std(trust_scores):.1f}%)'])
        
        stats_data.append(['Total de Profesores', str(len(self.professors_data)), ''])
        stats_data.append(['Total de Evaluaciones', f'{sum(review_counts):,}' if review_counts else '0', ''])
        
        # Create table
        table = ax5.table(cellText=stats_data,
                         colLabels=['Métrica', 'Valor', 'Detalle'],
                         cellLoc='center',
                         loc='center',
                         colWidths=[0.4, 0.3, 0.3])
        
        table.auto_set_font_size(False)
        table.set_fontsize(10)
        table.scale(1, 2)
        
        # Style the table
        for i in range(len(stats_data) + 1):
            for j in range(3):
                cell = table[i, j]
                if i == 0:  # Header
                    cell.set_facecolor(self.colors['primary'])
                    cell.set_text_props(weight='bold', color='white')
                else:
                    cell.set_facecolor(self.colors['light_gray'] if i % 2 == 0 else 'white')
                    cell.set_text_props(color=self.colors['dark_gray'])
        
        self.create_footer(fig, 2)
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def create_professor_page(self, prof_data, pdf, page_num):
        """Create a detailed page for each professor."""
        fig = plt.figure(figsize=(8.5, 11))
        
        prof_name = prof_data.get('nombre', 'Nombre no disponible')
        university = prof_data.get('universidad', 'Universidad no disponible')
        
        self.create_header(fig, f"PERFIL DOCENTE: {prof_name}", university)
        
        # Create grid layout
        gs = fig.add_gridspec(4, 2, hspace=0.5, wspace=0.3,
                             left=0.1, right=0.9, top=0.85, bottom=0.15)
        
        # Basic information section
        ax1 = fig.add_subplot(gs[0, :])
        ax1.axis('off')
        
        # Create info boxes
        bayes_quality = prof_data.get('bayes_analysis', {}).get('quality_bayes')
        rec_rate = prof_data.get('recommendation_analysis', {}).get('rate', 0) * 100
        n_reviews = prof_data.get('n_reviews', 0)
        trust_score = prof_data.get('integrity_analysis', {}).get('trust_score', 0) * 100
        
        # Quality score box
        quality_color = self.get_rating_color(bayes_quality)
        quality_text = f"{bayes_quality:.1f}" if bayes_quality else "N/A"
        
        # Create metric boxes
        metrics = [
            ("Calidad Docente", quality_text, quality_color),
            ("Recomendación", f"{rec_rate:.1f}%", self.get_rating_color(rec_rate/10)),
            ("Evaluaciones", str(n_reviews), self.colors['secondary']),
            ("Confiabilidad", f"{trust_score:.0f}%", self.get_rating_color(trust_score/10))
        ]
        
        for i, (label, value, color) in enumerate(metrics):
            x_pos = 0.2 + (i * 0.2)
            
            # Create box
            box = patches.FancyBboxPatch((x_pos - 0.08, 0.3), 0.16, 0.4,
                                       boxstyle="round,pad=0.02",
                                       facecolor=color, alpha=0.2,
                                       edgecolor=color, linewidth=2)
            ax1.add_patch(box)
            
            ax1.text(x_pos, 0.6, value, ha='center', va='center',
                    fontsize=14, fontweight='bold', color=color)
            ax1.text(x_pos, 0.4, label, ha='center', va='center',
                    fontsize=9, color=self.colors['dark_gray'])
        
        ax1.set_xlim(0, 1)
        ax1.set_ylim(0, 1)
        
        # Subject analysis
        subject_norm = prof_data.get('subject_normalization', {})
        if subject_norm and subject_norm.get('per_subject'):
            ax2 = fig.add_subplot(gs[1, 0])
            subjects = subject_norm['per_subject'][:5]  # Top 5 subjects
            
            subject_names = [s['materia'][:20] for s in subjects]  # Truncate long names
            z_scores = [s['z_decayed'] for s in subjects]
            n_counts = [s['n'] for s in subjects]
            
            bars = ax2.barh(subject_names, z_scores, 
                           color=[self.get_rating_color((z + 2) * 2.5) for z in z_scores])
            ax2.set_title('Rendimiento por Materia (Z-Score)', fontweight='bold', color=self.colors['primary'])
            ax2.set_xlabel('Puntuación Normalizada')
            ax2.axvline(0, color='black', linestyle='-', alpha=0.5)
            ax2.grid(True, alpha=0.3, axis='x')
            
            # Add count annotations
            for i, (bar, count) in enumerate(zip(bars, n_counts)):
                ax2.text(bar.get_width() + 0.05 if bar.get_width() >= 0 else bar.get_width() - 0.05,
                        bar.get_y() + bar.get_height()/2, f'n={count}',
                        ha='left' if bar.get_width() >= 0 else 'right', va='center', fontsize=8)
        
        # Sentiment analysis over time
        nlp_analysis = prof_data.get('nlp_analysis', {})
        sentiment_data = nlp_analysis.get('sentiment', {}) if nlp_analysis else {}
        sentiment_by_month = sentiment_data.get('by_month', {}) if sentiment_data else {}
        
        if sentiment_by_month:
            ax3 = fig.add_subplot(gs[1, 1])
            
            # Filter and sort sentiment data
            valid_sentiment = {k: v for k, v in sentiment_by_month.items() 
                             if v is not None and k != 'overall'}
            
            if valid_sentiment:
                sorted_months = sorted(valid_sentiment.keys())[-12:]  # Last 12 months with data
                sentiment_values = [valid_sentiment[month] for month in sorted_months]
                
                ax3.plot(range(len(sorted_months)), sentiment_values, 
                        marker='o', color=self.colors['secondary'], linewidth=2, markersize=4)
                ax3.set_title('Tendencia de Sentimiento', fontweight='bold', color=self.colors['primary'])
                ax3.set_ylabel('Sentimiento Promedio')
                ax3.set_xticks(range(len(sorted_months)))
                ax3.set_xticklabels([m[:7] for m in sorted_months], rotation=45, ha='right')
                ax3.axhline(0, color='black', linestyle='--', alpha=0.5)
                ax3.grid(True, alpha=0.3)
                ax3.set_ylim(-1, 1)
        
        # Quality trend
        trends_analysis = prof_data.get('trends_analysis', {})
        quality_trend = trends_analysis.get('quality_trend', {}) if trends_analysis else {}
        
        if quality_trend and quality_trend.get('series'):
            ax4 = fig.add_subplot(gs[2, 0])
            series = quality_trend['series'][-20:]  # Last 20 data points
            ewma = quality_trend.get('ewma', [])[-20:] if quality_trend.get('ewma') else []
            
            x_range = range(len(series))
            ax4.plot(x_range, series, 'o-', color=self.colors['accent'], 
                    alpha=0.6, label='Calificaciones', markersize=3)
            
            if ewma:
                ax4.plot(x_range, ewma, '-', color=self.colors['danger'], 
                        linewidth=2, label='Tendencia (EWMA)')
            
            ax4.set_title('Tendencia de Calidad', fontweight='bold', color=self.colors['primary'])
            ax4.set_ylabel('Calificación')
            ax4.set_xlabel('Evaluaciones Recientes')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        
        # Top topics from NLP analysis
        topics = nlp_analysis.get('topics', []) if nlp_analysis else []
        if topics:
            ax5 = fig.add_subplot(gs[2, 1])
            ax5.axis('off')
            
            ax5.text(0.5, 0.9, 'Temas Principales en Comentarios', 
                    ha='center', va='top', fontweight='bold', 
                    color=self.colors['primary'], fontsize=11)
            
            for i, topic in enumerate(topics[:3]):  # Top 3 topics
                words = ', '.join(topic.get('words', [])[:3])  # Top 3 words per topic
                weight = topic.get('weight', 0)
                
                y_pos = 0.7 - (i * 0.2)
                ax5.text(0.1, y_pos, f"• {words}", ha='left', va='center',
                        fontsize=9, color=self.colors['dark_gray'])
                ax5.text(0.9, y_pos, f"{weight:.1%}", ha='right', va='center',
                        fontsize=9, color=self.colors['secondary'], fontweight='bold')
            
            ax5.set_xlim(0, 1)
            ax5.set_ylim(0, 1)
        
        # Recent comments section
        recent_comments = prof_data.get('comments_recent', [])[:3]  # Top 3 recent comments
        
        if recent_comments:
            ax6 = fig.add_subplot(gs[3, :])
            ax6.axis('off')
            
            ax6.text(0.5, 0.95, 'Comentarios Recientes', ha='center', va='top',
                    fontweight='bold', color=self.colors['primary'], fontsize=12)
            
            for i, comment in enumerate(recent_comments):
                # Truncate long comments
                display_comment = comment[:150] + "..." if len(comment) > 150 else comment
                y_pos = 0.8 - (i * 0.25)
                
                # Create comment box
                ax6.text(0.05, y_pos, f'"{display_comment}"', ha='left', va='top',
                        fontsize=9, color=self.colors['dark_gray'], style='italic',
                        wrap=True)
            
            ax6.set_xlim(0, 1)
            ax6.set_ylim(0, 1)
        
        self.create_footer(fig, page_num)
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)
    
    def generate_pdf(self, output_filename="evaluacion_profesores.pdf"):
        """Generate the complete PDF report."""
        if not self.professors_data:
            print("No professor data loaded. Please run load_professor_data() first.")
            return
        
        print(f"Generating PDF report: {output_filename}")
        
        with PdfPages(output_filename) as pdf:
            # Title page
            print("Creating title page...")
            self.create_title_page(pdf)
            
            # Summary page
            print("Creating summary page...")
            self.create_summary_page(pdf)
            
            # Individual professor pages
            print("Creating individual professor pages...")
            for i, prof_data in enumerate(self.professors_data):
                print(f"Processing professor {i+1}/{len(self.professors_data)}: {prof_data.get('nombre', 'Unknown')}")
                self.create_professor_page(prof_data, pdf, i + 3)
        
        print(f"PDF report generated successfully: {output_filename}")
        return output_filename


def main():
    """Main function to run the PDF generator."""
    # Configuration
    DATA_FOLDER = "out/profesores_enriquecido"  # Relative to script location
    OUTPUT_FILE = "Reporte_Evaluacion_Profesores.pdf"
    
    # Get the script directory
    script_dir = Path(__file__).parent
    data_path = script_dir / DATA_FOLDER
    
    print("=" * 60)
    print("GENERADOR DE REPORTES PDF - EVALUACIÓN DE PROFESORES")
    print("=" * 60)
    print(f"Directorio de datos: {data_path}")
    print(f"Archivo de salida: {OUTPUT_FILE}")
    print()
    
    # Check if data folder exists
    if not data_path.exists():
        print(f"Error: No se encontró el directorio de datos: {data_path}")
        print("Por favor, verifica que el directorio existe y contiene archivos JSON.")
        return
    
    # Initialize generator
    generator = ProfessorPDFGenerator(data_path)
    
    # Load data
    num_loaded = generator.load_professor_data()
    
    if num_loaded == 0:
        print("No se encontraron archivos JSON válidos en el directorio.")
        return
    
    print()
    print("Iniciando generación del PDF...")
    print("Este proceso puede tomar varios minutos dependiendo del número de profesores...")
    print()
    
    # Generate PDF
    try:
        output_path = generator.generate_pdf(OUTPUT_FILE)
        print()
        print("=" * 60)
        print("¡REPORTE GENERADO EXITOSAMENTE!")
        print("=" * 60)
        print(f"Archivo: {output_path}")
        print(f"Profesores procesados: {num_loaded}")
        print(f"Páginas generadas: {num_loaded + 2}")  # +2 for title and summary pages
        print()
        print("El reporte incluye:")
        print("• Página de título con estadísticas generales")
        print("• Resumen ejecutivo con análisis estadístico")
        print("• Perfil detallado de cada profesor con:")
        print("  - Métricas de calidad y recomendación")
        print("  - Análisis por materias")
        print("  - Tendencias de calidad y sentimiento")
        print("  - Temas principales en comentarios")
        print("  - Comentarios recientes")
        print()
        
    except Exception as e:
        print(f"Error durante la generación del PDF: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
