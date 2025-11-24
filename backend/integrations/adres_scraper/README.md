Integración Scraping ADRES (Manual con Captcha)
================================================

Este módulo integra un scraper para consultar afiliación en ADRES (BDUA) utilizando Selenium. 
Los scripts provienen de la carpeta FUNCIONA y requieren resolver el captcha manualmente (o integrar 2Captcha).

Requisitos
----------
- Google Chrome instalado.
- ChromeDriver compatible con su versión de Chrome (en PATH o configurado por el sistema).
- Python 3.9+ instalado.
- Paquetes Python: `selenium`
- (Opcional) Servicio 2Captcha si desea automatizar el captcha (no incluido).

Ubicación
---------
- Carpeta: `backend/integrations/adres_scraper`
- Scripts clave:
  - `modified_demo_scraper.py`: Script de scraping que abre la página, llena el formulario y pide el captcha por consola.
  - `adres_scraper_cli.py`: Wrapper CLI que ejecuta el scraper y devuelve JSON (por consola) y lo guarda en `demo_resultado.json`.

Uso (manual, con captcha)
-------------------------
1) Desde la raíz del backend, ejecute:

```bash
python ./integrations/adres_scraper/adres_scraper_cli.py --doc-type CC --doc-number 1006206595
```

2) Se abrirá Chrome; el script pedirá el captcha por consola. Ingréselo tal como aparece.

3) Al finalizar, obtendrá el resultado en:
- STDOUT (JSON)
- Archivo: `backend/integrations/adres_scraper/demo_resultado.json`

Endpoints añadidos
------------------
- `POST /api/adres-scraper/consultar` 
  - Body JSON: `{ "numero_documento": "1006206595", "tipo_documento": "CC" }`
  - Inicia el scraper en modo interactivo (requiere escribir el captcha en la consola del servidor).
  - Responde inmediatamente con estado 202 y la ruta del archivo de resultado.

- `GET /api/adres-scraper/resultado`
  - Devuelve el JSON del último resultado guardado.

Notas importantes
-----------------
- Esta integración es para entorno local/laboratorio. En servidores no-interactivos (Vercel, Railway, etc.) no es viable por el captcha.
- Si desea automatizar el captcha, integre 2Captcha en `modified_demo_scraper.py` (reemplazando `simulate_2captcha_service`) o utilice un modelo robusto propio.
- Si su Python no está en PATH, defina `PYTHON_EXE` en variables de entorno apuntando a su ejecutable de Python.


