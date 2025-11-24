# Manual Técnico - Proyecto Salud Digital APS

## 1. Introducción

Este documento proporciona una descripción técnica detallada del sistema **Salud Digital APS**. Está dirigido a desarrolladores, administradores de sistemas y personal técnico que necesiten comprender la arquitectura, componentes, flujos de datos y procedimientos de despliegue del proyecto.

## 2. Arquitectura General

El sistema sigue un modelo cliente-servidor:

- **Frontend (Cliente)**: Una Single-Page Application (SPA) desarrollada con **React** y **TypeScript**. Se encarga de toda la interfaz de usuario y la interacción con el profesional de la salud.
- **Backend (Servidor)**: Una API RESTful monolítica construida con **Node.js** y **Express**. Gestiona la lógica de negocio, el acceso a la base de datos y la integración con servicios externos.
- **Base de Datos**: Un único archivo de base de datos **SQLite**, lo que simplifica el despliegue y la portabilidad.
- **Servicios Externos**:
    - **IA (Python)**: Un microservicio implícito ejecutado a través de un `child_process` de Node.js para realizar predicciones de riesgo de ACV.
    - **HAPI FHIR**: Un servidor de interoperabilidad médica estándar, que se espera esté disponible en una URL configurable.
    - **APIs de Terceros**: Conexiones a servicios como ElevenLabs (para TTS/STT) y Apitude (para ADRES).

### Flujo de Datos Típico
1. El usuario interactúa con la interfaz de React.
2. El frontend realiza una llamada a la API REST del backend de Express.
3. El backend procesa la solicitud:
    - Valida la autenticación y los datos de entrada.
    - Ejecuta consultas SQL contra la base de datos SQLite.
    - Si es necesario, llama a un script de Python, al servidor FHIR o a una API externa.
4. El backend retorna una respuesta JSON al frontend.
5. El frontend actualiza la interfaz para mostrar los datos.

## 3. Componentes del Backend (`/backend`)

El backend es el núcleo del sistema y está contenido en el directorio `backend/`.

### 3.1. Archivo Principal (`server.js`)

Este es el punto de entrada y el orquestador principal. Sus responsabilidades incluyen:
- Iniciar el servidor Express y configurar los middlewares (CORS, body-parser).
- Definir **todos** los endpoints de la API.
- Contener la lógica de negocio directamente en las funciones de los endpoints.
- Ejecutar consultas SQL directas (raw queries) a la base de datos SQLite.

### 3.2. API Endpoints Principales

A continuación se describen las rutas más relevantes definidas en `server.js`:

