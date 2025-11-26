# Proyecto Salud Digital APS

## Acceso a la App (Producción)
Frontend:
https://proyectosalud8.vercel.app/


Backend:
https://proyecto-salud-digital-2.onrender.com/

## Cuentas demo:
👨‍⚕️ MÉDICO
   Email: medico1@saludigital.edu.co
   Password: 1000000001

🧠 PSICÓLOGO
   Email: psicologo@salud.com
   Password: psic123

👩‍⚕️ AUXILIAR DE ENFERMERÍA
   Email: auxiliar@salud.com
   Password: aux123

🛡️ ENFERMERO JEFE
   Email: enfermerojefe@salud.com
   Password: 11223344

🏋🏻‍♀️FISIOTERAPEUTA
Email: fisioterapeuta@salud.com
Password: 900000001

🥜NUTRICIONISTA 
Email: nutricionista@salud.com
Password: nutri123

🦻🏻FONOAUDIOLOGO
Email: fonoaudiologo@salud.com
Password: fono123/900000003

🦷ODONTOLOGO
Email: odontologo@salud.com
Password: odonto123/900000004



## 📋 Descripción General

**Salud Digital APS** es un sistema de gestión integral para programas de Atención Primaria en Salud (APS). Su objetivo es optimizar el registro de información clínica y administrativa, facilitar la gestión de pacientes y familias, y proveer herramientas de apoyo para los profesionales de la salud.

El sistema cuenta con una arquitectura de aplicación web moderna, con un frontend desarrollado en **React/TypeScript** y un backend en **Node.js/Express** que se conecta a una base de datos **SQLite**.

## ✨ Características Principales

- **Gestión de Roles de Usuario**: Perfiles para Médico, Psicólogo, Enfermero, Fisioterapeuta, etc.
- **Historia Clínica Digital**: Módulos específicos por especialidad (Medicina General, Psicología).
- **Gestión de Pacientes y Familias**: Registro y seguimiento de datos demográficos y de cuidado.
- **Apoyo a Decisiones Clínicas**:
  - **Predicción de ACV**: Integración con un modelo de IA (Python/Scikit-learn) para predecir el riesgo de accidente cerebrovascular.
  - **Interoperabilidad FHIR**: Capacidad de conectarse a servidores FHIR (Fast Healthcare Interoperability Resources) para el intercambio de datos estándar.
- **Funcionalidades Multimedia**:
  - **Text-to-Speech (TTS)** y **Speech-to-Text (STT)** a través de la API de ElevenLabs.
- **Consulta de Afiliados**: Integración con el servicio de ADRES/BDUA (Base de Datos Única de Afiliados) a través de Apitude.

---

## 🔧 Arquitectura y Tecnologías

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite
- **Integraciones de IA**:
  - Modelo de predicción de ACV en Python (`sklearn`, `numpy`).
  - Servicios de ElevenLabs para TTS/STT.
- **Interoperabilidad**: Soporte para HL7 FHIR.

---

## ⚙️ Configuración y Puesta en Marcha

### **Requisitos Previos**

- **Node.js** (v18 o superior)
- **npm** (o un gestor de paquetes equivalente)
- **Python** (v3.x) con las librerías `scikit-learn` y `numpy`.
- **Servidor FHIR** (opcional): El sistema usa HAPI FHIR público por defecto (`https://hapi.fhir.org/baseR4`), no requiere configuración adicional. Para desarrollo local, puede usar Docker con la configuración en `sandbox/hapi-fhir/`.

### **1. Configuración del Backend**

a. **Navegue al directorio del backend:**
   ```bash
   cd backend
   ```

b. **Instale las dependencias de Node.js:**
   ```bash
   npm install
   ```

