import { TerminologyOption } from '../services/terminologyService';

interface PractitionerInfo {
  id?: number | string;
  name?: string;
}

interface ConditionInput {
  diagnosticos: string[];
  patientReference: string;
  encounterId?: number | null;
  practitioner?: PractitionerInfo;
}

interface MedicationInput {
  medicamentos: any[];
  patientReference: string;
  practitioner?: PractitionerInfo;
  encounterId?: number | null;
  diagnosticos?: string[];
}

export function sanitizeId(value: string | number): string {
  let sanitized = String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9\-]/g, '');
  
  // HAPI FHIR requiere que los IDs asignados por el cliente tengan al menos un carácter no numérico
  // Si el ID es puramente numérico, agregamos un prefijo
  if (/^\d+$/.test(sanitized)) {
    sanitized = `id-${sanitized}`;
  }
  
  return sanitized;
}

function splitName(fullName?: string) {
  if (!fullName) {
    return {
      family: 'Desconocido',
      given: []
    };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { family: parts[0], given: [] };
  }

  return {
    family: parts.slice(-1).join(' '),
    given: parts.slice(0, -1)
  };
}

export function buildPatientResource(patient: any) {
  const documentValue = patient?.documento || patient?.numero_documento || patient?.id;
  const patientId = sanitizeId(documentValue || `patient-${Date.now()}`);
  const { family, given } = splitName(patient?.nombre);

  const resource: any = {
    resourceType: 'Patient',
    id: patientId,
    text: {
      status: 'generated',
      div: `<div>${patient?.nombre || 'Paciente sin nombre'}</div>`
    },
    identifier: [
      {
        use: 'official',
        system: 'https://www.registraduria.gov.co',
        value: documentValue || patientId
      }
    ],
    name: [
      {
        use: 'official',
        text: patient?.nombre,
        family,
        given
      }
    ],
    active: true
  };

  if (patient?.telefono) {
    resource.telecom = [
      {
        system: 'phone',
        value: patient.telefono,
        use: 'mobile'
      }
    ];
  }

  if (patient?.direccion) {
    resource.address = [
      {
        text: patient.direccion
      }
    ];
  }

  if (patient?.sexo) {
    const gender = String(patient.sexo).toLowerCase();
    if (['male', 'female', 'other', 'unknown'].includes(gender)) {
      resource.gender = gender;
    } else if (gender.startsWith('m')) {
      resource.gender = 'male';
    } else if (gender.startsWith('f')) {
      resource.gender = 'female';
    } else {
      resource.gender = 'unknown';
    }
  } else {
    resource.gender = 'unknown';
  }

  if (patient?.fecha_nacimiento) {
    resource.birthDate = patient.fecha_nacimiento;
  }

  return { resource, patientId };
}

export function parseTerminologyValue(value: string) {
  if (!value) return { code: undefined, display: undefined };
  const [code, ...rest] = value.split('-').map((part) => part.trim());
  if (rest.length === 0) {
    return { code: undefined, display: value.trim() };
  }
  return {
    code: code,
    display: rest.join(' ').trim() || value.trim()
  };
}

export function buildConditionResources({
  diagnosticos,
  patientReference,
  encounterId,
  practitioner
}: ConditionInput) {
  const recordedDate = new Date().toISOString();

  return diagnosticos
    .filter((diag) => diag && diag.trim().length > 0)
    .map((diag) => {
      const parsed = parseTerminologyValue(diag);
      return {
        resourceType: 'Condition',
        clinicalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active'
            }
          ]
        },
        verificationStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: 'confirmed'
            }
          ]
        },
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'encounter-diagnosis'
              }
            ]
          }
        ],
        code: {
          text: parsed.display,
          coding: parsed.code
            ? [
                {
                  system: 'http://hl7.org/fhir/sid/icd-10',
                  code: parsed.code,
                  display: parsed.display
                }
              ]
            : undefined
        },
        subject: { reference: patientReference },
        encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
        recordedDate,
        recorder: practitioner?.name
          ? {
              display: practitioner.name,
              reference: practitioner?.id ? `Practitioner/${practitioner.id}` : undefined
            }
          : undefined
      };
    });
}

