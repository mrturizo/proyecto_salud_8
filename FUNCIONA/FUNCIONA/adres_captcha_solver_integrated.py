#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script integrado para capturar y reconocer el CAPTCHA de la página de ADRES
==========================================================================

Este script:
1. Abre la página web de ADRES
2. Localiza y captura la imagen del CAPTCHA desde el iframe correcto
3. Procesa la imagen con el modelo entrenado
4. Muestra los dígitos identificados
5. Mantiene la página abierta para uso posterior
pero el modelo no work
Autor: Manus AI
Fecha: Junio 2025
"""

import os
import sys
import time
import numpy as np
import cv2
import argparse
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from tensorflow.keras.models import load_model
import matplotlib.pyplot as plt
from PIL import Image

class AdresCaptchaSolverIntegrated:
    """Clase para automatizar la captura y reconocimiento de CAPTCHA en ADRES"""
    
    def __init__(self, model_path, url="https://www.adres.gov.co/consulte-su-eps", 
                 headless=False, chromedriver_path=None):
        """
        Inicializa el solucionador de CAPTCHA
        
        Args:
            model_path: Ruta al modelo entrenado (.h5)
            url: URL de la página de ADRES
            headless: Si es True, ejecuta el navegador en modo headless (sin interfaz gráfica)
            chromedriver_path: Ruta al ejecutable de ChromeDriver (opcional)
        """
        self.model_path = model_path
        self.url = url
        self.headless = headless
        self.chromedriver_path = chromedriver_path
        self.driver = None
        self.model = None
        
        # Cargar el modelo
        self._load_model()
        
        # Inicializar el navegador
        self._init_browser()
    
    def _load_model(self):
        """Carga el modelo entrenado desde el archivo .h5"""
        print(f"Cargando modelo desde: {self.model_path}")
        try:
            self.model = load_model(self.model_path)
            print("Modelo cargado correctamente")
        except Exception as e:
            print(f"Error al cargar el modelo: {e}")
            sys.exit(1)
    
    def _init_browser(self):
        """Inicializa el navegador web"""
        print("Inicializando navegador...")
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--start-maximized")
            
            # Configurar un User-Agent más realista para evitar detección de bot
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            
            # Inicializar el driver con la ruta especificada o automáticamente
            if self.chromedriver_path:
                print(f"Usando ChromeDriver desde: {self.chromedriver_path}")
                service = Service(executable_path=self.chromedriver_path)
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
            else:
                # Intentar usar el ChromeDriver instalado en el sistema
                try:
                    self.driver = webdriver.Chrome(options=chrome_options)
                except Exception as e1:
                    print(f"Error al inicializar Chrome sin ruta específica: {e1}")
                    print("Intentando con webdriver-manager (puede fallar en algunos entornos Windows)...")
                    
                    try:
                        from webdriver_manager.chrome import ChromeDriverManager
                        service = Service(ChromeDriverManager().install())
                        self.driver = webdriver.Chrome(service=service, options=chrome_options)
                    except Exception as e2:
                        print(f"Error al usar webdriver-manager: {e2}")
                        print("\nPor favor, descarga manualmente ChromeDriver desde:")
                        print("https://chromedriver.chromium.org/downloads")
                        print("Y especifica la ruta con --chromedriver-path")
                        sys.exit(1)
            
            print("Navegador inicializado correctamente")
        except Exception as e:
            print(f"Error al inicializar el navegador: {e}")
            sys.exit(1)
    
    def navigate_to_page(self):
        """Navega a la página de ADRES"""
        print(f"Navegando a: {self.url}")
        try:
            self.driver.get(self.url)
            # Esperar a que la página cargue completamente
            WebDriverWait(self.driver, 30).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            time.sleep(5)  # Espera adicional para asegurar carga completa
            print("Página cargada correctamente")
            return True
        except Exception as e:
            print(f"Error al navegar a la página: {e}")
            return False
    
    def capture_captcha(self):
        """
        Captura la imagen del CAPTCHA desde el iframe correcto
        
        Returns:
            Imagen del CAPTCHA como array de numpy o None si falla
        """
        print("Capturando imagen del CAPTCHA...")
        
        # Tomar captura de pantalla de la página principal para referencia
        self.driver.save_screenshot("main_page.png")
        print("Captura de pantalla de la página principal guardada.")
        
        try:
            # Buscar el iframe que contiene el CAPTCHA
            print("Buscando el iframe que contiene el CAPTCHA...")
            try:
                # Intentar encontrar el iframe por nombre
                iframe = WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.NAME, "MSOPageViewerWebPart_WebPartWPQ3"))
                )
                print("Iframe encontrado por nombre.")
            except TimeoutException:
                print("No se encontró el iframe por nombre, buscando por URL parcial...")
                try:
                    # Intentar encontrar el iframe por URL parcial
                    iframe = WebDriverWait(self.driver, 20).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "iframe[src*='ConsultarAfiliadoWeb']"))
                    )
                    print("Iframe encontrado por URL parcial.")
                except TimeoutException:
                    # Listar todos los iframes disponibles
                    iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
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
                        return None
            
            # Cambiar al contexto del iframe
            print("Cambiando al contexto del iframe...")
            self.driver.switch_to.frame(iframe)
            
            # Tomar captura de pantalla del iframe para referencia
            self.driver.save_screenshot("iframe.png")
            print("Captura de pantalla del iframe guardada.")
            
            # Buscar el elemento CAPTCHA dentro del iframe
            print("Buscando el elemento CAPTCHA dentro del iframe...")
            try:
                # Intentar encontrar el CAPTCHA por ID
                captcha_element = WebDriverWait(self.driver, 20).until(
                    EC.visibility_of_element_located((By.ID, "Capcha_CaptchaImageUP"))
                )
                print("Elemento CAPTCHA encontrado por ID.")
            except TimeoutException:
                print("No se encontró el CAPTCHA por ID, buscando por selectores alternativos...")
                try:
                    # Intentar encontrar por clase
                    captcha_element = WebDriverWait(self.driver, 10).until(
                        EC.visibility_of_element_located((By.CLASS_NAME, "imageClass"))
                    )
                    print("Elemento CAPTCHA encontrado por clase.")
                except TimeoutException:
                    # Intentar encontrar cualquier imagen en el iframe
                    images = self.driver.find_elements(By.TAG_NAME, "img")
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
                                return None
                    else:
                        print("No se encontraron imágenes en el iframe.")
                        return None
            
            # Intentar hacer scroll hasta el elemento CAPTCHA para asegurar visibilidad
            try:
                self.driver.execute_script("arguments[0].scrollIntoView(true);", captcha_element)
                time.sleep(2)  # Esperar a que el scroll se complete
            except Exception as e:
                print(f"Advertencia al hacer scroll: {str(e)}")
            
            # Capturar la imagen del CAPTCHA
            print("Capturando imagen del CAPTCHA...")
            try:
                # Intentar capturar directamente el elemento
                captcha_element.screenshot("captcha_original.png")
                print("Imagen del CAPTCHA guardada como 'captcha_original.png'")
                
                # Cargar la imagen capturada
                captcha_image = cv2.imread("captcha_original.png")
                return captcha_image
            except Exception as e:
                print(f"Error al capturar el elemento directamente: {str(e)}")
                
                # Alternativa: Capturar coordenadas y recortar de una captura completa
                try:
                    print("Intentando método alternativo de captura...")
                    # Tomar captura completa
                    self.driver.save_screenshot("full_screenshot.png")
                    
                    # Obtener ubicación y tamaño del elemento
                    location = captcha_element.location
                    size = captcha_element.size
                    
                    # Guardar información para depuración
                    with open("captcha_coords.txt", "w") as f:
                        f.write(f"Location: {location}\n")
                        f.write(f"Size: {size}\n")
                    
                    print(f"Captura completa guardada como 'full_screenshot.png'")
                    print(f"Coordenadas del CAPTCHA: Ubicación: {location}, Tamaño: {size}")
                    
                    # Recortar la imagen
                    full_screenshot = cv2.imread("full_screenshot.png")
                    x = location['x']
                    y = location['y']
                    width = size['width']
                    height = size['height']
                    
                    # Ajustar por el factor de escala entre la captura y las coordenadas del navegador
                    scale_x = full_screenshot.shape[1] / self.driver.execute_script("return window.innerWidth")
                    scale_y = full_screenshot.shape[0] / self.driver.execute_script("return window.innerHeight")
                    
                    x = int(x * scale_x)
                    y = int(y * scale_y)
                    width = int(width * scale_x)
                    height = int(height * scale_y)
                    
                    # Recortar la región
                    captcha_image = full_screenshot[y:y+height, x:x+width]
                    
                    # Guardar la imagen recortada
                    cv2.imwrite("captcha_original.png", captcha_image)
                    print("Imagen recortada guardada como 'captcha_original.png'")
                    
                    return captcha_image
                except Exception as e2:
                    print(f"Error en método alternativo: {str(e2)}")
                    return None
        
        except Exception as e:
            print(f"Error durante la captura del CAPTCHA: {str(e)}")
            return None
    
    def preprocess_image(self, image):
        """
        Preprocesa la imagen del CAPTCHA para mejorar el reconocimiento
        
        Args:
            image: Imagen del CAPTCHA como array de numpy
            
        Returns:
            Imagen preprocesada
        """
        print("Preprocesando imagen...")
        try:
            # Convertir a escala de grises si es necesario
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Aplicar umbralización para separar los dígitos del fondo
            _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
            
            # Aplicar operaciones morfológicas para eliminar ruido
            kernel = np.ones((2, 2), np.uint8)
            opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            
            # Guardar imagen preprocesada para depuración
            cv2.imwrite("captcha_preprocessed.png", opening)
            print("Imagen preprocesada guardada como 'captcha_preprocessed.png'")
            
            return opening
        except Exception as e:
            print(f"Error al preprocesar la imagen: {e}")
            return image
    
    def segment_digits(self, preprocessed_image):
        """
        Segmenta los dígitos individuales de la imagen preprocesada
        
        Args:
            preprocessed_image: Imagen preprocesada del CAPTCHA
            
        Returns:
            Lista de imágenes de dígitos segmentados
        """
        print("Segmentando dígitos...")
        try:
            # Encontrar contornos en la imagen
            contours, _ = cv2.findContours(
                preprocessed_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            
            # Filtrar contornos por área para eliminar ruido pequeño
            digit_contours = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                area = w * h
                if area > 50:  # Filtrar áreas pequeñas
                    digit_contours.append((x, y, w, h))
            
            print(f"Contornos encontrados: {len(digit_contours)}")
            
            # Si no encontramos exactamente 5 contornos, dividimos la imagen en 5 partes iguales
            if len(digit_contours) != 5:
                print(f"Usando división equitativa: Se encontraron {len(digit_contours)} contornos en lugar de 5")
                digit_width = preprocessed_image.shape[1] // 5
                digit_contours = [(i * digit_width, 0, digit_width, preprocessed_image.shape[0]) for i in range(5)]
            else:
                # Ordenar contornos de izquierda a derecha
                digit_contours.sort(key=lambda x: x[0])
            
            # Extraer cada dígito
            digit_images = []
            for i, (x, y, w, h) in enumerate(digit_contours):
                # Extraer el dígito con un pequeño margen
                digit = preprocessed_image[
                    max(0, y-2):min(preprocessed_image.shape[0], y+h+2),
                    max(0, x-2):min(preprocessed_image.shape[1], x+w+2)
                ]
                
                # Redimensionar a 28x28 (tamaño esperado por el modelo)
                try:
                    digit_resized = cv2.resize(digit, (28, 28))
                    digit_images.append(digit_resized)
                    
                    # Guardar dígito para depuración
                    cv2.imwrite(f"digit_{i}.png", digit_resized)
                except Exception as e:
                    print(f"Error al redimensionar dígito {i}: {e}")
                    # Usar una imagen en blanco si hay error
                    digit_images.append(np.zeros((28, 28), dtype=np.uint8))
            
            print(f"Dígitos segmentados: {len(digit_images)}")
            return digit_images
        except Exception as e:
            print(f"Error al segmentar dígitos: {e}")
            # En caso de error, devolver 5 imágenes en blanco
            return [np.zeros((28, 28), dtype=np.uint8) for _ in range(5)]
    
    def recognize_digits(self, digit_images):
        """
        Reconoce los dígitos segmentados utilizando el modelo entrenado
        
        Args:
            digit_images: Lista de imágenes de dígitos segmentados
            
        Returns:
            Lista de dígitos reconocidos
        """
        print("Reconociendo dígitos...")
        try:
            # Preparar las imágenes para la predicción
            X = np.array(digit_images).reshape(-1, 28, 28, 1).astype('float32') / 255.0
            
            # Realizar la predicción
            predictions = self.model.predict(X)
            
            # Obtener el dígito con mayor probabilidad para cada imagen
            recognized_digits = [np.argmax(pred) for pred in predictions]
            
            print(f"Dígitos reconocidos: {recognized_digits}")
            return recognized_digits
        except Exception as e:
            print(f"Error al reconocer dígitos: {e}")
            return [0, 0, 0, 0, 0]  # Devolver ceros en caso de error
    
    def visualize_results(self, original_image, preprocessed_image, digit_images, recognized_digits):
        """
        Visualiza los resultados del reconocimiento
        
        Args:
            original_image: Imagen original del CAPTCHA
            preprocessed_image: Imagen preprocesada
            digit_images: Lista de imágenes de dígitos segmentados
            recognized_digits: Lista de dígitos reconocidos
        """
        print("Visualizando resultados...")
        try:
            plt.figure(figsize=(15, 10))
            
            # Imagen original
            plt.subplot(3, 1, 1)
            plt.title("Imagen Original")
            if len(original_image.shape) == 3:
                plt.imshow(cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB))
            else:
                plt.imshow(original_image, cmap='gray')
            
            # Imagen preprocesada
            plt.subplot(3, 1, 2)
            plt.title("Imagen Preprocesada")
            plt.imshow(preprocessed_image, cmap='gray')
            
            # Dígitos segmentados y reconocidos
            for i, (digit_img, digit) in enumerate(zip(digit_images, recognized_digits)):
                plt.subplot(3, 5, 11 + i)
                plt.title(f"Dígito {i+1}: {digit}")
                plt.imshow(digit_img, cmap='gray')
                plt.axis('off')
            
            plt.tight_layout()
            plt.savefig("captcha_results.png")
            plt.close()
            
            print("Resultados guardados como 'captcha_results.png'")
            
            # Mostrar el código CAPTCHA reconocido
            captcha_code = ''.join(map(str, recognized_digits))
            print(f"\n=== CÓDIGO CAPTCHA RECONOCIDO: {captcha_code} ===\n")
            
            return captcha_code
        except Exception as e:
            print(f"Error al visualizar resultados: {e}")
            return ''.join(map(str, recognized_digits))
    
    def solve_captcha(self):
        """
        Resuelve el CAPTCHA completo: navega, extrae, procesa y reconoce
        
        Returns:
            Código CAPTCHA reconocido o None si falla
        """
        try:
            # Navegar a la página
            if not self.navigate_to_page():
                return None
            
            # Capturar la imagen del CAPTCHA
            original_image = self.capture_captcha()
            if original_image is None:
                return None
            
            # Preprocesar la imagen
            preprocessed_image = self.preprocess_image(original_image)
            
            # Segmentar los dígitos
            digit_images = self.segment_digits(preprocessed_image)
            
            # Reconocer los dígitos
            recognized_digits = self.recognize_digits(digit_images)
            
            # Visualizar los resultados
            captcha_code = self.visualize_results(
                original_image, preprocessed_image, digit_images, recognized_digits
            )
            
            # Volver al contexto principal del navegador
            try:
                self.driver.switch_to.default_content()
            except:
                pass
            
            return captcha_code
        except Exception as e:
            print(f"Error al resolver el CAPTCHA: {e}")
            return None
    
    def close(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
            print("Navegador cerrado")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Solucionador de CAPTCHA para ADRES')
    parser.add_argument('--model', type=str, default='captcha_model.h5', help='Ruta al modelo entrenado (.h5)')
    parser.add_argument('--url', type=str, default='https://www.adres.gov.co/consulte-su-eps', help='URL de la página de ADRES')
    parser.add_argument('--headless', action='store_true', help='Ejecutar en modo headless (sin interfaz gráfica)')
    parser.add_argument('--close', action='store_true', help='Cerrar el navegador después de resolver el CAPTCHA')
    parser.add_argument('--chromedriver-path', type=str, help='Ruta al ejecutable de ChromeDriver')
    
    args = parser.parse_args()
    
    # Crear el solucionador
    solver = AdresCaptchaSolverIntegrated(
        model_path=args.model,
        url=args.url,
        headless=args.headless,
        chromedriver_path=args.chromedriver_path
    )
    
    # Resolver el CAPTCHA
    captcha_code = solver.solve_captcha()
    
    # Mantener el navegador abierto a menos que se especifique lo contrario
    if not args.close:
        print("\nNavegador mantenido abierto. Presiona Ctrl+C para salir.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nCerrando navegador...")
            solver.close()
    else:
        solver.close()

if __name__ == "__main__":
    main()
