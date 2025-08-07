#!/usr/bin/env python3
"""
Script de configuración para el scraper de Mis Profesores
Instala las dependencias necesarias y configura el entorno.
"""

import subprocess
import sys
import os


def install_requirements():
    """Instala las dependencias del requirements.txt"""
    print("📦 Instalando dependencias...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencias instaladas correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando dependencias: {e}")
        return False


def install_playwright_browsers():
    """Instala los navegadores necesarios para Playwright"""
    print("🌐 Instalando navegadores de Playwright...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "playwright", "install", "chromium"
        ])
        print("✅ Navegador Chromium instalado correctamente")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error instalando navegador: {e}")
        return False


def create_directories():
    """Crea los directorios necesarios"""
    print("📁 Creando directorios...")
    
    directories = ["profesores", "logs"]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ Directorio '{directory}' creado/verificado")


def main():
    """Función principal de configuración"""
    print("🚀 Configurando scraper de Mis Profesores")
    print("=" * 50)
    
    # Instalar dependencias
    if not install_requirements():
        print("❌ Falló la instalación de dependencias")
        return False
    
    # Instalar navegadores
    if not install_playwright_browsers():
        print("❌ Falló la instalación de navegadores")
        return False
    
    # Crear directorios
    create_directories()
    
    print("\n🎉 Configuración completada exitosamente!")
    print("📝 Para ejecutar el scraper:")
    print("   python mis_profesores_scraper.py")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 