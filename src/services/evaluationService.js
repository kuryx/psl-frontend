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