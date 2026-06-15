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