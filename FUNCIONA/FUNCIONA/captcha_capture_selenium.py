#!/usr/bin/env python3
"""
Script para capturar la imagen CAPTCHA de la página web de ADRES.
Utiliza Selenium 4.1.0 para la automatización web.
"""

import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException

def capturar_captcha(url, ruta_salida="captcha.png"):
    """
    Accede a la página web especificada, navega al iframe que contiene el CAPTCHA
    y captura la imagen del CAPTCHA utilizando Selenium.
    
    Args:
        url (str): URL de la página web que contiene el iframe con el CAPTCHA.
        ruta_salida (str): Ruta donde se guardará la imagen del CAPTCHA.
    
    Returns:
        bool: True si la captura fue exitosa, False en caso contrario.
    """
    print(f"Iniciando captura de CAPTCHA con Selenium desde: {url}")
    print(f"La imagen se guardará en: {ruta_salida}")
    
    # Configurar opciones de Chrome para modo headless
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Configurar un User-Agent más realista para evitar detección de bot
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = None
    try:
        # Iniciar el navegador Chrome
        print("Iniciando navegador Chrome...")
        driver = webdriver.Chrome(options=chrome_options)
        
        # Establecer un timeout implícito para todos los elementos
        driver.implicitly_wait(10)
        
        # Navegar a la URL
        print("Navegando a la página web principal...")
        driver.get(url)
        
        # Esperar a que la página cargue completamente
        print("Esperando a que la página cargue completamente...")
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        time.sleep(5)  # Espera adicional para asegurar carga completa
        print("Página principal cargada completamente.")
        
        # Tomar captura de pantalla de la página principal para referencia
        driver.save_screenshot(os.path.splitext(ruta_salida)[0] + "_main_page.png")
        print("Captura de pantalla de la página principal guardada.")
        
        # Buscar el iframe que contiene el CAPTCHA
        print("Buscando el iframe que contiene el CAPTCHA...")
        try:
            # Intentar encontrar el iframe por nombre
            iframe = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.NAME, "MSOPageViewerWebPart_WebPartWPQ3"))
            )
            print("Iframe encontrado por nombre.")
        except TimeoutException:
            print("No se encontró el iframe por nombre, buscando por URL parcial...")
            try:
                # Intentar encontrar el iframe por URL parcial
                iframe = WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[src*='ConsultarAfiliadoWeb']"))
                )
                print("Iframe encontrado por URL parcial.")
            except TimeoutException:
                # Listar todos los iframes disponibles
                iframes = driver.find_elements(By.TAG_NAME, "iframe")
                if iframes:
                    print(f"Se encontraron {len(iframes)} iframes en la página:")
                    for i, frame in enumerate(iframes):
                        src = frame.get_attribute("src") or "Sin src"
                        name = frame.get_attribute("name") or "Sin nombre"
                        id_attr = frame.get_attribute("id") or "Sin ID"
                        print(f"  Iframe {i+1}: src='{src}', name='{name}', id='{id_attr}'")
                    
                    # Intentar con el primer iframe
                    print("Intentando con el primer iframe disponible...")
                    iframe = iframes[0]
                else:
                    print("No se encontraron iframes en la página.")
                    return False
        
        # Cambiar al contexto del iframe
        print("Cambiando al contexto del iframe...")
        driver.switch_to.frame(iframe)
        
        # Tomar captura de pantalla del iframe para referencia
        driver.save_screenshot(os.path.splitext(ruta_salida)[0] + "_iframe.png")
        print("Captura de pantalla del iframe guardada.")
        
        # Buscar el elemento CAPTCHA dentro del iframe
        print("Buscando el elemento CAPTCHA dentro del iframe...")
        try:
            # Intentar encontrar el CAPTCHA por ID
            captcha_element = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located((By.ID, "Capcha_CaptchaImageUP"))
            )
            print("Elemento CAPTCHA encontrado por ID.")
        except TimeoutException:
            print("No se encontró el CAPTCHA por ID, buscando por selectores alternativos...")
            try:
                # Intentar encontrar por clase
                captcha_element = WebDriverWait(driver, 10).until(
                    EC.visibility_of_element_located((By.CLASS_NAME, "imageClass"))
                )
                print("Elemento CAPTCHA encontrado por clase.")
            except TimeoutException:
                # Intentar encontrar cualquier imagen en el iframe
                images = driver.find_elements(By.TAG_NAME, "img")
                if images:
                    print(f"Se encontraron {len(images)} imágenes en el iframe:")
                    for i, img in enumerate(images):
                        src = img.get_attribute("src") or "Sin src"
                        alt = img.get_attribute("alt") or "Sin alt"
                        id_attr = img.get_attribute("id") or "Sin ID"
                        print(f"  Imagen {i+1}: src='{src}', alt='{alt}', id='{id_attr}'")
                        
                        # Si alguna imagen tiene 'captcha' en sus atributos
                        if ('captcha' in src.lower() or 
                            'captcha' in alt.lower() or 
                            'captcha' in id_attr.lower()):
                            print(f"  Posible CAPTCHA encontrado en imagen {i+1}")
                            captcha_element = img
                            break
                    else:
                        # Si no se encontró ninguna imagen con 'captcha', usar la primera
                        if images:
                            print("Usando la primera imagen como posible CAPTCHA...")
                            captcha_element = images[0]
                        else:
                            print("No se encontraron imágenes en el iframe.")
                            return False
                else:
                    print("No se encontraron imágenes en el iframe.")
                    return False
        
        # Intentar hacer scroll hasta el elemento CAPTCHA para asegurar visibilidad
        try:
            driver.execute_script("arguments[0].scrollIntoView(true);", captcha_element)
            time.sleep(2)  # Esperar a que el scroll se complete
        except Exception as e:
            print(f"Advertencia al hacer scroll: {str(e)}")
        
        # Capturar la imagen del CAPTCHA
        print("Capturando imagen del CAPTCHA...")
        try:
            # Intentar capturar directamente el elemento
            captcha_element.screenshot(ruta_salida)
            print(f"Imagen del CAPTCHA guardada en: {ruta_salida}")
            success = True
        except Exception as e:
            print(f"Error al capturar el elemento directamente: {str(e)}")
            
            # Alternativa: Capturar coordenadas y recortar de una captura completa
            try:
                print("Intentando método alternativo de captura...")
                # Tomar captura completa
                full_screenshot_path = os.path.splitext(ruta_salida)[0] + "_full.png"
                driver.save_screenshot(full_screenshot_path)
                
                # Obtener ubicación y tamaño del elemento
                location = captcha_element.location
                size = captcha_element.size
                
                # Guardar información para procesamiento posterior
                with open(os.path.splitext(ruta_salida)[0] + "_coords.txt", "w") as f:
                    f.write(f"Location: {location}\n")
                    f.write(f"Size: {size}\n")
                
                print(f"Captura completa guardada en: {full_screenshot_path}")
                print(f"Coordenadas del CAPTCHA guardadas para recorte posterior.")
                print(f"Ubicación: {location}, Tamaño: {size}")
                
                # Nota: El recorte requeriría procesamiento de imágenes (PIL/OpenCV)
                # que no está implementado en este script básico
                success = False
            except Exception as e2:
                print(f"Error en método alternativo: {str(e2)}")
                success = False
        
        return success
        
    except Exception as e:
        print(f"Error durante la captura del CAPTCHA: {str(e)}")
        return False
    
    finally:
        # Cerrar el navegador si está abierto
        if driver:
            print("Cerrando el navegador...")
            driver.quit()

if __name__ == "__main__":
    # URL de la página web de ADRES
    url_adres = "https://www.adres.gov.co/consulte-su-eps"
    
    # Ruta donde se guardará la imagen del CAPTCHA
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    ruta_captcha = os.path.join(directorio_actual, "captcha.png")
    
    # Capturar el CAPTCHA
    resultado = capturar_captcha(url_adres, ruta_captcha)
    
    if resultado:
        print("Proceso completado exitosamente.")
    else:
        print("El proceso falló. Se guardaron capturas alternativas para análisis.")