export function buildMedicationRequestResources({
  medicamentos,
  patientReference,
  practitioner,
  encounterId,
  diagnosticos
}: MedicationInput) {
  const authoredOn = new Date().toISOString();
  const reasonCodes = (diagnosticos || [])
    .map((diag) => parseTerminologyValue(diag))
    .filter((parsed) => parsed.code || parsed.display)
    .map((parsed) => ({
      text: parsed.display,
      coding: parsed.code
        ? [
            {
              system: 'http://hl7.org/fhir/sid/icd-10',
              code: parsed.code,
              display: parsed.display
            }
          ]
        : undefined
    }));

  return medicamentos
    .filter((med) => med && med.nombre)
    .map((med) => {
      const parsed = parseTerminologyValue(med.nombre);
      const coding = [];

      if (med.codigo_invima) {
        coding.push({
          system: 'https://terminology.salud.gov.co/medicamentos/invima',
          code: med.codigo_invima,
          display: parsed.display
        });
      }

      if (med.codigo_atc) {
        coding.push({
          system: 'http://www.whocc.no/atc',
          code: med.codigo_atc,
          display: parsed.display
        });
      }

      if (coding.length === 0) {
        coding.push({
          system: 'https://terminology.salud.gov.co/medicamentos/invima',
          code: parsed.code || med.nombre,
          display: parsed.display || med.nombre
        });
      }

      const dosageText = med.dosis_frecuencia_duracion || med.indicaciones;

      return {
        resourceType: 'MedicationRequest',
        status: 'active',
        intent: 'order',
        medicationCodeableConcept: {
          coding,
          text: parsed.display || med.nombre
        },
        subject: { reference: patientReference },
        encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
        authoredOn,
        requester: practitioner?.name
          ? {
              display: practitioner.name,
              reference: practitioner?.id ? `Practitioner/${practitioner.id}` : undefined
            }
          : undefined,
        reasonCode: reasonCodes.length > 0 ? reasonCodes : undefined,
        dosageInstruction: dosageText
          ? [
              {
                text: dosageText
              }
            ]
          : undefined,
        dispenseRequest:
          med.cantidad_numerica || med.cantidad_letras
            ? {
                quantity: med.cantidad_numerica
                  ? {
                      value: Number(med.cantidad_numerica),
                      unit: med.forma_farmaceutica || 'unidad'
                    }
                  : undefined,
                expectedSupplyDuration: med.cantidad_letras
                  ? {
                      text: med.cantidad_letras
                    }
                  : undefined
              }
            : undefined,
        note: med.entregado
          ? [
              {
                text: 'Medicamento marcado como entregado'
              }
            ]
          : undefined
      };
    });
}

export function buildMedicationResources(medicamentos: any[]) {
  const unique = new Map<string, any>();

  medicamentos
    .filter((med) => med && med.nombre)
    .forEach((med) => {
      const parsed = parseTerminologyValue(med.nombre);
      const codes = [];

      if (med.codigo_invima) {
        codes.push({
          system: 'https://terminology.salud.gov.co/medicamentos/invima',
          code: med.codigo_invima,
          display: parsed.display || med.nombre
        });
      }

      if (med.codigo_atc) {
        codes.push({
          system: 'http://www.whocc.no/atc',
          code: med.codigo_atc,
          display: parsed.display || med.nombre
        });
      }

      if (codes.length === 0) {
        codes.push({
          system: 'https://terminology.salud.gov.co/medicamentos/invima',
          code: parsed.code || sanitizeId(parsed.display || med.nombre),
          display: parsed.display || med.nombre
        });
      }

      const medId = sanitizeId(med.codigo_invima || parsed.code || parsed.display || med.nombre);

      unique.set(medId, {
        resourceType: 'Medication',
        id: medId,
        status: 'active',
        code: {
          coding: codes,
          text: parsed.display || med.nombre
        }
      });
    });

  return Array.from(unique.values());
}

interface EncounterInput {
  atencion: {
    atencion_id: number;
    paciente_id: number;
    usuario_id: number;
    fecha_atencion: string;
    tipo_atencion?: string;
    estado?: string;
    observaciones?: string;
  };
  patientReference: string;
  practitioner?: PractitionerInfo;
}

