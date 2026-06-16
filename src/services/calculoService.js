import api from './api';

export const obtenerCapitulos = async () => {
  const res = await api.get('/calculo/catalogo/capitulos');
  return res.data.capitulos;
};

export const obtenerCatalogo = async (capitulo = null) => {
  const params = capitulo ? { capitulo } : {};
  const res = await api.get('/calculo/catalogo', { params });
  return res.data.tablas;
};

export const obtenerModuladores = async (capitulo) => {
  const res = await api.get(`/calculo/moduladores/${capitulo}`);
  return res.data.moduladores;
};

export const calcularPCLApi = async (detalleDeficiencias, rolLaboral, avds) => {
  const res = await api.post('/calculo/calcular', { detalleDeficiencias, rolLaboral, avds });
  return res.data;
};