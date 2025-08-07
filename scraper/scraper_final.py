#!/usr/bin/env python3
"""
Scraper final para Mis Profesores - Instituto Tecnológico de Culiacán
Versión corregida con los selectores CSS correctos
"""

import os
import json
import time
import random
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright, Page, Browser
from bs4 import BeautifulSoup
from fake_useragent import UserAgent


class MisProfesoresScraperFinal:
    """Scraper final para Mis Profesores"""
    
    def __init__(self, max_professors=None):
        self.base_url = "https://www.misprofesores.com"
        self.universidad = "Instituto Tecnológico de Culiacán"
        self.output_dir = "profesores_json"
        self.ua = UserAgent()
        self.max_professors = max_professors
        
        # Crear directorio de salida
        os.makedirs(self.output_dir, exist_ok=True)
        
    def setup_browser(self) -> Browser:
        """Configura y retorna el navegador"""
        playwright = sync_playwright().start()
        
        browser = playwright.chromium.launch(
            headless=True,  # Cambiar a False para debug
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',  # Acelera la carga
            ]
        )
        
        return browser
    
    def get_random_delay(self) -> float:
        """Retorna un delay aleatorio entre 1.5 y 4 segundos"""
        return random.uniform(1.5, 4.0)
    
    def safe_extract_text(self, element, selector: str, default: str = "") -> str:
        """Extrae texto de forma segura de un elemento"""
        try:
            found = element.select_one(selector)
            return found.get_text(strip=True) if found else default
        except Exception:
            return default
    
    def safe_extract_number(self, element, selector: str, default: float = 0.0) -> float:
        """Extrae número de forma segura de un elemento"""
        try:
            text = self.safe_extract_text(element, selector)
            # Extraer solo números y punto decimal
            number_match = re.search(r'[\d.]+', text)
            return float(number_match.group()) if number_match else default
        except Exception:
            return default
    
    def get_professor_links_from_page(self, page: Page) -> List[Dict[str, str]]:
        """Obtiene los enlaces de profesores de la página actual"""
        professors = []
        
        try:
            # Esperar a que cargue la tabla
            page.wait_for_selector('table tbody tr', timeout=10000)
            
            # Obtener todas las filas de la tabla
            rows = page.query_selector_all('table tbody tr')
            
            for row in rows:
                try:
                    # Obtener todas las celdas de la fila
                    cells = row.query_selector_all('td')
                    
                    if len(cells) < 6:
                        continue
                    
                    # Los enlaces de profesores están en las columnas 2 y 3 (índices 1 y 2)
                    professor_links = []
                    
                    # Buscar en la columna 2 (Apellido, Nombre)
                    cell2 = cells[1]
                    link2 = cell2.query_selector('a')
                    if link2:
                        href2 = link2.get_attribute('href')
                        name2 = link2.inner_text().strip()
                        if href2 and name2 and 'profesores' in href2 and name2 != '.':
                            professor_links.append((name2, href2))
                    
                    # Buscar en la columna 3 (Nombre / Depto)
                    cell3 = cells[2]
                    link3 = cell3.query_selector('a')
                    if link3:
                        href3 = link3.get_attribute('href')
                        name3 = link3.inner_text().strip()
                        if href3 and name3 and 'profesores' in href3 and name3 != '.':
                            professor_links.append((name3, href3))
                    
                    # Usar el primer enlace válido encontrado
                    if professor_links:
                        name, href = professor_links[0]
                        
                        # Obtener información adicional de la fila
                        department = ""
                        if len(cells) > 3:
                            dept_cell = cells[3]
                            department = dept_cell.inner_text().strip()
                        
                        # Extraer calificaciones y promedio
                        ratings = ""
                        average = ""
                        if len(cells) > 4:
                            ratings_cell = cells[4]
                            ratings = ratings_cell.inner_text().strip()
                        
                        if len(cells) > 5:
                            avg_cell = cells[5]
                            average = avg_cell.inner_text().strip()
                        
                        professor_info = {
                            'name': name,
                            'url': href if href.startswith('http') else f"{self.base_url}{href}",
                            'department': department,
                            'ratings': ratings,
                            'average': average
                        }
                        
                        professors.append(professor_info)
                        
                        # Limitar al número máximo de profesores si se especifica
                        if self.max_professors and len(professors) >= self.max_professors:
                            break
                        
                except Exception as e:
                    print(f"Error procesando fila: {e}")
                    continue
            
            print(f"   Encontrados {len(professors)} profesores en esta página")
            
        except Exception as e:
            print(f"Error obteniendo enlaces de profesores: {e}")
        
        return professors
    
    def extract_professor_data(self, page: Page, professor_info: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Extrae los datos completos de un profesor usando los selectores CSS correctos"""
        try:
            # Navegar al perfil del profesor
            page.goto(professor_info['url'], wait_until='networkidle', timeout=30000)
            time.sleep(2)
            
            # Obtener el contenido de la página
            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extraer información básica usando los selectores correctos
            name = self.extract_professor_name(soup)
            university = self.extract_university(soup)
            city = self.extract_city(soup)
            department = self.extract_department(soup)
            
            # Extraer calificaciones usando los selectores correctos
            general_quality = self.extract_general_quality(soup)
            recommendation_percentage = self.extract_recommendation_percentage(soup)
            difficulty_level = self.extract_difficulty_level(soup)
            
            # Extraer etiquetas
            tags = self.extract_tags(soup)
            
            # Extraer reseñas detalladas
            reviews = self.extract_detailed_reviews(soup, page, professor_info['url'])
            
            professor_data = {
                'nombre': name or professor_info['name'],
                'universidad': university or self.universidad,
                'ciudad': city,
                'departamento': department or professor_info['department'],
                'calidad_general': general_quality,
                'porcentaje_recomienda': recommendation_percentage,
                'nivel_dificultad': difficulty_level,
                'etiquetas': tags,
                'numero_calificaciones': len(reviews),
                'calificaciones': reviews
            }
            
            return professor_data
            
        except Exception as e:
            print(f"Error extrayendo datos del profesor {professor_info['name']}: {e}")
            return None
    
    def extract_professor_name(self, soup: BeautifulSoup) -> str:
        """Extrae el nombre del profesor usando los selectores correctos"""
        selectors = [
            'h2 > b > span',
            'div.prof_headers h2 span'
        ]
        
        for selector in selectors:
            name = self.safe_extract_text(soup, selector)
            if name:
                return name
        
        return ""
    
    def extract_university(self, soup: BeautifulSoup) -> str:
        """Extrae la universidad usando los selectores correctos"""
        return self.safe_extract_text(soup, 'div.profesor_info_div a')
    
    def extract_city(self, soup: BeautifulSoup) -> str:
        """Extrae la ciudad usando los selectores correctos"""
        return self.safe_extract_text(soup, 'div.profesor_info_div span:nth-of-type(1)')
    
    def extract_department(self, soup: BeautifulSoup) -> str:
        """Extrae el departamento usando los selectores correctos"""
        return self.safe_extract_text(soup, 'div.profesor_info_div span:nth-of-type(2)')
    
    def extract_general_quality(self, soup: BeautifulSoup) -> float:
        """Extrae la calidad general usando los selectores correctos"""
        return self.safe_extract_number(soup, '.breakdown-container.quality .grade')
    
    def extract_recommendation_percentage(self, soup: BeautifulSoup) -> int:
        """Extrae el porcentaje de recomendación usando los selectores correctos"""
        text = self.safe_extract_text(soup, '.breakdown-section.takeAgain .grade')
        if text:
            # Extraer solo el número del porcentaje
            percentage_match = re.search(r'(\d+)', text)
            if percentage_match:
                return int(percentage_match.group(1))
        return 0
    
    def extract_difficulty_level(self, soup: BeautifulSoup) -> float:
        """Extrae el nivel de dificultad usando los selectores correctos"""
        return self.safe_extract_number(soup, '.breakdown-section.difficulty .grade')
    
    def extract_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extrae las etiquetas usando los selectores correctos"""
        tags = []
        tag_elements = soup.select('.tag-box span')
        
        for tag_elem in tag_elements:
            tag_text = tag_elem.get_text(strip=True)
            if tag_text and tag_text not in tags and len(tag_text) < 50:
                tags.append(tag_text)
        
        return tags[:10]  # Limitar a 10 etiquetas
    
    def extract_detailed_reviews(self, soup: BeautifulSoup, page: Page, professor_url: str) -> List[Dict[str, Any]]:
        """Extrae las reseñas detalladas usando los selectores correctos, manejando paginación"""
        reviews = []
        seen_review_ids = set()  # Para evitar duplicados
        
        try:
            # Primero, detectar el número total de páginas
            total_pages = self.get_total_pages(soup)
            print(f"   📄 Total de páginas de comentarios: {total_pages}")
            
            # Iterar por cada página
            for page_num in range(1, total_pages + 1):
                try:
                    print(f"   📖 Procesando página {page_num}/{total_pages} de comentarios...")
                    
                    # Si no es la primera página, navegar a la página específica
                    if page_num > 1:
                        page_url = f"{professor_url}?pag={page_num}"
                        page.goto(page_url, wait_until='networkidle', timeout=30000)
                        time.sleep(1)  # Pequeña pausa para que cargue
                        
                        # Obtener el contenido actualizado
                        content = page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                    
                    # Extraer reseñas de la página actual
                    page_reviews = self.extract_reviews_from_page(soup, seen_review_ids)
                    reviews.extend(page_reviews)
                    
                    print(f"   ✅ Página {page_num}: {len(page_reviews)} reseñas extraídas")
                    
                except Exception as e:
                    print(f"   ❌ Error procesando página {page_num}: {e}")
                    continue
            
            print(f"   📊 Total de reseñas únicas extraídas: {len(reviews)}")
            
        except Exception as e:
            print(f"Error extrayendo reseñas detalladas: {e}")
        
        return reviews
    
    def get_total_pages(self, soup: BeautifulSoup) -> int:
        """Detecta el número total de páginas de comentarios"""
        try:
            # Buscar el contenedor del paginador
            pagination = soup.select_one('nav ul.pagination')
            if not pagination:
                return 1  # Solo una página si no hay paginador
            
            # Obtener todos los enlaces numéricos (excluyendo "Anterior" y "Siguiente")
            page_links = pagination.select('li a:not([aria-label])')
            
            if not page_links:
                return 1
            
            # Extraer números de página y encontrar el máximo
            page_numbers = []
            for link in page_links:
                try:
                    page_text = link.get_text(strip=True)
                    if page_text.isdigit():
                        page_numbers.append(int(page_text))
                except:
                    continue
            
            if page_numbers:
                return max(page_numbers)
            
            return 1
            
        except Exception as e:
            print(f"Error detectando páginas: {e}")
            return 1
    
    def extract_reviews_from_page(self, soup: BeautifulSoup, seen_review_ids: set) -> List[Dict[str, Any]]:
        """Extrae las reseñas de una página específica"""
        page_reviews = []
        
        try:
            # Buscar todas las filas de la tabla de calificaciones (excepto la cabecera)
            table_rows = soup.select('table.tftable tbody tr')
            if not table_rows:
                # Fallback si no hay tbody
                table_rows = soup.select('table.tftable tr')[1:]  # Excluir la primera fila (cabecera)
            
            for row in table_rows:
                try:
                    # Generar un ID único para esta reseña basado en su contenido
                    review_id = self.generate_review_id(row)
                    
                    # Evitar duplicados
                    if review_id in seen_review_ids:
                        continue
                    
                    seen_review_ids.add(review_id)
                    
                    # Extraer fecha
                    date = self.safe_extract_text(row, 'td.rating .date')
                    
                    # Extraer tipo de calificación
                    rating_type = self.safe_extract_text(row, 'td.rating .rating-type')
                    
                    # Extraer puntaje de calidad general
                    quality_score = self.safe_extract_number(row, 'td.rating .descriptor-container:nth-of-type(1) .score')
                    
                    # Extraer puntaje de facilidad
                    ease_score = self.safe_extract_number(row, 'td.rating .descriptor-container:nth-of-type(2) .score')
                    
                    # Extraer materia
                    subject = self.safe_extract_text(row, 'td.class .name .response')
                    
                    # Extraer asistencia
                    attendance = self.safe_extract_text(row, 'td.class .attendance .response')
                    
                    # Extraer calificación recibida
                    grade_received = self.safe_extract_text(row, 'td.class .grade .response')
                    
                    # Extraer interés en la clase
                    class_interest = self.safe_extract_text(row, 'td.class .grade:nth-of-type(2) .response')
                    
                    # Extraer comentario del alumno
                    comment = self.safe_extract_text(row, 'td.comments p.commentsParagraph')
                    
                    # Extraer etiquetas del comentario
                    comment_tags = []
                    tag_elements = row.select('td.comments .tagbox span')
                    for tag_elem in tag_elements:
                        tag_text = tag_elem.get_text(strip=True)
                        if tag_text:
                            comment_tags.append(tag_text)
                    
                    # Extraer votos útiles/no útiles
                    helpful_votes = self.safe_extract_text(row, 'a.votar_icon.helpful span.count')
                    not_helpful_votes = self.safe_extract_text(row, 'a.votar_icon.nothelpful span.count')
                    
                    # Solo agregar reseña si hay algún contenido
                    if date or rating_type or subject or comment:
                        review_data = {
                            'fecha': date,
                            'tipo_calificacion': rating_type,
                            'puntaje_calidad_general': quality_score,
                            'puntaje_facilidad': ease_score,
                            'materia': subject,
                            'asistencia': attendance,
                            'calificacion_recibida': grade_received,
                            'interes_clase': class_interest,
                            'comentario': comment,
                            'etiquetas_comentario': comment_tags,
                            'votos_utiles': helpful_votes,
                            'votos_no_utiles': not_helpful_votes
                        }
                        
                        page_reviews.append(review_data)
                        
                except Exception as e:
                    print(f"Error procesando reseña: {e}")
                    continue
            
        except Exception as e:
            print(f"Error extrayendo reseñas de página: {e}")
        
        return page_reviews
    
    def generate_review_id(self, row) -> str:
        """Genera un ID único para una reseña basado en su contenido"""
        try:
            # Combinar elementos únicos para crear un ID
            date = self.safe_extract_text(row, 'td.rating .date')
            subject = self.safe_extract_text(row, 'td.class .name .response')
            comment = self.safe_extract_text(row, 'td.comments p.commentsParagraph')
            
            # Crear un hash simple
            content = f"{date}|{subject}|{comment[:50]}"  # Primeros 50 chars del comentario
            return str(hash(content))
        except:
            return str(random.randint(1000000, 9999999))  # Fallback aleatorio
    
    def save_professor_data(self, professor_data: Dict[str, Any]) -> bool:
        """Guarda los datos de un profesor en un archivo JSON"""
        try:
            if not professor_data or 'nombre' not in professor_data:
                return False
            
            # Crear nombre de archivo seguro
            safe_name = re.sub(r'[^\w\s-]', '', professor_data['nombre'])
            safe_name = re.sub(r'[-\s]+', '_', safe_name)
            filename = f"{safe_name}.json"
            filepath = os.path.join(self.output_dir, filename)
            
            # Guardar datos
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(professor_data, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Guardado: {professor_data['nombre']}")
            return True
            
        except Exception as e:
            print(f"❌ Error guardando datos: {e}")
            return False
    
    def run(self):
        """Ejecuta el scraper completo"""
        print("🚀 Iniciando scraper final de Mis Profesores - ITC")
        print(f"📁 Directorio de salida: {self.output_dir}")
        
        if self.max_professors:
            print(f"🎯 Modo prueba: máximo {self.max_professors} profesores")
        
        browser = self.setup_browser()
        page = browser.new_page()
        
        try:
            # Navegar a la página principal
            url = f"{self.base_url}/escuelas/Instituto-Tecnologico-de-Culiacan_1642"
            print(f"🌐 Navegando a: {url}")
            
            page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Obtener enlaces de profesores
            print("📖 Obteniendo enlaces de profesores...")
            professors = self.get_professor_links_from_page(page)
            
            if not professors:
                print("❌ No se encontraron profesores")
                return
            
            print(f"👥 Total de profesores encontrados: {len(professors)}")
            
            # Procesar cada profesor
            for i, professor_info in enumerate(professors, 1):
                try:
                    print(f"\n📊 Procesando {professor_info['name']} ({i}/{len(professors)}) - {(i/len(professors))*100:.1f}%")
                    print(f"👨‍🏫 URL: {professor_info['url']}")
                    
                    # Extraer datos del profesor
                    professor_data = self.extract_professor_data(page, professor_info)
                    
                    if professor_data:
                        # Guardar datos
                        self.save_professor_data(professor_data)
                        
                        # Mostrar resumen de datos extraídos
                        print(f"📊 Datos extraídos:")
                        print(f"   - Calidad General: {professor_data.get('calidad_general', 0)}")
                        print(f"   - Recomendación: {professor_data.get('porcentaje_recomienda', 0)}%")
                        print(f"   - Nivel Dificultad: {professor_data.get('nivel_dificultad', 0)}")
                        print(f"   - Etiquetas: {len(professor_data.get('etiquetas', []))}")
                        print(f"   - Reseñas: {len(professor_data.get('calificaciones', []))}")
                        print(f"   - Ciudad: {professor_data.get('ciudad', 'N/A')}")
                        print(f"   - Departamento: {professor_data.get('departamento', 'N/A')}")
                    else:
                        print("❌ Error extrayendo datos")
                    
                    # Delay aleatorio
                    delay = self.get_random_delay()
                    print(f"⏳ Esperando {delay:.1f} segundos...")
                    time.sleep(delay)
                    
                except Exception as e:
                    print(f"❌ Error procesando {professor_info['name']}: {e}")
                    continue
            
            print(f"\n🎉 Scraping completado! {len(professors)} profesores procesados")
            
        except Exception as e:
            print(f"❌ Error durante el scraping: {e}")
        
        finally:
            browser.close()


def main():
    """Función principal"""
    import sys
    
    # Verificar si se pasa un argumento para modo prueba
    max_professors = None
    if len(sys.argv) > 1:
        try:
            max_professors = int(sys.argv[1])
            print(f"🧪 Modo prueba activado: máximo {max_professors} profesores")
        except ValueError:
            print("❌ Argumento inválido. Uso: python scraper_final.py [número_profesores]")
            return
    
    scraper = MisProfesoresScraperFinal(max_professors=max_professors)
    scraper.run()


if __name__ == "__main__":
    main()