export function buildEncounterResource({
  atencion,
  patientReference,
  practitioner
}: EncounterInput) {
  const encounterId = sanitizeId(atencion.atencion_id.toString());
  const periodStart = atencion.fecha_atencion || new Date().toISOString().split('T')[0];
  
  const resource: any = {
    resourceType: 'Encounter',
    id: encounterId,
    status: mapEncounterStatus(atencion.estado),
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory'
    },
    type: atencion.tipo_atencion
      ? [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0004',
                code: 'AMB',
                display: atencion.tipo_atencion
              }
            ],
            text: atencion.tipo_atencion
          }
        ]
      : undefined,
    subject: {
      reference: patientReference
    },
    period: {
      start: periodStart
    }
  };

  if (practitioner?.id || practitioner?.name) {
    resource.participant = [
      {
        type: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                code: 'ATND',
                display: 'attending'
              }
            ]
          }
        ],
        individual: practitioner.id
          ? {
              reference: `Practitioner/${practitioner.id}`,
              display: practitioner.name
            }
          : {
              display: practitioner.name
            }
      }
    ];
  }

  if (atencion.observaciones) {
    resource.reasonCode = [
      {
        text: atencion.observaciones
      }
    ];
  }

  return { resource, encounterId };
}

function mapEncounterStatus(estado?: string): string {
  if (!estado) return 'finished';
  const estadoLower = estado.toLowerCase();
  if (estadoLower.includes('completada') || estadoLower.includes('finalizada')) {
    return 'finished';
  }
  if (estadoLower.includes('en proceso') || estadoLower.includes('proceso')) {
    return 'in-progress';
  }
  if (estadoLower.includes('cancelada') || estadoLower.includes('cancelado')) {
    return 'cancelled';
  }
  return 'finished';
}

interface ObservationInput {
  signosVitales: {
    tension_arterial_sistolica?: number | string;
    tension_arterial_diastolica?: number | string;
    frecuencia_cardiaca?: number | string;
    frecuencia_respiratoria?: number | string;
    saturacion_oxigeno?: number | string;
    temperatura?: number | string;
    peso?: number | string;
    talla?: number | string;
    imc?: number | string;
    glucometria?: number | string;
    glasgow?: number | string;
  };
  patientReference: string;
  encounterReference?: string;
  practitioner?: PractitionerInfo;
  fechaObservacion?: string;
}

