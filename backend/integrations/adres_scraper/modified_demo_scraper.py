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
    
    # Intentar con ChromeDriver disponible en el sistema
    try:
        driver = webdriver.Chrome(options=chrome_options)
    except Exception as e1:
        # Fallback: webdriver-manager (descarga automática del driver)
        try:
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e2:
            raise RuntimeError(f"No se pudo iniciar ChromeDriver. Error1: {e1} | Error2: {e2}")
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

        # Intentar detectar si se abrió una nueva ventana/pestaña para los resultados
        try:
            start_time = time.time()
            timeout_window = 90  # esperar hasta 90s por nueva pestaña o cambio de URL
            switched = False
            last_count = len(driver.window_handles)
            original_url = driver.current_url

            while time.time() - start_time < timeout_window and not switched:
                handles = driver.window_handles
                # Si aparecen nuevas ventanas, probar la última primero
                if len(handles) != last_count:
                    last_count = len(handles)
                for h in handles[::-1]:
                    try:
                        driver.switch_to.window(h)
                        current_url = driver.current_url
                        title_ok = False
                        url_ok = ("RespuestaConsulta" in current_url) or ("Respuesta" in current_url)
                        # Buscar el título dentro del body
                        try:
                            title_el = driver.find_elements(By.XPATH, "//*[contains(translate(., 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU'), 'RESULTADOS DE LA CONSULTA')]")
                            title_ok = len(title_el) > 0
                        except Exception:
                            title_ok = False
                        if url_ok or title_ok:
                            logger.info(f"Contexto de resultados detectado en {current_url}")
                            switched = True
                            break
                    except Exception:
                        continue
                if not switched:
                    # También considerar cambio de URL en la misma ventana
                    if driver.current_url != original_url:
                        logger.info(f"URL cambió a {driver.current_url}")
                        break
                    time.sleep(1.0)

            if not switched:
                logger.info("No se detectó nueva ventana; continuando en la actual.")
        except Exception as e:
            logger.warning(f"No se pudo verificar/cambiar de ventana: {e}")
        
        # Paso 5: Extraer resultado
        logger.info("Extrayendo resultados")
        try:
            WebDriverWait(driver, 25).until(
                EC.presence_of_all_elements_located((By.TAG_NAME, "table"))
            )
            # Guardar captura para depuración
            try:
                driver.save_screenshot("resultado_adres.png")
            except Exception:
                pass
        except TimeoutException:
            logger.warning("No se detectaron tablas a tiempo; intentaré dentro de iframes.")
            # Intentar buscar dentro de iframes
            try:
                frames = driver.find_elements(By.TAG_NAME, "iframe")
                found_in_iframe = False
                for i, fr in enumerate(frames):
                    try:
                        driver.switch_to.frame(fr)
                        logger.info(f"Probando iframe {i+1}/{len(frames)}")
                        tables = driver.find_elements(By.TAG_NAME, "table")
                        if tables and len(tables) > 0:
                            logger.info("Tablas encontradas dentro del iframe. Permaneciendo en este iframe para extraer.")
                            found_in_iframe = True
                            break
                        driver.switch_to.default_content()
                    except Exception:
                        try:
                            driver.switch_to.default_content()
                        except Exception:
                            pass
                # Volver al contenido principal solo si no se encontró nada útil en iframes
                if not found_in_iframe:
                    try:
                        driver.switch_to.default_content()
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"No fue posible iterar iframes: {e}")

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

        # Asegurar que estamos en la página de resultados
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(translate(., 'áéíóúÁÉÍÓÚ', 'aeiouAEIOU'), 'RESULTADOS DE LA CONSULTA')]"))
            )
        except TimeoutException:
            logger.warning("No se detectó el título 'Resultados de la consulta'. Continuando con extracción por tablas.")
        
        # Extraer información
        result = {"status": "success"}
        
        try:
            # 1) Intento por IDs (si la página expone labels con ID)
            fields_to_extract = {
                "nombre": "lblNombre",
                "apellidos": "lblApellidos",
                "tipo_documento": "lblTipoDoc",
                "documento": "lblNumDoc",
                "estado": "lblEstado",
                "regimen": "lblRegimen",
                "eps": "lblEPS",
                "fecha_afiliacion": "lblFechaAfiliacion",
                "fecha_nacimiento": "lblFechaNacimiento",
                "departamento": "lblDepartamento",
                "municipio": "lblMunicipio",
            }
            ids_encontrados = 0
            for field, element_id in fields_to_extract.items():
                try:
                    el = driver.find_element(By.ID, element_id)
                    txt = el.text.strip()
                    if txt:
                        result[field] = txt
                        ids_encontrados += 1
                except NoSuchElementException:
                    pass

            # 2) Fallback: Parseo por tablas visibles en la página de resultados
            if ids_encontrados == 0:
                import unicodedata

                def norm(s: str) -> str:
                    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
                    s = ' '.join(s.upper().split())
                    return s

                tables = driver.find_elements(By.TAG_NAME, "table")
                logger.info(f"Tablas detectadas para extracción: {len(tables)}")

                # a) Información Básica (COLUMNAS | DATOS)
                for tbl in tables:
                    try:
                        rows = tbl.find_elements(By.TAG_NAME, "tr")
                        if len(rows) < 2:
                            continue
                        header_cells = rows[0].find_elements(By.XPATH, ".//th|.//td")
                        header = [norm(c.text) for c in header_cells]
                        if "COLUMNAS" in header and "DATOS" in header and len(header) >= 2:
                            for r in rows[1:]:
                                cells = r.find_elements(By.XPATH, ".//td|.//th")
                                if len(cells) >= 2:
                                    label = norm(cells[0].text)
                                    value = cells[1].text.strip()
                                    if not value:
                                        continue
                                    if label == "NOMBRES":
                                        result["nombre"] = value
                                    elif label == "APELLIDOS":
                                        result["apellidos"] = value
                                    elif label in ("TIPO DE IDENTIFICACION", "TIPO DE IDENTIFICACIÓN"):
                                        result["tipo_documento"] = value
                                    elif label in ("NUMERO DE IDENTIFICACION", "NÚMERO DE IDENTIFICACIÓN"):
                                        result["documento"] = value
                                    elif label == "FECHA DE NACIMIENTO":
                                        result["fecha_nacimiento"] = value
                                    elif label == "DEPARTAMENTO":
                                        result["departamento"] = value
                                    elif label == "MUNICIPIO":
                                        result["municipio"] = value
                    except Exception:
                        continue

                # b) Datos de afiliación (encabezados: ESTADO | ENTIDAD | REGIMEN | FECHA DE AFILIACION EFECTIVA | ... | TIPO DE AFILIADO)
                for tbl in tables:
                    try:
                        rows = tbl.find_elements(By.TAG_NAME, "tr")
                        if len(rows) < 2:
                            continue
                        header_cells = rows[0].find_elements(By.XPATH, ".//th|.//td")
                        header = [norm(c.text) for c in header_cells]
                        if ("ESTADO" in header and "ENTIDAD" in header and "REGIMEN" in header) or \
                           ("ESTADO" in header and "ENTIDAD" in header and "RÉGIMEN" in header):
                            # Tomar la primera fila de datos con al menos 3 celdas
                            data_row = None
                            for r in rows[1:]:
                                tds = r.find_elements(By.TAG_NAME, "td")
                                if len(tds) >= 3:
                                    data_row = tds
                                    break
                            if not data_row:
                                continue
                            def val(col_name_variants):
                                for name in col_name_variants:
                                    if name in header:
                                        idx = header.index(name)
                                        if idx < len(data_row):
                                            return data_row[idx].text.strip()
                                return None

                            result["estado"] = val(["ESTADO"])
                            result["eps"] = val(["ENTIDAD"])
                            result["regimen"] = val(["REGIMEN", "RÉGIMEN"])
                            result["fecha_afiliacion"] = val(["FECHA DE AFILIACION EFECTIVA", "FECHA DE AFILIACIÓN EFECTIVA"])
                            result["tipo_afiliado"] = val(["TIPO DE AFILIADO"])
                    except Exception:
                        continue

                # c) Fallback ultra robusto: examinar cualquier tabla con pares (label, valor)
                if len(result.keys()) <= 1:  # solo 'status'
                    for tbl in tables:
                        try:
                            rows = tbl.find_elements(By.TAG_NAME, "tr")
                            for r in rows:
                                cells = r.find_elements(By.XPATH, ".//td|.//th")
                                if len(cells) < 2:
                                    continue
                                label = norm(cells[0].text)
                                value = cells[1].text.strip()
                                if not value:
                                    continue
                                if "NOMBRES" in label and "nombre" not in result:
                                    result["nombre"] = value
                                if "APELLIDOS" in label and "apellidos" not in result:
                                    result["apellidos"] = value
                                if "TIPO DE IDENTIFIC" in label and "tipo_documento" not in result:
                                    result["tipo_documento"] = value
                                if "NUMERO DE IDENTIFIC" in label and "documento" not in result:
                                    result["documento"] = value
                                if "FECHA DE NACIMIENTO" in label and "fecha_nacimiento" not in result:
                                    result["fecha_nacimiento"] = value
                                if "DEPARTAMENTO" in label and "departamento" not in result:
                                    result["departamento"] = value
                                if "MUNICIPIO" in label and "municipio" not in result:
                                    result["municipio"] = value
                                if "ESTADO" == label and "estado" not in result:
                                    result["estado"] = value
                                if "ENTIDAD" == label and "eps" not in result:
                                    result["eps"] = value
                                if ("REGIMEN" == label or "REGIMEN " in label or "REGIMEN" in label) and "regimen" not in result:
                                    result["regimen"] = value
                                if "FECHA DE AFILIACION EFECTIVA" in label and "fecha_afiliacion" not in result:
                                    result["fecha_afiliacion"] = value
                                if "TIPO DE AFILIADO" in label and "tipo_afiliado" not in result:
                                    result["tipo_afiliado"] = value
                        except Exception:
                            continue

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