| Método | Ruta                                      | Descripción                                                                                               | Notas de Implementación                                                                                                                                                             |
|--------|-------------------------------------------|-----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POST` | `/api/auth/login`                         | Autentica a un usuario.                                                                                   | **ALERTA DE SEGURIDAD GRAVE**: Este endpoint compara la contraseña enviada en texto plano con el número de documento almacenado en la BD. **NO APTO PARA PRODUCCIÓN**.                 |
| `GET`  | `/api/pacientes`                          | Obtiene la lista de todos los pacientes.                                                                  | Realiza un `SELECT * FROM Pacientes`.                                                                                                                                               |
| `POST` | `/api/pacientes`                          | Crea un nuevo paciente.                                                                                   | Recibe los datos del paciente y ejecuta un `INSERT`.                                                                                                                                |
| `GET`  | `/api/pacientes/consultar-adres/:doc`     | Consulta los datos de un paciente en la BDUA.                                                             | Usa el servicio de Apitude (`adresService.js`). Requiere la `APITUDE_API_KEY`. Si no está configurada, devuelve un error controlado.                                                  |
| `POST` | `/api/ai/predict/stroke`                  | Predice el riesgo de ACV de un paciente.                                                                  | Llama al servicio `aiService.js`, que a su vez ejecuta el script `predict_stroke.py`. Requiere un entorno Python válido con `scikit-learn` y `numpy`.                               |
| `GET`  | `/api/terminology/cie10`                  | Busca códigos de diagnóstico CIE-10.                                                                      | **FUNCIONALIDAD DESHABILITADA**: El servicio `terminologyLocal.js` está implementado para devolver siempre un array vacío. No realiza ninguna búsqueda real.                            |
| `POST` | `/api/fhir/patient`                       | Crea un recurso de Paciente en el servidor FHIR.                                                          | Utiliza `fhirClient.js` para enviar una solicitud `POST` al `FHIR_BASE_URL` configurado. Requiere que el servidor FHIR esté activo y accesible.                                         |
| `POST` | `/api/tts`                                | Convierte texto a voz.                                                                                    | Llama a la API de ElevenLabs. Requiere `ELEVENLABS_API_KEY`.                                                                                                                        |
| `POST` | `/api/stt`                                | Convierte voz a texto.                                                                                    | Recibe un archivo de audio y lo envía a la API de ElevenLabs. Requiere `ELEVENLABS_API_KEY`.                                                                                         |

### 3.3. Servicios (`/services`)

- `aiService.js`: Lógica para validar y ejecutar el script de Python `predict_stroke.py`.
- `adresService.js`: Lógica para realizar llamadas a la API de Apitude para consultar ADRES.
- `fhirClient.js`: Cliente HTTP para interactuar con el servidor HAPI FHIR. Construye y envía los recursos FHIR.
- `terminologyLocal.js`: Implementación "placeholder" para la búsqueda de terminología. **Actualmente no funcional.**

### 3.4. Base de Datos (`/database`)

- **Motor**: SQLite.
- **Archivo**: `salud_digital_aps.db` (configurable en `.env`).
- **Scripts de Creación**: El directorio `backend/database` contiene múltiples scripts `.js` y `.sql` que documentan la evolución del esquema. `create_tables_correct.sql` es una referencia clave para el esquema final.
- **Esquema Clave**:
    - `Usuarios`: Almacena las credenciales y datos de los profesionales. La contraseña **no está hasheada**.
    - `Roles`: Define los perfiles del sistema (Médico, Psicólogo, etc.).
    - `Pacientes` y `Familias`: Corazón de la gestión de personas.
    - `Atenciones_Clinicas`: Tabla "Hub" que centraliza los diferentes tipos de atención.
    - `HC_*`: Tablas "Spoke" para cada especialidad, con campos específicos.
    - `Recetas_Medicas`, `Ordenes_Laboratorio`: Registros de salida generados durante una atención.

## 4. Componentes del Frontend (`/src`)

El frontend es una aplicación React moderna y bien estructurada.

- **Punto de Entrada**: `main.tsx`.
- **Componente Principal**: `App.tsx`, donde se definen las rutas de la aplicación.
- **Estructura de Directorios**:
    - `components/`: Componentes de UI reutilizables (botones, inputs, modales).
    - `pages/` o `views/` (implícito): Componentes que representan páginas completas (ej. Dashboard, Vista de Paciente).
    - `services/`: Lógica para realizar llamadas a la API del backend. Se recomienda usar `fetch` o `axios`.
    - `hooks/`: Hooks personalizados de React para manejar lógica de estado compleja.
    - `types/`: Definiciones de tipos de TypeScript para los objetos de datos (Paciente, Usuario, etc.).
    - `config/`: Configuración del frontend, como la URL base de la API.

## 5. Proceso de Despliegue

### Entorno de Desarrollo
- Seguir las instrucciones del `README.md`.
- Es crucial tener todos los servicios dependientes (HAPI FHIR, entorno Python) y las claves de API configuradas para una funcionalidad completa.

### Entorno de Producción (Recomendaciones)

**¡ADVERTENCIA!** El sistema **no está listo para producción** debido a las vulnerabilidades de seguridad.

Si se resolviera el problema de autenticación, los pasos para un despliegue serían:

1.  **Backend**:
    - Desplegar la aplicación Node.js en un servicio como **Render** o **Railway** (existe un `railway.toml`).
    - La base de datos SQLite debería ser persistida en un volumen de disco.
    - Configurar todas las variables de entorno (`DB_PATH`, `FHIR_BASE_URL`, claves de API) en el panel del proveedor de hosting.

2.  **Frontend**:
    - Generar el build de producción: `npm run build`.
    - Desplegar los archivos estáticos generados en el directorio `dist/` en un servicio como **Vercel**, **Netlify** o un bucket de S3.
    - Configurar la variable de entorno `VITE_API_URL` (o similar) en el proceso de build para que apunte a la URL del backend desplegado.

3.  **Dependencia de Python**:
    - El entorno de producción del backend debe tener acceso a un intérprete de Python con las librerías requeridas. Algunos PaaS permiten especificar dependencias de sistema. Alternativamente, el servicio de IA podría ser extraído a una función serverless (ej. AWS Lambda) con un runtime de Python.
