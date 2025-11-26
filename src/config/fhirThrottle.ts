const toNumber = (value: string | number | undefined, fallback: number): number => {
  if (value === undefined || value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULTS = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 500,
  OBSERVATION_BATCH_SIZE: 2,
  OBSERVATION_BATCH_DELAY_MS: 200
};

export const FHIR_THROTTLE = {
  MAX_RETRIES: toNumber(import.meta.env.VITE_FHIR_MAX_RETRIES, DEFAULTS.MAX_RETRIES),
  BASE_DELAY_MS: toNumber(import.meta.env.VITE_FHIR_BASE_DELAY_MS, DEFAULTS.BASE_DELAY_MS),
  OBSERVATION_BATCH_SIZE: Math.max(
    1,
    toNumber(import.meta.env.VITE_FHIR_OBSERVATION_BATCH_SIZE, DEFAULTS.OBSERVATION_BATCH_SIZE)
  ),
  OBSERVATION_BATCH_DELAY_MS: Math.max(
    0,
    toNumber(import.meta.env.VITE_FHIR_OBSERVATION_BATCH_DELAY_MS, DEFAULTS.OBSERVATION_BATCH_DELAY_MS)
  )
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));



