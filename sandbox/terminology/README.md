# Terminology Service – Ontoserver

## Requisitos
- Docker y Docker Compose
- Puerto `8180` libre

## Puesta en marcha
```powershell
cd C:\Users\U\Documents\GitHub\Proyecto_salud\sandbox\terminology
docker compose up -d
```

Endpoints:
- Metadata: <http://localhost:8180/fhir/metadata>
- UI Swagger: <http://localhost:8180/>

## Carga de CodeSystem/ValueSet
- Colocar archivos `.zip` o `.json` en `./config` según la guía de Ontoserver.
- Usar scripts ETL (ver carpeta `scripts/etl`) para publicar códigos.

