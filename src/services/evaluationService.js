import api from "./api";

// ============================================
// BÚSQUEDA CIE-11
// ============================================
export const buscarEnfermedadesCIE11 = async (termino) => {
  try {
    const response = await api.get(`/evaluations/cie11/search`, {
      params: { q: termino }
    });
    return response.data.resultados;
  } catch (error) {
    console.error("Error buscando en CIE-11:", error);
    throw error;
  }
};

// ============================================
// CREAR EVALUACIÓN
// ============================================
export const crearEvaluacion = async (datosEvaluacion) => {
  try {
    const response = await api.post("/evaluations", datosEvaluacion);
    return response.data;
  } catch (error) {
    console.error("Error creando evaluación:", error);
    throw error;
  }
};

// ============================================
// LISTAR EVALUACIONES
// ============================================
export const listarEvaluaciones = async (params = {}) => {
  try {
    const response = await api.get("/evaluations", { params });
    return response.data;
  } catch (error) {
    console.error("Error listando evaluaciones:", error);
    throw error;
  }
};

// ============================================
// OBTENER EVALUACIÓN POR ID
// ============================================
export const obtenerEvaluacion = async (id) => {
  try {
    const response = await api.get(`/evaluations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo evaluación:", error);
    throw error;
  }
};

// ============================================
// ACTUALIZAR EVALUACIÓN
// ============================================
export const actualizarEvaluacion = async (id, datosEvaluacion) => {
  try {
    const response = await api.put(`/evaluations/${id}`, datosEvaluacion);
    return response.data;
  } catch (error) {
    console.error("Error actualizando evaluación:", error);
    throw error;
  }
};

// ============================================
// ELIMINAR EVALUACIÓN
// ============================================
export const eliminarEvaluacion = async (id) => {
  try {
    const response = await api.delete(`/evaluations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error eliminando evaluación:", error);
    throw error;
  }
};

// ============================================
// CAMBIAR ESTADO (MÓDULO 3 — WORKFLOW)
// ============================================
export const cambiarEstadoEvaluacion = async (id, { nuevoEstado, observacion }) => {
  try {
    const response = await api.patch(`/evaluations/${id}/estado`, { nuevoEstado, observacion });
    return response.data;
  } catch (error) {
    console.error("Error cambiando estado:", error);
    throw error;
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
export const obtenerEstadisticas = async () => {
  try {
    const response = await api.get("/evaluations/stats/general");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    throw error;
  }
};

// ============================================
// OBTENER ANALÍTICA — MÓDULO 5
// ============================================
export const obtenerAnalitica = async () => {
  try {
    const response = await api.get("/evaluations/stats/analytics");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo analítica:", error);
    throw error;
  }
};

// ============================================
// ALERTAS DE VENCIMIENTO
// ============================================
export const obtenerAlertas = async () => {
  try {
    const response = await api.get("/evaluations/stats/alertas");
    return response.data;
  } catch (error) {
    console.error("Error obteniendo alertas:", error);
    return { alertas: [] };
  }
};

// ============================================
// EXPORTAR EVALUACIONES (para CSV)
// ============================================
export const exportarEvaluaciones = async (params = {}) => {
  const response = await api.get("/evaluations", { params: { ...params, limit: 5000 } });
  return response.data.evaluaciones || [];
};

// ============================================
// DOCUMENTOS ADJUNTOS
// ============================================
export const listarDocumentos = async (evaluacionId) => {
  const r = await api.get(`/evaluations/${evaluacionId}/documentos`);
  return r.data.documentos || [];
};

export const subirDocumento = async (evaluacionId, archivo) => {
  const form = new FormData();
  form.append("archivo", archivo);
  const r = await api.post(`/evaluations/${evaluacionId}/documentos`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data;
};

export const eliminarDocumento = async (evaluacionId, docId) => {
  await api.delete(`/evaluations/${evaluacionId}/documentos/${docId}`);
};

export const urlDocumento = (evaluacionId, docId) =>
  `${api.defaults.baseURL}/evaluations/${evaluacionId}/documentos/${docId}`;

// ============================================
// DIRECTORIO DE PACIENTES
// ============================================
export const listarPacientes = async (params = {}) => {
  const response = await api.get("/evaluations/pacientes", { params });
  return response.data;
};

// ============================================
// CLONAR EVALUACIÓN (Recalificación)
// ============================================
export const clonarEvaluacion = async (id) => {
  const response = await api.post(`/evaluations/${id}/clonar`);
  return response.data;
};