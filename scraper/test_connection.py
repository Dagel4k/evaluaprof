#!/usr/bin/env python3
"""
Script de prueba para verificar la conectividad y estructura del sitio Mis Profesores
"""

import time
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup


def test_connection():
    """Prueba la conectividad básica al sitio web"""
    print("🔍 Probando conectividad a Mis Profesores...")
    
    with sync_playwright() as p:
        # Lanzar navegador en modo visible para debug
        browser = p.chromium.launch(
            headless=False,  # Modo visible para debug
            args=[
                '--no-sandbox',
                '--disable-dev-shm-usage',
            ]
        )
        
        page = browser.new_page()
        
        try:
            # Navegar a la página principal
            url = "https://www.misprofesores.com/escuelas/Instituto-Tecnologico-de-Culiacan_1642"
            print(f"🌐 Navegando a: {url}")
            
            page.goto(url, wait_until='networkidle', timeout=30000)
            print("✅ Página cargada exitosamente")
            
            # Esperar un poco para que cargue completamente
            time.sleep(3)
            
            # Obtener el contenido de la página
            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            print("\n📊 Análisis de la página:")
            print(f"Título: {page.title()}")
            print(f"URL actual: {page.url}")
            
            # Buscar elementos clave
            print("\n🔍 Buscando elementos clave:")
            
            # Buscar tabla de profesores
            tables = soup.find_all('table')
            print(f"Tablas encontradas: {len(tables)}")
            
            # Buscar enlaces de profesores
            professor_links = soup.find_all('a', href=lambda x: x and 'profesores' in x)
            print(f"Enlaces de profesores encontrados: {len(professor_links)}")
            
            # Buscar paginación
            pagination = soup.find_all(['.pagination', '.pager', 'nav'])
            print(f"Elementos de paginación encontrados: {len(pagination)}")
            
            # Mostrar algunos enlaces de profesores
            if professor_links:
                print("\n📝 Primeros 5 enlaces de profesores:")
                for i, link in enumerate(professor_links[:5]):
                    href = link.get('href', '')
                    text = link.get_text(strip=True)
                    print(f"  {i+1}. {text} -> {href}")
            
            # Buscar elementos con selectores específicos
            print("\n🎯 Probando selectores específicos:")
            
            selectors_to_test = [
                'table tbody tr',
                '.professor-row',
                '.teacher-item',
                'td a',
                '.name a',
                '.professor-name a',
                '.pagination',
                '.pager',
                'nav'
            ]
            
            for selector in selectors_to_test:
                elements = soup.select(selector)
                print(f"  {selector}: {len(elements)} elementos encontrados")
            
            # Intentar acceder a un perfil de profesor
            if professor_links:
                first_professor_url = professor_links[0].get('href')
                if first_professor_url:
                    if not first_professor_url.startswith('http'):
                        first_professor_url = f"https://www.misprofesores.com{first_professor_url}"
                    
                    print(f"\n👨‍🏫 Probando acceso a perfil: {first_professor_url}")
                    
                    try:
                        page.goto(first_professor_url, wait_until='networkidle', timeout=30000)
                        time.sleep(3)
                        
                        profile_content = page.content()
                        profile_soup = BeautifulSoup(profile_content, 'html.parser')
                        
                        print(f"Título del perfil: {page.title()}")
                        
                        # Buscar elementos del perfil
                        profile_selectors = [
                            '.professor-profile',
                            '.teacher-profile',
                            'h1',
                            '.stats',
                            '.rating',
                            '.tags'
                        ]
                        
                        for selector in profile_selectors:
                            elements = profile_soup.select(selector)
                            print(f"  {selector}: {len(elements)} elementos encontrados")
                        
                    except Exception as e:
                        print(f"❌ Error accediendo al perfil: {e}")
            
            # Pausa para que puedas ver el navegador
            print("\n⏸️ Pausa de 10 segundos para revisar el navegador...")
            time.sleep(10)
            
        except Exception as e:
            print(f"❌ Error durante la prueba: {e}")
        
        finally:
            browser.close()


if __name__ == "__main__":
    test_connection()
