# ETL Terminology Service

Scripts para cargar catálogos mínimos en Ontoserver.

## Requisitos
- Node.js 18+
- Ontoserver corriendo en `http://localhost:8180/fhir` (ver `sandbox/terminology/`)
- Dependencia `csv-parse` instalada (se instala en la raíz con `npm install csv-parse`)

## Archivo de datos

Copiar los catálogos oficiales en `backend/terminology-data/` (la carpeta se empaqueta con el backend para que esté disponible en producción):

| Archivo | Fuente sugerida | Columnas relevantes |
|---------|-----------------|---------------------|
| `cie10_colombia.csv` | Clasificación Internacional de Enfermedades (CIE-10). Puede descargarse del portal del Ministerio de Salud / DANE y exportarse a CSV (columnas `Código`, `Descripción`). | Código CIE10, descripción |
| `cum_medicamentos.csv` | Código Único de Medicamentos (CUM) vigentes – datos abiertos: <https://www.datos.gov.co/d/i7cb-raxc> (descarga `rows.csv?accessType=DOWNLOAD`). | `expedientecum` (o `codigo_cum`), `descripcioncomercial`, `atc` |

Los archivos `cie10_subset.csv` y `meds_subset.csv` se mantienen como respaldo para entornos de prueba. El script prioriza los catálogos oficiales si existen. Si sigues usando la ruta legacy `scripts/etl/data/`, el script también la detectará, pero se recomienda mantener los datos en `backend/terminology-data/`.

## Ejecución

```powershell
cd C:\Users\U\Documents\GitHub\Proyecto_salud
node scripts/etl/loadTerminology.js --baseUrl=http://localhost:8180/fhir
```

El proceso crea/actualiza:
- `CodeSystem/cie10-colombia-oficial` + `ValueSet/vs-cie10-colombia-oficial`
- `CodeSystem/invima-colombia-oficial` + `ValueSet/vs-medicamentos-invima-oficial`

Si solo están disponibles los CSV de ejemplo, los identificadores llevan el sufijo `demo`.

