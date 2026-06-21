import api from "./api";

export const listarUsuarios = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

export const actualizarUsuario = async (id, datos) => {
  const response = await api.put(`/admin/users/${id}`, datos);
  return response.data;
};

export const resetPasswordUsuario = async (id) => {
  const response = await api.post(`/admin/users/${id}/reset-password`);
  return response.data;
};

export const cambiarPlanUsuario = async (id, plan, diasVigencia) => {
  const response = await api.put(`/admin/users/${id}/plan`, { plan, diasVigencia });
  return response.data;
};
