# Sandbox HL7 FHIR (HAPI)

## Requisitos

- Docker y Docker Compose instalados.
- Puertos `8080` libres en la máquina local.
- `curl` o herramienta equivalente para realizar llamadas HTTP.

## Puesta en marcha

```powershell
cd C:\Users\U\Documents\GitHub\Proyecto_salud\sandbox\hapi-fhir
docker compose up -d
```

El servidor quedará disponible en: <http://localhost:8080/hapi-fhir-jpaserver/fhir>.

### Verificar estado

```powershell
curl http://localhost:8080/hapi-fhir-jpaserver/fhir/metadata
```

Debería retornar un recurso `CapabilityStatement`.

## Carga de recursos de ejemplo

```powershell
curl -X POST ^
  -H "Content-Type: application/fhir+json" ^
  -d @examples/patient-example.json ^
  http://localhost:8080/hapi-fhir-jpaserver/fhir/Patient

curl -X POST ^
  -H "Content-Type: application/fhir+json" ^
  -d @examples/condition-example.json ^
  http://localhost:8080/hapi-fhir-jpaserver/fhir/Condition

curl -X POST ^
  -H "Content-Type: application/fhir+json" ^
  -d @examples/medication-example.json ^
  http://localhost:8080/hapi-fhir-jpaserver/fhir/Medication
```

> También se puede usar la utilidad “FHIR Tester UI” disponible en <http://localhost:8080/>.

## Limpieza

```powershell
docker compose down
```

Para eliminar datos persistidos:

```powershell
docker compose down -v
```

