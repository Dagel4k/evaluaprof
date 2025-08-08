#!/usr/bin/env python3
"""
🎓 GENERADOR COMPLETO DE PDF - EVALUACIÓN DE PROFESORES
======================================================

Script principal para generar el PDF completo con todos los profesores
del directorio profesores_enriquecido.

Uso:
    python generar_pdf_completo.py

Características:
- Procesamiento de todos los profesores disponibles
- Diseño profesional con gráficos y estadísticas
- Manejo robusto de errores
- Progreso en tiempo real
- Archivo de salida optimizado

Autor: AI Assistant
Fecha: Enero 2025
"""

import sys
import time
from pathlib import Path
from datetime import datetime

# Importar el generador principal
try:
    from generate_professors_pdf import ProfessorPDFGenerator
except ImportError as e:
    print("❌ Error: No se pudo importar el generador de PDF")
    print("Asegúrate de que están instaladas las dependencias:")
    print("pip install matplotlib seaborn pandas numpy")
    sys.exit(1)


def print_banner():
    """Mostrar banner de bienvenida."""
    print("=" * 70)
    print("🎓 GENERADOR COMPLETO DE PDF - EVALUACIÓN DE PROFESORES")
    print("=" * 70)
    print("📊 Reporte integral con análisis estadístico avanzado")
    print("🎨 Diseño profesional con gráficos y visualizaciones")
    print("📈 Métricas de calidad, recomendación y tendencias")
    print("💬 Análisis de sentimiento y procesamiento de comentarios")
    print("=" * 70)
    print()


def check_requirements():
    """Verificar que todas las dependencias estén disponibles."""
    print("🔍 Verificando dependencias...")
    
    required_packages = [
        ('matplotlib', 'Generación de gráficos y PDF'),
        ('seaborn', 'Visualizaciones estadísticas'),
        ('pandas', 'Procesamiento de datos'),
        ('numpy', 'Cálculos numéricos')
    ]
    
    missing_packages = []
    
    for package, description in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package} - {description}")
        except ImportError:
            print(f"  ❌ {package} - {description} (FALTANTE)")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n❌ Faltan dependencias: {', '.join(missing_packages)}")
        print("Instala con: pip install " + " ".join(missing_packages))
        return False
    
    print("✅ Todas las dependencias están disponibles")
    return True


def main():
    """Función principal."""
    print_banner()
    
    # Verificar dependencias
    if not check_requirements():
        return
    
    print()
    
    # Configuración
    data_dir = Path("out/profesores_enriquecido")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"Evaluacion_Profesores_Completa_{timestamp}.pdf"
    
    print(f"📁 Directorio de datos: {data_dir}")
    print(f"📄 Archivo de salida: {output_file}")
    
    # Verificar directorio de datos
    if not data_dir.exists():
        print(f"\n❌ Error: No se encontró el directorio de datos")
        print(f"   Ruta esperada: {data_dir.absolute()}")
        print("   Asegúrate de que el directorio existe y contiene archivos JSON")
        return
    
    # Contar archivos JSON
    json_files = list(data_dir.glob("*.json"))
    print(f"📊 Archivos JSON encontrados: {len(json_files)}")
    
    if len(json_files) == 0:
        print("❌ No se encontraron archivos JSON en el directorio")
        return
    
    # Confirmación del usuario
    print(f"\n⚠️  ADVERTENCIA:")
    print(f"   Este proceso generará un PDF con TODOS los profesores disponibles")
    print(f"   Esto puede tomar entre 10-30 minutos dependiendo del número de profesores")
    print(f"   El archivo resultante puede ser de varios MB de tamaño")
    print()
    
    confirm = input("¿Deseas continuar? (s/N): ").strip().lower()
    if confirm not in ['s', 'si', 'sí', 'y', 'yes']:
        print("❌ Operación cancelada por el usuario")
        return
    
    print(f"\n🚀 Iniciando generación del PDF completo...")
    start_time = time.time()
    
    try:
        # Inicializar generador
        print("📥 Inicializando generador...")
        generator = ProfessorPDFGenerator(data_dir)
        
        # Cargar datos
        print("📊 Cargando datos de profesores...")
        num_loaded = generator.load_professor_data()
        
        if num_loaded == 0:
            print("❌ No se pudieron cargar datos válidos")
            return
        
        print(f"✅ Cargados {num_loaded:,} perfiles de profesores")
        
        # Calcular estadísticas previas
        total_reviews = sum(prof.get('n_reviews', 0) for prof in generator.professors_data)
        avg_reviews = total_reviews / num_loaded if num_loaded > 0 else 0
        
        print(f"📈 Total de evaluaciones: {total_reviews:,}")
        print(f"📊 Promedio por profesor: {avg_reviews:.1f}")
        
        estimated_pages = num_loaded + 2  # +2 para título y resumen
        print(f"📑 Páginas estimadas: {estimated_pages:,}")
        
        print(f"\n⏳ Generando PDF... (esto puede tomar varios minutos)")
        print("   💡 Tip: No cierres esta ventana hasta que termine")
        
        # Generar PDF
        generator.generate_pdf(output_file)
        
        # Calcular tiempo transcurrido
        elapsed_time = time.time() - start_time
        minutes = int(elapsed_time // 60)
        seconds = int(elapsed_time % 60)
        
        # Verificar archivo generado
        output_path = Path(output_file)
        if output_path.exists():
            file_size = output_path.stat().st_size / (1024 * 1024)  # MB
            
            print(f"\n🎉 ¡PDF GENERADO EXITOSAMENTE!")
            print("=" * 50)
            print(f"📄 Archivo: {output_file}")
            print(f"💾 Tamaño: {file_size:.1f} MB")
            print(f"👥 Profesores: {num_loaded:,}")
            print(f"📊 Evaluaciones: {total_reviews:,}")
            print(f"📑 Páginas: {estimated_pages:,}")
            print(f"⏱️  Tiempo: {minutes}m {seconds}s")
            print("=" * 50)
            
            print(f"\n📋 CONTENIDO DEL REPORTE:")
            print(f"   • Página de título con estadísticas generales")
            print(f"   • Resumen ejecutivo con análisis estadístico")
            print(f"   • {num_loaded:,} perfiles individuales de profesores")
            print(f"   • Gráficos de distribución y tendencias")
            print(f"   • Análisis de sentimiento y temas")
            print(f"   • Comentarios recientes destacados")
            
            print(f"\n💡 SUGERENCIAS:")
            print(f"   • Usa un visor de PDF robusto (Adobe Reader, etc.)")
            print(f"   • El archivo es grande, puede tardar en abrir")
            print(f"   • Considera imprimir solo las secciones necesarias")
            
        else:
            print(f"❌ Error: No se pudo crear el archivo PDF")
            
    except KeyboardInterrupt:
        print(f"\n⚠️  Proceso interrumpido por el usuario")
        print(f"   El archivo puede estar incompleto")
        
    except Exception as e:
        print(f"\n❌ Error durante la generación: {e}")
        print(f"   Verifica que tengas suficiente espacio en disco")
        print(f"   Asegúrate de que no hay otros programas usando mucha memoria")
        
        # Mostrar traceback para debugging
        import traceback
        print(f"\n🔧 Información técnica del error:")
        traceback.print_exc()


if __name__ == "__main__":
    main()