c. **Cree el archivo de variables de entorno:**
   Cree un archivo `.env` en el directorio `backend/` y agregue las siguientes variables.

   ```env
   # Ruta a la base de datos SQLite
   DB_PATH=./salud_digital_aps.db

   # URL del servidor FHIR
   # Opción 1: HAPI FHIR público (recomendado para estudiantes, no requiere configuración)
   FHIR_BASE_URL=https://hapi.fhir.org/baseR4
   # Opción 2: HAPI FHIR local (requiere Docker)
   # FHIR_BASE_URL=http://localhost:8080/hapi-fhir-jpaserver/fhir

   # --- Claves de API (Opcionales) ---

   # Speech-to-Text: Whisper local (GRATUITO, sin límites) - RECOMENDADO
   # No requiere configuración adicional, funciona automáticamente
   STT_DEFAULT_PROVIDER=whisper
   WHISPER_MODEL=base  # Opciones: tiny, base, small, medium, large (base recomendado)

   # API Key de ElevenLabs (opcional, alternativa a Whisper)
   ELEVENLABS_API_KEY=tu_api_key_de_elevenlabs

   # Hugging Face (opcional, no funciona en plan gratuito)
   # HF_API_TOKEN=tu_token_de_huggingface
   # HF_STT_MODEL=openai/whisper-small
   # STT_DEFAULT_PROVIDER=huggingface

   # API Key de Apitude para consultar ADRES/BDUA
   # Obtenga su clave en: https://apitude.co
   APITUDE_API_KEY=tu_api_key_de_apitude
   ```

d. **Inicie el servidor de backend:**
   ```bash
   npm run dev
   ```
   El servidor se ejecutará en `http://localhost:3001`.

### **2. Configuración del Frontend**

a. **Navegue al directorio raíz del proyecto.**

b. **Instale las dependencias del frontend:**
   ```bash
   npm install
   ```

c. **Inicie la aplicación de React:**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

d. **Variables opcionales (.env.local):**
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_DEFAULT_STT_PROVIDER=huggingface
   VITE_ENABLE_TTS=true
   ```
   Con estas variables puedes elegir el proveedor de STT predeterminado (Hugging Face vs ElevenLabs) y habilitar/deshabilitar TTS.

### **3. Configuración del Entorno de IA (Python)**

a. **Asegúrese de tener Python 3.8+ instalado.**

b. **Instale las dependencias necesarias:**
   ```bash
   # Dependencias para IA/ML
   pip install scikit-learn numpy
   
   # Dependencias para Whisper (STT local gratuito)
   cd backend/integrations/whisper_stt
   pip install -r requirements.txt
   cd ../../..
   ```
   
   **Nota sobre Whisper:**
   - Whisper se descarga automáticamente la primera vez que se usa (modelo `base` ~74 MB)
   - Los modelos se guardan en `~/.cache/whisper/`
   - El `aiService.js` del backend buscará un ejecutable de Python y validará que estas librerías estén disponibles

---

## ⚠️ Puntos Importantes y Advertencias

- **Seguridad de Autenticación**: La versión actual del endpoint de login (`/api/auth/login`) es **insegura**. Compara contraseñas en texto plano. Se recomienda encarecidamente no utilizar este sistema en producción sin una refactorización completa del sistema de autenticación para usar hashes de contraseña (ej. `bcrypt`).
- **Búsqueda de Terminología Médica**: La funcionalidad de búsqueda de códigos CIE-10 (`/api/terminology/cie10`) está actualmente **deshabilitada** en el backend (`terminologyLocal.js`) y devuelve resultados vacíos.

---

## 🗄️ Estructura de la Base de Datos

La base de datos SQLite (`salud_digital_aps.db`) sigue un modelo relacional para almacenar toda la información del sistema. Las tablas principales incluyen:

- `Usuarios`, `Roles`, `Pacientes`, `Familias`
- `Atenciones_Clinicas` (como Hub central)
- Historias Clínicas por especialidad (ej. `HC_Medicina_General`, `HC_Psicologia`)
- `Planes_Cuidado_Familiar` y `Demandas_Inducidas`
- `Recetas_Medicas` y `Ordenes_Laboratorio`

Para un esquema detallado, consulte los scripts de creación en `backend/database/`.
