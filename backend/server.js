// backend/server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const multer = require('multer');
const adresService = require('./services/adresService');
const adresScraper = require('./services/adresScraperService');
const terminologyClient = require('./services/terminologyClient');
const fhirClient = require('./services/fhirClient');
const aiService = require('./services/aiService');
const sttProviders = require('./services/sttProviders');
require('dotenv').config();

// Verificar carga de claves sensibles sin exponerlas completas
const elevenKey = process.env.ELEVENLABS_API_KEY || '';
if (elevenKey) {
  const masked = `${elevenKey.slice(0, 6)}***${elevenKey.slice(-4)}`;
  console.log('🔐 ELEVENLABS_API_KEY cargada:', masked);
} else {
  console.warn('⚠️ ELEVENLABS_API_KEY NO está configurada en este entorno');
}

// ✅ PRIMERO DECLARAR app
const app = express();

// 🔧 CONFIGURACIÓN CORS TEMPORAL - PERMITIR TODOS LOS ORIGENS
app.use(cors({
  origin: true, // Permitir cualquier origen
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}));

// También agregar headers manualmente por si acaso
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Bypass-Tunnel-Reminder');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
// Servir archivos estáticos desde /public para poder exponer el mp3 si se desea
app.use(express.static(path.join(__dirname, 'public')));
const upload = multer({ dest: path.join(__dirname, 'uploads') });

// Conectar a SQLite (usa la ruta correcta de tu BD)
// En Render, intentamos usar un volumen persistente si está disponible
console.log('🔧 Iniciando configuración de base de datos...');
const sourceDbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const tmpDbPath = '/tmp/salud_digital_aps.db';
// Ruta persistente en Render (si tienes volumen montado)
const persistentDbPath = process.env.DB_PATH || path.join(process.env.HOME || '/opt/render', 'persistent', 'salud_digital_aps.db');

console.log('📍 Ruta fuente:', sourceDbPath);
console.log('📍 Ruta temporal:', tmpDbPath);
console.log('📍 Ruta persistente:', persistentDbPath);
console.log('📍 __dirname:', __dirname);

// Función para verificar permisos de escritura
function verificarPermisosEscritura(ruta) {
  try {
    const testFile = path.join(ruta, '.test_write_permission');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return { tienePermisos: true, error: null };
  } catch (err) {
    return { tienePermisos: false, error: err.message };
  }
}

// Verificar permisos en diferentes rutas
console.log('\n🔐 Verificando permisos de escritura...');
const rutasAVerificar = [
  { nombre: 'Fuente (database/)', ruta: path.dirname(sourceDbPath) },
  { nombre: '/tmp', ruta: '/tmp' },
  { nombre: 'Persistente (DB_PATH)', ruta: process.env.DB_PATH ? path.dirname(persistentDbPath) : null },
  { nombre: 'HOME/persistent', ruta: path.join(process.env.HOME || '/opt/render', 'persistent') },
  { nombre: '__dirname', ruta: __dirname }
];

rutasAVerificar.forEach(({ nombre, ruta }) => {
  if (!ruta) {
    console.log(`  ⏭️  ${nombre}: No configurado`);
    return;
  }
  
  // Verificar si el directorio existe
  const existe = fs.existsSync(ruta);
  console.log(`  📁 ${nombre}: ${existe ? '✅ Existe' : '❌ No existe'}`);
  
  if (existe) {
    const permisos = verificarPermisosEscritura(ruta);
    if (permisos.tienePermisos) {
      console.log(`     ✍️  Permisos de escritura: ✅ SÍ`);
    } else {
      console.log(`     ✍️  Permisos de escritura: ❌ NO (${permisos.error})`);
    }
  } else {
    // Intentar crear el directorio
    try {
      fs.mkdirSync(ruta, { recursive: true });
      console.log(`     📝 Directorio creado`);
      const permisos = verificarPermisosEscritura(ruta);
      if (permisos.tienePermisos) {
        console.log(`     ✍️  Permisos de escritura: ✅ SÍ`);
      } else {
        console.log(`     ✍️  Permisos de escritura: ❌ NO (${permisos.error})`);
      }
    } catch (err) {
      console.log(`     ❌ No se pudo crear: ${err.message}`);
    }
  }
});

console.log(''); // Línea en blanco
  
// Determinar qué ruta usar
// Prioridad: 1) DB_PATH (persistente), 2) /tmp (temporal), 3) fuente
let dbPath = null;

console.log('🔍 Verificando archivos...');
const sourceExists = fs.existsSync(sourceDbPath);
const tmpExists = fs.existsSync(tmpDbPath);
const persistentExists = fs.existsSync(persistentDbPath);

console.log('🔍 Archivo fuente existe:', sourceExists);
console.log('🔍 Archivo en /tmp existe:', tmpExists);
console.log('🔍 Archivo persistente existe:', persistentExists);

// Crear directorio persistente si no existe
if (process.env.DB_PATH) {
  const persistentDir = path.dirname(persistentDbPath);
  if (!fs.existsSync(persistentDir)) {
    try {
      fs.mkdirSync(persistentDir, { recursive: true });
      console.log('✅ Directorio persistente creado:', persistentDir);
    } catch (err) {
      console.warn('⚠️  No se pudo crear directorio persistente:', err.message);
    }
  }
}

// Prioridad 1: Usar ruta persistente si está configurada y existe
if (process.env.DB_PATH && persistentExists) {
  console.log('✅ Usando base de datos persistente:', persistentDbPath);
  dbPath = persistentDbPath;
}
// Prioridad 2: Si hay persistente configurado pero no existe, copiar desde fuente
else if (process.env.DB_PATH && sourceExists && !persistentExists) {
  console.log('📋 Copiando base de datos a ruta persistente...');
  try {
    fs.copyFileSync(sourceDbPath, persistentDbPath);
    console.log('✅ Base de datos copiada a ruta persistente');
    dbPath = persistentDbPath;
  } catch (err) {
    console.error('❌ Error copiando a persistente:', err.message);
    console.log('⚠️  Fallback a /tmp');
    // Continuar con lógica de /tmp
    if (sourceExists && !tmpExists) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log('✅ Base de datos copiada a /tmp');
        dbPath = tmpDbPath;
      } catch (err2) {
        console.error('❌ Error copiando a /tmp:', err2.message);
        dbPath = sourceDbPath;
      }
    } else if (tmpExists) {
      dbPath = tmpDbPath;
    } else {
      dbPath = sourceDbPath;
    }
  }
}
// Prioridad 3: Usar /tmp si existe (compatibilidad con despliegues anteriores)
else if (tmpExists) {
  console.log('⚠️  Usando base de datos en /tmp (temporal - se perderá en el próximo despliegue)');
  console.log('💡 Recomendación: Configura DB_PATH en Render para persistencia');
  dbPath = tmpDbPath;
}
// Prioridad 4: Copiar desde fuente a /tmp si no existe
else if (sourceExists && !tmpExists) {
  console.log('📋 Copiando base de datos de', sourceDbPath, 'a', tmpDbPath);
  try {
    fs.copyFileSync(sourceDbPath, tmpDbPath);
    console.log('✅ Base de datos copiada exitosamente a /tmp');
    console.log('⚠️  ADVERTENCIA: /tmp es temporal. Los datos se perderán en el próximo despliegue.');
    console.log('💡 Para persistencia, configura DB_PATH en Render (ej: /opt/render/persistent/salud_digital_aps.db)');
    dbPath = tmpDbPath;
  } catch (err) {
    console.error('❌ Error copiando BD a /tmp:', err.message);
    console.log('⚠️  Intentando usar ruta original como fallback');
    dbPath = sourceDbPath;
  }
}
// Prioridad 5: Usar fuente directamente
else if (sourceExists) {
  console.log('⚠️  Usando archivo fuente directamente');
  dbPath = sourceDbPath;
}
// Último recurso: crear en /tmp
else {
  console.log('⚠️  Ningún archivo encontrado, usando /tmp (se creará vacío)');
  console.log('⚠️  ADVERTENCIA: Los datos en /tmp se perderán en el próximo despliegue');
  dbPath = tmpDbPath;
}

console.log('📊 Base de datos final: ', dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a SQLite:', err.message);
  } else {
    console.log('✅ Conectado exitosamente a la base de datos SQLite');
  }
});
// ==================== ENDPOINTS DE AUTENTICACIÓN ====================

// Login de usuarios
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', email);
  
  const query = `
    SELECT 
      u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
      r.nombre_rol, r.rol_id
    FROM Usuarios u 
    JOIN Roles r ON u.rol_id = r.rol_id 
    WHERE lower(u.email) = lower(?)
  `;
  
  db.get(query, [email], async (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (!row) {
      // Intentar autoprov para fisioterapeuta, nutricionista, fonoaudiólogo u odontólogo
      row = await ensureFisioUser(email);
      if (!row) row = await ensureNutriUser(email);
      if (!row) row = await ensureFonoUser(email);
      if (!row) row = await ensureOdontoUser(email);
      if (!row) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    // Verificación: documento o clave temporal específica para fisioterapeuta
    const isFisioTemp = String(email).toLowerCase() === 'fisioterapeuta@salud.com' && String(password) === 'fisio123';
    const isNutriTemp = String(email).toLowerCase() === 'nutricionista@salud.com' && String(password) === 'nutri123';
    const isFonoTemp  = String(email).toLowerCase() === 'fonoaudiologo@salud.com' && String(password) === 'fono123';
    const isOdontoTemp= String(email).toLowerCase() === 'odontologo@salud.com' && String(password) === 'odonto123';
    const isDocMatch = String(password) === String(row.numero_documento);
    if (!(isDocMatch || isFisioTemp || isNutriTemp || isFonoTemp || isOdontoTemp)) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    console.log('Login successful for:', row.nombre_completo);
    res.json({ 
      success: true, 
      user: {
        id: row.usuario_id,
        name: row.nombre_completo,
        email: row.email,
        role: row.nombre_rol,
        roleId: row.rol_id,
        team: null,
        document: row.numero_documento
      }
    });
  });
});

// Helper: asegurar usuario Fisioterapeuta de prueba
async function ensureFisioUser(email) {
  return new Promise((resolve) => {
    const emailNorm = String(email).trim().toLowerCase();
    if (emailNorm !== 'fisioterapeuta@salud.com') return resolve(null);

    // 1) Asegurar rol Fisioterapeuta
    db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Fisioterapeuta')", [], (e1, roleRow) => {
      const ensureRole = (cb) => {
        if (roleRow && roleRow.rol_id) return cb(roleRow.rol_id);
        db.run("INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Fisioterapeuta')", [], function() {
          db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Fisioterapeuta')", [], (_e2, r2) => cb(r2?.rol_id || 0));
        });
      };

      ensureRole((rolId) => {
        // 2) Insertar usuario si no existe
        db.run(
          `INSERT OR IGNORE INTO Usuarios (nombre_completo,email,numero_documento,telefono,rol_id,activo) VALUES (?,?,?,?,?,1)`,
          ['Fisioterapeuta Demo','fisioterapeuta@salud.com','900000001','3000000001',rolId],
          () => {
            // 3) Devolver fila completa
            db.get(
              `SELECT u.usuario_id, u.nombre_completo, u.email, u.numero_documento, r.nombre_rol, r.rol_id
               FROM Usuarios u JOIN Roles r ON u.rol_id=r.rol_id WHERE lower(u.email)=lower(?)`,
              ['fisioterapeuta@salud.com'],
              (_e3, row) => resolve(row || null)
            );
          }
        );
      });
    });
  });
}

// Helper: asegurar usuario Nutricionista de prueba
async function ensureNutriUser(email) {
  return new Promise((resolve) => {
    const emailNorm = String(email).trim().toLowerCase();
    if (emailNorm !== 'nutricionista@salud.com') return resolve(null);

    // 1) Asegurar rol Nutricionista
    db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Nutricionista')", [], (e1, roleRow) => {
      const ensureRole = (cb) => {
        if (roleRow && roleRow.rol_id) return cb(roleRow.rol_id);
        db.run("INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Nutricionista')", [], function() {
          db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Nutricionista')", [], (_e2, r2) => cb(r2?.rol_id || 0));
        });
      };

      ensureRole((rolId) => {
        // 2) Insertar usuario si no existe
        db.run(
          `INSERT OR IGNORE INTO Usuarios (nombre_completo,email,numero_documento,telefono,rol_id,activo) VALUES (?,?,?,?,?,1)`,
          ['Nutricionista Demo','nutricionista@salud.com','900000002','3000000002',rolId],
          () => {
            // 3) Devolver fila completa
            db.get(
              `SELECT u.usuario_id, u.nombre_completo, u.email, u.numero_documento, r.nombre_rol, r.rol_id
               FROM Usuarios u JOIN Roles r ON u.rol_id=r.rol_id WHERE lower(u.email)=lower(?)`,
              ['nutricionista@salud.com'],
              (_e3, row) => resolve(row || null)
            );
          }
        );
      });
    });
  });
}

// Helper: asegurar usuario Fonoaudiólogo de prueba
async function ensureFonoUser(email) {
  return new Promise((resolve) => {
    const emailNorm = String(email).trim().toLowerCase();
    if (emailNorm !== 'fonoaudiologo@salud.com') return resolve(null);

    db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Fonoaudiólogo')", [], (e1, roleRow) => {
      const ensureRole = (cb) => {
        if (roleRow && roleRow.rol_id) return cb(roleRow.rol_id);
        db.run("INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Fonoaudiólogo')", [], function() {
          db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Fonoaudiólogo')", [], (_e2, r2) => cb(r2?.rol_id || 0));
        });
      };

      ensureRole((rolId) => {
        db.run(
          `INSERT OR IGNORE INTO Usuarios (nombre_completo,email,numero_documento,telefono,rol_id,activo) VALUES (?,?,?,?,?,1)`,
          ['Fonoaudiólogo Demo','fonoaudiologo@salud.com','900000003','3000000003',rolId],
          () => {
            db.get(
              `SELECT u.usuario_id, u.nombre_completo, u.email, u.numero_documento, r.nombre_rol, r.rol_id
               FROM Usuarios u JOIN Roles r ON u.rol_id=r.rol_id WHERE lower(u.email)=lower(?)`,
              ['fonoaudiologo@salud.com'],
              (_e3, row) => resolve(row || null)
            );
          }
        );
      });
    });
  });
}

// Helper: asegurar usuario Odontólogo de prueba
async function ensureOdontoUser(email) {
  return new Promise((resolve) => {
    const emailNorm = String(email).trim().toLowerCase();
    if (emailNorm !== 'odontologo@salud.com') return resolve(null);

    db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Odontólogo')", [], (e1, roleRow) => {
      const ensureRole = (cb) => {
        if (roleRow && roleRow.rol_id) return cb(roleRow.rol_id);
        db.run("INSERT OR IGNORE INTO Roles (nombre_rol) VALUES ('Odontólogo')", [], function() {
          db.get("SELECT rol_id FROM Roles WHERE lower(nombre_rol)=lower('Odontólogo')", [], (_e2, r2) => cb(r2?.rol_id || 0));
        });
      };

      ensureRole((rolId) => {
        db.run(
          `INSERT OR IGNORE INTO Usuarios (nombre_completo,email,numero_documento,telefono,rol_id,activo) VALUES (?,?,?,?,?,1)`,
          ['Odontólogo Demo','odontologo@salud.com','900000004','3000000004',rolId],
          () => {
            db.get(
              `SELECT u.usuario_id, u.nombre_completo, u.email, u.numero_documento, r.nombre_rol, r.rol_id
               FROM Usuarios u JOIN Roles r ON u.rol_id=r.rol_id WHERE lower(u.email)=lower(?)`,
              ['odontologo@salud.com'],
              (_e3, row) => resolve(row || null)
            );
          }
        );
      });
    });
  });
}

// ==================== ENDPOINTS DE DATOS ====================

// Obtener todas las familias (con conteo de integrantes)
app.get('/api/familias', (req, res) => {
  const query = `
    SELECT 
      f.familia_id, f.apellido_principal, f.direccion, 
      f.barrio_vereda, f.municipio, f.telefono_contacto,
      u.nombre_completo as creado_por,
      (
        SELECT COUNT(1) FROM Pacientes p
        WHERE p.familia_id = f.familia_id AND p.activo = 1
      ) AS integrantes_count
    FROM Familias f 
    JOIN Usuarios u ON f.creado_por_uid = u.usuario_id
    ORDER BY f.apellido_principal
  `;
  
  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Obtener una familia por ID
app.get('/api/familias/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      f.familia_id, f.apellido_principal, f.direccion, 
      f.barrio_vereda, f.municipio, f.telefono_contacto,
      u.nombre_completo as creado_por
    FROM Familias f 
    LEFT JOIN Usuarios u ON f.creado_por_uid = u.usuario_id
    WHERE f.familia_id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Error obteniendo familia:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Familia no encontrada' });
    }
    res.json(row);
  });
});

