#!/usr/bin/env python3
"""
Scraper corregido para Mis Profesores - Instituto Tecnológico de Culiacán
Versión actualizada con los selectores CSS correctos
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


class MisProfesoresScraperFixed:
    """Scraper corregido para Mis Profesores"""
    
    def __init__(self):
        self.base_url = "https://www.misprofesores.com"
        self.universidad = "Instituto Tecnológico de Culiacán"
        self.output_dir = "profesores_json"
        self.ua = UserAgent()
        self.total_professors = 0
        self.current_professor = 0
        
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
                    # Buscar el enlace del profesor en la primera columna
                    name_link = row.query_selector('td:first-child a')
                    if not name_link:
                        continue
                    
                    href = name_link.get_attribute('href')
                    name = name_link.inner_text().strip()
                    
                    if href and name and 'profesores' in href:
                        # Obtener información adicional de la fila
                        cells = row.query_selector_all('td')
                        
                        department = ""
                        if len(cells) > 1:
                            dept_cell = cells[1]
                            department = dept_cell.inner_text().strip()
                        
                        # Extraer calificaciones y promedio
                        ratings = ""
                        average = ""
                        if len(cells) > 2:
                            ratings_cell = cells[2]
                            ratings = ratings_cell.inner_text().strip()
                        
                        if len(cells) > 3:
                            avg_cell = cells[3]
                            average = avg_cell.inner_text().strip()
                        
                        professor_info = {
                            'name': name,
                            'url': href if href.startswith('http') else f"{self.base_url}{href}",
                            'department': department,
                            'ratings': ratings,
                            'average': average
                        }
                        
                        professors.append(professor_info)
                        
                except Exception as e:
                    print(f"Error procesando fila: {e}")
                    continue
            
            print(f"   Encontrados {len(professors)} profesores en esta página")
            
        except Exception as e:
            print(f"Error obteniendo enlaces de profesores: {e}")
        
        return professors
    
    def extract_professor_data(self, page: Page, professor_info: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Extrae los datos completos de un profesor"""
        try:
            # Navegar al perfil del profesor
            page.goto(professor_info['url'], wait_until='networkidle', timeout=30000)
            time.sleep(2)
            
            # Obtener el contenido de la página
            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extraer información básica
            name = professor_info['name']
            department = professor_info['department']
            
            # Buscar el promedio general
            average_rating = self.extract_average_rating(soup)
            
            # Buscar porcentaje de recomendación
            recommendation_percentage = self.extract_recommendation_percentage(soup)
            
            # Buscar dificultad
            difficulty = self.extract_difficulty(soup)
            
            # Buscar etiquetas
            tags = self.extract_tags(soup)
            
            # Buscar total de reseñas
            total_reviews = self.extract_total_reviews(soup)
            
            # Extraer reseñas individuales
            reviews = self.extract_reviews(page, soup)
            
            professor_data = {
                'nombre': name,
                'universidad': self.universidad,
                'departamento': department,
                'promedio_general': average_rating,
                'porcentaje_recomienda': recommendation_percentage,
                'dificultad_promedio': difficulty,
                'etiquetas': tags,
                'numero_calificaciones': total_reviews,
                'calificaciones': reviews
            }
            
            return professor_data
            
        except Exception as e:
            print(f"Error extrayendo datos del profesor {professor_info['name']}: {e}")
            return None
    
    def extract_average_rating(self, soup: BeautifulSoup) -> float:
        """Extrae el promedio general del profesor"""
        # Buscar en varios selectores posibles
        selectors = [
            '.rating-circle .score',
            '.progress-circle .score',
            '.rating .score',
            '.average-rating',
            '.overall-rating'
        ]
        
        for selector in selectors:
            rating = self.safe_extract_number(soup, selector)
            if rating > 0:
                return rating
        
        return 0.0
    
    def extract_recommendation_percentage(self, soup: BeautifulSoup) -> int:
        """Extrae el porcentaje de recomendación"""
        # Buscar en varios selectores posibles
        selectors = [
            '.stats li:contains("recomienda")',
            '.recommendation-stats li',
            '.stats .recommendation',
            '.recommendation-percentage'
        ]
        
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text()
                    # Buscar porcentaje en el texto
                    percentage_match = re.search(r'(\d+)%', text)
                    if percentage_match:
                        return int(percentage_match.group(1))
            except:
                continue
        
        return 0
    
    def extract_difficulty(self, soup: BeautifulSoup) -> float:
        """Extrae la dificultad promedio"""
        # Buscar en varios selectores posibles
        selectors = [
            '.stats li:contains("dificultad")',
            '.difficulty-stats li',
            '.stats .difficulty',
            '.difficulty-rating'
        ]
        
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text()
                    # Buscar número en el texto
                    number_match = re.search(r'(\d+\.?\d*)', text)
                    if number_match:
                        return float(number_match.group(1))
            except:
                continue
        
        return 0.0
    
    def extract_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extrae las etiquetas del profesor"""
        tags = []
        
        # Buscar en varios selectores posibles
        selectors = [
            '.tags .tag',
            '.tags span',
            '.professor-tags .tag',
            '.characteristics .tag'
        ]
        
        for selector in selectors:
            tag_elements = soup.select(selector)
            for tag_elem in tag_elements:
                tag_text = tag_elem.get_text(strip=True)
                if tag_text and tag_text not in tags:
                    tags.append(tag_text)
        
        return tags
    
    def extract_total_reviews(self, soup: BeautifulSoup) -> int:
        """Extrae el total de reseñas"""
        # Buscar en varios selectores posibles
        selectors = [
            '.reviews-title span',
            '.total-reviews',
            '.reviews-count',
            '.stats .total-reviews'
        ]
        
        for selector in selectors:
            try:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text()
                    # Buscar número en el texto
                    number_match = re.search(r'(\d+)', text)
                    if number_match:
                        return int(number_match.group(1))
            except:
                continue
        
        return 0
    
    def extract_reviews(self, page: Page, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extrae las reseñas individuales"""
        reviews = []
        
        try:
            # Buscar contenedor de reseñas
            review_selectors = [
                '.review-item',
                '.review',
                '.comment-item',
                '.review-container'
            ]
            
            review_elements = []
            for selector in review_selectors:
                review_elements = soup.select(selector)
                if review_elements:
                    break
            
            for review_elem in review_elements[:10]:  # Limitar a 10 reseñas
                try:
                    review_data = {
                        'fecha': self.extract_review_date(review_elem),
                        'materia': self.extract_review_subject(review_elem),
                        'calificacion_general': self.extract_review_rating(review_elem),
                        'comentario': self.extract_review_comment(review_elem)
                    }
                    
                    if review_data['comentario']:  # Solo agregar si hay comentario
                        reviews.append(review_data)
                        
                except Exception as e:
                    continue
            
        except Exception as e:
            print(f"Error extrayendo reseñas: {e}")
        
        return reviews
    
    def extract_review_date(self, review_elem) -> str:
        """Extrae la fecha de una reseña"""
        date_selectors = [
            '.review-date',
            '.date',
            '.review-time',
            '.timestamp'
        ]
        
        for selector in date_selectors:
            date_text = self.safe_extract_text(review_elem, selector)
            if date_text:
                return date_text
        
        return ""
    
    def extract_review_subject(self, review_elem) -> str:
        """Extrae la materia de una reseña"""
        subject_selectors = [
            '.class',
            '.subject',
            '.course',
            '.materia'
        ]
        
        for selector in subject_selectors:
            subject_text = self.safe_extract_text(review_elem, selector)
            if subject_text:
                return subject_text
        
        return ""
    
    def extract_review_rating(self, review_elem) -> float:
        """Extrae la calificación de una reseña"""
        rating_selectors = [
            '.review-grade',
            '.rating',
            '.score',
            '.grade'
        ]
        
        for selector in rating_selectors:
            rating = self.safe_extract_number(review_elem, selector)
            if rating > 0:
                return rating
        
        return 0.0
    
    def extract_review_comment(self, review_elem) -> str:
        """Extrae el comentario de una reseña"""
        comment_selectors = [
            '.comments p',
            '.comment',
            '.review-text',
            '.comment-text'
        ]
        
        for selector in comment_selectors:
            comment_text = self.safe_extract_text(review_elem, selector)
            if comment_text:
                return comment_text
        
        return ""
    
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
        print("🚀 Iniciando scraper corregido de Mis Profesores - ITC")
        print(f"📁 Directorio de salida: {self.output_dir}")
        
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
            
            self.total_professors = len(professors)
            print(f"👥 Total de profesores encontrados: {self.total_professors}")
            
            # Procesar cada profesor
            for i, professor_info in enumerate(professors, 1):
                try:
                    print(f"\n📊 Procesando {professor_info['name']} ({i}/{self.total_professors}) - {(i/self.total_professors)*100:.1f}%")
                    print(f"👨‍🏫 URL: {professor_info['url']}")
                    
                    # Extraer datos del profesor
                    professor_data = self.extract_professor_data(page, professor_info)
                    
                    if professor_data:
                        # Guardar datos
                        self.save_professor_data(professor_data)
                    else:
                        print("❌ Error extrayendo datos")
                    
                    # Delay aleatorio
                    delay = self.get_random_delay()
                    print(f"⏳ Esperando {delay:.1f} segundos...")
                    time.sleep(delay)
                    
                except Exception as e:
                    print(f"❌ Error procesando {professor_info['name']}: {e}")
                    continue
            
            print(f"\n🎉 Scraping completado! {self.total_professors} profesores procesados")
            
        except Exception as e:
            print(f"❌ Error durante el scraping: {e}")
        
        finally:
            browser.close()


def main():
    """Función principal"""
    scraper = MisProfesoresScraperFixed()
    scraper.run()


if __name__ == "__main__":
    main()
