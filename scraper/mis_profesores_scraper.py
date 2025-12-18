#!/usr/bin/env python3
"""
Scraper para Mis Profesores - Instituto Tecnológico de Culiacán (Versión Asíncrona Optimizada)
Extrae información completa de todos los profesores del sitio web utilizando Playwright async.
"""

import os
import json
import asyncio
import random
import re
from typing import Dict, List, Optional, Any
from urllib.parse import urljoin

from playwright.async_api import async_playwright, Page, Browser, BrowserContext
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

class MisProfesoresScraper:
    """Scraper asíncrono y optimizado para Mis Profesores"""
    
    def __init__(self):
        self.base_url = "https://www.misprofesores.com"
        self.universidad = "Instituto Tecnológico de Culiacán"
        self.output_dir = "profesores_json"
        self.ua = UserAgent()
        self.browser_priority = ["webkit", "chromium", "firefox"]
        
        # Configuración de concurrencia
        self.CONCURRENCY_LIMIT = 8  # Número de pestañas simultáneas
        self.SEMAPHORE = None
        
        # Crear directorio de salida
        os.makedirs(self.output_dir, exist_ok=True)
        
        self.total_professors = 0
        self.processed_count = 0
        self.skipped_count = 0
        self.error_count = 0

    async def get_random_delay(self, min_delay=1.0, max_delay=3.0) -> float:
        """Retorna un delay aleatorio"""
        return random.uniform(min_delay, max_delay)

    def normalize_filename(self, name: str) -> str:
        """Normaliza el nombre del profesor para usarlo como nombre de archivo"""
        safe_name = re.sub(r'[^\w\s-]', '', name).strip()
        safe_name = re.sub(r'[-\s]+', '_', safe_name)
        if not safe_name:
            safe_name = "profesor_desconocido"
        return safe_name

    async def setup_browser(self, p) -> Browser:
        """Configura el navegador asíncrono"""
        for attempt in self.browser_priority:
            try:
                if attempt == "webkit":
                    print("🧭 Lanzando navegador: webkit")
                    return await p.webkit.launch(headless=True) # Headless True para mayor velocidad en background
                if attempt == "chromium":
                    print("🧭 Lanzando navegador: chromium")
                    return await p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
                if attempt == "firefox":
                    print("🧭 Lanzando navegador: firefox")
                    return await p.firefox.launch(headless=True)
            except Exception as e:
                print(f"⚠️  Falló lanzar navegador ({attempt}): {e}")
                continue
        raise RuntimeError("No se pudo iniciar ningún navegador")

    async def get_total_pages(self, page: Page) -> int:
        """Obtiene el número total de páginas"""
        try:
            await page.wait_for_load_state('domcontentloaded')
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            max_page = 1
            for a in soup.find_all('a', href=True):
                href = a['href']
                m = re.search(r'[?&]page=(\d+)', href)
                if m:
                    max_page = max(max_page, int(m.group(1)))
            return max_page
        except Exception:
            return 1

    async def get_professors_from_page(self, context: BrowserContext, page_num: int) -> List[Dict]:
        """Extrae enlaces de profesores de una página específica"""
        page = await context.new_page()
        professors = []
        try:
            url = f"{self.base_url}/escuelas/Instituto-Tecnologico-de-Culiacan_1642?page={page_num}"
            await page.goto(url, wait_until='domcontentloaded', timeout=60000)
            
            # Esperar selectores clave
            try:
                await page.wait_for_selector('a[href*="/profesores/"]', timeout=10000)
            except:
                pass

            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            links = soup.find_all('a', href=True)
            for a in links:
                href = a['href']
                text = a.get_text(strip=True)
                
                if not href or "/profesores/" not in href:
                    continue
                # Filtros básicos
                if not re.search(r"/profesores/[^?#]+_\d+", href):
                    continue
                if len(text) < 2:
                    continue

                professors.append({
                    'nombre': text,
                    'url': urljoin(self.base_url, href),
                    'departamento': "Departamento no disponible",
                    'numero_calificaciones': 0  # Default, se actualizará al entrar
                })
        except Exception as e:
            print(f"❌ Error obteniendo página {page_num}: {e}")
        finally:
            await page.close()
        
        return professors

    async def extract_professor_details(self, context: BrowserContext, professor_info: Dict):
        """Worker que procesa un profesor individualmente"""
        async with self.SEMAPHORE:
            name = professor_info['nombre']
            safe_name = self.normalize_filename(name)
            filepath = os.path.join(self.output_dir, f"{safe_name}.json")

            # Verificar estado actual del archivo
            saved_reviews_count = -1
            if os.path.exists(filepath):
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        saved_data = json.load(f)
                        # Usar el conteo de la lista real de calificaciones guardadas
                        saved_reviews_count = len(saved_data.get('calificaciones', []))
                except Exception:
                    pass

            page = await context.new_page()
            try:
                # print(f"🔄 Procesando: {name}...")
                await page.goto(professor_info['url'], wait_until='domcontentloaded', timeout=60000)
                
                # Intentar cerrar cookies (rápido)
                try:
                    await page.click("button:has-text('Aceptar')", timeout=1000)
                except:
                    pass

                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')

                # Helpers de extracción
                def get_text(sel, default=""):
                    el = soup.select_one(sel)
                    return el.get_text(strip=True) if el else default

                def get_number(sel):
                    text = get_text(sel)
                    m = re.search(r'[\d.]+', text)
                    return float(m.group()) if m else 0.0

                # Extracción de datos
                data = {
                    "nombre": name,
                    "universidad": self.universidad,
                    "departamento": professor_info['departamento'],
                    "promedio_general": 0.0,
                    "numero_calificaciones": 0,
                    "calificaciones": []
                }

                # Promedio
                for sel in ['.progress-circle .score', '.rating-circle .score', '.average-rating .score']:
                    val = get_number(sel)
                    if val > 0:
                        data['promedio_general'] = val
                        break
                
                # Total reviews (para paginación)
                for sel in ['.reviews-title span', '.total-reviews', '[data-testid="total-reviews"]']:
                    text = get_text(sel)
                    nums = re.findall(r'\d+', text)
                    if nums:
                        data['numero_calificaciones'] = int(nums[0])
                        break

                # Optimización: Si el número de reviews es el mismo (o menor), no re-scrapear
                if saved_reviews_count >= 0 and data['numero_calificaciones'] <= saved_reviews_count:
                    self.skipped_count += 1
                    print(f"⏭️  Saltando {name} (Sin cambios: {saved_reviews_count} reseñas)")
                    return

                # Otros datos (recomendación, dificultad)
                # ... (simplificado para velocidad, se puede expandir si es crítico)
                # Aquí extraemos las reviews de la primera página
                
                reviews = []
                
                # Función para extraer reviews del soup actual
                def parse_reviews(current_soup):
                    extracted = []
                    for item in current_soup.select('.review, .rating-item, .comment'):
                        comment = ""
                        for c_sel in ['.comments p', '.comment', '.review-text']:
                            c_el = item.select_one(c_sel)
                            if c_el:
                                comment = c_el.get_text(strip=True)
                                break
                        
                        if not comment: 
                            continue

                        extracted.append({
                            "fecha": "Fecha no disponible", # Simplificación, mejorar si se requiere
                            "materia": "Materia no disponible",
                            "calificacion_general": 0.0,
                            "comentario": comment
                        })
                        
                        # Extraer metadatos de la review
                        date_el = item.select_one('.date, .review-date')
                        if date_el: extracted[-1]['fecha'] = date_el.get_text(strip=True)
                        
                        subj_el = item.select_one('.class, .subject')
                        if subj_el: extracted[-1]['materia'] = subj_el.get_text(strip=True)
                        
                        rate_el = item.select_one('.review-grade, .score')
                        if rate_el:
                            m = re.search(r'[\d.]+', rate_el.get_text(strip=True))
                            if m: extracted[-1]['calificacion_general'] = float(m.group())

                    return extracted

                reviews.extend(parse_reviews(soup))

                # Paginación de reviews (Si hay muchas)
                # NOTA: Para máxima velocidad, a veces es mejor solo tomar las primeras X reviews.
                # Pero el usuario quiere "eficacia". Implementaremos paginación rápida.
                
                # Detectar botón next
                page_count = 1
                while page_count < 5: # Límite de seguridad de 5 páginas de reviews para no eternizar
                    next_el = await page.query_selector('.pagination .next a, .next-page')
                    if not next_el:
                        break
                    
                    try:
                        href = await next_el.get_attribute('href')
                        if not href: break
                        
                        await page.goto(urljoin(self.base_url, href), wait_until='domcontentloaded')
                        content = await page.content()
                        soup = BeautifulSoup(content, 'html.parser')
                        new_reviews = parse_reviews(soup)
                        if not new_reviews: break
                        reviews.extend(new_reviews)
                        page_count += 1
                    except:
                        break

                data['calificaciones'] = reviews
                
                # Guardar
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                self.processed_count += 1
                print(f"✅ Guardado: {name} ({len(reviews)} reviews)")

            except Exception as e:
                self.error_count += 1
                print(f"❌ Error procesando {name}: {e}")
            finally:
                await page.close()
                # Pequeño delay asíncrono para no saturar CPU/Red local violentamente
                await asyncio.sleep(0.5)

    async def run(self):
        # Inicializar semáforo en el loop correcto
        self.SEMAPHORE = asyncio.Semaphore(self.CONCURRENCY_LIMIT)
        
        async with async_playwright() as p:
            print("🚀 Iniciando Scraper Asíncrono Ultra-Rápido")
            browser = await self.setup_browser(p)
            
            # Contexto optimizado
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={'width': 1280, 'height': 720},
                locale="es-ES"
            )
            # Bloquear recursos innecesarios para velocidad
            await context.route("**/*.{png,jpg,jpeg,gif,webp,svg,css,woff,woff2}", lambda route: route.abort())

            # 1. Obtener lista de profesores (Paginación principal)
            print("📑 Obteniendo lista de profesores...")
            main_page = await context.new_page()
            await main_page.goto(f"{self.base_url}/escuelas/Instituto-Tecnologico-de-Culiacan_1642", wait_until='domcontentloaded')
            
            total_pages = await self.get_total_pages(main_page)
            print(f"📄 Total de páginas de índice: {total_pages}")
            await main_page.close()

            # Descargar índices en paralelo (si hubiera muchas páginas)
            # Como solo hay 1 según logs previos, esto será rápido.
            all_professors = []
            tasks = [self.get_professors_from_page(context, i) for i in range(1, total_pages + 1)]
            results = await asyncio.gather(*tasks)
            
            for res in results:
                all_professors.extend(res)
            
            # Deduplicar
            unique_professors = {p['url']: p for p in all_professors}.values()
            self.total_professors = len(unique_professors)
            print(f"👥 Total de profesores únicos encontrados: {self.total_professors}")
            
            # 2. Procesar detalles en paralelo
            print(f"⚡ Iniciando extracción paralela con {self.CONCURRENCY_LIMIT} workers...")
            
            scrape_tasks = [self.extract_professor_details(context, prof) for prof in unique_professors]
            
            # Barra de progreso simple
            # Usamos as_completed para feedback visual
            # O simplemente gather si queremos esperar todo.
            # Para feedback, mejor iterar tasks.
            
            await asyncio.gather(*scrape_tasks)

            print("\n🎉 Resumen Final:")
            print(f"✅ Procesados: {self.processed_count}")
            print(f"⏭️  Saltados: {self.skipped_count}")
            print(f"❌ Errores: {self.error_count}")
            
            await browser.close()

def main():
    asyncio.run(MisProfesoresScraper().run())

if __name__ == "__main__":
    main()