// Obtener pacientes por familia
app.get('/api/familias/:id/pacientes', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      paciente_id, numero_documento, tipo_documento,
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      fecha_nacimiento, genero, telefono, email
    FROM Pacientes 
    WHERE familia_id = ? AND activo = 1
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Búsqueda de pacientes por documento, nombre o familia
app.get('/api/pacientes/buscar', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido (q)' });
  }
  
  const searchTerm = `%${q.trim()}%`;
  
  const query = `
    SELECT 
      p.paciente_id,
      p.numero_documento,
      p.tipo_documento,
      p.primer_nombre,
      p.segundo_nombre,
      p.primer_apellido,
      p.segundo_apellido,
      p.fecha_nacimiento,
      p.genero,
      p.telefono,
      p.email,
      f.familia_id,
      f.apellido_principal as familia_apellido,
      f.municipio as familia_municipio
    FROM Pacientes p
    JOIN Familias f ON p.familia_id = f.familia_id
    WHERE p.activo = 1 AND (
      p.numero_documento LIKE ? OR
      p.primer_nombre LIKE ? OR
      p.segundo_nombre LIKE ? OR
      p.primer_apellido LIKE ? OR
      p.segundo_apellido LIKE ? OR
      f.apellido_principal LIKE ?
    )
    ORDER BY p.primer_apellido, p.primer_nombre
    LIMIT 50
  `;
  
  db.all(query, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error('Error en búsqueda de pacientes:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json(rows);
  });
});

// Crear un nuevo paciente vinculado a una familia
app.post('/api/pacientes', (req, res) => {
  const {
    familia_id,
    numero_documento,
    tipo_documento,
    primer_nombre,
    segundo_nombre,
    primer_apellido,
    segundo_apellido,
    fecha_nacimiento,
    genero,
    telefono,
    email
  } = req.body || {};

  if (!familia_id || !primer_nombre || !primer_apellido || !tipo_documento || !numero_documento) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: familia_id, tipo_documento, numero_documento, primer_nombre, primer_apellido'
    });
  }

  const insert = `
    INSERT INTO Pacientes (
      familia_id, numero_documento, tipo_documento,
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      fecha_nacimiento, genero, telefono, email, activo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const params = [
    familia_id, numero_documento, tipo_documento,
    primer_nombre, segundo_nombre || null, primer_apellido, segundo_apellido || null,
    fecha_nacimiento || null, genero || null, telefono || null, email || null
  ];

  db.run(insert, params, function(err) {
    if (err) {
      console.error('Error insertando paciente:', err);
      return res.status(500).json({ error: 'No se pudo crear el paciente' });
    }
    const createdId = this.lastID;
    db.get(
      `SELECT paciente_id, familia_id, numero_documento, tipo_documento,
              primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
              fecha_nacimiento, genero, telefono, email
       FROM Pacientes WHERE paciente_id = ?`,
      [createdId],
      (err2, row) => {
        if (err2) return res.status(201).json({ paciente_id: createdId, familia_id });
        res.status(201).json(row);
      }
    );
  });
});

// Crear una nueva familia
app.post('/api/familias', (req, res) => {
  const {
    apellido_principal,
    direccion,
    barrio_vereda,
    municipio,
    telefono_contacto,
    creado_por_uid
  } = req.body || {};

  if (!apellido_principal || !direccion || !municipio || !creado_por_uid) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: apellido_principal, direccion, municipio, creado_por_uid'
    });
  }

  const insert = `
    INSERT INTO Familias (apellido_principal, direccion, barrio_vereda, municipio, telefono_contacto, creado_por_uid)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    insert,
    [apellido_principal, direccion, barrio_vereda || null, municipio, telefono_contacto || null, creado_por_uid],
    function (err) {
      if (err) {
        console.error('Error insertando familia:', err);
        return res.status(500).json({ error: 'No se pudo crear la familia' });
      }
      const createdId = this.lastID;
      db.get(
        `SELECT f.*, (
            SELECT COUNT(1) FROM Pacientes p WHERE p.familia_id = f.familia_id AND p.activo = 1
          ) AS integrantes_count
         FROM Familias f WHERE f.familia_id = ?`,
        [createdId],
        (err2, row) => {
          if (err2) {
            return res.status(201).json({ familia_id: createdId });
          }
          res.status(201).json(row);
        }
      );
    }
  );
});

// Obtener usuarios por rol
app.get('/api/usuarios/rol/:rol', (req, res) => {
  const { rol } = req.params;
  
  // Query simplificada que no requiere Equipos_Basicos
  const query = `
    SELECT u.usuario_id, u.nombre_completo, u.email, u.telefono
    FROM Usuarios u
    JOIN Roles r ON u.rol_id = r.rol_id
    WHERE r.nombre_rol = ? AND u.activo = 1
    ORDER BY u.nombre_completo
  `;
  
  db.all(query, [rol], (err, rows) => {
    if (err) {
      console.error('Error obteniendo usuarios por rol:', err);
      return res.status(500).json({ error: 'Error obteniendo usuarios por rol: ' + err.message });
    }
    res.json(rows || []);
  });
});


// ==================== ENDPOINTS DE HC_MEDICINA_GENERAL ====================

// Crear nueva atención y historia clínica
app.post('/api/hc/medicina', (req, res) => {
  const {
    paciente_id,
    usuario_id,
    fecha_atencion,
    hora_consulta,
    motivo_consulta,
    enfermedad_actual,
    antecedentes_personales,
    antecedentes_familiares,
    revision_por_sistemas,
    signos_vitales,
    habitos_toxicos,
    examen_fisico,
    diagnosticos_cie10,
    plan_manejo,
    recomendaciones,
    proxima_cita,
    // Enfoque diferencial
    enfoque_diferencial,
    // Signos vitales expandidos
    tension_arterial_sistolica,
    tension_arterial_diastolica,
    frecuencia_cardiaca,
    frecuencia_respiratoria,
    saturacion_oxigeno,
    temperatura,
    // Medidas antropométricas
    peso,
    talla,
    imc,
    perimetro_cefalico,
    perimetro_toracico,
    perimetro_abdominal,
    perimetro_braquial,
    perimetro_pantorrilla,
    // Otros parámetros
    glucometria,
    glasgow,
    // Campos adicionales
    conducta_seguir,
    evolucion,
    analisis,
    fecha_hora_egreso
  } = req.body;

  if (!paciente_id || !usuario_id || !motivo_consulta || !diagnosticos_cie10) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: paciente_id, usuario_id, motivo_consulta, diagnosticos_cie10'
    });
  }

  // Iniciar transacción
  db.serialize(() => {
    // 1. Crear atención clínica
    const insertAtencion = `
      INSERT INTO Atenciones_Clinicas (
        paciente_id, usuario_id, fecha_atencion, tipo_atencion, estado
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const fechaAtencion = fecha_atencion || new Date().toISOString().split('T')[0];

    db.run(insertAtencion, [
      paciente_id,
      usuario_id,
      fechaAtencion,
      'Consulta Médica',
      'En proceso'
    ], function(err) {
      if (err) {
        console.error('Error creando atención:', err);
        console.error('Mensaje:', err.message);
        console.error('Código:', err.code);
        return res.status(500).json({ error: 'Error creando atención clínica: ' + err.message });
      }

      const atencionId = this.lastID;

      // 2. Crear historia clínica asociada
      const insertHC = `
        INSERT INTO HC_Medicina_General (
          atencion_id, hora_consulta, motivo_consulta, enfermedad_actual,
          antecedentes_personales, antecedentes_familiares,
          revision_por_sistemas, signos_vitales,
          examen_fisico, diagnosticos_cie10, plan_manejo,
          recomendaciones, proxima_cita,
          enfoque_diferencial,
          tension_arterial_sistolica, tension_arterial_diastolica,
          frecuencia_cardiaca, frecuencia_respiratoria,
          saturacion_oxigeno, temperatura,
          peso, talla, imc,
          perimetro_cefalico, perimetro_toracico, perimetro_abdominal,
          perimetro_braquial, perimetro_pantorrilla,
          glucometria, glasgow,
          conducta_seguir, evolucion, analisis,
          fecha_hora_egreso
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Procesar antecedentes_personales como JSON si viene como objeto
      const antPersonales = typeof antecedentes_personales === 'object' 
        ? JSON.stringify(antecedentes_personales) 
        : antecedentes_personales;

      // Procesar enfoque_diferencial como JSON si viene como objeto
      const enfoqueDiff = typeof enfoque_diferencial === 'object'
        ? JSON.stringify(enfoque_diferencial)
        : enfoque_diferencial;

      db.run(insertHC, [
        atencionId,
        hora_consulta || null,
        motivo_consulta,
        enfermedad_actual || null,
        antPersonales || null,
        antecedentes_familiares || null,
        revision_por_sistemas || null,
        signos_vitales || null,
        examen_fisico || null,
        diagnosticos_cie10,
        plan_manejo || null,
        recomendaciones || null,
        proxima_cita || null,
        enfoqueDiff || null,
        tension_arterial_sistolica || null,
        tension_arterial_diastolica || null,
        frecuencia_cardiaca || null,
        frecuencia_respiratoria || null,
        saturacion_oxigeno || null,
        temperatura || null,
        peso || null,
        talla || null,
        imc || null,
        perimetro_cefalico || null,
        perimetro_toracico || null,
        perimetro_abdominal || null,
        perimetro_braquial || null,
        perimetro_pantorrilla || null,
        glucometria || null,
        glasgow || null,
        conducta_seguir || null,
        evolucion || null,
        analisis || null,
        fecha_hora_egreso || null
      ], function(err) {
        if (err) {
          console.error('Error creando HC Medicina:', err);
          console.error('Mensaje:', err.message);
          console.error('Código:', err.code);
          // Rollback: eliminar atención creada
          db.run('DELETE FROM Atenciones_Clinicas WHERE atencion_id = ?', [atencionId]);
          return res.status(500).json({ error: 'Error creando historia clínica: ' + err.message });
        }

        res.status(201).json({
          success: true,
          atencion_id: atencionId,
          message: 'Atención y historia clínica creadas exitosamente'
        });
      });
    });
  });
});

// Obtener historia clínica de medicina general
app.get('/api/hc/medicina/:atencion_id', (req, res) => {
  const { atencion_id } = req.params;
  
  const query = `
    SELECT 
      atencion_id, hora_consulta, motivo_consulta, enfermedad_actual,
      antecedentes_personales, antecedentes_familiares,
      revision_por_sistemas, signos_vitales,
      examen_fisico, diagnosticos_cie10, plan_manejo, 
      recomendaciones, proxima_cita,
      enfoque_diferencial,
      tension_arterial_sistolica, tension_arterial_diastolica,
      frecuencia_cardiaca, frecuencia_respiratoria,
      saturacion_oxigeno, temperatura,
      peso, talla, imc,
      perimetro_cefalico, perimetro_toracico, perimetro_abdominal,
      perimetro_braquial, perimetro_pantorrilla,
      glucometria, glasgow,
      conducta_seguir, evolucion, analisis,
      fecha_hora_egreso
    FROM HC_Medicina_General
    WHERE atencion_id = ?
  `;
  
  db.get(query, [atencion_id], (err, row) => {
    if (err) {
      console.error('Error obteniendo HC Medicina:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' });
    }
    
    // Parsear campos JSON de forma segura
    try {
      if (row.antecedentes_personales && typeof row.antecedentes_personales === 'string') {
        row.antecedentes_personales = JSON.parse(row.antecedentes_personales);
      }
    } catch (e) {
      console.error('Error parseando antecedentes_personales:', e);
    }
    
    try {
      if (row.enfoque_diferencial && typeof row.enfoque_diferencial === 'string') {
        row.enfoque_diferencial = JSON.parse(row.enfoque_diferencial);
      }
    } catch (e) {
      console.error('Error parseando enfoque_diferencial:', e);
    }
    
    try {
      if (row.revision_por_sistemas && typeof row.revision_por_sistemas === 'string') {
        row.revision_por_sistemas = JSON.parse(row.revision_por_sistemas);
      }
    } catch (e) {
      console.error('Error parseando revision_por_sistemas:', e);
    }
    
    res.json(row);
  });
});

// ==================== ENDPOINT DE LOGIN CON DEPURACIÓN ====================

