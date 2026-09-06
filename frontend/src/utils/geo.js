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

/** Classifica coordenadas em zonas de São Paulo (mesma regra usada no Dashboard). */
export function resolveRegionFromGps(gps) {
  const coords = parseGps(gps);
  if (!coords) return 'Centro';

  const { latitude, longitude } = coords;
  if (latitude < -23.65 && longitude < -46.7) return 'Sul';
  if (latitude > -23.45 && longitude < -46.5) return 'Norte';
  if (longitude > -46.5) return 'Leste';
  if (longitude < -46.8) return 'Oeste';
  return 'Centro';
}
