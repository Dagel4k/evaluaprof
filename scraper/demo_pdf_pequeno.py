#!/usr/bin/env python3
"""
🧪 DEMO PDF - MUESTRA PEQUEÑA
============================

Genera un PDF de demostración con solo los primeros 5 profesores
para probar el sistema sin esperar mucho tiempo.

Uso:
    python demo_pdf_pequeno.py

Perfecto para:
- Probar el funcionamiento del generador
- Verificar el diseño y layout
- Testear antes de generar el PDF completo
"""

import sys
from pathlib import Path
from datetime import datetime

try:
    from generate_professors_pdf import ProfessorPDFGenerator
except ImportError:
    print("❌ Error: No se pudo importar el generador de PDF")
    print("Instala las dependencias: pip install matplotlib seaborn pandas numpy")
    sys.exit(1)


def main():
    """Generar PDF demo con muestra pequeña."""
    print("🧪 DEMO PDF - GENERANDO MUESTRA PEQUEÑA")
    print("=" * 50)
    
    # Configuración
    data_dir = Path("out/profesores_enriquecido")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"Demo_Profesores_{timestamp}.pdf"
    demo_size = 5
    
    print(f"📁 Directorio: {data_dir}")
    print(f"📄 Archivo de salida: {output_file}")
    print(f"👥 Profesores en demo: {demo_size}")
    
    # Verificar directorio
    if not data_dir.exists():
        print(f"❌ No se encontró: {data_dir}")
        print("Asegúrate de que el directorio existe")
        return
    
    try:
        print(f"\n🚀 Iniciando demo...")
        
        # Inicializar generador
        generator = ProfessorPDFGenerator(data_dir)
        
        # Cargar todos los datos
        total_loaded = generator.load_professor_data()
        print(f"📊 Profesores disponibles: {total_loaded}")
        
        if total_loaded == 0:
            print("❌ No se encontraron datos válidos")
            return
        
        # Limitar a muestra pequeña
        actual_demo_size = min(demo_size, total_loaded)
        generator.professors_data = generator.professors_data[:actual_demo_size]
        
        print(f"🎯 Generando PDF con {actual_demo_size} profesores...")
        
        # Generar PDF
        generator.generate_pdf(output_file)
        
        # Verificar resultado
        output_path = Path(output_file)
        if output_path.exists():
            size_mb = output_path.stat().st_size / (1024 * 1024)
            
            print(f"\n✅ ¡DEMO GENERADO EXITOSAMENTE!")
            print("=" * 40)
            print(f"📄 Archivo: {output_file}")
            print(f"💾 Tamaño: {size_mb:.1f} MB")
            print(f"👥 Profesores: {actual_demo_size}")
            print(f"📑 Páginas: {actual_demo_size + 2}")
            print("=" * 40)
            
            print(f"\n🔍 Profesores incluidos:")
            for i, prof in enumerate(generator.professors_data, 1):
                name = prof.get('nombre', 'Sin nombre')
                reviews = prof.get('n_reviews', 0)
                quality = prof.get('bayes_analysis', {}).get('quality_bayes')
                quality_str = f"{quality:.1f}" if quality else "N/A"
                print(f"  {i}. {name}")
                print(f"     📊 {reviews} evaluaciones | Calidad: {quality_str}")
            
            print(f"\n💡 Siguiente paso:")
            print(f"   Si el demo se ve bien, ejecuta:")
            print(f"   python generar_pdf_completo.py")
            
        else:
            print(f"❌ Error: No se pudo crear el archivo")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()



