/**
 * Utilidad de cálculo de PCL — lado cliente (sin llamadas API)
 * Espejo del calculoPCLService.js del backend.
 * Decreto 1507 de 2014 — Manual Único para la Calificación de la PCL
 */

/**
 * Combina porcentajes con la fórmula de Balthazard: A + (100-A)×B/100
 * Ordena de mayor a menor antes de combinar.
 */
export function combinarBalthazard(porcentajes) {
  const validos = porcentajes
    .map(p => parseFloat(p))
    .filter(p => !isNaN(p) && p > 0 && p <= 100);

  if (validos.length === 0) return { total: 0, pasos: [] };

  validos.sort((a, b) => b - a);

  let acumulado = validos[0];
  const pasos = [
    { paso: 1, acumulado, descripcion: `Inicio: ${validos[0].toFixed(2)}%` },
  ];

  for (let i = 1; i < validos.length; i++) {
    const nuevo = acumulado + (100 - acumulado) * (validos[i] / 100);
    pasos.push({
      paso: i + 1,
      acumulado: nuevo,
      descripcion: `${acumulado.toFixed(2)} + (100 – ${acumulado.toFixed(2)}) × ${validos[i]} / 100 = ${nuevo.toFixed(2)}%`,
    });
    acumulado = nuevo;
  }

  return { total: acumulado, pasos };
}

// ─── Motor de consistencia (compartido con PDF y UI) ─────────────
const _CONSIST_MAP = {
  1:  { d4: 1, d5: 1, d6: 2 },
  2:  { d4: 1, d5: 3, d6: 3 },
  3:  { d4: 1, d5: 2, d6: 2 },
  4:  { d5: 2 },
  5:  { d5: 2 },
  6:  { d1: 0, d3: 1, d4: 1, d5: 2, d6: 3 },
  7:  { d4: 2, d5: 2 },
  8:  { d4: 2, d5: 2 },
  9:  { d4: 2 },
  10: { d5: 1 },
  11: { d1: 0, d3: 1, d4: 1, d5: 3, d6: 3 },
  12: { d1: 1, d3: 2, d4: 1, d5: 2, d6: 3 },
  13: { d3: 2 },
  14: { d1: 1, d3: 1, d5: 2, d6: 3 },
};
const _CLASE_A_NIVEL = {
  '0': -1, 'I': 0, '1': 0, 'II': 1, '2': 1,
  'III': 2, '3': 2, 'IV': 3, '4': 3, 'V': 3, '5': 3,
};
const _AVD_ITEMS = {
  d1: ['d110','d115','d140','d150','d163','d166','d170','d172','d175','d1751'],
  d3: ['d310','d315','d320','d325','d330','d335','d345','d350','d355','d360'],
  d4: ['d410','d415','d430','d440','d445','d455','d460','d465','d470','d475'],
  d5: ['d510','d520','d530','d540','d5401','d5402','d550','d560','d570','d5701'],
  d6: ['d610','d620','d6200','d630','d640','d6402','d650','d660','d6504','d6506'],
};
export const AVD_NOMBRES = {
  d1: 'Aprendizaje y aplicación del conocimiento',
  d3: 'Comunicación',
  d4: 'Movilidad',
  d5: 'Autocuidado personal',
  d6: 'Vida doméstica',
};

/**
 * Calcula qué dominios CIF deberían tener puntaje según las deficiencias
 * registradas pero aparecen con 0. Devuelve array de { domId, nombre, causas, urgencia }.
 */
