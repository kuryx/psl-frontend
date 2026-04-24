import api from "./api";

/**
 * Buscar ocupaciones CIUO por término
 * @param {string} termino - Término de búsqueda (código o descripción)
 * @param {number} limite - Número máximo de resultados
 * @returns {Promise<Array>} Array de ocupaciones
 */
export const buscarCIUO = async (termino, limite = 50) => {
  try {
    const response = await api.get("/ciuo/buscar", {
      params: { termino, limite },
    });
    return response.data;
  } catch (error) {
    console.error("Error buscando CIUO:", error);
    throw error;
  }
};

/**
 * Obtener ocupación CIUO por código
 * @param {string} codigo - Código CIUO
 * @returns {Promise<Object>} Ocupación encontrada
 */
export const obtenerCIUOPorCodigo = async (codigo) => {
  try {
    const response = await api.get(`/ciuo/codigo/${codigo}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo CIUO:", error);
    throw error;
  }
};

/**
 * Obtener todas las ocupaciones CIUO
 * @returns {Promise<Array>} Array de todas las ocupaciones
 */
export const obtenerTodasCIUO = async () => {
  try {
    const response = await api.get("/ciuo/todas");
    return response.data.ocupaciones;
  } catch (error) {
    console.error("Error obteniendo todas las ocupaciones CIUO:", error);
    throw error;
  }
};