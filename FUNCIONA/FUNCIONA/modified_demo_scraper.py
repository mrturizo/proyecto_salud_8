#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script de ejemplo para probar el funcionamiento del scraper de ADRES
sin necesidad de una API key real de 2Captcha.

Este script simula la resolución del captcha para fines de demostración,
permitiendo verificar el flujo del proceso sin incurrir en costos.

Nota: Para uso en producción, reemplace la función simulate_2captcha_service
con una implementación real utilizando la API de 2Captcha.
"""

import os
import time
import json
import logging
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()

def setup_driver(headless=True):
    """Configura el driver de Selenium."""
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless")
    
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    return driver

def simulate_2captcha_service():
    """
    Simula el servicio de 2Captcha solicitando al usuario que ingrese el captcha.
    
    En un entorno real, esta función sería reemplazada por la integración
    con la API de 2Captcha.
    
    Returns:
        str: Texto del captcha ingresado por el usuario
    """
    print("\n" + "="*50)
    print("SIMULACIÓN DE SERVICIO 2CAPTCHA")
    print("="*50)
    print("En un entorno real, esta parte utilizaría la API de 2Captcha.")
    print("Para esta demostración, por favor observe la imagen del captcha")
    print("en el navegador (si está en modo visible) e ingrese el texto:")
    captcha_text = input("Ingrese el texto del captcha: ")
    print("="*50 + "\n")
    return captcha_text

def demo_adres_consulta(doc_type="CC", doc_number="1006206595", headless=False):
    """
    Demuestra el proceso de consulta en ADRES con intervención manual para el captcha.
    
    Args:
        doc_type (str): Tipo de documento
        doc_number (str): Número de documento
        headless (bool): Si se ejecuta el navegador en modo headless
        
    Returns:
        dict: Resultado de la consulta
    """
    driver = setup_driver(headless=headless)
    url = "https://aplicaciones.adres.gov.co/bdua_internet/Pages/ConsultarAfiliadoWeb.aspx"
    
    try:
        # Paso 1: Navegar al formulario
        logger.info(f"Navegando a {url}")
        driver.get(url)
        
        # Esperar a que la página cargue
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.ID, "txtNumDoc"))
        )
        logger.info("Página cargada correctamente")
        
        # Paso 2: Completar el formulario
        logger.info(f"Completando formulario con documento {doc_type}: {doc_number}")
        
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
        
        # Paso 3: Simular resolución del captcha (en producción, usar 2Captcha)
        captcha_text = simulate_2captcha_service()
        
        # Ingresar texto del captcha
        input_captcha = driver.find_element(By.ID, "Capcha_CaptchaTextBox")
        input_captcha.clear()
        input_captcha.send_keys(captcha_text)
        
        # Paso 4: Enviar formulario
        submit_button = driver.find_element(By.ID, "btnConsultar")
        submit_button.click()
        logger.info("Formulario enviado")
        
        # Esperar a que se procese la solicitud
        time.sleep(3)
        
        # Paso 5: Extraer resultado
        logger.info("Extrayendo resultados")
        
        # Verificar si hay mensaje de error
        try:
            error_msg = driver.find_element(By.ID, "lblError").text
            logger.warning(f"Mensaje de error: {error_msg}")
            
            if "captcha" in error_msg.lower() or "imagen" in error_msg.lower():
                return {"status": "error", "message": "Captcha incorrecto", "error": error_msg}
            else:
                return {"status": "not_found", "message": "Documento no encontrado", "error": error_msg}
        except NoSuchElementException:
            # No hay mensaje de error, intentar extraer la información
            pass
        
        # Extraer información
        result = {"status": "success"}
        
        try:
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
            
            for field, element_id in fields_to_extract.items():
                try:
                    result[field] = driver.find_element(By.ID, element_id).text
                except NoSuchElementException:
                    logger.warning(f"Campo {field} no encontrado")
            
            logger.info("Información extraída correctamente")
            return result
        except Exception as e:
            logger.error(f"Error al extraer información: {str(e)}")
            return {"status": "error", "message": "Error al extraer información", "error": str(e)}
    
    except Exception as e:
        logger.error(f"Error en el proceso: {str(e)}")
        return {"status": "error", "message": "Error en el proceso", "error": str(e)}
    
    finally:
        # Cerrar el navegador
        driver.quit()
        logger.info("Navegador cerrado")

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

if __name__ == "__main__":
    print("Demostración de consulta en ADRES")
    print("=================================")
    
    # Extraer datos del archivo JSON
    json_file_path = "output.json"
    doc_type, doc_number = extract_document_info_from_json(json_file_path)
    
    print(f"Datos extraídos del JSON:")
    print(f"Tipo de documento: {doc_type}")
    print(f"Número de documento: {doc_number}")
    
    # Ejecutar la demostración
    result = demo_adres_consulta(doc_type, doc_number, headless=False)
    
    # Mostrar resultado
    print("\nResultado de la consulta:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Guardar resultado
    with open("demo_resultado.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\nResultado guardado en demo_resultado.json")
