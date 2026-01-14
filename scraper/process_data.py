#!/usr/bin/env python3
"""
Script para procesar y validar los datos extraídos por el scraper
Combina todos los archivos JSON en uno solo y genera estadísticas.
"""

import os
import json
import glob
from typing import Dict, List, Any
from datetime import datetime


class DataProcessor:
    """Procesador de datos extraídos"""
    
    def __init__(self, input_dir: str = "profesores_json", output_file: str = "profesores_completos.json"):
        self.input_dir = input_dir
        self.output_file = output_file
        self.professors_data = []
        self.stats = {
            "total_professors": 0,
            "total_reviews": 0,
            "average_rating": 0.0,
            "departments": {},
            "tags_frequency": {},
            "rating_distribution": {},
            "review_years": {}
        }
    
    def load_all_professors(self) -> bool:
        """Carga todos los archivos JSON de profesores"""
        try:
            json_files = glob.glob(os.path.join(self.input_dir, "*.json"))
            
            if not json_files:
                print(f"❌ No se encontraron archivos JSON en {self.input_dir}")
                return False
            
            print(f"📁 Cargando {len(json_files)} archivos de profesores...")
            
            for file_path in json_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        professor_data = json.load(f)
                        self.professors_data.append(professor_data)
                except Exception as e:
                    print(f"⚠️ Error cargando {file_path}: {e}")
            
            self.stats["total_professors"] = len(self.professors_data)
            print(f"✅ Cargados {self.stats['total_professors']} profesores")
            return True
            
        except Exception as e:
            print(f"❌ Error cargando archivos: {e}")
            return False
    
    def validate_professor_data(self, professor: Dict[str, Any]) -> bool:
        """Valida que los datos del profesor sean correctos"""
        required_fields = ["nombre", "universidad", "departamento"]
        
        for field in required_fields:
            if field not in professor or not professor[field]:
                return False
        
        # Validar tipos de datos
        if not isinstance(professor.get("promedio_general", 0), (int, float)):
            return False
        
        if not isinstance(professor.get("numero_calificaciones", 0), int):
            return False
        
        if not isinstance(professor.get("calificaciones", []), list):
            return False
        
        return True
    
    def clean_professor_data(self, professor: Dict[str, Any]) -> Dict[str, Any]:
        """Limpia y normaliza los datos del profesor"""
        cleaned = professor.copy()
        
        # Asegurar tipos de datos correctos
        cleaned["promedio_general"] = float(cleaned.get("promedio_general", 0.0))
        cleaned["porcentaje_recomienda"] = int(cleaned.get("porcentaje_recomienda", 0))
        # Map nivel_dificultad from scraper to dificultad_promedio
        cleaned["dificultad_promedio"] = float(cleaned.get("nivel_dificultad", cleaned.get("dificultad_promedio", 0.0)))
        cleaned["numero_calificaciones"] = int(cleaned.get("numero_calificaciones", 0))
        
        # Asegurar que las listas existan
        if "etiquetas" not in cleaned:
            cleaned["etiquetas"] = []
        if "calificaciones" not in cleaned:
            cleaned["calificaciones"] = []
        
        # Limpiar etiquetas
        cleaned["etiquetas"] = [tag.strip() for tag in cleaned["etiquetas"] if tag.strip()]
        
        # Limpiar calificaciones
        cleaned_reviews = []
        for review in cleaned["calificaciones"]:
            if isinstance(review, dict) and review.get("comentario"):
                cleaned_review = {
                    "fecha": review.get("fecha", "Fecha no disponible"),
                    "materia": review.get("materia", "Materia no disponible"),
                    "puntaje_calidad_general": float(review.get("puntaje_calidad_general", 0.0)),
                    "puntaje_facilidad": float(review.get("puntaje_facilidad", 0.0)),
                    "tipo_calificacion": review.get("tipo_calificacion", "REGULAR"),
                    "recomienda": review.get("recomienda", False),
                    "comentario": review.get("comentario", "").strip()
                }
                cleaned_reviews.append(cleaned_review)
        
        cleaned["calificaciones"] = cleaned_reviews
        
        return cleaned
    
    def calculate_statistics(self):
        """Calcula estadísticas de los datos"""
        print("📊 Calculando estadísticas...")
        
        total_rating = 0
        total_reviews = 0
        departments = {}
        tags_frequency = {}
        rating_distribution = {}
        review_years = {}
        
        for professor in self.professors_data:
            # Estadísticas de departamentos
            dept = professor.get("departamento", "Sin departamento")
            departments[dept] = departments.get(dept, 0) + 1
            
            # Estadísticas de calificaciones
            rating = professor.get("promedio_general", 0)
            if rating > 0:
                total_rating += rating
                rating_bucket = int(rating)
                rating_distribution[rating_bucket] = rating_distribution.get(rating_bucket, 0) + 1
            
            # Estadísticas de reseñas
            reviews = professor.get("calificaciones", [])
            total_reviews += len(reviews)
            
            # Años de reseñas
            for review in reviews:
                date_str = review.get("fecha", "")
                if date_str and "/" in date_str:
                    try:
                        year = date_str.split("/")[-1]
                        if year.isdigit():
                            review_years[year] = review_years.get(year, 0) + 1
                    except:
                        pass
            
            # Frecuencia de etiquetas
            for tag in professor.get("etiquetas", []):
                tags_frequency[tag] = tags_frequency.get(tag, 0) + 1
        
        # Actualizar estadísticas
        self.stats["total_reviews"] = total_reviews
        self.stats["average_rating"] = total_rating / len(self.professors_data) if self.professors_data else 0
        self.stats["departments"] = departments
        self.stats["tags_frequency"] = dict(sorted(tags_frequency.items(), key=lambda x: x[1], reverse=True)[:20])
        self.stats["rating_distribution"] = rating_distribution
        self.stats["review_years"] = dict(sorted(review_years.items()))
    
    def save_combined_data(self) -> bool:
        """Guarda todos los datos combinados en un archivo"""
        try:
            # Filtrar y limpiar datos
            valid_professors = []
            invalid_count = 0
            
            for professor in self.professors_data:
                if self.validate_professor_data(professor):
                    cleaned_professor = self.clean_professor_data(professor)
                    valid_professors.append(cleaned_professor)
                else:
                    invalid_count += 1
            
            if invalid_count > 0:
                print(f"⚠️ {invalid_count} profesores con datos inválidos fueron excluidos")
            
            # Crear archivo combinado
            combined_data = {
                "metadata": {
                    "generated_at": datetime.now().isoformat(),
                    "total_professors": len(valid_professors),
                    "university": "Instituto Tecnológico de Culiacán",
                    "source": "Mis Profesores"
                },
                "statistics": self.stats,
                "professors": valid_professors
            }
            
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(combined_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Datos combinados guardados en {self.output_file}")
            print(f"📊 {len(valid_professors)} profesores válidos procesados")
            return True
            
        except Exception as e:
            print(f"❌ Error guardando datos combinados: {e}")
            return False
    
    def save_statistics_report(self) -> bool:
        """Guarda un reporte de estadísticas"""
        try:
            report = {
                "generated_at": datetime.now().isoformat(),
                "summary": {
                    "total_professors": self.stats["total_professors"],
                    "total_reviews": self.stats["total_reviews"],
                    "average_rating": round(self.stats["average_rating"], 2),
                    "average_reviews_per_professor": round(self.stats["total_reviews"] / self.stats["total_professors"], 1) if self.stats["total_professors"] > 0 else 0
                },
                "departments": self.stats["departments"],
                "top_tags": self.stats["tags_frequency"],
                "rating_distribution": self.stats["rating_distribution"],
                "review_years": self.stats["review_years"]
            }
            
            with open("estadisticas_profesores.json", 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
            
            print("✅ Reporte de estadísticas guardado en estadisticas_profesores.json")
            return True
            
        except Exception as e:
            print(f"❌ Error guardando reporte: {e}")
            return False
    
    def print_summary(self):
        """Imprime un resumen de los datos procesados"""
        print("\n" + "="*50)
        print("📊 RESUMEN DE DATOS PROCESADOS")
        print("="*50)
        print(f"👥 Total de profesores: {self.stats['total_professors']}")
        print(f"📝 Total de reseñas: {self.stats['total_reviews']}")
        print(f"⭐ Promedio general: {self.stats['average_rating']:.2f}")
        print(f"📚 Promedio reseñas por profesor: {self.stats['total_reviews'] / self.stats['total_professors']:.1f}")
        
        print(f"\n🏢 Departamentos ({len(self.stats['departments'])}):")
        for dept, count in sorted(self.stats['departments'].items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"   {dept}: {count} profesores")
        
        print(f"\n🏷️ Etiquetas más comunes:")
        for tag, count in list(self.stats['tags_frequency'].items())[:10]:
            print(f"   {tag}: {count} veces")
        
        print(f"\n⭐ Distribución de calificaciones:")
        for rating, count in sorted(self.stats['rating_distribution'].items()):
            print(f"   {rating}/10: {count} profesores")
        
        print(f"\n📅 Años de reseñas:")
        for year, count in self.stats['review_years'].items():
            print(f"   {year}: {count} reseñas")
    
    def run(self):
        """Ejecuta el procesamiento completo"""
        print("🚀 Iniciando procesamiento de datos...")
        
        # Cargar datos
        if not self.load_all_professors():
            return False
        
        # Calcular estadísticas
        self.calculate_statistics()
        
        # Guardar datos combinados
        if not self.save_combined_data():
            return False
        
        # Guardar reporte
        if not self.save_statistics_report():
            return False
        
        # Mostrar resumen
        self.print_summary()
        
        print(f"\n🎉 Procesamiento completado!")
        print(f"📁 Archivos generados:")
        print(f"   - {self.output_file} (datos completos)")
        print(f"   - estadisticas_profesores.json (reporte)")
        
        return True


def main():
    """Función principal"""
    processor = DataProcessor()
    success = processor.run()
    
    if not success:
        print("❌ El procesamiento falló")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 