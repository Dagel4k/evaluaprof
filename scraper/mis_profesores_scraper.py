#!/usr/bin/env python3
"""
Scraper para Mis Profesores - Instituto Tecnológico de Culiacán
Extrae información completa de todos los profesores del sitio web.
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


class MisProfesoresScraper:
    """Scraper principal para Mis Profesores"""
    
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
    
    def get_total_pages(self, page: Page) -> int:
        """Obtiene el número total de páginas de profesores"""
        try:
            # Esperar a que cargue la paginación
            page.wait_for_selector('.pagination, .pager', timeout=10000)
            
            # Buscar el último número de página
            pagination = page.query_selector('.pagination, .pager')
            if not pagination:
                return 1
            
            page_numbers = pagination.query_selector_all('a[href*="page="], .page-link')
            if not page_numbers:
                return 1
            
            max_page = 1
            for page_link in page_numbers:
                href = page_link.get_attribute('href')
                if href:
                    page_match = re.search(r'page=(\d+)', href)
                    if page_match:
                        page_num = int(page_match.group(1))
                        max_page = max(max_page, page_num)
                
                # También buscar en el texto del enlace
                text = page_link.inner_text()
                if text and text.isdigit():
                    page_num = int(text)
                    max_page = max(max_page, page_num)
            
            return max_page
            
        except Exception as e:
            print(f"Error obteniendo total de páginas: {e}")
            return 1
    
    def get_professor_links_from_page(self, page: Page, page_num: int = 1) -> List[Dict[str, str]]:
        """Obtiene los enlaces a los perfiles de profesores de una página específica"""
        try:
            if page_num > 1:
                page_url = f"{self.base_url}/escuelas/Instituto-Tecnologico-de-Culiacan_1642?page={page_num}"
                page.goto(page_url)
                time.sleep(self.get_random_delay())
            
            # Esperar a que cargue la tabla de profesores
            page.wait_for_selector('table, .professors-table, .teachers-list', timeout=10000)
            
            # Obtener el HTML de la página
            html = page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            professors = []
            
            # Buscar filas de la tabla de profesores
            rows = soup.select('table tbody tr, .professor-row, .teacher-item')
            
            for row in rows:
                try:
                    # Extraer nombre y enlace
                    name_link = row.select_one('td a, .name a, .professor-name a')
                    if not name_link:
                        continue
                    
                    name = name_link.get_text(strip=True)
                    href = name_link.get('href')
                    
                    if not name or not href:
                        continue
                    
                    # Construir URL completa
                    full_url = urljoin(self.base_url, href)
                    
                    # Extraer departamento
                    dept_cell = row.select_one('td:nth-child(2), .department, .dept')
                    department = dept_cell.get_text(strip=True) if dept_cell else "Departamento no disponible"
                    
                    # Extraer número de calificaciones
                    reviews_cell = row.select_one('td:nth-child(3), .reviews, .ratings')
                    reviews_count = 0
                    if reviews_cell:
                        reviews_text = reviews_cell.get_text(strip=True)
                        numbers = re.findall(r'\d+', reviews_text)
                        if numbers:
                            reviews_count = int(numbers[0])
                    
                    # Extraer promedio
                    avg_cell = row.select_one('td:nth-child(4), .average, .rating')
                    average = 0.0
                    if avg_cell:
                        avg_text = avg_cell.get_text(strip=True)
                        avg_match = re.search(r'[\d.]+', avg_text)
                        if avg_match:
                            average = float(avg_match.group())
                    
                    professors.append({
                        'nombre': name,
                        'url': full_url,
                        'departamento': department,
                        'numero_calificaciones': reviews_count,
                        'promedio_general': average
                    })
                    
                except Exception as e:
                    print(f"Error procesando fila: {e}")
                    continue
            
            return professors
            
        except Exception as e:
            print(f"Error obteniendo enlaces de profesores en página {page_num}: {e}")
            return []
    
    def extract_professor_data(self, page: Page, professor_info: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Extrae los datos completos de un profesor desde su perfil"""
        try:
            page.goto(professor_info['url'])
            time.sleep(self.get_random_delay())
            
            # Esperar a que cargue el contenido del perfil
            page.wait_for_selector('.professor-profile, .teacher-profile, h1', timeout=10000)
            
            # Obtener el HTML de la página
            html = page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extraer datos básicos
            professor_data = {
                "nombre": professor_info['nombre'],
                "universidad": self.universidad,
                "departamento": professor_info['departamento'],
                "promedio_general": self.extract_average_rating(soup),
                "porcentaje_recomienda": self.extract_recommendation_percentage(soup),
                "dificultad_promedio": self.extract_difficulty(soup),
                "etiquetas": self.extract_tags(soup),
                "numero_calificaciones": self.extract_total_reviews(soup),
                "calificaciones": self.extract_reviews(page, soup)
            }
            
            return professor_data
            
        except Exception as e:
            print(f"Error extrayendo datos del profesor {professor_info['nombre']}: {e}")
            return None
    
    def extract_average_rating(self, soup: BeautifulSoup) -> float:
        """Extrae el promedio general desde .progress-circle > .score"""
        selectors = [
            '.progress-circle .score',
            '.rating-circle .score',
            '.average-rating .score',
            '.score',
            '.rating .number',
            '[data-testid="average-rating"]'
        ]
        
        for selector in selectors:
            rating = self.safe_extract_number(soup, selector)
            if rating > 0:
                return rating
        
        return 0.0
    
    def extract_recommendation_percentage(self, soup: BeautifulSoup) -> int:
        """Extrae el porcentaje de recomendación desde .stats > li"""
        selectors = [
            '.stats li',
            '.recommendation-stats li',
            '.stats .recommendation',
            '.recommendation-percentage',
            '.would-take-again'
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text(strip=True)
                if '%' in text or 'recomienda' in text.lower():
                    percentage = self.safe_extract_number(element, '')
                    if percentage > 0:
                        return int(percentage)
        
        return 0
    
    def extract_difficulty(self, soup: BeautifulSoup) -> float:
        """Extrae la dificultad promedio"""
        selectors = [
            '.stats li',
            '.difficulty-stats li',
            '.difficulty',
            '.level',
            '[data-testid="difficulty"]'
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            for element in elements:
                text = element.get_text(strip=True)
                if 'dificultad' in text.lower() or 'level' in text.lower():
                    difficulty = self.safe_extract_number(element, '')
                    if difficulty > 0:
                        return difficulty
        
        return 0.0
    
    def extract_tags(self, soup: BeautifulSoup) -> List[str]:
        """Extrae las etiquetas desde .tags"""
        selectors = [
            '.tags .tag',
            '.tags span',
            '.labels .label',
            '.characteristics .characteristic',
            '.professor-tags .tag'
        ]
        
        tags = []
        for selector in selectors:
            tag_elements = soup.select(selector)
            for tag in tag_elements:
                tag_text = tag.get_text(strip=True)
                if tag_text and len(tag_text) > 2:
                    tags.append(tag_text)
        
        return list(set(tags))  # Eliminar duplicados
    
    def extract_total_reviews(self, soup: BeautifulSoup) -> int:
        """Extrae el número total de calificaciones desde .reviews-title span"""
        selectors = [
            '.reviews-title span',
            '.total-reviews',
            '.review-count',
            '.ratings-count',
            '[data-testid="total-reviews"]'
        ]
        
        for selector in selectors:
            count_text = self.safe_extract_text(soup, selector)
            if count_text:
                # Extraer números del texto
                numbers = re.findall(r'\d+', count_text)
                if numbers:
                    return int(numbers[0])
        
        return 0
    
    def extract_reviews(self, page: Page, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extrae todas las reseñas del profesor"""
        reviews = []
        
        try:
            # Buscar reseñas en la página actual
            review_elements = soup.select('.review, .rating-item, .comment')
            
            for review_elem in review_elements:
                review_data = {
                    "fecha": self.extract_review_date(review_elem),
                    "materia": self.extract_review_subject(review_elem),
                    "calificacion_general": self.extract_review_rating(review_elem),
                    "comentario": self.extract_review_comment(review_elem)
                }
                
                if review_data["comentario"]:  # Solo agregar si hay comentario
                    reviews.append(review_data)
            
            # Verificar si hay más páginas de reseñas
            next_page = soup.select_one('.pagination .next a, .next-page, .pager .next')
            page_num = 2
            
            while next_page and page_num <= 10:  # Límite de 10 páginas
                try:
                    next_url = next_page.get('href')
                    if next_url:
                        full_url = urljoin(self.base_url, next_url)
                        page.goto(full_url)
                        time.sleep(self.get_random_delay())
                        
                        html = page.content()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        review_elements = soup.select('.review, .rating-item, .comment')
                        
                        for review_elem in review_elements:
                            review_data = {
                                "fecha": self.extract_review_date(review_elem),
                                "materia": self.extract_review_subject(review_elem),
                                "calificacion_general": self.extract_review_rating(review_elem),
                                "comentario": self.extract_review_comment(review_elem)
                            }
                            
                            if review_data["comentario"]:
                                reviews.append(review_data)
                        
                        next_page = soup.select_one('.pagination .next a, .next-page, .pager .next')
                        page_num += 1
                    else:
                        break
                        
                except Exception as e:
                    print(f"Error en página {page_num} de reseñas: {e}")
                    break
            
        except Exception as e:
            print(f"Error extrayendo reseñas: {e}")
        
        return reviews
    
    def extract_review_date(self, review_elem) -> str:
        """Extrae la fecha de una reseña desde .review-date"""
        selectors = [
            '.review-date',
            '.date',
            '.timestamp',
            '.time',
            '[data-testid="review-date"]'
        ]
        
        for selector in selectors:
            date = self.safe_extract_text(review_elem, selector)
            if date:
                return date
        
        return "Fecha no disponible"
    
    def extract_review_subject(self, review_elem) -> str:
        """Extrae la materia de una reseña desde .class"""
        selectors = [
            '.class',
            '.subject',
            '.course',
            '.materia',
            '[data-testid="review-subject"]'
        ]
        
        for selector in selectors:
            subject = self.safe_extract_text(review_elem, selector)
            if subject:
                return subject
        
        return "Materia no disponible"
    
    def extract_review_rating(self, review_elem) -> float:
        """Extrae la calificación de una reseña desde .review-grade"""
        selectors = [
            '.review-grade',
            '.rating',
            '.score',
            '.grade',
            '.stars',
            '[data-testid="review-rating"]'
        ]
        
        for selector in selectors:
            rating = self.safe_extract_number(review_elem, selector)
            if rating > 0:
                return rating
        
        return 0.0
    
    def extract_review_comment(self, review_elem) -> str:
        """Extrae el comentario de una reseña desde .comments > p"""
        selectors = [
            '.comments p',
            '.comment',
            '.review-text',
            '.feedback',
            '.opinion',
            '[data-testid="review-comment"]'
        ]
        
        for selector in selectors:
            comment = self.safe_extract_text(review_elem, selector)
            if comment and len(comment) > 10:  # Comentarios mínimos
                return comment
        
        return ""
    
    def save_professor_data(self, professor_data: Dict[str, Any]) -> bool:
        """Guarda los datos del profesor en un archivo JSON"""
        try:
            # Crear nombre de archivo seguro
            name = professor_data.get("nombre", "profesor_desconocido")
            safe_name = re.sub(r'[^\w\s-]', '', name).strip()
            safe_name = re.sub(r'[-\s]+', '_', safe_name)
            
            if not safe_name:
                safe_name = "profesor_desconocido"
            
            filename = f"{safe_name}.json"
            filepath = os.path.join(self.output_dir, filename)
            
            # Si el archivo ya existe, agregar timestamp
            if os.path.exists(filepath):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{safe_name}_{timestamp}.json"
                filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(professor_data, f, ensure_ascii=False, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Error guardando datos del profesor: {e}")
            return False
    
    def run(self):
        """Ejecuta el scraper completo"""
        print("🚀 Iniciando scraper de Mis Profesores - ITC")
        print(f"📁 Directorio de salida: {self.output_dir}")
        
        browser = None
        try:
            browser = self.setup_browser()
            context = browser.new_context(
                user_agent=self.ua.random,
                viewport={'width': 1920, 'height': 1080}
            )
            
            page = context.new_page()
            
            # Ir a la página principal
            main_url = f"{self.base_url}/escuelas/Instituto-Tecnologico-de-Culiacan_1642"
            print(f"🌐 Navegando a: {main_url}")
            
            page.goto(main_url)
            time.sleep(3)
            
            # Obtener total de páginas
            total_pages = self.get_total_pages(page)
            print(f"📄 Total de páginas encontradas: {total_pages}")
            
            all_professors = []
            
            # Obtener profesores de todas las páginas
            for page_num in range(1, total_pages + 1):
                print(f"📖 Procesando página {page_num}/{total_pages}")
                
                professors = self.get_professor_links_from_page(page, page_num)
                all_professors.extend(professors)
                
                print(f"   Encontrados {len(professors)} profesores en esta página")
                time.sleep(self.get_random_delay())
            
            # Eliminar duplicados basándose en la URL
            unique_professors = {}
            for prof in all_professors:
                unique_professors[prof['url']] = prof
            
            all_professors = list(unique_professors.values())
            self.total_professors = len(all_professors)
            
            print(f"👥 Total de profesores únicos encontrados: {self.total_professors}")
            
            # Procesar cada profesor
            successful_scrapes = 0
            
            for i, professor_info in enumerate(all_professors, 1):
                self.current_professor = i
                progress = (i / self.total_professors) * 100
                
                print(f"\n📊 Procesando {professor_info['nombre']} ({i}/{self.total_professors}) - {progress:.1f}%")
                print(f"👨‍🏫 URL: {professor_info['url']}")
                
                professor_data = self.extract_professor_data(page, professor_info)
                
                if professor_data:
                    if self.save_professor_data(professor_data):
                        successful_scrapes += 1
                        print(f"✅ Guardado: {professor_data.get('nombre', 'N/A')}")
                    else:
                        print(f"❌ Error guardando datos")
                else:
                    print(f"❌ Error extrayendo datos")
                
                # Delay entre profesores
                delay = self.get_random_delay()
                print(f"⏳ Esperando {delay:.1f} segundos...")
                time.sleep(delay)
            
            print(f"\n🎉 Scraping completado!")
            print(f"✅ Profesores procesados exitosamente: {successful_scrapes}/{self.total_professors}")
            print(f"📁 Archivos guardados en: {self.output_dir}")
            
        except Exception as e:
            print(f"❌ Error en el scraping: {e}")
        
        finally:
            if browser:
                browser.close()


def main():
    """Función principal"""
    scraper = MisProfesoresScraper()
    scraper.run()


if __name__ == "__main__":
    main() 