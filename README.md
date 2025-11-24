# Proyecto Salud Digital APS

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
- Un servidor **HAPI FHIR** en ejecución (para la funcionalidad de interoperabilidad). Puede usar la configuración de Docker en `sandbox/hapi-fhir/`.

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

   # URL del servidor FHIR (usar el de HAPI FHIR si se ejecuta localmente)
   FHIR_BASE_URL=http://localhost:8080/fhir

   # --- Claves de API (Opcionales pero recomendadas) ---

   # API Key de ElevenLabs para las funciones de Speech-to-Text y Text-to-Speech
   ELEVENLABS_API_KEY=tu_api_key_de_elevenlabs

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

### **3. Configuración del Entorno de IA (Python)**

a. **Asegúrese de tener Python instalado.**

b. **Instale las dependencias necesarias:**
   ```bash
   pip install scikit-learn numpy
   ```
   El `aiService.js` del backend buscará un ejecutable de Python y validará que estas librerías estén disponibles para usar el endpoint de predicción.

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