// Login de usuarios - VERSIÓN CON DEBUG
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 ============ LOGIN DEBUG START ============');
  console.log('📧 Email recibido:', email);
  console.log('🔑 Password recibido:', password);
  console.log('📏 Longitud password:', password?.length);
  console.log('🔍 Tipo de password:', typeof password);
  
  // Verificar que llegaron los datos
  if (!email || !password) {
    console.log('❌ FALTAN DATOS: email o password vacíos');
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const query = `
    SELECT 
      u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
      r.nombre_rol, r.rol_id
    FROM Usuarios u 
    JOIN Roles r ON u.rol_id = r.rol_id 
    WHERE lower(u.email) = lower(?)
  `;
  
  console.log('🛢️  Ejecutando query en BD para email:', email);
  
  db.get(query, [email.trim()], async (err, row) => {
    if (err) {
      console.error('❌ ERROR EN BASE DE DATOS:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    console.log('📋 RESULTADO DE BD:', row ? 'USUARIO ENCONTRADO' : 'USUARIO NO ENCONTRADO');
    
    if (!row) {
      // Autoprovisionar fisioterapeuta/nutricionista/fonoaudiólogo/odontólogo si es el caso
      row = await ensureFisioUser(email);
      if (!row) row = await ensureNutriUser(email);
      if (!row) row = await ensureFonoUser(email);
      if (!row) row = await ensureOdontoUser(email);
      if (!row) {
        console.log('❌ USUARIO NO EXISTE y no es usuario demo permitido');
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }
    }
    
    console.log('✅ USUARIO ENCONTRADO EN BD:');
    console.log('   ID:', row.usuario_id);
    console.log('   Nombre:', row.nombre_completo);
    console.log('   Email:', row.email);
    console.log('   Documento:', row.numero_documento);
    console.log('   Rol:', row.nombre_rol);
    
    // Verificación: documento o clave temporal específica para fisioterapeuta
    const isFisioTemp = String(email).toLowerCase() === 'fisioterapeuta@salud.com' && String(password) === 'fisio123';
    const isNutriTemp = String(email).toLowerCase() === 'nutricionista@salud.com' && String(password) === 'nutri123';
    const isFonoTemp  = String(email).toLowerCase() === 'fonoaudiologo@salud.com' && String(password) === 'fono123';
    const isOdontoTemp= String(email).toLowerCase() === 'odontologo@salud.com' && String(password) === 'odonto123';
    const isDocMatch = String(password) === String(row.numero_documento);
    if (!(isDocMatch || isFisioTemp || isNutriTemp || isFonoTemp || isOdontoTemp)) {
      console.log('❌ CONTRASEÑA INCORRECTA');
      console.log('   Esperado (doc):', row.numero_documento, 'Recibido:', password);
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
    console.log('✅ LOGIN EXITOSO para:', row.nombre_completo);
    console.log('🔐 ============ LOGIN DEBUG END ============');
    
    res.json({ 
      success: true, 
      user: {
        id: row.usuario_id,
        name: row.nombre_completo,
        email: row.email,
        role: row.nombre_rol,
        roleId: row.rol_id,
        team: null,
        document: row.numero_documento
      }
    });
  });
});
// Actualizar historia clínica de medicina general
app.put('/api/hc/medicina/:atencion_id', (req, res) => {
  const { atencion_id } = req.params;
  const {
    hora_consulta,
    motivo_consulta, enfermedad_actual,
    antecedentes_personales, antecedentes_familiares,
    revision_por_sistemas, signos_vitales,
    examen_fisico, diagnosticos_cie10, plan_manejo, 
    recomendaciones, proxima_cita,
    enfoque_diferencial,
    tension_arterial_sistolica,
    tension_arterial_diastolica,
    frecuencia_cardiaca,
    frecuencia_respiratoria,
    saturacion_oxigeno,
    temperatura,
    peso,
    talla,
    imc,
    perimetro_cefalico,
    perimetro_toracico,
    perimetro_abdominal,
    perimetro_braquial,
    perimetro_pantorrilla,
    glucometria,
    glasgow,
    conducta_seguir,
    evolucion,
    analisis,
    fecha_hora_egreso
  } = req.body;

  // Procesar campos JSON
  const antPersonales = typeof antecedentes_personales === 'object' 
    ? JSON.stringify(antecedentes_personales) 
    : antecedentes_personales;
  
  const enfoqueDiff = typeof enfoque_diferencial === 'object'
    ? JSON.stringify(enfoque_diferencial)
    : enfoque_diferencial;

  const query = `
    UPDATE HC_Medicina_General SET
      hora_consulta = ?,
      motivo_consulta = ?, enfermedad_actual = ?,
      antecedentes_personales = ?, antecedentes_familiares = ?,
      revision_por_sistemas = ?, signos_vitales = ?,
      examen_fisico = ?, diagnosticos_cie10 = ?,
      plan_manejo = ?, recomendaciones = ?, proxima_cita = ?,
      enfoque_diferencial = ?,
      tension_arterial_sistolica = ?,
      tension_arterial_diastolica = ?,
      frecuencia_cardiaca = ?,
      frecuencia_respiratoria = ?,
      saturacion_oxigeno = ?,
      temperatura = ?,
      peso = ?,
      talla = ?,
      imc = ?,
      perimetro_cefalico = ?,
      perimetro_toracico = ?,
      perimetro_abdominal = ?,
      perimetro_braquial = ?,
      perimetro_pantorrilla = ?,
      glucometria = ?,
      glasgow = ?,
      conducta_seguir = ?,
      evolucion = ?,
      analisis = ?,
      fecha_hora_egreso = ?
    WHERE atencion_id = ?
  `;

  const params = [
    hora_consulta || null,
    motivo_consulta, enfermedad_actual || null,
    antPersonales || null, antecedentes_familiares || null,
    revision_por_sistemas || null, signos_vitales || null,
    examen_fisico || null, diagnosticos_cie10,
    plan_manejo || null, recomendaciones || null, proxima_cita || null,
    enfoqueDiff || null,
    tension_arterial_sistolica || null,
    tension_arterial_diastolica || null,
    frecuencia_cardiaca || null,
    frecuencia_respiratoria || null,
    saturacion_oxigeno || null,
    temperatura || null,
    peso || null,
    talla || null,
    imc || null,
    perimetro_cefalico || null,
    perimetro_toracico || null,
    perimetro_abdominal || null,
    perimetro_braquial || null,
    perimetro_pantorrilla || null,
    glucometria || null,
    glasgow || null,
    conducta_seguir || null,
    evolucion || null,
    analisis || null,
    fecha_hora_egreso || null,
    atencion_id
  ];

  db.run(query, params, function(err) {
    if (err) {
      console.error('Error actualizando HC Medicina:', err);
      return res.status(500).json({ error: 'Error actualizando historia clínica' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Historia clínica no encontrada' });
    }
    res.json({ 
      success: true, 
      message: 'Historia clínica actualizada exitosamente' 
    });
  });
});

// ==================== ENDPOINTS DE HC_PSICOLOGIA ====================

// Crear nueva atención y historia clínica psicológica
app.post('/api/hc/psicologia', (req, res) => {
  const {
    paciente_id,
    usuario_id,
    fecha_atencion,
    motivo_consulta,
    analisis_funcional,
    antecedentes_psicologicos,
    evaluacion_mental,
    diagnosticos_dsm5,
    plan_terapeutico,
    tecnicas_aplicadas,
    proxima_sesion
  } = req.body;

  if (!paciente_id || !usuario_id || !motivo_consulta) {
    return res.status(400).json({ 
      error: 'Datos requeridos: paciente_id, usuario_id, motivo_consulta' 
    });
  }

  // Iniciar transacción
  db.serialize(() => {
    // 1. Crear atención clínica
    const insertAtencion = `
      INSERT INTO Atenciones_Clinicas (
        paciente_id, usuario_id, fecha_atencion, tipo_atencion, estado
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const fechaAtencion = fecha_atencion || new Date().toISOString().split('T')[0];

    db.run(insertAtencion, [
      paciente_id,
      usuario_id,
      fechaAtencion,
      'Consulta Psicológica',
      'En proceso'
    ], function(err) {
      if (err) {
        console.error('Error creando atención:', err);
        return res.status(500).json({ error: 'Error creando atención clínica: ' + err.message });
      }

      const atencionId = this.lastID;

      // 2. Crear historia clínica psicológica asociada
      const insertHC = `
        INSERT INTO HC_Psicologia (
          atencion_id, motivo_consulta, analisis_funcional,
          antecedentes_psicologicos, evaluacion_mental,
          diagnosticos_dsm5, plan_terapeutico,
          tecnicas_aplicadas, proxima_sesion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(insertHC, [
        atencionId,
        motivo_consulta || null,
        analisis_funcional || null,
        antecedentes_psicologicos || null,
        evaluacion_mental || null,
        diagnosticos_dsm5 || null,
        plan_terapeutico || null,
        tecnicas_aplicadas || null,
        proxima_sesion || null
      ], function(err) {
        if (err) {
          console.error('Error creando HC psicológica:', err);
          return res.status(500).json({ error: 'Error creando historia clínica psicológica: ' + err.message });
        }

        res.status(201).json({
          success: true,
          atencion_id: atencionId,
          message: 'Historia clínica psicológica creada exitosamente'
        });
      });
    });
  });
});

// Obtener historia clínica psicológica
app.get('/api/hc/psicologia/:atencion_id', (req, res) => {
  const { atencion_id } = req.params;
  
  const query = `
    SELECT 
      atencion_id, motivo_consulta, analisis_funcional,
      antecedentes_psicologicos, evaluacion_mental,
      diagnosticos_dsm5, plan_terapeutico,
      tecnicas_aplicadas, proxima_sesion
    FROM HC_Psicologia
    WHERE atencion_id = ?
  `;
  
  db.get(query, [atencion_id], (err, row) => {
    if (err) {
      console.error('Error obteniendo HC psicológica:', err);
      return res.status(500).json({ error: 'Error obteniendo historia clínica psicológica' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Historia clínica psicológica no encontrada' });
    }
    
    res.json(row);
  });
});

// Obtener historias clínicas psicológicas de un paciente
app.get('/api/pacientes/:id/hc-psicologia', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      ac.atencion_id,
      ac.fecha_atencion,
      ac.estado,
      u.nombre_completo as profesional_nombre,
      hcp.motivo_consulta,
      hcp.evaluacion_mental,
      hcp.diagnosticos_dsm5,
      hcp.proxima_sesion
    FROM Atenciones_Clinicas ac
    JOIN HC_Psicologia hcp ON ac.atencion_id = hcp.atencion_id
    LEFT JOIN Usuarios u ON ac.usuario_id = u.usuario_id
    WHERE ac.paciente_id = ? AND ac.tipo_atencion = 'Consulta Psicológica'
    ORDER BY ac.fecha_atencion DESC, ac.atencion_id DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo HC psicológicas:', err);
      return res.status(500).json({ error: 'Error obteniendo historias clínicas psicológicas' });
    }
    
    res.json(rows || []);
  });
});

// Obtener historias clínicas psicológicas completadas por un psicólogo
app.get('/api/usuarios/:id/hc-psicologia-completadas', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      ac.atencion_id,
      ac.fecha_atencion,
      ac.estado,
      p.paciente_id,
      p.primer_nombre || ' ' || p.primer_apellido as paciente_nombre,
      p.numero_documento,
      f.apellido_principal as familia_apellido,
      hcp.motivo_consulta,
      hcp.evaluacion_mental,
      hcp.diagnosticos_dsm5,
      hcp.proxima_sesion
    FROM Atenciones_Clinicas ac
    JOIN HC_Psicologia hcp ON ac.atencion_id = hcp.atencion_id
    JOIN Pacientes p ON ac.paciente_id = p.paciente_id
    JOIN Familias f ON p.familia_id = f.familia_id
    WHERE ac.usuario_id = ? 
      AND ac.tipo_atencion = 'Consulta Psicológica'
      AND ac.estado = 'Completada'
    ORDER BY ac.fecha_atencion DESC, ac.atencion_id DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo HC psicológicas completadas:', err);
      return res.status(500).json({ error: 'Error obteniendo historias clínicas completadas' });
    }
    
    res.json(rows || []);
  });
});

// Actualizar historia clínica psicológica
app.put('/api/hc/psicologia/:atencion_id', (req, res) => {
  const { atencion_id } = req.params;
  const {
    motivo_consulta,
    analisis_funcional,
    antecedentes_psicologicos,
    evaluacion_mental,
    diagnosticos_dsm5,
    plan_terapeutico,
    tecnicas_aplicadas,
    proxima_sesion
  } = req.body;

  const query = `
    UPDATE HC_Psicologia SET
      motivo_consulta = ?,
      analisis_funcional = ?,
      antecedentes_psicologicos = ?,
      evaluacion_mental = ?,
      diagnosticos_dsm5 = ?,
      plan_terapeutico = ?,
      tecnicas_aplicadas = ?,
      proxima_sesion = ?
    WHERE atencion_id = ?
  `;

  db.run(query, [
    motivo_consulta || null,
    analisis_funcional || null,
    antecedentes_psicologicos || null,
    evaluacion_mental || null,
    diagnosticos_dsm5 || null,
    plan_terapeutico || null,
    tecnicas_aplicadas || null,
    proxima_sesion || null,
    atencion_id
  ], function(err) {
    if (err) {
      console.error('Error actualizando HC psicológica:', err);
      return res.status(500).json({ error: 'Error actualizando historia clínica psicológica' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Historia clínica psicológica no encontrada' });
    }
    res.json({ 
      success: true, 
      message: 'Historia clínica psicológica actualizada exitosamente' 
    });
  });
});

// Marcar atención como completada
app.put('/api/atenciones/:id/completar', (req, res) => {
  const { id } = req.params;
  
  console.log('[Completar Atención] Recibida petición para atencion_id:', id);
  
  // Primero verificar que la atención existe
  db.get('SELECT atencion_id, estado, usuario_id, paciente_id FROM Atenciones_Clinicas WHERE atencion_id = ?', [id], (err, row) => {
    if (err) {
      console.error('[Completar Atención] Error verificando atención:', err);
      return res.status(500).json({ error: 'Error verificando atención' });
    }
    
    if (!row) {
      console.warn('[Completar Atención] No se encontró atención con ID:', id);
      return res.status(404).json({ error: 'Atención no encontrada' });
    }
    
    console.log('[Completar Atención] Atención encontrada:', { 
      atencion_id: row.atencion_id, 
      estado_actual: row.estado, 
      usuario_id: row.usuario_id,
      paciente_id: row.paciente_id 
    });
  
    const query = `
      UPDATE Atenciones_Clinicas 
      SET estado = 'Completada'
      WHERE atencion_id = ?
    `;
    
    db.run(query, [id], function(err2) {
      if (err2) {
        console.error('[Completar Atención] Error completando atención:', err2);
        return res.status(500).json({ error: 'Error completando atención' });
      }
      console.log('[Completar Atención] Filas actualizadas:', this.changes);
      if (this.changes === 0) {
        console.warn('[Completar Atención] No se pudo actualizar atención con ID:', id);
        return res.status(404).json({ error: 'Atención no encontrada' });
      }
      console.log('[Completar Atención] Atención marcada como completada exitosamente');
      res.json({ 
        success: true, 
        message: 'Atención marcada como completada',
        atencion_id: id,
        estado_anterior: row.estado
      });
    });
  });
});

// Obtener todas las historias clínicas de medicina de un paciente
app.get('/api/pacientes/:paciente_id/hc/medicina', (req, res) => {
  const { paciente_id } = req.params;
  
  const query = `
    SELECT 
      hc.*,
      ac.fecha_atencion,
      ac.usuario_id as profesional_id,
      u.nombre_completo as profesional_nombre
    FROM HC_Medicina_General hc
    JOIN Atenciones_Clinicas ac ON hc.atencion_id = ac.atencion_id
    JOIN Usuarios u ON ac.usuario_id = u.usuario_id
    WHERE ac.paciente_id = ?
    ORDER BY ac.fecha_atencion DESC
  `;
  
  db.all(query, [paciente_id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo historias clínicas:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json(rows);
  });
});

// Obtener historias clínicas completadas por un médico/usuario
app.get('/api/usuarios/:id/hc-completadas', (req, res) => {
  const { id } = req.params;
  const { desde, hasta } = req.query;
  
  console.log('[HC Completadas] Buscando consultas para usuario_id:', id, 'desde:', desde, 'hasta:', hasta);
  
  let query = `
    SELECT 
      hc.atencion_id,
      hc.motivo_consulta,
      hc.diagnosticos_cie10,
      hc.plan_manejo,
      ac.fecha_atencion,
      ac.estado,
      ac.usuario_id,
      p.paciente_id,
      p.primer_nombre,
      p.segundo_nombre,
      p.primer_apellido,
      p.segundo_apellido,
      p.numero_documento,
      p.tipo_documento,
      COALESCE(f.apellido_principal, 'Sin familia') as familia_apellido
    FROM HC_Medicina_General hc
    JOIN Atenciones_Clinicas ac ON hc.atencion_id = ac.atencion_id
    JOIN Pacientes p ON ac.paciente_id = p.paciente_id
    LEFT JOIN Familias f ON p.familia_id = f.familia_id
    WHERE ac.usuario_id = ? AND ac.estado = 'Completada'
  `;
  
  const params = [id];
  
  if (desde) {
    query += ' AND ac.fecha_atencion >= ?';
    params.push(desde);
  }
  
  if (hasta) {
    query += ' AND ac.fecha_atencion <= ?';
    params.push(hasta);
  }
  
  query += ' ORDER BY ac.fecha_atencion DESC';
  
  console.log('[HC Completadas] Ejecutando query con usuario_id:', id);
  console.log('[HC Completadas] Parámetros:', params);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('[HC Completadas] Error obteniendo HC completadas:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    console.log('[HC Completadas] Encontradas', rows.length, 'consultas completadas para usuario_id:', id);
    if (rows.length > 0) {
      console.log('[HC Completadas] Primeras 3 consultas:', rows.slice(0, 3).map(r => ({ 
        atencion_id: r.atencion_id, 
        paciente: `${r.primer_nombre} ${r.primer_apellido}`, 
        fecha: r.fecha_atencion,
        estado: r.estado,
        usuario_id: r.usuario_id,
        familia: r.familia_apellido
      })));
    } else {
      // Debug: verificar si hay atenciones con ese usuario_id pero estado diferente
      db.all(
        `SELECT atencion_id, estado, usuario_id, paciente_id 
         FROM Atenciones_Clinicas 
         WHERE usuario_id = ? 
         ORDER BY atencion_id DESC 
         LIMIT 5`,
        [id],
        (err2, debugRows) => {
          if (!err2 && debugRows.length > 0) {
            console.log('[HC Completadas] Debug - Últimas 5 atenciones para este usuario:', debugRows);
          }
        }
      );
    }
    res.json(rows);
  });
});

// Obtener bitácora mensual de actividades del médico
app.get('/api/usuarios/:id/bitacora', (req, res) => {
  const { id } = req.params;
  const { mes, ano } = req.query;
  
  // Calcular rango de fechas si se proporciona mes y año
  let fechaInicio, fechaFin;
  if (mes && ano) {
    fechaInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const nextMonth = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
    const nextYear = parseInt(mes) === 12 ? parseInt(ano) + 1 : parseInt(ano);
    fechaFin = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  }
  
  let query = `
    SELECT 
      DATE(ac.fecha_atencion) as fecha,
      COUNT(DISTINCT ac.atencion_id) as total_consultas,
      COUNT(DISTINCT rm.receta_id) as total_recetas,
      COUNT(DISTINCT ol.orden_id) as total_ordenes
    FROM Atenciones_Clinicas ac
    LEFT JOIN Recetas_Medicas rm ON ac.atencion_id = rm.atencion_id
    LEFT JOIN Ordenes_Laboratorio ol ON ac.atencion_id = ol.atencion_id
    WHERE ac.usuario_id = ?
  `;
  
  const params = [id];
  
  if (fechaInicio) {
    query += ' AND ac.fecha_atencion >= ?';
    params.push(fechaInicio);
  }
  
  if (fechaFin) {
    query += ' AND ac.fecha_atencion < ?';
    params.push(fechaFin);
  }
  
  query += `
    GROUP BY DATE(ac.fecha_atencion)
    ORDER BY fecha DESC
  `;
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error obteniendo bitácora:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    // Calcular totales del mes
    const resumen = {
      total_consultas: rows.reduce((sum, row) => sum + row.total_consultas, 0),
      total_recetas: rows.reduce((sum, row) => sum + row.total_recetas, 0),
      total_ordenes: rows.reduce((sum, row) => sum + row.total_ordenes, 0),
      dias_activos: rows.length,
      detalle_diario: rows
    };
    
    res.json(resumen);
  });
});

