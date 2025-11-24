const fetch = require('node-fetch');
const { SimpleCache } = require('../utils/simpleCache');
const localTerminology = require('./terminologyLocal');

const BASE_URL = process.env.TERMINOLOGY_BASE_URL || 'http://localhost:8180/fhir';
const CIE10_VALUESET_URL =
  process.env.CIE10_VALUESET_URL || 'https://terminology.salud.gov.co/ValueSet/cie10-demo';
const MEDS_VALUESET_URL =
  process.env.MEDS_VALUESET_URL || 'https://terminology.salud.gov.co/ValueSet/medicamentos-demo';

const cache = new SimpleCache(5 * 60 * 1000); // 5 minutos
const DEFAULT_COUNT = parseInt(process.env.TERMINOLOGY_PAGE_SIZE || '20', 10);

function buildExpandUrl(valueSetUrl, filter, count = DEFAULT_COUNT) {
  const params = new URLSearchParams({
    url: valueSetUrl,
    filter,
    count: String(count)
  });
  return `${BASE_URL}/ValueSet/$expand?${params.toString()}`;
}

function localFallback(valueSetUrl, filter, count = DEFAULT_COUNT) {
  return valueSetUrl === CIE10_VALUESET_URL
    ? localTerminology.searchCIE10(filter, count)
    : localTerminology.searchMedications(filter, count);
}

async function fetchValueSet(valueSetUrl, filter) {
  if (!filter || filter.length < 2) {
    return [];
  }

  const cacheKey = `expand:${valueSetUrl}:${filter.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const attemptRemote = async () => {
    const url = buildExpandUrl(valueSetUrl, filter);
    const response = await fetch(url, {
      headers: { Accept: 'application/fhir+json' }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Terminology expand error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return (
      data?.expansion?.contains?.map(item => ({
        code: item.code,
        display: item.display,
        system: item.system || data?.expansion?.contains?.[0]?.system,
        designation: item.designation || []
      })) || []
    );
  };

  try {
    const entries = await attemptRemote();
    if (entries.length > 0) {
      console.log(
        `[Terminology] Remoto ${valueSetUrl} -> ${entries.length} resultados para "${filter}"`
      );
      cache.set(cacheKey, entries);
      return entries;
    }
    console.warn(
      `[Terminology] Remoto ${valueSetUrl} sin resultados para "${filter}". Se usará fallback local.`
    );
    const fallback = localFallback(valueSetUrl, filter, DEFAULT_COUNT);
    cache.set(cacheKey, fallback);
    return fallback;
  } catch (error) {
    console.warn(
      `[Terminology] Error remoto (${valueSetUrl}): ${error.message}. Se usará fallback local.`
    );
    const fallback = localFallback(valueSetUrl, filter, DEFAULT_COUNT);
    cache.set(cacheKey, fallback);
    return fallback;
  }
}

async function searchCIE10(query) {
  if (!query || query.length < 2) {
    return [];
  }
  const results = localTerminology.searchCIE10(query, DEFAULT_COUNT);
  console.log(`[Terminology][Local] CIE10 -> ${results.length} resultados para "${query}"`);
  return results;
}

async function searchMedications(query) {
  if (!query || query.length < 2) {
    return [];
  }
  const results = localTerminology.searchMedications(query, DEFAULT_COUNT);
  console.log(`[Terminology][Local] Medicamentos -> ${results.length} resultados para "${query}"`);
  return results;
}

async function validateCode({ valueSetUrl, system, code, display }) {
  const body = {
    resourceType: 'Parameters',
    parameter: [
      { name: 'url', valueUri: valueSetUrl },
      { name: 'code', valueCode: code }
    ]
  };

  if (system) {
    body.parameter.push({ name: 'system', valueUri: system });
  }
  if (display) {
    body.parameter.push({ name: 'display', valueString: display });
  }

  const response = await fetch(`${BASE_URL}/ValueSet/$validate-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/fhir+json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Terminology validate error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const resultParam = data.parameter?.find(p => p.name === 'result');
  const messageParam = data.parameter?.find(p => p.name === 'message');

  return {
    result: resultParam?.valueBoolean ?? false,
    message: messageParam?.valueString || null
  };
}

module.exports = {
  searchCIE10,
  searchMedications,
  validateCode,
  constants: {
    BASE_URL,
    CIE10_VALUESET_URL,
    MEDS_VALUESET_URL
  }
};
