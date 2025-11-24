/**
 * Mapea datos de la aplicación a features requeridas por los modelos de ML
 */

/**
 * Mapea datos del paciente de la app a features del modelo de stroke
 * @param {Object} patientData - Datos del paciente desde la app
 * @returns {Object} Features mapeadas para el modelo
 */
function mapToStrokeFeatures(patientData) {
  const {
    age,
    gender,
    estadoCivil,
    tensionSistolica,
    tensionDiastolica,
    frecuenciaCardiaca,
    peso,
    talla,
    imc,
    glucometria,
    antecedentesPersonales = {},
    antecedentesFamiliares = '',
    revisionPorSistemas = {},
    // Nuevos campos desde caracterización
    territorio = '',
    ocupacion = '',
    smokingStatus = 'never smoked'
  } = patientData;

  // Calcular IMC si no está disponible
  let calculatedBMI = null;
  
  // Verificar si IMC es válido (no vacío, no "0", no "0.00")
  if (imc && imc !== '' && imc !== '0' && imc !== '0.00') {
    const imcNum = parseFloat(imc);
    if (!isNaN(imcNum) && imcNum > 0) {
      calculatedBMI = imcNum;
    }
  }
  
  // Si IMC no es válido, calcular desde peso y talla
  if (!calculatedBMI && peso && talla) {
    const pesoNum = parseFloat(peso);
    const tallaNum = parseFloat(talla);
    // Talla puede estar en metros (1.70) o cm (170)
    let tallaEnMetros = tallaNum;
    if (tallaNum > 3) {
      // Probablemente está en cm, convertir a metros
      tallaEnMetros = tallaNum / 100;
    }
    
    if (!isNaN(pesoNum) && !isNaN(tallaEnMetros) && pesoNum > 0 && tallaEnMetros > 0) {
      calculatedBMI = pesoNum / (tallaEnMetros * tallaEnMetros);
    }
  }

  // Mapear género
  let gender_Male = 0;
  let gender_Other = 0;
  if (gender) {
    const genderLower = gender.toLowerCase();
    if (genderLower.includes('masculino') || genderLower.includes('male') || genderLower === 'm') {
      gender_Male = 1;
    } else if (genderLower.includes('otro') || genderLower.includes('other')) {
      gender_Other = 1;
    }
  }

  // Detectar hipertensión desde antecedentes o signos vitales
  let hypertension = 0;
  const antecedentesText = typeof antecedentesPersonales === 'string' 
    ? antecedentesPersonales 
    : (antecedentesPersonales.patologicos || '');
  
  if (antecedentesText.toLowerCase().includes('hipertens') || 
      antecedentesText.toLowerCase().includes('hta') ||
      antecedentesText.toLowerCase().includes('presión alta')) {
    hypertension = 1;
  } else if (tensionSistolica && tensionDiastolica) {
    // Considerar hipertensión si TA > 140/90
    const taSist = parseFloat(tensionSistolica);
    const taDiast = parseFloat(tensionDiastolica);
    if (taSist > 140 || taDiast > 90) {
      hypertension = 1;
    }
  }

  // Detectar enfermedad cardiaca
  let heart_disease = 0;
  const antecedentesLower = antecedentesText.toLowerCase();
  if (antecedentesLower.includes('cardiac') ||
      antecedentesLower.includes('corazón') ||
      antecedentesLower.includes('corazon') ||
      antecedentesLower.includes('cardiovascular') ||
      antecedentesLower.includes('infarto') ||
      antecedentesLower.includes('arritmia') ||
      antecedentesLower.includes('cardiopatía') ||
      antecedentesLower.includes('cardiopatia')) {
    heart_disease = 1;
  }
  
  // También verificar en antecedentes familiares
  if (antecedentesFamiliares) {
    const familiaresLower = antecedentesFamiliares.toLowerCase();
    if (familiaresLower.includes('cardiac') ||
        familiaresLower.includes('corazón') ||
        familiaresLower.includes('corazon') ||
        familiaresLower.includes('cardiovascular') ||
        familiaresLower.includes('infarto')) {
      // Los antecedentes familiares aumentan el riesgo pero no se consideran como enfermedad propia
      // Podríamos ajustar esto según necesidad
    }
  }

  // Estado civil
  const ever_married_Yes = (estadoCivil && 
    (estadoCivil.toLowerCase().includes('casado') || 
     estadoCivil.toLowerCase().includes('casada') ||
     estadoCivil.toLowerCase().includes('married'))) ? 1 : 0;

  // Tipo de trabajo - usar ocupación de caracterización
  // El modelo usa one-hot encoding con 4 variables para 5 categorías:
  // 1. Self-employed → work_type_Self_employed = 1
  // 2. Private → work_type_Private = 1
  // 3. Government Job → todas las variables = 0 (categoría base)
  // 4. children → work_type_children = 1
  // 5. Never_worked → work_type_Never_worked = 1
  
  let work_type_Never_worked = 0;
  let work_type_Private = 0;
  let work_type_Self_employed = 0;
  let work_type_children = 0;
  
  if (ocupacion) {
    const ocupacionLower = ocupacion.toLowerCase();
    
    // 1. Detectar niños/estudiantes primero (tiene prioridad)
    if (ocupacionLower.includes('estudiante') || 
        ocupacionLower.includes('niño') ||
        ocupacionLower.includes('menor') ||
        ocupacionLower.includes('escolar') ||
        ocupacionLower.includes('infante')) {
      work_type_children = 1;
    }
    // 2. Detectar nunca trabajó
    else if (ocupacionLower.includes('nunca') || 
             ocupacionLower.includes('desempleado') ||
             ocupacionLower.includes('sin trabajo') ||
             ocupacionLower.includes('no trabaja') ||
             (ocupacionLower.includes('jubilado') && !ocupacionLower.includes('trabaj'))) {
      work_type_Never_worked = 1;
    }
    // 3. Detectar trabajo gubernamental (categoría base - todas las variables = 0)
    else if (ocupacionLower.includes('gobierno') ||
             ocupacionLower.includes('gubernamental') ||
             ocupacionLower.includes('público') ||
             ocupacionLower.includes('publico') ||
             ocupacionLower.includes('estatal') ||
             ocupacionLower.includes('funcionario') ||
             ocupacionLower.includes('servidor público') ||
             ocupacionLower.includes('militar') ||
             ocupacionLower.includes('policía') ||
             ocupacionLower.includes('policia') ||
             ocupacionLower.includes('docente público') ||
             ocupacionLower.includes('profesor público') ||
             ocupacionLower.includes('maestro público') ||
             ocupacionLower.includes('salud pública') ||
             ocupacionLower.includes('ministerio') ||
             ocupacionLower.includes('alcaldía') ||
             ocupacionLower.includes('alcaldia')) {
      // Government Job es la categoría base en one-hot encoding
      // Todas las variables permanecen en 0
      work_type_Never_worked = 0;
      work_type_Private = 0;
      work_type_Self_employed = 0;
      work_type_children = 0;
    }
    // 4. Detectar independiente/autónomo
    else if (ocupacionLower.includes('independiente') || 
             ocupacionLower.includes('freelance') ||
             ocupacionLower.includes('por cuenta propia') ||
             ocupacionLower.includes('autónomo') ||
             ocupacionLower.includes('autonomo') ||
             ocupacionLower.includes('comerciante') ||
             ocupacionLower.includes('empresario') ||
             ocupacionLower.includes('taxista') ||
             ocupacionLower.includes('vendedor ambulante')) {
      work_type_Self_employed = 1;
    }
    // 5. Default: trabajo privado
    else {
      work_type_Private = 1;
    }
  } else {
    // Si no hay ocupación, usar Private como default
    work_type_Private = 1;
  }

  // Tipo de residencia - desde territorio
  // Si tiene territorio (comuna, zona urbana), probablemente es urbano
  // Si no tiene territorio o es zona rural, es rural
  let Residence_type_Urban = 1; // Default urbano
  if (territorio) {
    const territorioLower = territorio.toLowerCase();
    // Si menciona "rural", "vereda", "corregimiento", etc., es rural
    if (territorioLower.includes('rural') || 
        territorioLower.includes('vereda') ||
        territorioLower.includes('corregimiento') ||
        territorioLower.includes('zona rural') ||
        territorioLower.includes('campo')) {
      Residence_type_Urban = 0;
    } else {
      // Si tiene territorio (comuna, barrio, etc.), asumir urbano
      Residence_type_Urban = 1;
    }
  }

  // Estado de tabaquismo
  let smoking_status_formerly_smoked = 0;
  let smoking_status_never_smoked = 0;
  let smoking_status_smokes = 0;
  
  const smokingLower = (smokingStatus || 'never smoked').toLowerCase();
  if (smokingLower.includes('formerly') || smokingLower.includes('ex-fumador') || smokingLower.includes('dejó')) {
    smoking_status_formerly_smoked = 1;
  } else if (smokingLower.includes('smokes') || smokingLower.includes('fuma') || smokingLower.includes('actual')) {
    smoking_status_smokes = 1;
  } else {
    smoking_status_never_smoked = 1; // Default
  }

  // Validar y limpiar valores numéricos
  const ageNum = age ? parseFloat(age) : null;
  const glucoseNum = glucometria && glucometria !== '' ? parseFloat(glucometria) : null;
  
  // Construir objeto de features con validación
  const features = {
    age: (!isNaN(ageNum) && ageNum > 0 && ageNum < 150) ? ageNum : 50, // Default 50 si no hay edad válida
    hypertension: hypertension,
    heart_disease: heart_disease,
    avg_glucose_level: (!isNaN(glucoseNum) && glucoseNum > 0 && glucoseNum < 1000) ? glucoseNum : 100, // Default 100 mg/dL
    bmi: (calculatedBMI && !isNaN(calculatedBMI) && calculatedBMI > 10 && calculatedBMI < 100) ? calculatedBMI : 25, // Default BMI 25 si no se puede calcular
    gender_Male: gender_Male,
    gender_Other: gender_Other,
    ever_married_Yes: ever_married_Yes,
    work_type_Never_worked: work_type_Never_worked,
    work_type_Private: work_type_Private,
    work_type_Self_employed: work_type_Self_employed,
    work_type_children: work_type_children,
    Residence_type_Urban: Residence_type_Urban,
    smoking_status_formerly_smoked: smoking_status_formerly_smoked,
    smoking_status_never_smoked: smoking_status_never_smoked,
    smoking_status_smokes: smoking_status_smokes
  };

  // Validar que todas las features requeridas estén presentes y sean válidas
  const requiredFeatures = [
    'age', 'hypertension', 'heart_disease', 'avg_glucose_level', 'bmi',
    'gender_Male', 'gender_Other', 'ever_married_Yes',
    'work_type_Never_worked', 'work_type_Private', 'work_type_Self_employed', 'work_type_children',
    'Residence_type_Urban',
    'smoking_status_formerly_smoked', 'smoking_status_never_smoked', 'smoking_status_smokes'
  ];

  const missingFeatures = [];
  const invalidFeatures = [];

  for (const feature of requiredFeatures) {
    if (features[feature] === undefined || features[feature] === null) {
      missingFeatures.push(feature);
    } else if (typeof features[feature] === 'number' && isNaN(features[feature])) {
      invalidFeatures.push(feature);
    }
  }

  if (missingFeatures.length > 0 || invalidFeatures.length > 0) {
    console.warn('⚠️ [DataMapper] Features inválidas detectadas:', {
      missing: missingFeatures,
      invalid: invalidFeatures
    });
  }

  // Validar rangos de valores
  if (features.age < 0 || features.age > 150) {
    console.warn('⚠️ [DataMapper] Edad fuera de rango:', features.age);
  }
  if (features.bmi < 10 || features.bmi > 100) {
    console.warn('⚠️ [DataMapper] BMI fuera de rango:', features.bmi);
  }
  if (features.avg_glucose_level < 0 || features.avg_glucose_level > 1000) {
    console.warn('⚠️ [DataMapper] Glucosa fuera de rango:', features.avg_glucose_level);
  }

  // Validar que las variables categóricas sean 0 o 1
  const categoricalFeatures = [
    'hypertension', 'heart_disease', 'gender_Male', 'gender_Other', 'ever_married_Yes',
    'work_type_Never_worked', 'work_type_Private', 'work_type_Self_employed', 'work_type_children',
    'Residence_type_Urban',
    'smoking_status_formerly_smoked', 'smoking_status_never_smoked', 'smoking_status_smokes'
  ];

  for (const feature of categoricalFeatures) {
    if (features[feature] !== 0 && features[feature] !== 1) {
      console.warn(`⚠️ [DataMapper] Feature categórica inválida ${feature}:`, features[feature]);
      // Normalizar a 0 o 1
      features[feature] = features[feature] ? 1 : 0;
    }
  }

  console.log('✅ [DataMapper] Features validadas y listas para enviar a Python');
  return features;
}

/**
 * Valida que los datos mínimos estén presentes para hacer una predicción
 * @param {Object} patientData - Datos del paciente
 * @returns {Object} { valid: boolean, missingFields: string[] }
 */
function validateStrokeData(patientData) {
  const required = ['age'];
  const missing = [];
  
  for (const field of required) {
    if (!patientData[field] && patientData[field] !== 0) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missingFields: missing
  };
}

module.exports = {
  mapToStrokeFeatures,
  validateStrokeData
};

