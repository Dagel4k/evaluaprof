#!/usr/bin/env python3
"""
Simple script to run the PDF generator
=====================================

This script provides an easy way to generate the professor evaluation PDF
with customizable options.
"""

import sys
import os
from pathlib import Path

# Add the current directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

try:
    from generate_professors_pdf import ProfessorPDFGenerator
except ImportError as e:
    print(f"Error importing PDF generator: {e}")
    print("Please make sure all required packages are installed:")
    print("pip install matplotlib seaborn pandas numpy")
    sys.exit(1)


def main():
    """Run the PDF generator with user options."""
    print("🎓 GENERADOR DE PDF - EVALUACIÓN DE PROFESORES")
    print("=" * 50)
    
    # Get data directory
    default_data_dir = "out/profesores_enriquecido"
    data_dir = input(f"Directorio de datos [{default_data_dir}]: ").strip()
    if not data_dir:
        data_dir = default_data_dir
    
    # Get output filename
    default_output = "Reporte_Evaluacion_Profesores.pdf"
    output_file = input(f"Nombre del archivo de salida [{default_output}]: ").strip()
    if not output_file:
        output_file = default_output
    
    # Validate data directory
    data_path = Path(data_dir)
    if not data_path.exists():
        print(f"❌ Error: No se encontró el directorio: {data_path}")
        print("Por favor, verifica la ruta y vuelve a intentar.")
        return
    
    print(f"\n📁 Directorio de datos: {data_path}")
    print(f"📄 Archivo de salida: {output_file}")
    
    # Ask for confirmation
    confirm = input("\n¿Continuar con la generación? (s/N): ").strip().lower()
    if confirm not in ['s', 'si', 'sí', 'y', 'yes']:
        print("Operación cancelada.")
        return
    
    print("\n🚀 Iniciando generación del PDF...")
    print("⏳ Este proceso puede tomar varios minutos...")
    
    try:
        # Initialize and run generator
        generator = ProfessorPDFGenerator(data_path)
        num_loaded = generator.load_professor_data()
        
        if num_loaded == 0:
            print("❌ No se encontraron archivos JSON válidos.")
            return
        
        print(f"✅ Cargados {num_loaded} perfiles de profesores")
        
        # Generate PDF
        generator.generate_pdf(output_file)
        
        print(f"\n🎉 ¡ÉXITO! PDF generado: {output_file}")
        print(f"📊 Profesores procesados: {num_loaded}")
        print(f"📑 Páginas totales: {num_loaded + 2}")
        
        # Check file size
        if Path(output_file).exists():
            file_size = Path(output_file).stat().st_size / (1024 * 1024)  # MB
            print(f"💾 Tamaño del archivo: {file_size:.1f} MB")
        
    except KeyboardInterrupt:
        print("\n⚠️  Operación interrumpida por el usuario.")
    except Exception as e:
        print(f"\n❌ Error durante la generación: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()