// ==================== ENDPOINTS DE CARACTERIZACIÓN ====================

// Crear/actualizar caracterización completa de familia
app.post('/api/caracterizaciones', (req, res) => {
  const { familia_id, datos_familia, integrantes } = req.body;
  
  if (!familia_id || !datos_familia) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: familia_id, datos_familia'
    });
  }

  console.log('Creando caracterización para familia:', familia_id);

  // Iniciar transacción
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 1. Actualizar tabla Familias con datos de caracterización
    const updateFamilia = `
      UPDATE Familias SET
        numero_ficha = ?,
        zona = ?,
        territorio = ?,
        micro_territorio = ?,
        barrio = ?,
        numero_personas = ?,
        estrato = ?,
        tipo_familia = ?,
        riesgo_familiar = ?,
        fecha_caracterizacion = ?,
        info_vivienda = ?,
        situaciones_proteccion = ?,
        condiciones_salud_publica = ?,
        practicas_cuidado = ?
      WHERE familia_id = ?
    `;
    
    const paramsFamilia = [
      datos_familia.numero_ficha || null,
      datos_familia.zona || null,
      datos_familia.territorio || null,
      datos_familia.micro_territorio || null,
      datos_familia.barrio || null,
      datos_familia.numero_personas || null,
      datos_familia.estrato || null,
      datos_familia.tipo_familia || null,
      datos_familia.riesgo_familiar || null,
      datos_familia.fecha_caracterizacion || null,
      JSON.stringify(datos_familia.info_vivienda || {}),
      JSON.stringify(datos_familia.situaciones_proteccion || []),
      JSON.stringify(datos_familia.condiciones_salud_publica || {}),
      JSON.stringify(datos_familia.practicas_cuidado || {}),
      familia_id
    ];
    
    db.run(updateFamilia, paramsFamilia, function(err) {
      if (err) {
        console.error('Error actualizando familia:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Error actualizando datos de familia' });
      }
      
      console.log('Familia actualizada, filas afectadas:', this.changes);
      
      // 2. Eliminar caracterizaciones existentes de pacientes de esta familia
      db.run('DELETE FROM Caracterizacion_Paciente WHERE paciente_id IN (SELECT paciente_id FROM Pacientes WHERE familia_id = ?)', 
        [familia_id], function(err) {
        if (err) {
          console.error('Error eliminando caracterizaciones existentes:', err);
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Error limpiando caracterizaciones previas' });
        }
        
        console.log('Caracterizaciones previas eliminadas:', this.changes);
        
        // 3. Insertar nuevas caracterizaciones de pacientes
        if (integrantes && integrantes.length > 0) {
          const insertPaciente = `
            INSERT INTO Caracterizacion_Paciente (
              paciente_id, fecha_caracterizacion, rol_familiar, ocupacion,
              nivel_educativo, grupo_poblacional, regimen_afiliacion,
              pertenencia_etnica, discapacidad, victima_violencia,
              telefono_1, orientacion_sexual, comunidad_indigena,
              datos_pyp, datos_salud, tiempo_cuidador, creado_por_uid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          let completed = 0;
          let errors = 0;
          
          integrantes.forEach((integrante, index) => {
            // Incluir tiempo_cuidador en datos_salud si no está en el nivel superior
            const datosSaludCompletos = {
              ...(integrante.datos_salud || {}),
              tiempo_cuidador: integrante.tiempo_cuidador || integrante.datos_salud?.tiempo_cuidador
            };
            
            const paramsPaciente = [
              integrante.paciente_id,
              integrante.fecha_caracterizacion || datos_familia.fecha_caracterizacion || new Date().toISOString().split('T')[0],
              integrante.rol_familiar || null,
              integrante.ocupacion || null,
              integrante.nivel_educativo || null,
              integrante.grupo_poblacional || null,
              integrante.regimen_afiliacion || null,
              integrante.pertenencia_etnica || null,
              JSON.stringify(integrante.discapacidad || []),
              integrante.victima_violencia || false,
              integrante.telefono_1 || null,
              integrante.orientacion_sexual || null,
              integrante.comunidad_indigena || false,
              JSON.stringify(integrante.datos_pyp || {}),
              JSON.stringify(datosSaludCompletos),
              integrante.tiempo_cuidador || null,
              integrante.creado_por_uid || null
            ];
            
            db.run(insertPaciente, paramsPaciente, function(err) {
              if (err) {
                console.error(`Error insertando caracterización paciente ${index}:`, err);
                errors++;
              } else {
                console.log(`Caracterización paciente ${index} insertada:`, this.lastID);
              }
              
              completed++;
              
              if (completed === integrantes.length) {
                if (errors > 0) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: `Error en ${errors} caracterizaciones de pacientes` });
                }
                
                // Commit transacción
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error en commit:', err);
                    return res.status(500).json({ error: 'Error confirmando transacción' });
                  }
                  
                  console.log('✅ Caracterización completada exitosamente');
                  res.status(201).json({
                    success: true,
                    message: 'Caracterización creada exitosamente',
                    familia_id: familia_id,
                    integrantes_procesados: integrantes.length
                  });
                });
              }
            });
          });
        } else {
          // No hay integrantes, solo commit
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error en commit:', err);
              return res.status(500).json({ error: 'Error confirmando transacción' });
            }
            
            console.log('✅ Caracterización de familia completada exitosamente');
            res.status(201).json({
              success: true,
              message: 'Caracterización de familia creada exitosamente',
              familia_id: familia_id
            });
          });
        }
      });
    });
  });
});

// Obtener caracterización de una familia
app.get('/api/familias/:id/caracterizacion', (req, res) => {
  const { id } = req.params;
  
  // 1. Obtener datos de caracterización de la familia
  const queryFamilia = `
    SELECT 
      f.*,
      u.nombre_completo as creado_por_nombre
    FROM Familias f
    LEFT JOIN Usuarios u ON f.creado_por_uid = u.usuario_id
    WHERE f.familia_id = ?
  `;
  
  db.get(queryFamilia, [id], (err, familia) => {
    if (err) {
      console.error('Error obteniendo familia:', err);
      return res.status(500).json({ error: 'Error obteniendo datos de familia' });
    }
    
    if (!familia) {
      return res.status(404).json({ error: 'Familia no encontrada' });
    }
    
    // 2. Obtener caracterizaciones de los pacientes
    const queryPacientes = `
      SELECT 
        p.paciente_id,
        p.numero_documento,
        p.tipo_documento,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.fecha_nacimiento,
        p.genero,
        cp.*
      FROM Pacientes p
      LEFT JOIN Caracterizacion_Paciente cp ON p.paciente_id = cp.paciente_id
      WHERE p.familia_id = ? AND p.activo = 1
      ORDER BY p.primer_nombre
    `;
    
    db.all(queryPacientes, [id], (err, pacientes) => {
      if (err) {
        console.error('Error obteniendo pacientes:', err);
        return res.status(500).json({ error: 'Error obteniendo datos de pacientes' });
      }
      
      // Procesar datos JSON de forma segura
      const familiaProcesada = {
        ...familia,
        info_vivienda: familia.info_vivienda ? (typeof familia.info_vivienda === 'string' ? JSON.parse(familia.info_vivienda) : familia.info_vivienda) : {},
        situaciones_proteccion: familia.situaciones_proteccion ? (typeof familia.situaciones_proteccion === 'string' ? JSON.parse(familia.situaciones_proteccion) : familia.situaciones_proteccion) : [],
        condiciones_salud_publica: familia.condiciones_salud_publica ? (typeof familia.condiciones_salud_publica === 'string' ? JSON.parse(familia.condiciones_salud_publica) : familia.condiciones_salud_publica) : {},
        practicas_cuidado: familia.practicas_cuidado ? (typeof familia.practicas_cuidado === 'string' ? JSON.parse(familia.practicas_cuidado) : familia.practicas_cuidado) : {}
      };
      
      const pacientesProcesados = pacientes.map(p => {
        try {
          return {
            ...p,
            discapacidad: p.discapacidad ? (typeof p.discapacidad === 'string' ? JSON.parse(p.discapacidad) : p.discapacidad) : [],
            datos_pyp: p.datos_pyp ? (typeof p.datos_pyp === 'string' ? JSON.parse(p.datos_pyp) : p.datos_pyp) : {},
            datos_salud: p.datos_salud ? (typeof p.datos_salud === 'string' ? JSON.parse(p.datos_salud) : p.datos_salud) : {}
          };
        } catch (parseErr) {
          console.error('Error parseando datos de paciente:', parseErr);
          return {
            ...p,
            discapacidad: [],
            datos_pyp: {},
            datos_salud: {}
          };
        }
      });
      
      res.json({
        familia: familiaProcesada,
        integrantes: pacientesProcesados,
        tiene_caracterizacion: !!familia.fecha_caracterizacion
      });
    });
  });
});

// Obtener resumen clínico consolidado de un paciente
app.get('/api/pacientes/:id/resumen-clinico', async (req, res) => {
  const pacienteId = parseInt(req.params.id, 10);

  if (isNaN(pacienteId)) {
    return res.status(400).json({ error: 'ID de paciente inválido' });
  }

  const dbGet = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

  const dbAll = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

  const parseJSON = (value, fallback) => {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch (e) {
      console.warn('JSON parse error en resumen clínico:', e?.message);
      return fallback;
    }
  };

  try {
    const pacienteQuery = `
      SELECT 
        p.*,
        f.apellido_principal AS familia_apellido,
        f.direccion AS familia_direccion,
        f.barrio_vereda AS familia_barrio,
        f.municipio AS familia_municipio,
        f.telefono_contacto,
        f.riesgo_familiar,
        f.numero_ficha,
        f.zona,
        f.tipo_familia,
        f.info_vivienda,
        f.condiciones_salud_publica
      FROM Pacientes p
      LEFT JOIN Familias f ON p.familia_id = f.familia_id
      WHERE p.paciente_id = ?
    `;

    const caracterizacionQuery = `
      SELECT *
      FROM Caracterizacion_Paciente
      WHERE paciente_id = ?
      ORDER BY fecha_caracterizacion DESC, caracterizacion_paciente_id DESC
      LIMIT 1
    `;

    const consultasRecientesQuery = `
      SELECT
        ac.atencion_id,
        ac.fecha_atencion,
        ac.estado,
        u.nombre_completo AS profesional,
        hc.motivo_consulta,
        hc.diagnosticos_cie10,
        hc.plan_manejo,
        hc.signos_vitales,
        hc.tension_arterial_sistolica,
        hc.tension_arterial_diastolica,
        hc.frecuencia_cardiaca,
        hc.frecuencia_respiratoria,
        hc.saturacion_oxigeno,
        hc.temperatura,
        hc.peso,
        hc.talla,
        hc.imc
      FROM Atenciones_Clinicas ac
      LEFT JOIN HC_Medicina_General hc ON hc.atencion_id = ac.atencion_id
      LEFT JOIN Usuarios u ON ac.usuario_id = u.usuario_id
      WHERE ac.paciente_id = ?
      ORDER BY ac.fecha_atencion DESC
      LIMIT 5
    `;

    const diagnosticosFrecuentesQuery = `
      SELECT 
        hc.diagnosticos_cie10 AS diagnostico,
        COUNT(*) AS frecuencia
      FROM HC_Medicina_General hc
      JOIN Atenciones_Clinicas ac ON hc.atencion_id = ac.atencion_id
      WHERE ac.paciente_id = ?
        AND hc.diagnosticos_cie10 IS NOT NULL
        AND TRIM(hc.diagnosticos_cie10) != ''
      GROUP BY hc.diagnosticos_cie10
      ORDER BY frecuencia DESC
      LIMIT 5
    `;

    const planesActivosQuery = `
      SELECT 
        pcf.plan_id,
        pcf.fecha_entrega,
        pcf.estado,
        pcf.condicion_identificada,
        pcf.logro_salud,
        pcf.cuidados_salud,
        pcf.demandas_inducidas_desc,
        pcf.educacion_salud,
        u.nombre_completo AS profesional
      FROM Planes_Cuidado_Familiar pcf
      LEFT JOIN Usuarios u ON pcf.creado_por_uid = u.usuario_id
      WHERE pcf.paciente_principal_id = ?
        AND (pcf.estado IS NULL OR pcf.estado IN ('Activo', 'En seguimiento', 'En proceso'))
      ORDER BY pcf.fecha_entrega DESC
      LIMIT 5
    `;

    const demandasPendientesQuery = `
      SELECT 
        demanda_id,
        numero_formulario,
        fecha_demanda,
        estado,
        diligenciamiento,
        remision_a,
        asignado_a_uid,
        seguimiento
      FROM Demandas_Inducidas
      WHERE paciente_id = ?
        AND estado IN ('Pendiente', 'Asignada')
      ORDER BY fecha_demanda DESC
      LIMIT 5
    `;

    const [
      paciente,
      caracterizacion,
      consultasRecientes,
      diagnosticosFrecuentes,
      planesActivos,
      demandasPendientes,
      kpiConsultas,
      kpiDemandas,
      kpiPlanes
    ] = await Promise.all([
      dbGet(pacienteQuery, [pacienteId]),
      dbGet(caracterizacionQuery, [pacienteId]),
      dbAll(consultasRecientesQuery, [pacienteId]),
      dbAll(diagnosticosFrecuentesQuery, [pacienteId]),
      dbAll(planesActivosQuery, [pacienteId]),
      dbAll(demandasPendientesQuery, [pacienteId]),
      dbGet(
        `
          SELECT 
            COUNT(*) AS total_consultas,
            MAX(fecha_atencion) AS ultima_atencion
          FROM Atenciones_Clinicas
          WHERE paciente_id = ?
        `,
        [pacienteId]
      ),
      dbGet(
        `
          SELECT COUNT(*) AS total
          FROM Demandas_Inducidas
          WHERE paciente_id = ?
            AND estado IN ('Pendiente', 'Asignada')
        `,
        [pacienteId]
      ),
      dbGet(
        `
          SELECT COUNT(*) AS total
          FROM Planes_Cuidado_Familiar
          WHERE paciente_principal_id = ?
            AND (estado IS NULL OR estado IN ('Activo', 'En seguimiento', 'En proceso'))
        `,
        [pacienteId]
      )
    ]);

    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const pacienteProcesado = {
      ...paciente,
      info_vivienda: parseJSON(paciente.info_vivienda, {}),
      condiciones_salud_publica: parseJSON(paciente.condiciones_salud_publica, {})
    };

    const caracterizacionProcesada = caracterizacion
      ? {
          ...caracterizacion,
          discapacidad: parseJSON(caracterizacion.discapacidad, []),
          datos_pyp: parseJSON(caracterizacion.datos_pyp, {}),
          datos_salud: parseJSON(caracterizacion.datos_salud, {})
        }
      : null;

    const consultasProcesadas = (consultasRecientes || []).map((consulta) => ({
      ...consulta,
      signos_vitales: parseJSON(consulta.signos_vitales, null)
    }));

    const planesProcesados = (planesActivos || []).map((plan) => ({
      ...plan,
      demandas_inducidas_desc: parseJSON(plan.demandas_inducidas_desc, []),
      educacion_salud: parseJSON(plan.educacion_salud, [])
    }));

    const demandasProcesadas = (demandasPendientes || []).map((demanda) => ({
      ...demanda,
      diligenciamiento: parseJSON(demanda.diligenciamiento, []),
      remision_a: parseJSON(demanda.remision_a, []),
      seguimiento: parseJSON(demanda.seguimiento, {})
    }));

    res.json({
      paciente: pacienteProcesado,
      caracterizacion: caracterizacionProcesada,
      consultas_recientes: consultasProcesadas,
      ultima_consulta: consultasProcesadas[0] || null,
      diagnosticos_frecuentes: diagnosticosFrecuentes || [],
      planes_activos: planesProcesados,
      demandas_pendientes: demandasProcesadas,
      kpis: {
        total_consultas: kpiConsultas?.total_consultas || 0,
        ultima_atencion: kpiConsultas?.ultima_atencion || null,
        demandas_pendientes: kpiDemandas?.total || 0,
        planes_activos: kpiPlanes?.total || 0,
        riesgo_familiar: paciente.riesgo_familiar || null,
        grupo_poblacional: caracterizacionProcesada?.grupo_poblacional || null
      }
    });
  } catch (error) {
    console.error('Error construyendo resumen clínico:', error);
    res.status(500).json({ error: 'Error obteniendo resumen clínico' });
  }
});

// ==================== ENDPOINTS DE PLANES DE CUIDADO ====================

// Obtener planes de cuidado por paciente
app.get('/api/pacientes/:id/planes-cuidado', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      pcf.*,
      u1.nombre_completo as creado_por_nombre,
      f.apellido_principal,
      p.primer_nombre,
      p.primer_apellido
    FROM Planes_Cuidado_Familiar pcf
    LEFT JOIN Usuarios u1 ON pcf.creado_por_uid = u1.usuario_id
    LEFT JOIN Familias f ON pcf.familia_id = f.familia_id
    LEFT JOIN Pacientes p ON pcf.paciente_principal_id = p.paciente_id
    WHERE pcf.paciente_principal_id = ?
    ORDER BY pcf.fecha_entrega DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo planes de cuidado:', err);
      return res.status(500).json({ error: 'Error obteniendo planes de cuidado' });
    }
    
    // Procesar campos JSON de forma segura
    const planesProcesados = rows.map(plan => {
      let planAsociado = [];
      try {
        if (plan.plan_asociado && plan.plan_asociado.trim() !== '') {
          planAsociado = JSON.parse(plan.plan_asociado);
        }
      } catch (parseErr) {
        console.error('Error parseando plan_asociado:', parseErr);
        planAsociado = [];
      }
      
      return {
        ...plan,
        plan_asociado: planAsociado
      };
    });
    
    res.json(planesProcesados);
  });
});

// Crear nuevo plan de cuidado
app.post('/api/planes-cuidado', (req, res) => {
  const {
    familia_id,
    paciente_principal_id,
    fecha_entrega,
    plan_asociado,
    condicion_identificada,
    logro_salud,
    cuidados_salud,
    demandas_inducidas_desc,
    educacion_salud,
    estado,
    creado_por_uid,
    fecha_aceptacion,
    numero_ficha_relacionada,
    nombre_encuestado_principal,
    territorio,
    micro_territorio,
    direccion,
    telefono,
    profesional_entrega,
    ebs_numero,
    relaciones_salud_mental
  } = req.body;
  
  if (!paciente_principal_id || !fecha_entrega || !creado_por_uid) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: paciente_principal_id, fecha_entrega, creado_por_uid'
    });
  }
  
  // Si no se proporciona familia_id, obtenerlo del paciente
  const obtenerFamiliaId = (pacienteId) => {
    return new Promise((resolve, reject) => {
      if (familia_id) {
        resolve(familia_id);
        return;
      }
      
      db.get('SELECT familia_id FROM Pacientes WHERE paciente_id = ?', [pacienteId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Paciente no encontrado'));
        } else {
          resolve(row.familia_id);
        }
      });
    });
  };
  
  obtenerFamiliaId(paciente_principal_id).then(familiaId => {
  
  const insert = `
    INSERT INTO Planes_Cuidado_Familiar (
      familia_id, paciente_id, paciente_principal_id, fecha_entrega, plan_asociado,
      condicion_identificada, logro_salud, cuidados_salud, demandas_inducidas_desc,
      educacion_salud, estado, creado_por_uid, fecha_aceptacion,
      numero_ficha_relacionada, nombre_encuestado_principal, territorio, micro_territorio,
      direccion, telefono, profesional_entrega, ebs_numero, relaciones_salud_mental
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
    const params = [
      familiaId,
      paciente_principal_id, // También para paciente_id (mantener compatibilidad)
      paciente_principal_id,
      fecha_entrega,
      JSON.stringify(plan_asociado || []),
      condicion_identificada || null,
      logro_salud || null,
      cuidados_salud || null,
      demandas_inducidas_desc || null,
      educacion_salud || null,
      estado || 'Activo',
      creado_por_uid,
      fecha_aceptacion || null,
      numero_ficha_relacionada || null,
      nombre_encuestado_principal || null,
      territorio || null,
      micro_territorio || null,
      direccion || null,
      telefono || null,
      profesional_entrega || null,
      ebs_numero || null,
      relaciones_salud_mental || null
    ];
    
    db.run(insert, params, function(err) {
      if (err) {
        console.error('Error creando plan de cuidado:', err);
        return res.status(500).json({ error: 'Error creando plan de cuidado: ' + err.message });
      }
      
      res.status(201).json({
        success: true,
        plan_id: this.lastID,
        message: 'Plan de cuidado creado exitosamente'
      });
    });
  }).catch(err => {
    console.error('Error obteniendo familia_id:', err);
    return res.status(500).json({ error: 'Error obteniendo familia del paciente: ' + err.message });
  });
});

// ==================== ENDPOINTS DE DEMANDAS INDUCIDAS ====================

// Obtener demandas por paciente
app.get('/api/pacientes/:id/demandas-inducidas', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      di.*,
      pcf.condicion_identificada,
      u1.nombre_completo as solicitado_por_nombre,
      u2.nombre_completo as asignado_a_nombre
    FROM Demandas_Inducidas di
    LEFT JOIN Planes_Cuidado_Familiar pcf ON di.plan_id = pcf.plan_id
    LEFT JOIN Usuarios u1 ON di.solicitado_por_uid = u1.usuario_id
    LEFT JOIN Usuarios u2 ON di.asignado_a_uid = u2.usuario_id
    WHERE di.paciente_id = ?
    ORDER BY di.fecha_demanda DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo demandas inducidas:', err);
      return res.status(500).json({ error: 'Error obteniendo demandas inducidas: ' + err.message });
    }
    
    // Procesar campos JSON de forma segura
    const demandasProcesadas = rows.map(demanda => {
      let diligenciamiento = [];
      let remision_a = {};
      let seguimiento = {};
      
      try {
        if (demanda.diligenciamiento && demanda.diligenciamiento.trim() !== '') {
          diligenciamiento = JSON.parse(demanda.diligenciamiento);
        }
      } catch (e) {
        console.error('Error parseando diligenciamiento:', e);
        diligenciamiento = [];
      }
      
      try {
        if (demanda.remision_a && demanda.remision_a.trim() !== '') {
          const parsed = JSON.parse(demanda.remision_a);
          // Si es un array (formato antiguo), mantenerlo
          // Si es un objeto (formato nuevo), usarlo
          remision_a = Array.isArray(parsed) ? parsed : parsed;
        }
      } catch (e) {
        console.error('Error parseando remision_a:', e);
        remision_a = {};
      }
      
      try {
        if (demanda.seguimiento && demanda.seguimiento.trim() !== '') {
          seguimiento = JSON.parse(demanda.seguimiento);
        }
      } catch (e) {
        console.error('Error parseando seguimiento:', e);
        seguimiento = {};
      }
      
      return {
        ...demanda,
        diligenciamiento,
        remision_a,
        seguimiento
      };
    });
    
    res.json(demandasProcesadas);
  });
});

