import api from "./api";

export const obtenerAuditEvaluacion = async (evaluacionId) => {
  const response = await api.get(`/audit/evaluacion/${evaluacionId}`);
  return response.data;
};

export const obtenerAuditGeneral = async (params = {}) => {
  const response = await api.get("/audit", { params });
  return response.data;
};
