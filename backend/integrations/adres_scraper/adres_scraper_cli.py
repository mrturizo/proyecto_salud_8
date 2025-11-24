#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
CLI para ejecutar el scraper de ADRES y devolver el resultado como JSON.
Utiliza el script `modified_demo_scraper.py` y guarda el resultado en
`demo_resultado.json` en el mismo directorio.

Uso:
  python adres_scraper_cli.py --doc-type CC --doc-number 1006206595 [--headless]
"""

import os
import sys
import json
import argparse

# Permitir imports relativos desde el mismo directorio
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

try:
    import modified_demo_scraper as scraper
except Exception as e:
    print(json.dumps({
        "status": "error",
        "message": "No se pudo importar el scraper",
        "error": str(e)
    }, ensure_ascii=False))
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="ADRES scraper CLI (manual captcha)")
    parser.add_argument("--doc-type", required=True, help="Tipo de documento (CC, TI, CE, etc.)")
    parser.add_argument("--doc-number", required=True, help="Número de documento")
    parser.add_argument("--headless", action="store_true", help="Ejecutar navegador en modo headless")
    args = parser.parse_args()

    result = scraper.demo_adres_consulta(args.doc_type, args.doc_number, headless=args.headless)
    # Imprimir a stdout
    print(json.dumps(result, ensure_ascii=False))

    # Guardar a archivo
    out_path = os.path.join(SCRIPT_DIR, "demo_resultado.json")
    try:
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
    except Exception:
        # No es fatal si no puede escribir
        pass

if __name__ == "__main__":
    main()