// Crear nueva demanda inducida
// Las demandas inducidas son independientes y pueden:
// - Ser creadas por médicos después de una HC
// - Ser creadas por auxiliares después de caracterización o plan de cuidado
// - Asociarse a múltiples profesionales del equipo básico
// - plan_id es opcional (solo si está asociada a un plan de cuidado)
app.post('/api/demandas-inducidas', (req, res) => {
  const {
    numero_formulario,
    paciente_id,
    plan_id,
    fecha_demanda,
    diligenciamiento,
    remision_a,
    estado,
    asignado_a_uid,
    solicitado_por_uid,
    seguimiento,
    edad,
    sexo,
    eps,
    regimen,
    ips_atencion,
    ebs_numero,
    educacion_salud,
    intervencion_efectiva,
    tipo_identificacion,
    numero_identificacion,
    telefono,
    direccion,
    nombres_completos,
    intervencion_efectiva_si,
    seguimiento_verificado,
    seguimiento_medio,
    seguimiento_fecha,
    seguimiento_observaciones
  } = req.body;
  
  if (!paciente_id || !fecha_demanda || !solicitado_por_uid) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: paciente_id, fecha_demanda, solicitado_por_uid'
    });
  }
  
  // Procesar remision_a: puede venir como objeto (formato nuevo con múltiples profesionales)
  // o como string JSON
  let remisionData = remision_a;
  if (typeof remision_a === 'string' && remision_a.trim() !== '') {
    try {
      remisionData = JSON.parse(remision_a);
    } catch (e) {
      console.error('Error parseando remision_a:', e);
      remisionData = {};
    }
  }
  
  // Construir objeto de seguimiento completo
  const seguimientoCompleto = {
    ...(seguimiento || {}),
    fecha_seguimiento: seguimiento_fecha || seguimiento?.fecha_seguimiento || null,
    observaciones: seguimiento_observaciones || seguimiento?.observaciones || null,
    medio: seguimiento_medio || null,
    verificado: seguimiento_verificado !== undefined ? seguimiento_verificado : null
  };

  const insert = `
    INSERT INTO Demandas_Inducidas (
      numero_formulario, paciente_id, plan_id, fecha_demanda, diligenciamiento,
      remision_a, estado, asignado_a_uid, solicitado_por_uid, seguimiento,
      edad, sexo, eps, regimen, ips_atencion, ebs_numero, educacion_salud, intervencion_efectiva,
      tipo_identificacion, numero_identificacion, telefono, direccion, nombres_completos,
      intervencion_efectiva_si, seguimiento_verificado, seguimiento_medio, fecha_creacion_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    numero_formulario || null,
    paciente_id,
    plan_id || null,
    fecha_demanda,
    JSON.stringify(diligenciamiento || []),
    JSON.stringify(remisionData || {}),
    estado || 'Pendiente',
    asignado_a_uid || null,
    solicitado_por_uid,
    JSON.stringify(seguimientoCompleto),
    edad || null,
    sexo || null,
    eps || null,
    regimen || null,
    ips_atencion || null,
    ebs_numero || null,
    educacion_salud || null,
    intervencion_efectiva || null,
    tipo_identificacion || null,
    numero_identificacion || null,
    telefono || null,
    direccion || null,
    nombres_completos || null,
    intervencion_efectiva_si !== undefined ? (intervencion_efectiva_si ? 1 : 0) : null,
    seguimiento_verificado !== undefined ? (seguimiento_verificado ? 1 : 0) : null,
    seguimiento_medio || null,
    new Date().toISOString() // fecha_creacion_timestamp
  ];
  
  db.run(insert, params, function(err) {
    if (err) {
      console.error('Error creando demanda inducida:', err);
      console.error('Params:', params);
      return res.status(500).json({ error: 'Error creando demanda inducida: ' + err.message });
    }
    
    res.status(201).json({
      success: true,
      demanda_id: this.lastID,
      message: 'Demanda inducida creada exitosamente'
    });
  });
});

// Obtener demandas asignadas a un profesional
// Busca demandas donde el usuario esté asignado directamente o en la lista de profesionales
app.get('/api/usuarios/:id/demandas-asignadas', (req, res) => {
  const { id } = req.params;
  const usuarioId = parseInt(id);
  
  console.log(`🔍 Obteniendo demandas para usuario ID: ${usuarioId}`);
  
  // Obtener todas las demandas activas y filtrarlas en JavaScript
  // porque necesitamos buscar dentro de JSON (remision_a.profesionales)
  const query = `
    SELECT 
      di.demanda_id,
      di.plan_id,
      di.numero_formulario,
      di.fecha_demanda,
      di.tipo_demanda,
      di.descripcion,
      di.prioridad,
      di.fecha_creacion,
      di.fecha_limite,
      di.estado,
      di.paciente_id,
      di.fecha_asignacion,
      di.creado_por_uid,
      di.asignado_a_uid,
      di.profesional_asignado,
      di.observaciones,
      di.diligenciamiento,
      di.remision_a,
      di.seguimiento,
      di.solicitado_por_uid,
      p.primer_nombre,
      p.primer_apellido,
      p.segundo_nombre,
      p.segundo_apellido,
      p.numero_documento,
      p.fecha_nacimiento,
      p.genero,
      f.apellido_principal,
      f.direccion,
      f.municipio,
      u.nombre_completo as solicitado_por_nombre
    FROM Demandas_Inducidas di
    JOIN Pacientes p ON di.paciente_id = p.paciente_id
    JOIN Familias f ON p.familia_id = f.familia_id
    LEFT JOIN Usuarios u ON di.solicitado_por_uid = u.usuario_id
    WHERE di.estado IN ('Pendiente', 'Asignada')
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error en query:', err.message);
      return res.status(500).json({ error: 'Error obteniendo demandas asignadas', details: err.message });
    }
    
    console.log(`✅ Query base exitoso: ${rows.length} demandas activas encontradas`);
    
    // Filtrar demandas donde el usuario esté asignado
    const demandasAsignadas = rows.filter(demanda => {
      // Caso 1: Asignado directamente por asignado_a_uid
      if (demanda.asignado_a_uid === usuarioId) {
        return true;
      }
      
      // Caso 2: Asignado en remision_a.profesionales[]
      if (demanda.remision_a) {
        try {
          const remision = typeof demanda.remision_a === 'string' 
            ? JSON.parse(demanda.remision_a) 
            : demanda.remision_a;
          
          if (remision.profesionales && Array.isArray(remision.profesionales)) {
            const estaAsignado = remision.profesionales.some(
              (p) => p.profesional_id === usuarioId
            );
            if (estaAsignado) {
              return true;
            }
          }
        } catch (e) {
          console.error('Error parseando remision_a en filtro:', e);
        }
      }
      
      return false;
    });
    
    console.log(`🎯 Demandas asignadas al usuario ${usuarioId}: ${demandasAsignadas.length}`);
    
    // Procesar campos JSON de forma segura
    const demandasProcesadas = demandasAsignadas.map(demanda => {
      try {
        return {
          ...demanda,
          fecha_demanda: demanda.fecha_demanda || demanda.fecha_creacion,
          diligenciamiento: demanda.diligenciamiento ? 
            (typeof demanda.diligenciamiento === 'string' ? JSON.parse(demanda.diligenciamiento) : demanda.diligenciamiento) : [],
          remision_a: demanda.remision_a ? 
            (typeof demanda.remision_a === 'string' ? JSON.parse(demanda.remision_a) : demanda.remision_a) : {},
          seguimiento: demanda.seguimiento ? 
            (typeof demanda.seguimiento === 'string' ? JSON.parse(demanda.seguimiento) : demanda.seguimiento) : {}
        };
      } catch (jsonErr) {
        console.error('Error parseando JSON:', jsonErr);
        return {
          ...demanda,
          fecha_demanda: demanda.fecha_demanda || demanda.fecha_creacion,
          diligenciamiento: [],
          remision_a: {},
          seguimiento: {}
        };
      }
    });
    
    console.log(`✅ Devolviendo ${demandasProcesadas.length} demandas procesadas`);
    res.json(demandasProcesadas);
  });
});

// ==================== ENDPOINTS DE RECETAS MÉDICAS ====================

// Obtener recetas de un paciente
app.get('/api/pacientes/:id/recetas', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      rm.receta_id,
      rm.atencion_id,
      rm.fecha_receta,
      rm.medicamentos,
      rm.indicaciones,
      rm.estado,
      rm.fecha_impresion,
      rm.codigo_diagnostico_principal,
      rm.codigo_diagnostico_rel1,
      rm.codigo_diagnostico_rel2,
      rm.recomendaciones,
      ac.fecha_atencion,
      u.nombre_completo as medico_nombre
    FROM Recetas_Medicas rm
    JOIN Atenciones_Clinicas ac ON rm.atencion_id = ac.atencion_id
    JOIN Usuarios u ON rm.usuario_id = u.usuario_id
    WHERE rm.paciente_id = ?
    ORDER BY rm.fecha_receta DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo recetas:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    // Procesar JSON de medicamentos
    const recetas = rows.map(receta => {
      let medicamentos = [];
      if (receta.medicamentos) {
        try {
          medicamentos = typeof receta.medicamentos === 'string' 
            ? JSON.parse(receta.medicamentos) 
            : receta.medicamentos;
        } catch (e) {
          console.error('Error parseando medicamentos:', e);
        }
      }
      return {
        ...receta,
        medicamentos
      };
    });
    
    res.json(recetas);
  });
});

