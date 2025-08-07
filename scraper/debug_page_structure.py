#!/usr/bin/env python3
"""
Script de diagnóstico para analizar la estructura de la página de Mis Profesores
"""

import time
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup


def debug_page_structure():
    """Analiza la estructura de la página en detalle"""
    print("🔍 Analizando estructura de la página de Mis Profesores...")
    
    with sync_playwright() as p:
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
            time.sleep(5)
            
            # Obtener el contenido de la página
            content = page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            print("\n📊 Análisis detallado de la página:")
            print(f"Título: {page.title()}")
            print(f"URL actual: {page.url}")
            
            # Analizar estructura de tablas
            print("\n📋 Análisis de tablas:")
            tables = soup.find_all('table')
            print(f"Total de tablas encontradas: {len(tables)}")
            
            for i, table in enumerate(tables):
                print(f"\nTabla {i+1}:")
                print(f"  Clases: {table.get('class', [])}")
                print(f"  ID: {table.get('id', 'N/A')}")
                
                # Analizar filas
                rows = table.find_all('tr')
                print(f"  Filas encontradas: {len(rows)}")
                
                if rows:
                    # Analizar primera fila (encabezados)
                    first_row = rows[0]
                    headers = first_row.find_all(['th', 'td'])
                    print(f"  Columnas en primera fila: {len(headers)}")
                    
                    for j, header in enumerate(headers):
                        header_text = header.get_text(strip=True)
                        print(f"    Columna {j+1}: '{header_text}'")
                    
                    # Analizar segunda fila (datos de ejemplo)
                    if len(rows) > 1:
                        second_row = rows[1]
                        cells = second_row.find_all('td')
                        print(f"  Celdas en segunda fila: {len(cells)}")
                        
                        for j, cell in enumerate(cells):
                            cell_text = cell.get_text(strip=True)
                            links = cell.find_all('a')
                            print(f"    Celda {j+1}: '{cell_text}' (enlaces: {len(links)})")
                            
                            for link in links:
                                href = link.get('href', '')
                                link_text = link.get_text(strip=True)
                                print(f"      Enlace: '{link_text}' -> {href}")
            
            # Buscar enlaces de profesores específicamente
            print("\n🔗 Análisis de enlaces de profesores:")
            all_links = soup.find_all('a', href=True)
            professor_links = []
            
            for link in all_links:
                href = link.get('href', '')
                text = link.get_text(strip=True)
                
                if 'profesores' in href and text:
                    professor_links.append({
                        'text': text,
                        'href': href
                    })
            
            print(f"Enlaces que contienen 'profesores' en URL: {len(professor_links)}")
            
            for i, link_info in enumerate(professor_links[:10]):  # Mostrar primeros 10
                print(f"  {i+1}. '{link_info['text']}' -> {link_info['href']}")
            
            # Buscar elementos con selectores específicos
            print("\n🎯 Probando selectores específicos:")
            
            selectors_to_test = [
                'table tbody tr',
                'table tr',
                'tr',
                'td a',
                'a[href*="profesores"]',
                '.professor-link',
                '.teacher-link',
                'td:first-child a',
                'td a[href*="profesores"]'
            ]
            
            for selector in selectors_to_test:
                try:
                    elements = soup.select(selector)
                    print(f"  {selector}: {len(elements)} elementos encontrados")
                    
                    # Mostrar algunos ejemplos
                    if elements and len(elements) <= 5:
                        for j, elem in enumerate(elements):
                            if selector == 'td a' or selector == 'a[href*="profesores"]':
                                text = elem.get_text(strip=True)
                                href = elem.get('href', '')
                                print(f"    Ejemplo {j+1}: '{text}' -> {href}")
                except Exception as e:
                    print(f"  {selector}: Error - {e}")
            
            # Intentar encontrar la estructura correcta
            print("\n🔍 Buscando estructura correcta de profesores:")
            
            # Buscar todas las filas de tabla
            all_rows = soup.find_all('tr')
            print(f"Total de filas en la página: {len(all_rows)}")
            
            professor_rows = []
            for row in all_rows:
                cells = row.find_all('td')
                if cells:
                    # Buscar enlaces en la primera celda
                    first_cell = cells[0]
                    links = first_cell.find_all('a')
                    
                    for link in links:
                        href = link.get('href', '')
                        text = link.get_text(strip=True)
                        
                        if 'profesores' in href and text:
                            professor_rows.append({
                                'row': row,
                                'link': link,
                                'text': text,
                                'href': href,
                                'cells': cells
                            })
            
            print(f"Filas con enlaces de profesores: {len(professor_rows)}")
            
            if professor_rows:
                print("\n📝 Ejemplos de filas de profesores:")
                for i, prof_row in enumerate(professor_rows[:3]):
                    print(f"  Profesor {i+1}: '{prof_row['text']}'")
                    print(f"    URL: {prof_row['href']}")
                    
                    # Mostrar contenido de las celdas
                    for j, cell in enumerate(prof_row['cells']):
                        cell_text = cell.get_text(strip=True)
                        print(f"    Celda {j+1}: '{cell_text}'")
            
            # Pausa para revisar el navegador
            print("\n⏸️ Pausa de 15 segundos para revisar el navegador...")
            time.sleep(15)
            
        except Exception as e:
            print(f"❌ Error durante el análisis: {e}")
        
        finally:
            browser.close()


if __name__ == "__main__":
    debug_page_structure()
