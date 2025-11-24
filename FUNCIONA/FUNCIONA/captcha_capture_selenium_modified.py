#!/usr/bin/env python3
"""
Script para capturar la imagen CAPTCHA de la página web de ADRES.
Utiliza Selenium 4.1.0 para la automatización web.
Modificado para mostrar el navegador y no cerrarlo al finalizar.
Integra la extracción de parámetros desde un archivo JSON.
"""

import os
import time
import json
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()

def extract_document_info_from_json(json_file_path):
    """
    Extrae la información del tipo y número de documento desde un archivo JSON.
    
    Args:
        json_file_path (str): Ruta al archivo JSON
        
    Returns:
        tuple: (tipo_documento, numero_documento)
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extraer tipo de documento y convertirlo al formato esperado (CC, TI, CE, etc.)
        doc_type_full = data.get("Tipo de Documento", "")
        
        # Mapeo de tipos de documento completos a abreviaciones
        doc_type_mapping_reverse = {
            "Cédula de Ciudadanía": "CC",
            "Tarjeta de Identidad": "TI",
            "Cédula de Extranjería": "CE",
            "Pasaporte": "PA",
            "Registro Civil": "RC"
        }
        
        # Extraer la abreviación del tipo de documento
        doc_type = None
        for key, value in doc_type_mapping_reverse.items():
            if key in doc_type_full:
                doc_type = value
                break
        
        # Si no se encuentra en el mapeo, usar el valor completo
        if doc_type is None:
            doc_type = doc_type_full
        
        # Extraer número de documento
        doc_number = data.get("Número de Documento", "")
        
        logger.info(f"Información extraída del JSON: Tipo={doc_type}, Número={doc_number}")
        return doc_type, doc_number
    
    except Exception as e:
        logger.error(f"Error al leer el archivo JSON: {str(e)}")
        return "CC", "1006206595"  # Valores por defecto en caso de error

def capturar_captcha(url, ruta_salida="captcha.png", json_file_path=None):
    """
    Accede a la página web especificada, navega al iframe que contiene el CAPTCHA
    y captura la imagen del CAPTCHA utilizando Selenium.
    
    Args:
        url (str): URL de la página web que contiene el iframe con el CAPTCHA.
        ruta_salida (str): Ruta donde se guardará la imagen del CAPTCHA.
        json_file_path (str): Ruta al archivo JSON con los datos del documento.
    
    Returns:
        tuple: (bool, webdriver) - True si la captura fue exitosa y el driver de Selenium.
    """
    print(f"Iniciando captura de CAPTCHA con Selenium desde: {url}")
    print(f"La imagen se guardará en: {ruta_salida}")
    
    # Extraer información del documento desde JSON si se proporciona
    doc_type = None
    doc_number = None
    if json_file_path:
        doc_type, doc_number = extract_document_info_from_json(json_file_path)
        print(f"Datos extraídos del JSON: Tipo={doc_type}, Número={doc_number}")
    
    # Configurar opciones de Chrome - SIN modo headless para mostrar el navegador
    chrome_options = Options()
    # Se eliminan las opciones de headless para mostrar el navegador
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
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
                    return False, driver
        
        # Cambiar al contexto del iframe
        print("Cambiando al contexto del iframe...")
        driver.switch_to.frame(iframe)
        
        # Tomar captura de pantalla del iframe para referencia
        driver.save_screenshot(os.path.splitext(ruta_salida)[0] + "_iframe.png")
        print("Captura de pantalla del iframe guardada.")
        
        # Si tenemos información del documento, completar el formulario
        if doc_type and doc_number:
            try:
                print(f"Completando formulario con documento {doc_type}: {doc_number}")
                
                # Seleccionar tipo de documento
                select_doc_type = Select(driver.find_element(By.CSS_SELECTOR, "select"))
                
                # Mapeo de tipos de documento a índices
                doc_type_mapping = {
                    "CC": 0,  # Cédula de Ciudadanía
                    "TI": 1,  # Tarjeta de Identidad
                    "CE": 2,  # Cédula de Extranjería
                    "PA": 3,  # Pasaporte
                    "RC": 4,  # Registro Civil
                }
                
                # Seleccionar tipo de documento
                if doc_type in doc_type_mapping:
                    select_doc_type.select_by_index(doc_type_mapping[doc_type])
                else:
                    select_doc_type.select_by_visible_text(doc_type)
                
                # Ingresar número de documento
                input_doc_number = driver.find_element(By.ID, "txtNumDoc")
                input_doc_number.clear()
                input_doc_number.send_keys(doc_number)
                
                print("Formulario completado con los datos del documento.")
            except Exception as e:
                print(f"Error al completar el formulario: {str(e)}")
        
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
                            return False, driver
                else:
                    print("No se encontraron imágenes en el iframe.")
                    return False, driver
        
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
        
        # Solicitar al usuario que ingrese el texto del captcha
        print("\n" + "="*50)
        print("CAPTCHA DETECTADO")
        print("="*50)
        print("Por favor, observe la imagen del captcha en el navegador")
        print("e ingrese el texto para continuar:")
        captcha_text = input("Ingrese el texto del captcha: ")
        print("="*50 + "\n")
        
        # Ingresar el texto del captcha
        try:
            input_captcha = driver.find_element(By.ID, "Capcha_CaptchaTextBox")
            input_captcha.clear()
            input_captcha.send_keys(captcha_text)
            print("Texto del captcha ingresado.")
            
            # Enviar formulario
            submit_button = driver.find_element(By.ID, "btnConsultar")
            submit_button.click()
            print("Formulario enviado.")
            
            # Esperar a que se procese la solicitud
            time.sleep(3)
            
            # Extraer resultado
            print("Extrayendo resultados...")
            
            # Verificar si hay mensaje de error
            try:
                error_msg = driver.find_element(By.ID, "lblError").text
                print(f"Mensaje de error: {error_msg}")
                
                if "captcha" in error_msg.lower() or "imagen" in error_msg.lower():
                    print("Captcha incorrecto.")
                else:
                    print("Documento no encontrado.")
            except NoSuchElementException:
                # No hay mensaje de error, intentar extraer la información
                print("Extrayendo información del afiliado...")
                
                # Intentar extraer campos principales
                fields_to_extract = {
                    "nombre": "lblNombre",
                    "tipo_documento": "lblTipoDoc",
                    "documento": "lblNumDoc",
                    "estado": "lblEstado",
                    "regimen": "lblRegimen",
                    "eps": "lblEPS",
                    "fecha_afiliacion": "lblFechaAfiliacion"
                }
                
                result = {}
                for field, element_id in fields_to_extract.items():
                    try:
                        result[field] = driver.find_element(By.ID, element_id).text
                        print(f"{field}: {result[field]}")
                    except NoSuchElementException:
                        print(f"Campo {field} no encontrado")
                
                # Guardar resultado en un archivo JSON
                result_file = os.path.splitext(ruta_salida)[0] + "_resultado.json"
                with open(result_file, "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)
                print(f"Resultado guardado en: {result_file}")
        except Exception as e:
            print(f"Error al procesar el captcha: {str(e)}")
        
        return success, driver
        
    except Exception as e:
        print(f"Error durante la captura del CAPTCHA: {str(e)}")
        return False, driver
    
    # Se elimina el bloque finally que cerraba el navegador para mantenerlo abierto

def simulate_2captcha_service(driver):
    """
    Simula el servicio de 2Captcha solicitando al usuario que ingrese el captcha.
    
    Args:
        driver: Instancia del navegador Selenium
        
    Returns:
        str: Texto del captcha ingresado por el usuario
    """
    print("\n" + "="*50)
    print("SIMULACIÓN DE SERVICIO 2CAPTCHA")
    print("="*50)
    print("En un entorno real, esta parte utilizaría la API de 2Captcha.")
    print("Para esta demostración, por favor observe la imagen del captcha")
    print("en el navegador e ingrese el texto:")
    captcha_text = input("Ingrese el texto del captcha: ")
    print("="*50 + "\n")
    return captcha_text

if __name__ == "__main__":
    # URL de la página web de ADRES
    url_adres = "https://www.adres.gov.co/consulte-su-eps"
    
    # Ruta donde se guardará la imagen del CAPTCHA
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    ruta_captcha = os.path.join(directorio_actual, "captcha.png")
    
    # Ruta al archivo JSON con los datos del documento (si existe)
    json_file_path = os.path.join(directorio_actual, "output.json")
    if not os.path.exists(json_file_path):
        print(f"Archivo JSON no encontrado en: {json_file_path}")
        print("Se procederá sin datos de documento.")
        json_file_path = None
    
    # Capturar el CAPTCHA
    resultado, driver = capturar_captcha(url_adres, ruta_captcha, json_file_path)
    
    if resultado:
        print("Proceso de captura de CAPTCHA completado exitosamente.")
    else:
        print("El proceso de captura de CAPTCHA falló. Se guardaron capturas alternativas para análisis.")
    
    print("\nEl navegador Chrome permanecerá abierto para su uso.")
    print("Para cerrar el navegador manualmente, presione Ctrl+C en esta terminal.")
    
    # Mantener el script en ejecución para que el navegador no se cierre
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nProceso interrumpido por el usuario.")
        if driver:
            print("Cerrando el navegador...")
            driver.quit()