export function buildObservationResources({
  signosVitales,
  patientReference,
  encounterReference,
  practitioner,
  fechaObservacion
}: ObservationInput) {
  const observations: any[] = [];
  const effectiveDateTime = fechaObservacion || new Date().toISOString();

  // Tensión arterial sistólica
  if (signosVitales.tension_arterial_sistolica) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure'
          }
        ],
        text: 'Presión arterial sistólica'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.tension_arterial_sistolica),
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Tensión arterial diastólica
  if (signosVitales.tension_arterial_diastolica) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure'
          }
        ],
        text: 'Presión arterial diastólica'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.tension_arterial_diastolica),
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Frecuencia cardíaca
  if (signosVitales.frecuencia_cardiaca) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }
        ],
        text: 'Frecuencia cardíaca'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.frecuencia_cardiaca),
        unit: 'bpm',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Frecuencia respiratoria
  if (signosVitales.frecuencia_respiratoria) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '9279-1',
            display: 'Respiratory rate'
          }
        ],
        text: 'Frecuencia respiratoria'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.frecuencia_respiratoria),
        unit: 'rpm',
        system: 'http://unitsofmeasure.org',
        code: '/min'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Saturación de oxígeno
  if (signosVitales.saturacion_oxigeno) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '2708-6',
            display: 'Oxygen saturation in Arterial blood'
          }
        ],
        text: 'Saturación de oxígeno'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.saturacion_oxigeno),
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Temperatura
  if (signosVitales.temperatura) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8310-5',
            display: 'Body temperature'
          }
        ],
        text: 'Temperatura'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.temperatura),
        unit: '°C',
        system: 'http://unitsofmeasure.org',
        code: 'Cel'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Peso
  if (signosVitales.peso) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Body weight'
          }
        ],
        text: 'Peso'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.peso),
        unit: 'kg',
        system: 'http://unitsofmeasure.org',
        code: 'kg'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Talla
  if (signosVitales.talla) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8302-2',
            display: 'Body height'
          }
        ],
        text: 'Talla'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.talla),
        unit: 'cm',
        system: 'http://unitsofmeasure.org',
        code: 'cm'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // IMC
  if (signosVitales.imc) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '39156-5',
            display: 'Body mass index (BMI) [Ratio]'
          }
        ],
        text: 'Índice de masa corporal (IMC)'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.imc),
        unit: 'kg/m²',
        system: 'http://unitsofmeasure.org',
        code: 'kg/m2'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Glucometría
  if (signosVitales.glucometria) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '2339-0',
            display: 'Glucose [Mass/volume] in Blood'
          }
        ],
        text: 'Glucometría'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.glucometria),
        unit: 'mg/dL',
        system: 'http://unitsofmeasure.org',
        code: 'mg/dL'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  // Escala de Glasgow
  if (signosVitales.glasgow) {
    observations.push({
      resourceType: 'Observation',
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'exam',
              display: 'Exam'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '35088-4',
            display: 'Glasgow Coma Scale total'
          }
        ],
        text: 'Escala de Glasgow'
      },
      subject: { reference: patientReference },
      encounter: encounterReference ? { reference: encounterReference } : undefined,
      effectiveDateTime,
      valueQuantity: {
        value: Number(signosVitales.glasgow),
        unit: 'puntos',
        system: 'http://unitsofmeasure.org',
        code: '{score}'
      },
      performer: practitioner?.id
        ? [{ reference: `Practitioner/${practitioner.id}`, display: practitioner.name }]
        : practitioner?.name
        ? [{ display: practitioner.name }]
        : undefined
    });
  }

  return observations;
}

interface CompositionInput {
  encounterReference: string;
  patientReference: string;
  conditionReferences: string[];
  observationReferences: string[];
  practitioner?: PractitionerInfo;
  fechaComposicion?: string;
  tipoDocumento?: string;
  titulo?: string;
}

export function buildCompositionResource({
  encounterReference,
  patientReference,
  conditionReferences,
  observationReferences,
  practitioner,
  fechaComposicion,
  tipoDocumento,
  titulo
}: CompositionInput) {
  const date = fechaComposicion || new Date().toISOString();
  const compositionId = sanitizeId(`${encounterReference.replace('Encounter/', '')}-${Date.now()}`);

  const sections: any[] = [];

  // Sección de diagnósticos (Conditions)
  if (conditionReferences.length > 0) {
    sections.push({
      title: 'Diagnósticos',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '29548-5',
            display: 'Diagnosis'
          }
        ],
        text: 'Diagnósticos'
      },
      entry: conditionReferences.map(ref => ({ reference: ref }))
    });
  }

  // Sección de signos vitales (Observations)
  if (observationReferences.length > 0) {
    sections.push({
      title: 'Signos Vitales y Exámenes',
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8716-3',
            display: 'Vital signs'
          }
        ],
        text: 'Signos Vitales'
      },
      entry: observationReferences.map(ref => ({ reference: ref }))
    });
  }

  const resource: any = {
    resourceType: 'Composition',
    id: compositionId,
    status: 'final',
    type: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '11506-3',
          display: tipoDocumento || 'Historia Clínica'
        }
      ],
      text: tipoDocumento || 'Historia Clínica'
    },
    subject: {
      reference: patientReference
    },
    encounter: {
      reference: encounterReference
    },
    date: date,
    author: practitioner?.id
      ? [
          {
            reference: `Practitioner/${practitioner.id}`,
            display: practitioner.name
          }
        ]
      : practitioner?.name
      ? [
          {
            display: practitioner.name
          }
        ]
      : undefined,
    title: titulo || 'Historia Clínica',
    section: sections.length > 0 ? sections : undefined
  };

  return { resource, compositionId };
}

