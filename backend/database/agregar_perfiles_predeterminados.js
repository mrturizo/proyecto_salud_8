const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a la base de datos SQLite');
});

// Perfiles predeterminados (públicos - creado_por_uid = NULL)
const perfilesPredeterminados = [
  {
    nombre_perfil: 'Paciente Joven Normal',
    descripcion: 'Perfil para pacientes jóvenes sin condiciones especiales',
    tipo_perfil: 'HC_Medicina',
    datos_perfil: JSON.stringify({
      motivo_consulta: 'Control de salud',
      enfoque_diferencial: {
        ciclo_vida: 'Adolescente',
        genero: 'Sin enfoque especial',
        grupo_etnico: 'No aplica',
        orientacion_sexual: 'No aplica',
        discapacidad: false,
        victima_violencia: false,
        desplazamiento: false,
        reclusion: false,
        gestante_lactante: false,
        trabajador_salud: false
      },
      enfermedad_actual: 'Paciente asintomático, en control regular',
      antecedentes_familiares: 'No refiere antecedentes familiares relevantes',
      examen_fisico: 'Paciente en buen estado general. Signos vitales estables.',
      plan_manejo: 'Control periódico. Promoción y prevención en salud.'
    })
  },
  {
    nombre_perfil: 'Paciente Adulto Mayor Normal',
    descripcion: 'Perfil para pacientes adultos mayores sin condiciones especiales',
    tipo_perfil: 'HC_Medicina',
    datos_perfil: JSON.stringify({
      motivo_consulta: 'Control de salud',
      enfoque_diferencial: {
        ciclo_vida: 'Adulto Mayor',
        genero: 'Sin enfoque especial',
        grupo_etnico: 'No aplica',
        orientacion_sexual: 'No aplica',
        discapacidad: false,
        victima_violencia: false,
        desplazamiento: false,
        reclusion: false,
        gestante_lactante: false,
        trabajador_salud: false
      },
      enfermedad_actual: 'Paciente en seguimiento por edad, refiere buen estado general',
      antecedentes_familiares: 'Antecedentes familiares de hipertensión y diabetes',
      examen_fisico: 'Paciente en buen estado general. Signos vitales estables. Sin alteraciones evidentes.',
      plan_manejo: 'Control periódico. Promoción y prevención. Seguimiento de factores de riesgo cardiovascular.'
    })
  },
  {
    nombre_perfil: 'Paciente con Hipertensión',
    descripcion: 'Perfil para pacientes con diagnóstico de hipertensión arterial',
    tipo_perfil: 'HC_Medicina',
    datos_perfil: JSON.stringify({
      motivo_consulta: 'Control de hipertensión arterial',
      enfoque_diferencial: {
        ciclo_vida: 'Adulto',
        genero: 'Sin enfoque especial',
        grupo_etnico: 'No aplica',
        orientacion_sexual: 'No aplica',
        discapacidad: false,
        victima_violencia: false,
        desplazamiento: false,
        reclusion: false,
        gestante_lactante: false,
        trabajador_salud: false
      },
      enfermedad_actual: 'Paciente con diagnóstico de hipertensión arterial en seguimiento. Refiere adherencia al tratamiento.',
      antecedentes_familiares: 'Antecedentes familiares de hipertensión y enfermedad cardiovascular',
      examen_fisico: 'Paciente en buen estado general. Signos vitales: Tensión arterial dentro de parámetros aceptables. Sin alteraciones adicionales.',
      diagnostico_principal: 'I10 - Hipertensión esencial (primaria)',
      plan_manejo: 'Continuar con tratamiento farmacológico. Control de factores de riesgo. Dieta baja en sodio. Ejercicio regular. Control en 3 meses.'
    })
  },
  {
    nombre_perfil: 'Paciente con Diabetes Tipo 2',
    descripcion: 'Perfil para pacientes con diabetes mellitus tipo 2',
    tipo_perfil: 'HC_Medicina',
    datos_perfil: JSON.stringify({
      motivo_consulta: 'Control de diabetes mellitus tipo 2',
      enfoque_diferencial: {
        ciclo_vida: 'Adulto',
        genero: 'Sin enfoque especial',
        grupo_etnico: 'No aplica',
        orientacion_sexual: 'No aplica',
        discapacidad: false,
        victima_violencia: false,
        desplazamiento: false,
        reclusion: false,
        gestante_lactante: false,
        trabajador_salud: false
      },
      enfermedad_actual: 'Paciente con diagnóstico de diabetes mellitus tipo 2 en seguimiento. Refiere adherencia al tratamiento y dieta.',
      antecedentes_familiares: 'Antecedentes familiares de diabetes mellitus',
      examen_fisico: 'Paciente en buen estado general. Signos vitales estables. Sin signos de complicaciones agudas.',
      diagnostico_principal: 'E11 - Diabetes mellitus tipo 2',
      plan_manejo: 'Continuar con tratamiento farmacológico. Monitoreo de glucemia. Dieta controlada en carbohidratos. Ejercicio regular. Control oftalmológico anual. Control en 1 mes.'
    })
  },
  {
    nombre_perfil: 'Paciente Pediátrico',
    descripcion: 'Perfil para pacientes pediátricos en control de crecimiento y desarrollo',
    tipo_perfil: 'HC_Medicina',
    datos_perfil: JSON.stringify({
      motivo_consulta: 'Control de crecimiento y desarrollo',
      enfoque_diferencial: {
        ciclo_vida: 'Niño',
        genero: 'Sin enfoque especial',
        grupo_etnico: 'No aplica',
        orientacion_sexual: 'No aplica',
        discapacidad: false,
        victima_violencia: false,
        desplazamiento: false,
        reclusion: false,
        gestante_lactante: false,
        trabajador_salud: false
      },
      enfermedad_actual: 'Paciente pediátrico en control de crecimiento y desarrollo. Refiere buen estado general.',
      antecedentes_familiares: 'No refiere antecedentes familiares relevantes',
      examen_fisico: 'Paciente en buen estado general. Signos vitales acordes a la edad. Desarrollo psicomotor adecuado.',
      plan_manejo: 'Control de crecimiento y desarrollo. Vacunación al día. Promoción de hábitos saludables. Control en 3 meses.'
    })
  }
];

const insertSQL = `
  INSERT OR REPLACE INTO Perfiles_Autocompletado 
  (nombre_perfil, descripcion, tipo_perfil, datos_perfil, creado_por_uid, activo) 
  VALUES (?, ?, ?, ?, NULL, 1)
`;

let insertados = 0;
perfilesPredeterminados.forEach((perfil) => {
  db.run(insertSQL, [
    perfil.nombre_perfil,
    perfil.descripcion,
    perfil.tipo_perfil,
    perfil.datos_perfil
  ], function(err) {
    if (err) {
      console.error(`❌ Error insertando perfil ${perfil.nombre_perfil}:`, err.message);
    } else {
      insertados++;
      console.log(`✅ Perfil insertado: ${perfil.nombre_perfil}`);
      if (insertados === perfilesPredeterminados.length) {
        console.log(`\n✅ ${insertados} perfiles predeterminados creados/actualizados`);
        db.close();
      }
    }
  });
});

console.log('📋 Creando/actualizando perfiles predeterminados...');