// Crear nueva receta médica
app.post('/api/recetas', (req, res) => {
  const {
    atencion_id,
    paciente_id,
    usuario_id,
    fecha_receta,
    medicamentos,
    indicaciones,
    estado,
    codigo_diagnostico_principal,
    codigo_diagnostico_rel1,
    codigo_diagnostico_rel2,
    recomendaciones
  } = req.body;

  if (!atencion_id || !paciente_id || !usuario_id || !medicamentos) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: atencion_id, paciente_id, usuario_id, medicamentos'
    });
  }

  const insert = `
    INSERT INTO Recetas_Medicas (
      atencion_id, paciente_id, usuario_id, fecha_receta,
      medicamentos, indicaciones, estado,
      codigo_diagnostico_principal, codigo_diagnostico_rel1, codigo_diagnostico_rel2,
      recomendaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const fechaReceta = fecha_receta || new Date().toISOString().split('T')[0];
  const medicamentosJSON = typeof medicamentos === 'string' 
    ? medicamentos 
    : JSON.stringify(medicamentos);

  db.run(insert, [
    atencion_id,
    paciente_id,
    usuario_id,
    fechaReceta,
    medicamentosJSON,
    indicaciones || null,
    estado || 'Activa',
    codigo_diagnostico_principal || null,
    codigo_diagnostico_rel1 || null,
    codigo_diagnostico_rel2 || null,
    recomendaciones || null
  ], function(err) {
    if (err) {
      console.error('Error creando receta:', err);
      return res.status(500).json({ error: 'Error creando receta médica' });
    }

    res.status(201).json({
      success: true,
      receta_id: this.lastID,
      message: 'Receta creada exitosamente'
    });
  });
});

// Marcar receta como impresa
app.put('/api/recetas/:id/imprimir', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE Recetas_Medicas SET fecha_impresion = CURRENT_TIMESTAMP WHERE receta_id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Error actualizando receta:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      res.json({ success: true, message: 'Receta marcada como impresa' });
    }
  );
});

// ==================== ENDPOINTS DE ÓRDENES DE LABORATORIO ====================

// Obtener órdenes de laboratorio de un paciente
app.get('/api/pacientes/:id/ordenes-laboratorio', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      ol.orden_id,
      ol.atencion_id,
      ol.fecha_orden,
      ol.examenes,
      ol.indicaciones_clinicas,
      ol.estado,
      ol.fecha_impresion,
      ol.servicio,
      ol.numero_carnet,
      ol.diagnostico_justificacion,
      ac.fecha_atencion,
      u.nombre_completo as medico_nombre
    FROM Ordenes_Laboratorio ol
    JOIN Atenciones_Clinicas ac ON ol.atencion_id = ac.atencion_id
    JOIN Usuarios u ON ol.usuario_id = u.usuario_id
    WHERE ol.paciente_id = ?
    ORDER BY ol.fecha_orden DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo órdenes de laboratorio:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    // Procesar JSON de exámenes
    const ordenes = rows.map(orden => {
      let examenes = [];
      if (orden.examenes) {
        try {
          examenes = typeof orden.examenes === 'string' 
            ? JSON.parse(orden.examenes) 
            : orden.examenes;
        } catch (e) {
          console.error('Error parseando examenes:', e);
        }
      }
      return {
        ...orden,
        examenes
      };
    });
    
    res.json(ordenes);
  });
});

// Crear nueva orden de laboratorio
app.post('/api/ordenes-laboratorio', (req, res) => {
  const {
    atencion_id,
    paciente_id,
    usuario_id,
    fecha_orden,
    examenes,
    indicaciones_clinicas,
    examenes_solicitados,
    estado,
    servicio,
    numero_carnet,
    diagnostico_justificacion
  } = req.body;

  // Para compatibilidad, usar examenes_solicitados si viene, sino indicaciones_clinicas
  const examenesTexto = examenes_solicitados || indicaciones_clinicas || '';
  
  // Si viene examenes como array/JSON, mantenerlo para compatibilidad
  const examenesJSON = examenes && typeof examenes === 'object'
    ? JSON.stringify(examenes)
    : (examenes || null);

  if (!atencion_id || !paciente_id || !usuario_id) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: atencion_id, paciente_id, usuario_id'
    });
  }

  const insert = `
    INSERT INTO Ordenes_Laboratorio (
      atencion_id, paciente_id, usuario_id, fecha_orden,
      examenes, indicaciones_clinicas, estado,
      servicio, numero_carnet, diagnostico_justificacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const fechaOrden = fecha_orden || new Date().toISOString().split('T')[0];

  db.run(insert, [
    atencion_id,
    paciente_id,
    usuario_id,
    fechaOrden,
    examenesJSON,
    examenesTexto || null,
    estado || 'Pendiente',
    servicio || null,
    numero_carnet || null,
    diagnostico_justificacion || null
  ], function(err) {
    if (err) {
      console.error('Error creando orden de laboratorio:', err);
      return res.status(500).json({ error: 'Error creando orden de laboratorio' });
    }

    res.status(201).json({
      success: true,
      orden_id: this.lastID,
      message: 'Orden de laboratorio creada exitosamente'
    });
  });
});

// Marcar orden como impresa
app.put('/api/ordenes-laboratorio/:id/imprimir', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE Ordenes_Laboratorio SET fecha_impresion = CURRENT_TIMESTAMP WHERE orden_id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Error actualizando orden:', err);
        return res.status(500).json({ error: 'Error del servidor' });
      }
      res.json({ success: true, message: 'Orden marcada como impresa' });
    }
  );
});

// ==================== ENDPOINTS DE DASHBOARD ====================

// Resumen de actividad para el médico/usuario
app.get('/api/usuarios/:id/resumen-actividad', (req, res) => {
  const { id } = req.params;
  const hoy = new Date().toISOString().split('T')[0];
  
  const queries = {
    registrosHoy: `
      SELECT COUNT(*) as total 
      FROM Atenciones_Clinicas 
      WHERE usuario_id = ? AND date(fecha_atencion) = ?
    `,
    consultasTotal: `
      SELECT COUNT(*) as total 
      FROM Atenciones_Clinicas 
      WHERE usuario_id = ?
    `,
    caracterizaciones: `
      SELECT COUNT(DISTINCT familia_id) as total 
      FROM Familias 
      WHERE fecha_caracterizacion IS NOT NULL
    `,
    demandasInducidas: `
      SELECT COUNT(*) as total 
      FROM Demandas_Inducidas 
      WHERE asignado_a_uid = ? AND estado IN ('Pendiente', 'Asignada')
    `
  };

  db.serialize(() => {
    const resultados = {};
    let queriesCompletadas = 0;
    const totalQueries = Object.keys(queries).length;

    const procesarResultado = (key, resultado) => {
      resultados[key] = resultado;
      queriesCompletadas++;
      if (queriesCompletadas === totalQueries) {
        res.json(resultados);
      }
    };

    db.get(queries.registrosHoy, [id, hoy], (err, row) => {
      if (err) console.error('Error en registrosHoy:', err);
      procesarResultado('registros_hoy', (row && row.total) || 0);
    });

    db.get(queries.consultasTotal, [id], (err, row) => {
      if (err) console.error('Error en consultasTotal:', err);
      procesarResultado('consultas', (row && row.total) || 0);
    });

    db.get(queries.caracterizaciones, [], (err, row) => {
      if (err) console.error('Error en caracterizaciones:', err);
      procesarResultado('caracterizaciones', (row && row.total) || 0);
    });

    db.get(queries.demandasInducidas, [id], (err, row) => {
      if (err) console.error('Error en demandasInducidas:', err);
      procesarResultado('demandas_inducidas', (row && row.total) || 0);
    });
  });
});

// Dashboard epidemiológico
app.get('/api/dashboard/epidemio', async (req, res) => {
  const dbGet = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
    });

  const dbAll = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });

  try {
    const [
      totalFamilias,
      totalPacientes,
      totalAtenciones,
      atencionesMes,
      diagnosticosFrecuentes,
      poblacionGenero,
      poblacionEtaria,
      diagnosticosCronicos,
      riesgoFamiliar,
      gruposPoblacionales,
      condicionesSensibles,
      coberturaMunicipio,
      tendenciaAtenciones
    ] = await Promise.all([
      dbGet('SELECT COUNT(*) as total FROM Familias'),
      dbGet('SELECT COUNT(*) as total FROM Pacientes WHERE activo = 1'),
      dbGet('SELECT COUNT(*) as total FROM Atenciones_Clinicas'),
      dbGet(`
      SELECT COUNT(*) as total 
      FROM Atenciones_Clinicas 
      WHERE fecha_atencion >= date('now', 'start of month')
      `),
      dbAll(`
      SELECT diagnosticos_cie10, COUNT(*) as frecuencia
      FROM HC_Medicina_General
      WHERE diagnosticos_cie10 IS NOT NULL AND diagnosticos_cie10 != ''
      GROUP BY diagnosticos_cie10
      ORDER BY frecuencia DESC
      LIMIT 10
      `),
      dbAll(`
        SELECT 
          COALESCE(genero, 'No reportado') AS genero,
          COUNT(*) AS total
        FROM Pacientes
        WHERE activo = 1
        GROUP BY COALESCE(genero, 'No reportado')
      `),
      dbAll(`
        SELECT grupo, COUNT(*) as total FROM (
          SELECT 
            CASE
              WHEN fecha_nacimiento IS NULL THEN 'Sin dato'
              WHEN (julianday('now') - julianday(fecha_nacimiento)) / 365.25 < 6 THEN '0-5 años'
              WHEN (julianday('now') - julianday(fecha_nacimiento)) / 365.25 < 18 THEN '6-17 años'
              WHEN (julianday('now') - julianday(fecha_nacimiento)) / 365.25 < 60 THEN '18-59 años'
              ELSE '60+ años'
            END AS grupo
          FROM Pacientes
          WHERE activo = 1
        ) 
        GROUP BY grupo
      `),
      dbAll(`
        SELECT categoria, COUNT(*) as total FROM (
          SELECT
            CASE
              WHEN upper(hc.diagnosticos_cie10) LIKE 'I%' THEN 'Cardiovasculares'
              WHEN upper(hc.diagnosticos_cie10) LIKE 'E1%' THEN 'Metabólicas'
              WHEN upper(hc.diagnosticos_cie10) LIKE 'J%' THEN 'Respiratorias'
              WHEN upper(hc.diagnosticos_cie10) LIKE 'F%' THEN 'Salud mental'
              ELSE 'Otros crónicos'
            END AS categoria
          FROM HC_Medicina_General hc
          JOIN Atenciones_Clinicas ac ON hc.atencion_id = ac.atencion_id
          WHERE hc.diagnosticos_cie10 IS NOT NULL AND TRIM(hc.diagnosticos_cie10) != ''
        )
        GROUP BY categoria
      `),
      dbAll(`
        SELECT 
          COALESCE(riesgo_familiar, 'Sin definir') AS riesgo,
          COUNT(*) AS total
        FROM Familias
        GROUP BY COALESCE(riesgo_familiar, 'Sin definir')
      `),
      dbAll(`
        SELECT 
          grupo_poblacional AS grupo,
          COUNT(*) AS total
        FROM Caracterizacion_Paciente
        WHERE grupo_poblacional IS NOT NULL AND TRIM(grupo_poblacional) != ''
        GROUP BY grupo_poblacional
        ORDER BY total DESC
      `),
      dbGet(`
        SELECT 
          SUM(CASE WHEN discapacidad IS NOT NULL AND TRIM(discapacidad) != '' AND TRIM(discapacidad) != '[]' THEN 1 ELSE 0 END) AS con_discapacidad,
          SUM(CASE WHEN victima_violencia = 1 THEN 1 ELSE 0 END) AS victimas_violencia
        FROM Caracterizacion_Paciente
      `),
      dbAll(`
        SELECT 
          COALESCE(f.municipio, 'Sin municipio') AS municipio,
          COUNT(DISTINCT f.familia_id) AS familias,
          COUNT(p.paciente_id) AS pacientes
        FROM Familias f
        LEFT JOIN Pacientes p ON f.familia_id = p.familia_id AND p.activo = 1
        GROUP BY COALESCE(f.municipio, 'Sin municipio')
        ORDER BY pacientes DESC
        LIMIT 5
      `),
      dbAll(`
        SELECT 
          strftime('%Y-%m', fecha_atencion) AS periodo,
          COUNT(*) AS total
        FROM Atenciones_Clinicas
        WHERE fecha_atencion >= date('now', '-5 months')
        GROUP BY strftime('%Y-%m', fecha_atencion)
        ORDER BY periodo ASC
      `)
    ]);

    const ordenarEtapas = (datos = []) => {
      const orden = ['0-5 años', '6-17 años', '18-59 años', '60+ años', 'Sin dato'];
      return datos.sort((a, b) => orden.indexOf(a.grupo) - orden.indexOf(b.grupo));
    };

    res.json({
      total_familias: totalFamilias?.total || 0,
      total_pacientes: totalPacientes?.total || 0,
      total_atenciones: totalAtenciones?.total || 0,
      atenciones_mes: atencionesMes?.total || 0,
      diagnosticos_frecuentes: diagnosticosFrecuentes || [],
      poblacion_genero: poblacionGenero || [],
      poblacion_etaria: ordenarEtapas(poblacionEtaria || []),
      diagnosticos_cronicos: diagnosticosCronicos || [],
      riesgo_familiar: riesgoFamiliar || [],
      grupos_poblacionales: gruposPoblacionales || [],
      condiciones_sensibles: {
        con_discapacidad: condicionesSensibles?.con_discapacidad || 0,
        victimas_violencia: condicionesSensibles?.victimas_violencia || 0
      },
      cobertura_municipio: coberturaMunicipio || [],
      tendencia_atenciones: tendenciaAtenciones || []
    });
  } catch (error) {
    console.error('Error construyendo dashboard epidemiológico:', error);
    res.status(500).json({ error: 'Error generando dashboard epidemiológico' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Salud Digital APS funcionando',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint funcionando',
    timestamp: new Date().toISOString()
  });
});

