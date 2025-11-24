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
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9\-]/g, '');
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

