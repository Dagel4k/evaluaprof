#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad del scraper
Prueba la conexión y extrae datos de muestra.
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from fake_useragent import UserAgent


def test_connection():
    """Prueba la conexión al sitio web"""
    print("🔍 Probando conexión al sitio web...")
    
    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(user_agent=UserAgent().random)
        page = context.new_page()
        
        # URL del ITC
        url = "https://www.misprofesores.com/escuelas/Instituto-Tecnologico-de-Culiacan_1642"
        
        print(f"🌐 Conectando a: {url}")
        page.goto(url, timeout=30000)
        
        # Verificar que la página cargó
        title = page.title()
        print(f"✅ Página cargada: {title}")
        
        # Verificar elementos clave
        selectors_to_check = [
            'table',
            '.pagination',
            'a[href*="/profesores/"]'
        ]
        
        for selector in selectors_to_check:
            try:
                element = page.query_selector(selector)
                if element:
                    print(f"✅ Selector encontrado: {selector}")
                else:
                    print(f"⚠️ Selector no encontrado: {selector}")
            except Exception as e:
                print(f"❌ Error verificando {selector}: {e}")
        
        browser.close()
        return True
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False


def test_professor_extraction():
    """Prueba la extracción de datos de un profesor"""
    print("\n👨‍🏫 Probando extracción de datos de profesor...")
    
    try:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(user_agent=UserAgent().random)
        page = context.new_page()
        
        # Ir a la página principal
        url = "https://www.misprofesores.com/escuelas/Instituto-Tecnologico-de-Culiacan_1642"
        page.goto(url, timeout=30000)
        
        # Buscar el primer profesor
        professor_link = page.query_selector('a[href*="/profesores/"]')
        if not professor_link:
            print("❌ No se encontró ningún enlace de profesor")
            return False
        
        professor_url = professor_link.get_attribute('href')
        if not professor_url:
            print("❌ No se pudo obtener la URL del profesor")
            return False
        
        # Construir URL completa
        if not professor_url.startswith('http'):
            professor_url = f"https://www.misprofesores.com{professor_url}"
        
        print(f"👨‍🏫 Probando con: {professor_url}")
        
        # Ir al perfil del profesor
        page.goto(professor_url, timeout=30000)
        
        # Extraer datos básicos
        html = page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # Buscar nombre
        name_selectors = ['h1', '.professor-name', '.teacher-name']
        name = "No encontrado"
        for selector in name_selectors:
            name_elem = soup.select_one(selector)
            if name_elem:
                name = name_elem.get_text(strip=True)
                break
        
        print(f"✅ Nombre extraído: {name}")
        
        # Buscar promedio
        rating_selectors = ['.progress-circle .score', '.rating-circle .score', '.score']
        rating = 0.0
        for selector in rating_selectors:
            rating_elem = soup.select_one(selector)
            if rating_elem:
                rating_text = rating_elem.get_text(strip=True)
                import re
                rating_match = re.search(r'[\d.]+', rating_text)
                if rating_match:
                    rating = float(rating_match.group())
                    break
        
        print(f"✅ Promedio extraído: {rating}")
        
        # Buscar etiquetas
        tags = []
        tag_elements = soup.select('.tags .tag, .tags span')
        for tag in tag_elements:
            tag_text = tag.get_text(strip=True)
            if tag_text:
                tags.append(tag_text)
        
        print(f"✅ Etiquetas encontradas: {len(tags)} - {tags[:3]}")
        
        # Buscar reseñas
        reviews = soup.select('.review, .rating-item, .comment')
        print(f"✅ Reseñas encontradas: {len(reviews)}")
        
        browser.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en extracción: {e}")
        return False


def test_file_structure():
    """Prueba la estructura de archivos"""
    print("\n📁 Verificando estructura de archivos...")
    
    required_files = [
        'mis_profesores_scraper.py',
        'process_data.py',
        'run_scraper.py',
        'setup.py',
        'requirements.txt',
        'README.md'
    ]
    
    missing_files = []
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} - FALTANTE")
            missing_files.append(file)
    
    if missing_files:
        print(f"\n⚠️ Archivos faltantes: {missing_files}")
        return False
    
    return True


def test_dependencies():
    """Prueba las dependencias"""
    print("\n📦 Verificando dependencias...")
    
    dependencies = [
        'playwright',
        'beautifulsoup4',
        'fake_useragent'
    ]
    
    missing_deps = []
    for dep in dependencies:
        try:
            __import__(dep.replace('-', '_'))
            print(f"✅ {dep}")
        except ImportError:
            print(f"❌ {dep} - NO INSTALADA")
            missing_deps.append(dep)
    
    if missing_deps:
        print(f"\n💡 Para instalar dependencias faltantes:")
        print("   python setup.py")
        return False
    
    return True


def main():
    """Función principal de pruebas"""
    print("🧪 PRUEBAS DEL SCRAPER - MIS PROFESORES ITC")
    print("=" * 50)
    
    tests = [
        ("Estructura de archivos", test_file_structure),
        ("Dependencias", test_dependencies),
        ("Conexión al sitio", test_connection),
        ("Extracción de datos", test_professor_extraction)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Ejecutando: {test_name}")
        print("-" * 30)
        
        try:
            if test_func():
                print(f"✅ {test_name}: PASÓ")
                passed += 1
            else:
                print(f"❌ {test_name}: FALLÓ")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
    
    print(f"\n📊 RESULTADOS: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron! El scraper está listo.")
        print("\n💡 Para ejecutar el scraper completo:")
        print("   python run_scraper.py")
    else:
        print("⚠️ Algunas pruebas fallaron. Revisa los errores arriba.")
        print("\n💡 Para instalar dependencias:")
        print("   python setup.py")
    
    return 0 if passed == total else 1


if __name__ == "__main__":
    exit(main()) 