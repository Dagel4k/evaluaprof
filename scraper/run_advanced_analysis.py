#!/usr/bin/env python3
"""
Script Principal para Análisis Avanzado de Profesores
Ejecuta todo el pipeline de análisis: carga, procesamiento, visualización
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    required_packages = [
        'numpy', 'pandas', 'scipy', 'sklearn', 'matplotlib', 'seaborn'
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Faltan las siguientes dependencias:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\nInstala las dependencias con:")
        print("pip install -r requirements_analysis.txt")
        return False
    
    print("✅ Todas las dependencias están instaladas")
    return True

def check_data_directory():
    """Verifica que el directorio de datos existe"""
    data_dir = "profesores_json copy"
    if not os.path.exists(data_dir):
        print(f"❌ No se encontró el directorio de datos: {data_dir}")
        return False
    
    json_files = [f for f in os.listdir(data_dir) if f.endswith('.json')]
    if not json_files:
        print(f"❌ No se encontraron archivos JSON en {data_dir}")
        return False
    
    print(f"✅ Encontrados {len(json_files)} archivos JSON en {data_dir}")
    return True

def run_analysis():
    """Ejecuta el análisis avanzado"""
    print("\n" + "="*60)
    print("🚀 INICIANDO ANÁLISIS AVANZADO DE PROFESORES")
    print("="*60)
    
    # Paso 1: Análisis estadístico avanzado
    print("\n📊 Paso 1: Ejecutando análisis estadístico avanzado...")
    start_time = time.time()
    
    try:
        from advanced_analysis import main as run_advanced_analysis
        run_advanced_analysis()
        analysis_time = time.time() - start_time
        print(f"✅ Análisis completado en {analysis_time:.2f} segundos")
    except Exception as e:
        print(f"❌ Error en el análisis: {e}")
        return False
    
    # Paso 2: Dashboard de visualización
    print("\n📈 Paso 2: Generando dashboard de visualización...")
    start_time = time.time()
    
    try:
        from visualization_dashboard import main as run_dashboard
        run_dashboard()
        dashboard_time = time.time() - start_time
        print(f"✅ Dashboard completado en {dashboard_time:.2f} segundos")
    except Exception as e:
        print(f"❌ Error en el dashboard: {e}")
        return False
    
    # Paso 3: Utilidades de análisis
    print("\n🔧 Paso 3: Ejecutando utilidades de análisis...")
    start_time = time.time()
    
    try:
        from analysis_utils import main as run_utils
        run_utils()
        utils_time = time.time() - start_time
        print(f"✅ Utilidades completadas en {utils_time:.2f} segundos")
    except Exception as e:
        print(f"❌ Error en las utilidades: {e}")
        return False
    
    return True

def generate_summary():
    """Genera un resumen de los archivos creados"""
    print("\n" + "="*60)
    print("📋 RESUMEN DE ARCHIVOS GENERADOS")
    print("="*60)
    
    output_files = [
        'advanced_analysis_results.json',
        'top_professors.csv',
        'comparison_report.json'
    ]
    
    for file in output_files:
        if os.path.exists(file):
            size = os.path.getsize(file) / 1024  # KB
            print(f"✅ {file} ({size:.1f} KB)")
        else:
            print(f"❌ {file} (no encontrado)")
    
    print("\n📁 Archivos de análisis:")
    print("   • advanced_analysis_results.json - Resultados completos del análisis")
    print("   • top_professors.csv - Ranking de mejores profesores")
    print("   • comparison_report.json - Reporte de comparaciones")
    
    print("\n🎯 Próximos pasos:")
    print("   1. Revisa los gráficos generados por el dashboard")
    print("   2. Consulta el archivo 'top_professors.csv' para recomendaciones")
    print("   3. Usa 'comparison_report.json' para comparaciones específicas")
    print("   4. Ejecuta scripts individuales para análisis específicos")

def main():
    """Función principal"""
    print("🔍 Verificando entorno...")
    
    # Verificar dependencias
    if not check_dependencies():
        return
    
    # Verificar datos
    if not check_data_directory():
        return
    
    # Ejecutar análisis
    if run_analysis():
        generate_summary()
        print("\n🎉 ¡Análisis completado exitosamente!")
    else:
        print("\n❌ El análisis no se pudo completar")

if __name__ == "__main__":
    main()