export function calcularSugerenciasConsistencia(detalleDeficiencias, avdsDetalle) {
  const pending = {};
  for (const def of (detalleDeficiencias || [])) {
    const cap = parseInt((def.capitulo || '').replace('Cap. ', ''));
    const nivel = _CLASE_A_NIVEL[def.clase] ?? -1;
    if (nivel < 0 || isNaN(cap)) continue;
    const mapping = _CONSIST_MAP[cap];
    if (!mapping) continue;
    for (const [domId, minNivel] of Object.entries(mapping)) {
      if (nivel < minNivel) continue;
      const items = _AVD_ITEMS[domId] || [];
      const domData = avdsDetalle?.[domId] || {};
      const totalDom = items.reduce((s, id) => s + (parseFloat(domData[id]) || 0), 0);
      if (totalDom > 0) continue;
      if (!pending[domId]) pending[domId] = { causas: [], urgencia: 'media' };
      const label = def.descripcion || def.claseDescripcion || '';
      if (label && !pending[domId].causas.includes(label)) pending[domId].causas.push(label);
      if (nivel >= 2) pending[domId].urgencia = 'alta';
    }
  }
  return Object.entries(pending)
    .map(([domId, info]) => ({ domId, nombre: AVD_NOMBRES[domId] || domId, ...info }))
    .sort((a, b) => (b.urgencia === 'alta' ? 1 : 0) - (a.urgencia === 'alta' ? 1 : 0));
}

/** Redondeo normativo: fracción ≥ 0.5 → entero superior */
export function redondearNormativa(valor) {
  return Math.floor(valor + 0.5);
}

/** Calcula PCL completo (Título I + Título II) de forma local */
export function calcularPCLLocal(detalleDeficiencias, rolLaboral, avds) {
  // ── Título I ──────────────────────────────────────────────────
  const porcentajes = (detalleDeficiencias || [])
    .map(d => parseFloat(d.valorAsignado))
    .filter(v => !isNaN(v) && v > 0);

  const { total: sinPonderar, pasos } = combinarBalthazard(porcentajes);
  const ponderado = sinPonderar * 0.5;

  // ── Título II — Rol laboral ────────────────────────────────────
  const restriccionesRol  = Math.max(0, parseFloat(rolLaboral?.restriccionesRolLaboral)  || 0);
  const restriccionesAuto = Math.max(0, parseFloat(rolLaboral?.restriccionesAutosuficiencia) || 0);
  const restriccionesEdad = Math.max(0, parseFloat(rolLaboral?.restriccionesEdad) || 0);
  const totalRolLaboral   = Math.min(restriccionesRol + restriccionesAuto + restriccionesEdad, 30);

  // ── Título II — AVDs ───────────────────────────────────────────
  let sumaAVDs = 0;
  if (avds && typeof avds === 'object') {
    Object.values(avds).forEach(dominio => {
      if (dominio && typeof dominio === 'object') {
        Object.values(dominio).forEach(val => {
          sumaAVDs += parseFloat(val) || 0;
        });
      }
    });
  }
  const totalAVDs   = Math.min(Math.round(sumaAVDs * 100) / 100, 20);
  const tituloIIVal = Math.round((totalRolLaboral + totalAVDs) * 100) / 100;

  // ── PCL Total ──────────────────────────────────────────────────
  const pclTotal    = Math.round((ponderado + tituloIIVal) * 100) / 100;
  const pclRedondeada = Math.min(redondearNormativa(pclTotal), 100);

  let nivelPerdida = 'Incapacidad permanente parcial';
  if (pclRedondeada >= 95) nivelPerdida = 'Gran invalidez';
  else if (pclRedondeada >= 50) nivelPerdida = 'Invalidez';

  return {
    tituloI: {
      valorSinPonderar: Math.round(sinPonderar * 100) / 100,
      valorPonderado:   Math.round(ponderado   * 100) / 100,
      pasos,
    },
    tituloII: {
      restriccionesRolLaboral:   Math.round(restriccionesRol  * 100) / 100,
      restriccionesAutosuficiencia: Math.round(restriccionesAuto * 100) / 100,
      restriccionesEdad:         Math.round(restriccionesEdad * 100) / 100,
      totalRolLaboral:           Math.round(totalRolLaboral   * 100) / 100,
      totalAVDs,
      valorFinal: tituloIIVal,
    },
    pclTotal,
    pclRedondeada,
    nivelPerdida,
    esInvalidez: pclRedondeada >= 50,
  };
}