// ==================== ENDPOINT TTS ELEVENLABS ====================
// Genera audio a partir de texto usando ElevenLabs y lo devuelve como audio/mpeg
app.post('/api/tts', async (req, res) => {
  try {
    console.log('[TTS] Request recibido:', { texto: req.body?.texto?.substring(0, 50) + '...', voiceId: req.body?.voiceId });
    const { texto, voiceId } = req.body || {};
    if (!texto || typeof texto !== 'string') {
      console.log('[TTS] Error: Falta el texto');
      return res.status(400).json({ error: 'Falta el texto' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('[TTS] Error: Falta ELEVENLABS_API_KEY');
      return res.status(500).json({ error: 'Falta ELEVENLABS_API_KEY en el servidor' });
    }

    const selectedVoiceId = voiceId || 'EXAVITQu4vr4xnSDxMaL';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`;
    console.log('[TTS] Llamando a ElevenLabs:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texto,
        voice_settings: { stability: 0.7, similarity_boost: 0.8 }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TTS] Error ElevenLabs:', response.status, errorText);
      return res.status(500).json({ error: 'Error ElevenLabs', details: errorText });
    }

    console.log('[TTS] Audio generado exitosamente');
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Opción A: devolver el audio directamente como streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="voz.mp3"');
    return res.send(audioBuffer);

    // Opción B (comentada): guardar a archivo público
    // const publicDir = path.join(__dirname, 'public');
    // if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    // const audioPath = path.join(publicDir, 'voz.mp3');
    // fs.writeFileSync(audioPath, audioBuffer);
    // return res.json({ audioUrl: '/voz.mp3' });
  } catch (err) {
    console.error('[TTS] Error interno:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== ENDPOINT STT ====================
// Recibe un archivo de audio (multipart/form-data campo "audio") y devuelve la transcripción
app.post('/api/stt', upload.single('audio'), async (req, res) => {
  try {
    const provider =
      (req.query.provider || req.body?.provider || process.env.STT_DEFAULT_PROVIDER || sttProviders.DEFAULT_PROVIDER).toLowerCase();

    console.log('[STT] Request recibido:', {
      provider,
      filename: req.file?.originalname,
      size: req.file?.size,
      mimetype: req.file?.mimetype
    });

    if (!req.file) {
      console.log('[STT] Error: Falta archivo de audio');
      return res.status(400).json({ error: 'Falta archivo de audio' });
    }

    const inputFilePath = req.file.path;
    const audioBuffer = fs.readFileSync(inputFilePath);
    const contentType = (req.file.mimetype || 'audio/webm').split(';')[0];

    let text = '';
    try {
      text = await sttProviders.transcribe({
        provider,
        audioBuffer,
        contentType,
        filename: req.file.originalname
      });
    } finally {
    fs.unlink(inputFilePath, () => {});
    }

    console.log('[STT] Transcripción exitosa con proveedor', provider);
    return res.json({ text, provider });
  } catch (err) {
    console.error('[STT] Error interno:', err.message);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

// ==================== ENDPOINTS PERFILES AUTOCOMPLETADO ====================

// GET: Obtener todos los perfiles (filtrados por tipo si se especifica)
// Muestra perfiles públicos (creado_por_uid IS NULL) + perfiles del usuario actual
app.get('/api/perfiles-autocompletado', (req, res) => {
  const { tipo_perfil, usuario_id } = req.query;
  
  console.log('📥 [GET /api/perfiles-autocompletado] Query params:', { tipo_perfil, usuario_id });
  
  let query = `
    SELECT 
      Perfiles_Autocompletado.perfil_id, 
      Perfiles_Autocompletado.nombre_perfil, 
      Perfiles_Autocompletado.descripcion, 
      Perfiles_Autocompletado.tipo_perfil, 
      Perfiles_Autocompletado.datos_perfil, 
      Perfiles_Autocompletado.creado_por_uid, 
      Perfiles_Autocompletado.activo, 
      Perfiles_Autocompletado.fecha_creacion, 
      Perfiles_Autocompletado.fecha_actualizacion,
      u.nombre_completo as creado_por_nombre
    FROM Perfiles_Autocompletado
    LEFT JOIN Usuarios u ON Perfiles_Autocompletado.creado_por_uid = u.usuario_id
    WHERE Perfiles_Autocompletado.activo = 1
  `;
  
  const params = [];
  
  // Agregar filtro de usuario: mostrar públicos (creado_por_uid IS NULL) + del usuario si existe
  if (usuario_id && usuario_id !== 'undefined' && usuario_id !== 'null') {
    query += ' AND (Perfiles_Autocompletado.creado_por_uid IS NULL OR Perfiles_Autocompletado.creado_por_uid = ?)';
    params.push(parseInt(usuario_id));
    console.log('📥 [GET] Incluyendo perfiles del usuario:', usuario_id);
  } else {
    // Si no hay usuario_id, solo mostrar públicos
    query += ' AND Perfiles_Autocompletado.creado_por_uid IS NULL';
    console.log('📥 [GET] Solo mostrando perfiles públicos');
  }
  
  if (tipo_perfil) {
    query += ' AND Perfiles_Autocompletado.tipo_perfil = ?';
    params.push(tipo_perfil);
    console.log('📥 [GET] Filtrando por tipo_perfil:', tipo_perfil);
  }
  
  query += ' ORDER BY Perfiles_Autocompletado.creado_por_uid IS NULL DESC, Perfiles_Autocompletado.nombre_perfil';
  
  console.log('📥 [GET] Query final:', query);
  console.log('📥 [GET] Params:', params);
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('❌ Error obteniendo perfiles:', err);
      console.error('❌ Query:', query);
      console.error('❌ Params:', params);
      return res.status(500).json({ error: 'Error obteniendo perfiles', details: err.message });
    }
    
    console.log(`✅ Perfiles encontrados: ${rows.length}`);
    
    // Parsear JSON de datos_perfil
    const perfiles = rows.map(row => {
      try {
        return {
          ...row,
          datos_perfil: typeof row.datos_perfil === 'string' 
            ? JSON.parse(row.datos_perfil) 
            : row.datos_perfil
        };
      } catch (parseError) {
        console.error('❌ Error parseando datos_perfil del perfil:', row.perfil_id, parseError);
        return {
          ...row,
          datos_perfil: {}
        };
      }
    });
    
    console.log(`✅ Perfiles parseados exitosamente: ${perfiles.length}`);
    res.json(perfiles);
  });
});

// GET: Obtener un perfil por ID
app.get('/api/perfiles-autocompletado/:id', (req, res) => {
  const { id } = req.params;
  
  db.get(
    `SELECT 
      perfil_id, nombre_perfil, descripcion, tipo_perfil, 
      datos_perfil, creado_por_uid, activo, 
      fecha_creacion, fecha_actualizacion
    FROM Perfiles_Autocompletado
    WHERE perfil_id = ? AND activo = 1`,
    [id],
    (err, row) => {
      if (err) {
        console.error('Error obteniendo perfil:', err);
        return res.status(500).json({ error: 'Error obteniendo perfil' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }
      
      // Parsear JSON de datos_perfil
      const perfil = {
        ...row,
        datos_perfil: typeof row.datos_perfil === 'string' 
          ? JSON.parse(row.datos_perfil) 
          : row.datos_perfil
      };
      
      res.json(perfil);
    }
  );
});

// POST: Crear un nuevo perfil
app.post('/api/perfiles-autocompletado', (req, res) => {
  const { nombre_perfil, descripcion, tipo_perfil, datos_perfil, creado_por_uid } = req.body;
  
  if (!nombre_perfil || !datos_perfil) {
    return res.status(400).json({ 
      error: 'Faltan campos obligatorios: nombre_perfil, datos_perfil' 
    });
  }
  
  const datosJSON = typeof datos_perfil === 'string' 
    ? datos_perfil 
    : JSON.stringify(datos_perfil);
  
  const insert = `
    INSERT INTO Perfiles_Autocompletado 
    (nombre_perfil, descripcion, tipo_perfil, datos_perfil, creado_por_uid, activo)
    VALUES (?, ?, ?, ?, ?, 1)
  `;
  
  db.run(insert, [
    nombre_perfil,
    descripcion || null,
    tipo_perfil || 'HC_Medicina',
    datosJSON,
    creado_por_uid || null
  ], function(err) {
    if (err) {
      console.error('Error creando perfil:', err);
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Ya existe un perfil con ese nombre' });
      }
      return res.status(500).json({ error: 'Error creando perfil' });
    }
    
    // Obtener el perfil creado
    db.get(
      `SELECT * FROM Perfiles_Autocompletado WHERE perfil_id = ?`,
      [this.lastID],
      (err, row) => {
        if (err || !row) {
          return res.status(201).json({ 
            perfil_id: this.lastID, 
            message: 'Perfil creado exitosamente' 
          });
        }
        
        const perfil = {
          ...row,
          datos_perfil: typeof row.datos_perfil === 'string' 
            ? JSON.parse(row.datos_perfil) 
            : row.datos_perfil
        };
        
        res.status(201).json(perfil);
      }
    );
  });
});

// PUT: Actualizar un perfil
app.put('/api/perfiles-autocompletado/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_perfil, descripcion, tipo_perfil, datos_perfil } = req.body;
  
  // Construir query dinámicamente
  const updates = [];
  const params = [];
  
  if (nombre_perfil !== undefined) {
    updates.push('nombre_perfil = ?');
    params.push(nombre_perfil);
  }
  
  if (descripcion !== undefined) {
    updates.push('descripcion = ?');
    params.push(descripcion);
  }
  
  if (tipo_perfil !== undefined) {
    updates.push('tipo_perfil = ?');
    params.push(tipo_perfil);
  }
  
  if (datos_perfil !== undefined) {
    updates.push('datos_perfil = ?');
    params.push(typeof datos_perfil === 'string' 
      ? datos_perfil 
      : JSON.stringify(datos_perfil));
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No hay campos para actualizar' });
  }
  
  updates.push('fecha_actualizacion = CURRENT_TIMESTAMP');
  params.push(id);
  
  const update = `
    UPDATE Perfiles_Autocompletado 
    SET ${updates.join(', ')}
    WHERE perfil_id = ? AND activo = 1
  `;
  
  db.run(update, params, function(err) {
    if (err) {
      console.error('Error actualizando perfil:', err);
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Ya existe un perfil con ese nombre' });
      }
      return res.status(500).json({ error: 'Error actualizando perfil' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }
    
    // Obtener el perfil actualizado
    db.get(
      `SELECT * FROM Perfiles_Autocompletado WHERE perfil_id = ?`,
      [id],
      (err, row) => {
        if (err || !row) {
          return res.json({ message: 'Perfil actualizado exitosamente' });
        }
        
        const perfil = {
          ...row,
          datos_perfil: typeof row.datos_perfil === 'string' 
            ? JSON.parse(row.datos_perfil) 
            : row.datos_perfil
        };
        
        res.json(perfil);
      }
    );
  });
});

// DELETE: Eliminar (desactivar) un perfil
app.delete('/api/perfiles-autocompletado/:id', (req, res) => {
  const { id } = req.params;
  
  db.run(
    `UPDATE Perfiles_Autocompletado 
     SET activo = 0, fecha_actualizacion = CURRENT_TIMESTAMP
     WHERE perfil_id = ?`,
    [id],
    function(err) {
      if (err) {
        console.error('Error eliminando perfil:', err);
        return res.status(500).json({ error: 'Error eliminando perfil' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }
      
      res.json({ message: 'Perfil eliminado exitosamente' });
    }
  );
});

// ==================== TERMINOLOGY SERVICE ====================

app.get('/api/terminology/cie10', async (req, res) => {
  try {
    const search = (req.query.query || '').trim();
    if (!search || search.length < 2) {
      return res.json([]);
    }
    const results = await terminologyClient.searchCIE10(search);
    res.json(results.slice(0, 20));
  } catch (error) {
    console.error('❌ [Terminology] Error buscando CIE10:', error);
    res.status(500).json({ error: 'Error consultando CIE10' });
  }
});

app.get('/api/terminology/medications', async (req, res) => {
  try {
    const search = (req.query.query || '').trim();
    if (!search || search.length < 2) {
      return res.json([]);
    }
    const results = await terminologyClient.searchMedications(search);
    res.json(results.slice(0, 20));
  } catch (error) {
    console.error('❌ [Terminology] Error buscando medicamentos:', error);
    res.status(500).json({ error: 'Error consultando medicamentos' });
  }
});

app.post('/api/terminology/validate', async (req, res) => {
  const { type, valueSetUrl, system, code, display } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'El campo code es obligatorio' });
  }

  let targetValueSet = valueSetUrl;
  if (!targetValueSet) {
    if (type === 'cie10') {
      targetValueSet = terminologyClient.constants.CIE10_VALUESET_URL;
    } else if (type === 'medication') {
      targetValueSet = terminologyClient.constants.MEDS_VALUESET_URL;
    }
  }

  if (!targetValueSet) {
    return res.status(400).json({
      error: 'Debe indicar valueSetUrl o un type válido (cie10, medication)'
    });
  }

  try {
    const result = await terminologyClient.validateCode({
      valueSetUrl: targetValueSet,
      system,
      code,
      display
    });
    res.json(result);
  } catch (error) {
    console.error('❌ [Terminology] Error validando código:', error);
    res.status(500).json({ error: 'Error validando código', details: error.message });
  }
});

// ==================== FHIR GATEWAY ====================

app.post('/api/fhir/patient', async (req, res) => {
  const { resource, identifier } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Patient' });
  }
  try {
    const response = await fhirClient.upsertPatient(resource, identifier);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando/actualizando Patient:', error);
    res.status(500).json({ error: 'Error enviando Patient a FHIR', details: error.message });
  }
});

app.post('/api/fhir/condition', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Condition' });
  }
  try {
    const response = await fhirClient.createCondition(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando Condition:', error);
    res.status(500).json({ error: 'Error enviando Condition a FHIR', details: error.message });
  }
});

app.post('/api/fhir/medication', async (req, res) => {
  const { resource, id } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Medication' });
  }
  try {
    const response = await fhirClient.createMedication(resource, id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando/actualizando Medication:', error);
    res.status(500).json({ error: 'Error enviando Medication a FHIR', details: error.message });
  }
});

app.post('/api/fhir/medication-request', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso MedicationRequest' });
  }
  try {
    const response = await fhirClient.createMedicationRequest(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando MedicationRequest:', error);
    res.status(500).json({ error: 'Error enviando MedicationRequest a FHIR', details: error.message });
  }
});

// ==================== FHIR READ OPERATIONS ====================

app.get('/api/fhir/patient/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readPatient(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Patient:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Patient no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Patient desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/condition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readCondition(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Condition:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Condition no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Condition desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/medication/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readMedication(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Medication:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Medication no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Medication desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/medication-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readMedicationRequest(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo MedicationRequest:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'MedicationRequest no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo MedicationRequest desde FHIR', details: error.message });
    }
  }
});

// ==================== FHIR UPDATE OPERATIONS ====================

app.put('/api/fhir/patient/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Patient' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updatePatient(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Patient:', error);
    res.status(500).json({ error: 'Error actualizando Patient en FHIR', details: error.message });
  }
});

app.put('/api/fhir/condition/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Condition' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateCondition(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Condition:', error);
    res.status(500).json({ error: 'Error actualizando Condition en FHIR', details: error.message });
  }
});

app.put('/api/fhir/medication/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Medication' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateMedication(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Medication:', error);
    res.status(500).json({ error: 'Error actualizando Medication en FHIR', details: error.message });
  }
});

app.put('/api/fhir/medication-request/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso MedicationRequest' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateMedicationRequest(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando MedicationRequest:', error);
    res.status(500).json({ error: 'Error actualizando MedicationRequest en FHIR', details: error.message });
  }
});

// ==================== FHIR DELETE OPERATIONS ====================

app.delete('/api/fhir/patient/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deletePatient(id);
    res.json({ success: true, message: 'Patient eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Patient:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Patient no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Patient desde FHIR', details: error.message });
    }
  }
});

app.delete('/api/fhir/condition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteCondition(id);
    res.json({ success: true, message: 'Condition eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Condition:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Condition no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Condition desde FHIR', details: error.message });
    }
  }
});

app.delete('/api/fhir/medication/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteMedication(id);
    res.json({ success: true, message: 'Medication eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Medication:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Medication no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Medication desde FHIR', details: error.message });
    }
  }
});

app.delete('/api/fhir/medication-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteMedicationRequest(id);
    res.json({ success: true, message: 'MedicationRequest eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando MedicationRequest:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'MedicationRequest no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando MedicationRequest desde FHIR', details: error.message });
    }
  }
});

// ==================== FHIR SEARCH OPERATIONS ====================

app.get('/api/fhir/patient', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchPatients(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Patients:', error);
    res.status(500).json({ error: 'Error buscando Patients en FHIR', details: error.message });
  }
});

app.get('/api/fhir/condition', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchConditions(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Conditions:', error);
    res.status(500).json({ error: 'Error buscando Conditions en FHIR', details: error.message });
  }
});

app.get('/api/fhir/medication', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchMedications(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Medications:', error);
    res.status(500).json({ error: 'Error buscando Medications en FHIR', details: error.message });
  }
});

app.get('/api/fhir/medication-request', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchMedicationRequests(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando MedicationRequests:', error);
    res.status(500).json({ error: 'Error buscando MedicationRequests en FHIR', details: error.message });
  }
});

// ==================== FHIR ENCOUNTER OPERATIONS ====================

app.post('/api/fhir/encounter', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Encounter' });
  }
  try {
    const response = await fhirClient.createEncounter(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando Encounter:', error);
    res.status(500).json({ error: 'Error enviando Encounter a FHIR', details: error.message });
  }
});

app.get('/api/fhir/encounter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readEncounter(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Encounter:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Encounter no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Encounter desde FHIR', details: error.message });
    }
  }
});

app.put('/api/fhir/encounter/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Encounter' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateEncounter(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Encounter:', error);
    res.status(500).json({ error: 'Error actualizando Encounter en FHIR', details: error.message });
  }
});

app.delete('/api/fhir/encounter/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteEncounter(id);
    res.json({ success: true, message: 'Encounter eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Encounter:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Encounter no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Encounter desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/encounter', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchEncounters(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Encounters:', error);
    res.status(500).json({ error: 'Error buscando Encounters en FHIR', details: error.message });
  }
});

// ==================== FHIR OBSERVATION OPERATIONS ====================

app.post('/api/fhir/observation', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Observation' });
  }
  try {
    const response = await fhirClient.createObservation(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando Observation:', error);
    res.status(500).json({ error: 'Error enviando Observation a FHIR', details: error.message });
  }
});

app.get('/api/fhir/observation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readObservation(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Observation:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Observation no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Observation desde FHIR', details: error.message });
    }
  }
});

app.put('/api/fhir/observation/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Observation' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateObservation(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Observation:', error);
    res.status(500).json({ error: 'Error actualizando Observation en FHIR', details: error.message });
  }
});

app.delete('/api/fhir/observation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteObservation(id);
    res.json({ success: true, message: 'Observation eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Observation:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Observation no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Observation desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/observation', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchObservations(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Observations:', error);
    res.status(500).json({ error: 'Error buscando Observations en FHIR', details: error.message });
  }
});

// ==================== FHIR COMPOSITION OPERATIONS ====================

app.post('/api/fhir/composition', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Composition' });
  }
  try {
    const response = await fhirClient.createComposition(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando Composition:', error);
    res.status(500).json({ error: 'Error enviando Composition a FHIR', details: error.message });
  }
});

app.get('/api/fhir/composition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readComposition(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Composition:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Composition no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Composition desde FHIR', details: error.message });
    }
  }
});

app.put('/api/fhir/composition/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Composition' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updateComposition(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Composition:', error);
    res.status(500).json({ error: 'Error actualizando Composition en FHIR', details: error.message });
  }
});

app.delete('/api/fhir/composition/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deleteComposition(id);
    res.json({ success: true, message: 'Composition eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Composition:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Composition no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Composition desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/composition', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchCompositions(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Compositions:', error);
    res.status(500).json({ error: 'Error buscando Compositions en FHIR', details: error.message });
  }
});

// ==================== FHIR PRACTITIONER OPERATIONS ====================

app.post('/api/fhir/practitioner', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Practitioner' });
  }
  try {
    const response = await fhirClient.createPractitioner(resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error creando Practitioner:', error);
    res.status(500).json({ error: 'Error enviando Practitioner a FHIR', details: error.message });
  }
});

app.get('/api/fhir/practitioner/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await fhirClient.readPractitioner(id);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error leyendo Practitioner:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Practitioner no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error leyendo Practitioner desde FHIR', details: error.message });
    }
  }
});

app.put('/api/fhir/practitioner/:id', async (req, res) => {
  const { resource } = req.body || {};
  if (!resource) {
    return res.status(400).json({ error: 'Falta el recurso Practitioner' });
  }
  try {
    const { id } = req.params;
    const response = await fhirClient.updatePractitioner(id, resource);
    res.json({ success: true, resource: response });
  } catch (error) {
    console.error('❌ [FHIR] Error actualizando Practitioner:', error);
    res.status(500).json({ error: 'Error actualizando Practitioner en FHIR', details: error.message });
  }
});

app.delete('/api/fhir/practitioner/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await fhirClient.deletePractitioner(id);
    res.json({ success: true, message: 'Practitioner eliminado correctamente' });
  } catch (error) {
    console.error('❌ [FHIR] Error eliminando Practitioner:', error);
    if (error.message.includes('404')) {
      res.status(404).json({ error: 'Practitioner no encontrado', details: error.message });
    } else {
      res.status(500).json({ error: 'Error eliminando Practitioner desde FHIR', details: error.message });
    }
  }
});

app.get('/api/fhir/practitioner', async (req, res) => {
  try {
    const queryParams = req.query;
    const response = await fhirClient.searchPractitioners(queryParams);
    res.json({ success: true, bundle: response });
  } catch (error) {
    console.error('❌ [FHIR] Error buscando Practitioners:', error);
    res.status(500).json({ error: 'Error buscando Practitioners en FHIR', details: error.message });
  }
});

// ==================== FHIR METADATA ====================

app.get('/api/fhir/metadata', async (req, res) => {
  try {
    const response = await fhirClient.getCapabilityStatement();
    res.json({ success: true, capabilityStatement: response });
  } catch (error) {
    console.error('❌ [FHIR] Error obteniendo CapabilityStatement:', error);
    res.status(500).json({ error: 'Error obteniendo CapabilityStatement desde FHIR', details: error.message });
  }
});

// ==================== ENDPOINTS SCRAPER ADRES (manual) ====================

// POST: Iniciar consulta vía scraper (modo interactivo: requiere captcha en consola)
app.post('/api/adres-scraper/consultar', (req, res) => {
  try {
    const { numero_documento, tipo_documento } = req.body || {};
    if (!numero_documento) {
      return res.status(400).json({
        success: false,
        error: 'Número de documento es requerido',
        message: 'Debe proporcionar un número de documento para consultar'
      });
    }
    const docType = (tipo_documento || 'CC');
    const started = adresScraper.startInteractiveConsulta(docType, String(numero_documento), { headless: false });

    return res.status(202).json({
      success: true,
      mode: 'manual',
      message: 'Scraper iniciado. Ingrese el captcha en la consola del servidor. Luego consulte el resultado.',
      pid: started.pid,
      resultPath: started.resultPath
    });
  } catch (error) {
    console.error('❌ [ADRES SCRAPER] Error iniciando scraper:', error);
    return res.status(500).json({
      success: false,
      error: 'Error iniciando scraper',
      message: error.message || 'Error desconocido'
    });
  }
});

// GET: Obtener último resultado del scraper
app.get('/api/adres-scraper/resultado', (req, res) => {
  try {
    const result = adresScraper.readLastResult();
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'No hay resultado disponible. Ejecute primero la consulta del scraper.'
      });
    }
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('❌ [ADRES SCRAPER] Error leyendo resultado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error leyendo resultado',
      message: error.message || 'Error desconocido'
    });
  }
});

// ==================== ENDPOINT CONSULTA ADRES ====================

// GET: Consultar datos de paciente desde ADRES por número de documento
app.get('/api/pacientes/consultar-adres/:numero_documento', async (req, res) => {
  try {
    const { numero_documento } = req.params;
    const { tipo_documento } = req.query; // Opcional: CC, TI, CE
    
    if (!numero_documento) {
      return res.status(400).json({ 
        success: false,
        error: 'Número de documento es requerido',
        message: 'Debe proporcionar un número de documento para consultar'
      });
    }
    
    // Verificar si hay API key configurada
    const apiKey = process.env.APITUDE_API_KEY;
    if (!apiKey) {
      console.log(`📥 [ADRES] Consulta sin API key configurada para documento: ${numero_documento}`);
      return res.status(503).json({
        success: false,
        error: 'API no configurada',
        message: 'La integración con ADRES no está configurada. Para activarla, agregue APITUDE_API_KEY en el archivo .env. Mientras tanto, puede ingresar los datos manualmente.',
        datos: null,
        requiere_configuracion: true
      });
    }
    
    console.log(`📥 [ADRES] Consultando documento: ${numero_documento} (${tipo_documento || 'CC'})`);
    
    const datos = await adresService.consultarADRES(
      numero_documento, 
      tipo_documento || 'CC'
    );
    
    if (!datos) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró información del paciente en ADRES. Puede ingresar los datos manualmente.',
        datos: null
      });
    }
    
    console.log(`✅ [ADRES] Datos encontrados para documento: ${numero_documento}`);
    res.json({
      success: true,
      datos: datos,
      message: 'Datos encontrados correctamente'
    });
  } catch (error) {
    console.error('❌ [ADRES] Error en endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Error consultando ADRES',
      message: error.message || 'Error desconocido al consultar datos del paciente'
    });
  }
});

// Endpoint para verificar usuarios en la BD del servidor
app.get('/api/debug/users', (req, res) => {
  console.log('🔍 [DEBUG] Verificando usuarios en la BD del servidor...');
  
  db.all("SELECT * FROM Usuarios ORDER BY usuario_id", (err, usuarios) => {
    if (err) {
      console.error('Error:', err);
      return res.status(500).json({ error: 'Error consultando usuarios' });
    }
    
    console.log(`📋 [DEBUG] Usuarios encontrados: ${usuarios.length}`);
    usuarios.forEach(user => {
      console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}`);
    });
    
    res.json({
      message: 'Usuarios en la BD del servidor',
      count: usuarios.length,
      users: usuarios,
      dbPath: dbPath
    });
  });
});





