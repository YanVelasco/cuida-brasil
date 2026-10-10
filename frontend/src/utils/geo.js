/** Utilidades de geolocalização compartilhadas entre as páginas admin. */

export function parseGps(gps) {
  if (!gps) return null;
  const raw = String(gps).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/\s+/g, ' ')
    .replace(/\(|\)|\[|\]/g, '')
    .replace(/lat\s*[:=]/gi, ' latitude=')
    .replace(/lng\s*[:=]/gi, ' longitude=')
    .replace(/lon\s*[:=]/gi, ' longitude=')
    .replace(/;/g, ',')
    .replace(/,/g, ' ');

  const matches = Array.from(cleaned.matchAll(/[-+]?\d{1,3}(?:[.,]\d+)?/g), (match) => {
    const value = Number(match[0].replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }).filter((value) => value !== null);

  if (matches.length < 2) return null;

  const latitudeMatch = raw.match(/lat(?:itude)?\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);
  const longitudeMatch = raw.match(/(?:lng|lon|longitude)\s*[:=]?\s*[-+]?\d{1,3}(?:[.,]\d+)?/i);

  const latitude = latitudeMatch
    ? Number(latitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim())
    : Number(matches[0]);
  const longitude = longitudeMatch
    ? Number(longitudeMatch[0].split(/[:=]/).pop().replace(',', '.').trim())
    : Number(matches[1]);

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return null;
  }

  return { latitude, longitude };
}

function isAddressNumber(value) {
  return /^\d[\d\s./-]*[A-Za-z]?$/.test(value);
}

/** Extrai bairro/localidade do endereço com a mesma regra usada nos relatórios. */
export function resolveRegionFromAddress(address) {
  if (!address || !String(address).trim()) return null;

  const rawAddress = String(address).trim();
  const hyphenParts = rawAddress.split(' - ');
  if (hyphenParts.length > 1) {
    const candidate = hyphenParts[1].split(',')[0].trim();
    if (candidate && !isAddressNumber(candidate)) return candidate;
  }

  const textParts = rawAddress.split(',').map(part => part.trim()).filter(part => part && !isAddressNumber(part));
  if (textParts.length > 1) return textParts[1];
  if (textParts.length === 1) return textParts[0];
  return null;
}

/** Classifica coordenadas em zonas de São Paulo, com os rótulos do backend. */
export function resolveRegionFromGps(gps) {
  const coords = parseGps(gps);
  if (!coords) return 'Não informada';

  const { latitude, longitude } = coords;
  const deltaLatitude = latitude - (-23.5505);
  const deltaLongitude = longitude - (-46.6333);
  if (Math.abs(deltaLatitude) < 0.02 && Math.abs(deltaLongitude) < 0.02) return 'Centro';
  if (Math.abs(deltaLatitude) >= Math.abs(deltaLongitude)) return deltaLatitude > 0 ? 'Zona Norte' : 'Zona Sul';
  return deltaLongitude > 0 ? 'Zona Leste' : 'Zona Oeste';
}

/** Prioriza bairro/localidade do endereço e usa zona GPS somente como fallback. */
export function resolveRegionFromLocation(address, gps) {
  return resolveRegionFromAddress(address) || resolveRegionFromGps(gps);
}

export function matchesRegion(address, gps, selectedRegion) {
  if (!selectedRegion) return true;
  const region = resolveRegionFromLocation(address, gps);
  return region.localeCompare(selectedRegion, 'pt-BR', { sensitivity: 'base' }) === 0;
}
