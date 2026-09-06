import { useState, useEffect } from 'react';
import { ocorrenciaService } from '../services/api';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const viaNominatim = async (lat, lng) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
  if (!res.ok) throw new Error('nominatim indisponível');
  const data = await res.json();
  const addr = data?.address || {};
  const rua = addr.road || '';
  const numero = addr.house_number || '';
  const ruaComNumero = rua ? (numero ? `${rua}, ${numero}` : rua) : '';
  const bairro = addr.suburb || addr.neighbourhood || '';
  const cidade = addr.city || addr.town || addr.village || '';
  return [ruaComNumero, bairro, cidade].filter(Boolean).join(', ');
};

const viaPhoton = async (lat, lng) => {
  const res = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}&lang=default`);
  if (!res.ok) throw new Error('photon indisponível');
  const data = await res.json();
  const props = data?.features?.[0]?.properties || {};
  const rua = props.street || props.name || '';
  const numero = props.housenumber || '';
  const ruaComNumero = rua ? (numero ? `${rua}, ${numero}` : rua) : '';
  const bairro = props.district || props.locality || '';
  const cidade = props.city || '';
  return [ruaComNumero, bairro, cidade].filter(Boolean).join(', ');
};

const viaBigDataCloud = async (lat, lng) => {
  const res = await fetch(`https://api-bdc.io/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`);
  if (!res.ok) throw new Error('bigdatacloud indisponível');
  const data = await res.json();
  const partes = [data.locality, data.city, data.principalSubdivision]
    .filter((parte, index, arr) => parte && arr.indexOf(parte) === index);
  return partes.join(', ');
};

/**
 * Resolve um endereço legível para coordenadas usando a cadeia
 * Nominatim → Photon → BigDataCloud. Retorna { texto, preciso }:
 * `preciso` indica resultado em nível de rua (confiável para persistir).
 */
export async function resolverEndereco(lat, lng) {
  let texto = '';
  let preciso = false;
  try {
    texto = await viaNominatim(lat, lng);
    preciso = Boolean(texto);
  } catch { /* tenta o próximo */ }
  if (!texto) {
    try {
      texto = await viaPhoton(lat, lng);
      preciso = Boolean(texto);
    } catch { /* tenta o próximo */ }
  }
  if (!texto) {
    try { texto = await viaBigDataCloud(lat, lng); } catch { /* sem endereço */ }
  }
  return { texto, preciso };
}

/**
 * Hook de geocodificação reversa compartilhado: recebe itens com { id, gps, endereco }
 * e retorna um mapa { [gps]: endereço legível }.
 * Ordem: Nominatim (rua+número) → Photon (rua) → BigDataCloud (cidade, aproximado).
 * Resultados com nível de rua ficam em cache no localStorage (geocodeCacheV3) e são
 * persistidos no backend (PATCH /solicitacoes/{id}/endereco) para registros sem endereço.
 */
export default function useEnderecos(items) {
  const [enderecos, setEnderecos] = useState({});

  useEffect(() => {
    if (!items || !items.length) return;
    const cache = JSON.parse(localStorage.getItem('geocodeCacheV3') || '{}');
    const persistidos = JSON.parse(localStorage.getItem('geocodePersistidosV1') || '{}');

    const persistir = (item, texto) => {
      if (!item?.id || persistidos[item.id]) return;
      persistidos[item.id] = true;
      localStorage.setItem('geocodePersistidosV1', JSON.stringify(persistidos));
      ocorrenciaService.atualizarEndereco(item.id, texto).catch(() => {
        delete persistidos[item.id];
        localStorage.setItem('geocodePersistidosV1', JSON.stringify(persistidos));
      });
    };

    // Resolve imediatamente o que já está em cache
    const doCache = {};
    const pendentes = [];
    for (const row of items) {
      if (!row || !row.gps) continue;
      if (row.endereco) continue;
      if (cache[row.gps]) {
        doCache[row.gps] = cache[row.gps];
        persistir(row, cache[row.gps]); // grava no banco o que já está em cache
      } else if (!enderecos[row.gps]) {
        pendentes.push(row);
      }
    }
    if (Object.keys(doCache).length) setEnderecos((prev) => ({ ...prev, ...doCache }));
    if (!pendentes.length) return;

    let cancelled = false;

    (async () => {
      let nominatimOk = true;
      const vistos = new Set();
      for (const item of pendentes) {
        if (cancelled) return;
        const gps = item.gps;
        if (vistos.has(gps)) continue;
        vistos.add(gps);
        const [lat, lng] = gps.split(',').map((v) => parseFloat(v.trim()));
        if (isNaN(lat) || isNaN(lng)) continue;

        let texto = '';
        let preciso = false; // só resultados com nível de rua entram no cache
        if (nominatimOk) {
          try {
            texto = await viaNominatim(lat, lng);
            preciso = Boolean(texto);
            await delay(1100); // respeita o limite de 1 req/s do Nominatim
          } catch {
            nominatimOk = false; // IP limitado: passa a usar os fallbacks
          }
        }
        if (!texto) {
          try {
            texto = await viaPhoton(lat, lng);
            preciso = Boolean(texto);
          } catch { /* tenta o próximo */ }
        }
        if (!texto) {
          try { texto = await viaBigDataCloud(lat, lng); } catch { /* mantém GPS */ }
        }

        if (texto && !cancelled) {
          if (preciso) {
            cache[gps] = texto;
            localStorage.setItem('geocodeCacheV3', JSON.stringify(cache));
            persistir(item, texto); // salva o endereço completo no sistema
          }
          setEnderecos((prev) => ({ ...prev, [gps]: texto }));
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return enderecos;
}
