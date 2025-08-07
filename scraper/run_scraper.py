#!/usr/bin/env python3
"""
Script principal para ejecutar el scraper completo de Mis Profesores
Incluye scraping, procesamiento y generación de reportes.
"""

import os
import sys
import subprocess
import time
from datetime import datetime


def check_dependencies():
    """Verifica que las dependencias estén instaladas"""
    print("🔍 Verificando dependencias...")
    
    try:
        import playwright
        import bs4
        import fake_useragent
        print("✅ Todas las dependencias están instaladas")
        return True
    except ImportError as e:
        print(f"❌ Dependencia faltante: {e}")
        print("💡 Ejecuta: python setup.py")
        return False


def check_playwright_browsers():
    """Verifica que los navegadores de Playwright estén instalados"""
    print("🌐 Verificando navegadores de Playwright...")
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "playwright", "install", "--dry-run", "chromium"
        ], capture_output=True, text=True)
        
        if "chromium" in result.stdout:
            print("✅ Navegador Chromium está instalado")
            return True
        else:
            print("⚠️ Navegador Chromium no encontrado")
            return False
    except Exception as e:
        print(f"❌ Error verificando navegadores: {e}")
        return False


def run_scraper():
    """Ejecuta el scraper principal"""
    print("\n🚀 Ejecutando scraper de Mis Profesores...")
    print("=" * 60)
    
    try:
        result = subprocess.run([
            sys.executable, "mis_profesores_scraper.py"
        ], check=True)
        
        print("✅ Scraper ejecutado exitosamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error ejecutando scraper: {e}")
        return False


def run_processor():
    """Ejecuta el procesador de datos"""
    print("\n📊 Procesando datos extraídos...")
    print("=" * 60)
    
    try:
        result = subprocess.run([
            sys.executable, "process_data.py"
        ], check=True)
        
        print("✅ Procesamiento completado")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error procesando datos: {e}")
        return False


def check_results():
    """Verifica los resultados del scraping"""
    print("\n📁 Verificando resultados...")
    
    # Verificar directorio de profesores
    if not os.path.exists("profesores_json"):
        print("❌ Directorio 'profesores_json' no encontrado")
        return False
    
    # Contar archivos JSON
    json_files = [f for f in os.listdir("profesores_json") if f.endswith('.json')]
    print(f"✅ Encontrados {len(json_files)} archivos de profesores")
    
    # Verificar archivo combinado
    if os.path.exists("profesores_completos.json"):
        print("✅ Archivo combinado generado")
    else:
        print("⚠️ Archivo combinado no encontrado")
    
    # Verificar reporte de estadísticas
    if os.path.exists("estadisticas_profesores.json"):
        print("✅ Reporte de estadísticas generado")
    else:
        print("⚠️ Reporte de estadísticas no encontrado")
    
    return len(json_files) > 0


def print_summary():
    """Imprime un resumen del proceso"""
    print("\n" + "=" * 60)
    print("🎉 PROCESO COMPLETADO")
    print("=" * 60)
    
    # Estadísticas de archivos
    if os.path.exists("profesores_json"):
        json_files = [f for f in os.listdir("profesores_json") if f.endswith('.json')]
        print(f"📁 Archivos de profesores: {len(json_files)}")
    
    # Tamaño de archivos
    if os.path.exists("profesores_completos.json"):
        size = os.path.getsize("profesores_completos.json") / (1024 * 1024)
        print(f"📊 Archivo combinado: {size:.2f} MB")
    
    print(f"\n📝 Próximos pasos:")
    print(f"   1. Revisar archivos en el directorio 'profesores_json/'")
    print(f"   2. Verificar 'profesores_completos.json'")
    print(f"   3. Revisar 'estadisticas_profesores.json'")
    print(f"   4. Cargar datos en EvaluaProf")
    
    print(f"\n⏰ Completado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def main():
    """Función principal"""
    print("🚀 SCRAPER COMPLETO - MIS PROFESORES ITC")
    print("=" * 60)
    print(f"⏰ Iniciado el: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar dependencias
    if not check_dependencies():
        print("\n💡 Para instalar dependencias:")
        print("   python setup.py")
        return 1
    
    # Verificar navegadores
    if not check_playwright_browsers():
        print("\n💡 Para instalar navegadores:")
        print("   playwright install chromium")
        return 1
    
    # Crear directorios si no existen
    os.makedirs("profesores_json", exist_ok=True)
    os.makedirs("logs", exist_ok=True)
    
    # Ejecutar scraper
    if not run_scraper():
        print("❌ El scraping falló")
        return 1
    
    # Verificar que se extrajeron datos
    if not check_results():
        print("❌ No se encontraron datos extraídos")
        return 1
    
    # Ejecutar procesador
    if not run_processor():
        print("❌ El procesamiento falló")
        return 1
    
    # Mostrar resumen
    print_summary()
    
    return 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️ Proceso interrumpido por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1) 