// ==================== ENDPOINTS DE ANTECEDENTES FAMILIARES ====================

// Obtener árbol familiar completo
app.get('/api/familias/:id/arbol', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      f.familia_id,
      f.apellido_principal,
      p.paciente_id,
      p.primer_nombre || ' ' || p.primer_apellido as nombre_completo,
      p.parentesco,
      p.fecha_nacimiento,
      p.genero,
      padre.primer_nombre || ' ' || padre.primer_apellido as nombre_padre,
      madre.primer_nombre || ' ' || madre.primer_apellido as nombre_madre
    FROM Pacientes p
    JOIN Familias f ON p.familia_id = f.familia_id
    LEFT JOIN Pacientes padre ON p.id_padre = padre.paciente_id
    LEFT JOIN Pacientes madre ON p.id_madre = madre.paciente_id
    WHERE p.familia_id = ? AND p.activo = 1
    ORDER BY p.parentesco, p.fecha_nacimiento
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo árbol familiar:', err);
      console.error('Error details:', err.message);
      return res.status(500).json({ error: 'Error obteniendo árbol familiar: ' + err.message });
    }
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// Obtener antecedentes familiares de un paciente
app.get('/api/pacientes/:id/antecedentes-familiares', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      af.paciente_id,
      p.primer_nombre || ' ' || p.primer_apellido as paciente_nombre,
      af.parentesco,
      f.primer_nombre || ' ' || f.primer_apellido as familiar_nombre,
      af.condicion_salud,
      af.diagnostico,
      af.gravedad,
      af.estado_actual,
      af.fecha_diagnostico,
      af.fuente_antecedente
    FROM Antecedentes_Familiares af
    JOIN Pacientes p ON af.paciente_id = p.paciente_id
    JOIN Pacientes f ON af.familiar_id = f.paciente_id
    WHERE af.paciente_id = ?
    ORDER BY af.parentesco, af.gravedad DESC
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo antecedentes familiares:', err);
      console.error('Error details:', err.message);
      return res.status(500).json({ error: 'Error obteniendo antecedentes familiares: ' + err.message });
    }
    
    res.json({
      success: true,
      data: rows,
      total: rows.length,
      automaticos: rows.filter(r => r.fuente_antecedente === 'Automático').length
    });
  });
});

// Registrar condición de salud familiar (para propagación automática)
app.post('/api/condiciones-salud-familiares', (req, res) => {
  const {
    paciente_id,
    condicion_salud,
    diagnostico,
    fecha_diagnostico,
    gravedad,
    es_hereditario,
    estado,
    especialidad
  } = req.body;

  if (!paciente_id || !condicion_salud) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: paciente_id, condicion_salud'
    });
  }

  const insert = `
    INSERT INTO Condiciones_Salud_Familiares (
      paciente_id, condicion_salud, diagnostico, fecha_diagnostico,
      gravedad, es_hereditario, estado, especialidad
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(insert, [
    paciente_id,
    condicion_salud,
    diagnostico || null,
    fecha_diagnostico || new Date().toISOString().split('T')[0],
    gravedad || 'Moderada',
    es_hereditario ? 1 : 0,
    estado || 'Activo',
    especialidad || 'Medicina General'
  ], function(err) {
    if (err) {
      console.error('Error registrando condición de salud:', err);
      return res.status(500).json({ error: 'Error registrando condición de salud: ' + err.message });
    }

    res.status(201).json({
      success: true,
      condicion_id: this.lastID,
      message: 'Condición de salud registrada y propagada a familiares'
    });
  });
});

// Establecer relaciones familiares para un paciente
app.put('/api/pacientes/:id/relaciones-familiares', (req, res) => {
  const { id } = req.params;
  const { id_padre, id_madre, parentesco } = req.body;
  
  const update = `
    UPDATE Pacientes 
    SET id_padre = ?, id_madre = ?, parentesco = ?
    WHERE paciente_id = ?
  `;
  
  db.run(update, [
    id_padre || null,
    id_madre || null, 
    parentesco || null,
    id
  ], function(err) {
    if (err) {
      console.error('Error actualizando relaciones familiares:', err);
      return res.status(500).json({ error: 'Error actualizando relaciones familiares: ' + err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    res.json({
      success: true,
      message: 'Relaciones familiares actualizadas correctamente'
    });
  });
});

// Obtener pacientes por familia para gestión de relaciones
app.get('/api/familias/:id/pacientes-completos', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      p.paciente_id,
      p.numero_documento,
      p.tipo_documento,
      p.primer_nombre,
      p.segundo_nombre,
      p.primer_apellido,
      p.segundo_apellido,
      p.fecha_nacimiento,
      p.genero,
      p.parentesco,
      p.id_padre,
      p.id_madre,
      padre.primer_nombre || ' ' || padre.primer_apellido as nombre_padre,
      madre.primer_nombre || ' ' || madre.primer_apellido as nombre_madre
    FROM Pacientes p
    LEFT JOIN Pacientes padre ON p.id_padre = padre.paciente_id
    LEFT JOIN Pacientes madre ON p.id_madre = madre.paciente_id
    WHERE p.familia_id = ? AND p.activo = 1
    ORDER BY p.fecha_nacimiento
  `;
  
  db.all(query, [id], (err, rows) => {
    if (err) {
      console.error('Error obteniendo pacientes de familia:', err);
      return res.status(500).json({ error: 'Error obteniendo pacientes: ' + err.message });
    }
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// ==================== RUTAS BÁSICAS PARA PRODUCCIÓN ====================

// Ruta raíz - Health check básico
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Salud Digital APS Backend - Funcionando ✅',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes: [
      '/api/auth/login',
      '/api/familias',
      '/api/pacientes/buscar',
      '/api/hc/medicina',
      '/api/hc/psicologia',
      '/api/health',
      '/api/test'
    ]
  });
});

// Rutas básicas de API (para compatibilidad)
app.get('/api/usuarios', (req, res) => {
  res.json({ message: 'Use /api/usuarios/rol/:rol para obtener usuarios por rol' });
});

app.get('/api/pacientes', (req, res) => {
  res.json({ message: 'Use /api/pacientes/buscar?q=termino para buscar pacientes' });
});

app.get('/api/login', (req, res) => {
  res.json({ message: 'Use POST /api/auth/login para autenticación' });
});

// Health check extendido
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor de Salud Digital APS funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'Connected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ==================== ENDPOINTS DE INTELIGENCIA ARTIFICIAL ====================

// POST: Predecir riesgo de stroke
app.post('/api/ai/predict/stroke', async (req, res) => {
  try {
    const patientData = req.body;
    
    console.log('🤖 [AI] Predicción de stroke solicitada:', {
      age: patientData.age,
      gender: patientData.gender,
      hasVitals: !!(patientData.tensionSistolica || patientData.glucometria),
      hasAntecedentes: !!patientData.antecedentesPersonales,
      hasTerritorio: !!patientData.territorio,
      hasOcupacion: !!patientData.ocupacion
    });

    const result = await aiService.predictStrokeRisk(patientData);
    
    if (result.success) {
      console.log('✅ [AI] Predicción exitosa:', {
        riskLevel: result.risk_level,
        probability: result.probability
      });
      res.json(result);
    } else {
      console.error('❌ [AI] Error en predicción:', result.error);
      console.error('❌ [AI] Detalles del error:', result.details);
      // Devolver 400 para errores de validación, 500 para errores del servidor
      const statusCode = result.error && result.error.includes('Faltan campos') ? 400 : 500;
      res.status(statusCode).json(result);
    }
  } catch (error) {
    console.error('❌ [AI] Error en endpoint predict/stroke:', error);
    console.error('❌ [AI] Error message:', error.message);
    console.error('❌ [AI] Error stack:', error.stack);
    
    // En desarrollo, incluir más detalles del error
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: isDevelopment ? error.message : 'Error al procesar la solicitud',
      stack: isDevelopment ? error.stack : undefined
    });
  }
});

// GET: Sugerir diagnósticos basados en síntomas (placeholder)
app.get('/api/ai/suggest/diagnosis', async (req, res) => {
  try {
    const { symptoms, patientData } = req.query;
    
    if (!symptoms) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro "symptoms" es requerido'
      });
    }

    const patientDataObj = patientData ? JSON.parse(patientData) : {};
    const result = await aiService.suggestDiagnosis(symptoms, patientDataObj);
    
    res.json(result);
  } catch (error) {
    console.error('❌ [AI] Error en endpoint suggest/diagnosis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// POST: Generar resumen automático de consulta (placeholder)
app.post('/api/ai/generate/summary', async (req, res) => {
  try {
    const { clinicalNotes } = req.body;
    
    if (!clinicalNotes) {
      return res.status(400).json({
        success: false,
        error: 'Campo "clinicalNotes" es requerido'
      });
    }

    const result = await aiService.generateSummary(clinicalNotes);
    res.json(result);
  } catch (error) {
    console.error('❌ [AI] Error en endpoint generate/summary:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
});

// Test endpoint simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ Test endpoint funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${dbPath}`);
});