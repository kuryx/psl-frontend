import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { crearEvaluacion, buscarEnfermedadesCIE11 } from "../services/evaluationService";

// Función para limpiar HTML

const limpiarHTML = (texto) => {
  if (!texto) return "";
  const doc = new DOMParser().parseFromString(texto, 'text/html');
  return doc.body.textContent || "";
};

// Componente de TabPanel
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 20 }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function NewEvaluation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Estados para búsqueda CIE-11
  const [diagnosticoPrincipalOptions, setDiagnosticoPrincipalOptions] = useState([]);
  const [diagnosticoPrincipalLoading, setDiagnosticoPrincipalLoading] = useState(false);
  const [secundariosOptions, setSecundariosOptions] = useState([]);
  const [secundariosLoading, setSecundariosLoading] = useState(false);

  const [form, setForm] = useState({
  // 1. INFORMACIÓN DEL DICTAMEN
  informacionDictamen: {
    fechaDictamen: new Date().toISOString().split('T')[0],
    motivoCalificacion: "PCL (Dec 1507/2014)",
    numeroDictamen: "",
    tipoCalificacion: "Primera vez",
    instanciaActual: "Primera Instancia",
    primeraOportunidad: "",
    primeraInstancia: "",
    tipoSolicitante: "",
    nombreSolicitante: "",
    identificacionSolicitante: "",
    telefonoSolicitante: "",
    ciudadSolicitante: "",
    direccionSolicitante: "",
    correoSolicitante: "",
  },

  // 2. ENTIDAD CALIFICADORA
  entidadCalificadora: {
    nombre: "",
    identificacion: "",
    direccion: "",
    telefono: "",
    correoElectronico: "",
    ciudad: "",
  },

  // 3. DATOS DEL PACIENTE (EXPANDIDO)
  paciente: {
    nombreCompleto: "",
    cedula: "",
    direccion: "",
    ciudad: "",
    telefonos: [""],
    fechaNacimiento: "",
    lugarNacimiento: "",
    edad: "",
    genero: "",
    etapasCicloVital: "",
    estadoCivil: "",
    escolaridad: "",
    correoElectronico: "",
    ocupacion: "",
    tipoUsuarioSGSS: "",
    eps: "",
    afp: "",
    arl: "",
    companiasSeguros: "",
  },

  // 4. ANTECEDENTES LABORALES
  antecedentesLaborales: {
    tipoVinculacion: "",
    trabajoEmpleo: "",
    ocupacion: "",
    codigoCIUO: "",
    actividadEconomica: "",
    empresa: "",
    identificacionEmpresa: "",
    direccionEmpresa: "",
    ciudadEmpresa: "",
    telefonoEmpresa: "",
    fechaIngreso: "",
    antiguedad: "",
    descripcionCargos: "",
  },

  // 5. HISTORIAL CLÍNICO
  historialClinico: "",

  // 6. DIAGNÓSTICOS
  diagnosticoPrincipal: null,
  diagnosticosSecundarios: [],

  // 7. PORCENTAJES
  porcentajePCL: "",
  deficiencia: "",
  discapacidad: "",
  minusvalia: "",

  // 8. OBSERVACIONES
  observaciones: "",
  recomendaciones: "",

  // ESTADO
  estado: "borrador",
});

  const handleChange = (section, field, value) => {
  if (section) {
    setForm({
      ...form,
      [section]: {
        ...form[section],
        [field]: value,
      },
    });
  } else {
    setForm({ ...form, [field]: value });
  }
};

const handleTabChange = (event, newValue) => {
  setTabValue(newValue);
};

// Agregar teléfono
const agregarTelefono = () => {
  setForm({
    ...form,
    paciente: {
      ...form.paciente,
      telefonos: [...form.paciente.telefonos, ""],
    },
  });
};

  // Búsqueda diagnóstico principal
  const buscarDiagnosticoPrincipal = async (termino) => {
    if (termino.length < 3) return;

    setDiagnosticoPrincipalLoading(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setDiagnosticoPrincipalOptions(resultados);
    } catch (error) {
      console.error("Error buscando diagnóstico:", error);
    } finally {
      setDiagnosticoPrincipalLoading(false);
    }
  };

  // Búsqueda diagnósticos secundarios
  const buscarDiagnosticosSecundarios = async (termino) => {
    if (termino.length < 3) return;

    setSecundariosLoading(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setSecundariosOptions(resultados);
    } catch (error) {
      console.error("Error buscando diagnósticos:", error);
    } finally {
      setSecundariosLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validar campos obligatorios
      if (!form.paciente.nombreCompleto || !form.paciente.cedula || !form.paciente.edad || !form.paciente.ocupacion) {
        setError("Por favor completa todos los datos del paciente");
        setLoading(false);
        return;
      }

      if (!form.historialClinico) {
        setError("El historial clínico es obligatorio");
        setLoading(false);
        return;
      }

      if (!form.diagnosticoPrincipal) {
        setError("Debe seleccionar un diagnóstico principal");
        setLoading(false);
        return;
      }

      if (!form.porcentajePCL) {
        setError("El porcentaje de PCL es obligatorio");
        setLoading(false);
        return;
      }

      // Preparar datos
      const datosEvaluacion = {
        informacionDictamen: form.informacionDictamen,
        entidadCalificadora: form.entidadCalificadora,
        paciente: {
          ...form.paciente,
          edad: parseInt(form.paciente.edad),
          telefonos: form.paciente.telefonos.filter(t => t.trim() !== ""),
        },
      antecedentesLaborales: form.antecedentesLaborales,
      historialClinico: form.historialClinico,
      diagnosticoPrincipal: form.diagnosticoPrincipal,
      diagnosticosSecundarios: form.diagnosticosSecundarios,
      porcentajePCL: parseFloat(form.porcentajePCL),
      deficiencia: form.deficiencia ? parseFloat(form.deficiencia) : undefined,
      discapacidad: form.discapacidad ? parseFloat(form.discapacidad) : undefined,
      minusvalia: form.minusvalia ? parseFloat(form.minusvalia) : undefined,
      observaciones: form.observaciones,
      recomendaciones: form.recomendaciones,
      estado: form.estado,
    };

      await crearEvaluacion(datosEvaluacion);

      setSuccess(true);
      setTimeout(() => {
        navigate("/evaluations");
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || "Error al crear evaluación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
  <Paper elevation={3} sx={{ mt: 4, p: { xs: 2, sm: 3, md: 4 }, mb: 4, width: '100%' }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5">
          Nueva Evaluación PCL - Dictamen Completo
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Evaluación creada correctamente. Redirigiendo...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {/* PESTAÑAS */}
<Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
  <Tab label="1. Info Dictamen" />
  <Tab label="2. Entidad" />
  <Tab label="3. Paciente" />
  <Tab label="4. Laboral" />
  <Tab label="5. Clínico" />
  <Tab label="6. Diagnósticos" />
  <Tab label="7. Porcentajes" />
  <Tab label="8. Observaciones" />
</Tabs>

{/* TAB 1: INFORMACIÓN DEL DICTAMEN */}
<TabPanel value={tabValue} index={0}>
  <Typography variant="h6" gutterBottom>Información General del Dictamen</Typography>
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        type="date"
        label="Fecha de Dictamen"
        value={form.informacionDictamen.fechaDictamen}
        onChange={(e) => handleChange('informacionDictamen', 'fechaDictamen', e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Número de Dictamen"
        value={form.informacionDictamen.numeroDictamen}
        onChange={(e) => handleChange('informacionDictamen', 'numeroDictamen', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Tipo de Calificación"
        value={form.informacionDictamen.tipoCalificacion}
        onChange={(e) => handleChange('informacionDictamen', 'tipoCalificacion', e.target.value)}
      >
        <MenuItem value="Primera vez">Primera vez</MenuItem>
        <MenuItem value="Revisión">Revisión</MenuItem>
        <MenuItem value="Recalificación">Recalificación</MenuItem>
        <MenuItem value="Otro">Otro</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Tipo Solicitante"
        value={form.informacionDictamen.tipoSolicitante}
        onChange={(e) => handleChange('informacionDictamen', 'tipoSolicitante', e.target.value)}
      >
        <MenuItem value="">Seleccione...</MenuItem>
        <MenuItem value="EPS">EPS</MenuItem>
        <MenuItem value="AFP">AFP</MenuItem>
        <MenuItem value="ARL">ARL</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Nombre Solicitante"
        value={form.informacionDictamen.nombreSolicitante}
        onChange={(e) => handleChange('informacionDictamen', 'nombreSolicitante', e.target.value)}
      />
    </Grid>
  </Grid>
</TabPanel>

{/* TAB 2: ENTIDAD CALIFICADORA */}
<TabPanel value={tabValue} index={1}>
  <Typography variant="h6" gutterBottom>Información de la Entidad Calificadora</Typography>
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Nombre de la Entidad"
        value={form.entidadCalificadora.nombre}
        onChange={(e) => handleChange('entidadCalificadora', 'nombre', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Identificación"
        value={form.entidadCalificadora.identificacion}
        onChange={(e) => handleChange('entidadCalificadora', 'identificacion', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Dirección"
        value={form.entidadCalificadora.direccion}
        onChange={(e) => handleChange('entidadCalificadora', 'direccion', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Ciudad"
        value={form.entidadCalificadora.ciudad}
        onChange={(e) => handleChange('entidadCalificadora', 'ciudad', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Teléfono"
        value={form.entidadCalificadora.telefono}
        onChange={(e) => handleChange('entidadCalificadora', 'telefono', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Correo Electrónico"
        type="email"
        value={form.entidadCalificadora.correoElectronico}
        onChange={(e) => handleChange('entidadCalificadora', 'correoElectronico', e.target.value)}
      />
    </Grid>
  </Grid>
</TabPanel>

{/* TAB 3: DATOS DEL PACIENTE */}
<TabPanel value={tabValue} index={2}>
  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
    Datos del Paciente
  </Typography>
  
  {/* SECCIÓN 1: DATOS PERSONALES */}
  <Grid container spacing={3}>
    <Grid item xs={12} md={3}>
  <TextField
    fullWidth
    required
    label="Nombre Completo"
    value={form.paciente.nombreCompleto}
    onChange={(e) => handleChange('paciente', 'nombreCompleto', e.target.value)}
  />
</Grid>
<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    required
    label="Cédula"
    value={form.paciente.cedula}
    onChange={(e) => handleChange('paciente', 'cedula', e.target.value)}
  />
</Grid>
<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    required
    type="number"
    label="Edad"
    value={form.paciente.edad}
    onChange={(e) => handleChange('paciente', 'edad', e.target.value)}
    inputProps={{ min: 0, max: 120 }}
  />
</Grid>
<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    select
    label="Género"
    value={form.paciente.genero}
    onChange={(e) => handleChange('paciente', 'genero', e.target.value)}
  >
    <MenuItem value="">Seleccione...</MenuItem>
    <MenuItem value="Masculino">Masculino</MenuItem>
    <MenuItem value="Femenino">Femenino</MenuItem>
    <MenuItem value="Otro">Otro</MenuItem>
  </TextField>
</Grid>
<Grid item xs={12} md={2}>
  <TextField
    fullWidth
    required
    label="Ocupación"
    value={form.paciente.ocupacion}
    onChange={(e) => handleChange('paciente', 'ocupacion', e.target.value)}
  />
</Grid>

<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    label="Dirección"
    value={form.paciente.direccion}
    onChange={(e) => handleChange('paciente', 'direccion', e.target.value)}
  />
</Grid>
<Grid item xs={12} md={6}>
  <TextField
    fullWidth
    label="Ciudad"
    value={form.paciente.ciudad}
    onChange={(e) => handleChange('paciente', 'ciudad', e.target.value)}
  />
</Grid>

    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Estado Civil"
        value={form.paciente.estadoCivil}
        onChange={(e) => handleChange('paciente', 'estadoCivil', e.target.value)}
      >
        <MenuItem value="">Seleccione...</MenuItem>
        <MenuItem value="Soltero">Soltero</MenuItem>
        <MenuItem value="Casado">Casado</MenuItem>
        <MenuItem value="Unión libre">Unión libre</MenuItem>
        <MenuItem value="Viudo">Viudo</MenuItem>
        <MenuItem value="Divorciado">Divorciado</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Escolaridad"
        value={form.paciente.escolaridad}
        onChange={(e) => handleChange('paciente', 'escolaridad', e.target.value)}
      >
        <MenuItem value="">Seleccione...</MenuItem>
        <MenuItem value="Sin escolaridad">Sin escolaridad</MenuItem>
        <MenuItem value="Básica primaria">Básica primaria</MenuItem>
        <MenuItem value="Básica secundaria">Básica secundaria</MenuItem>
        <MenuItem value="Bachillerato">Bachillerato</MenuItem>
        <MenuItem value="Técnico">Técnico</MenuItem>
        <MenuItem value="Tecnólogo">Tecnólogo</MenuItem>
        <MenuItem value="Profesional">Profesional</MenuItem>
        <MenuItem value="Postgrado">Postgrado</MenuItem>
        <MenuItem value="Otro">Otro</MenuItem>
      </TextField>
    </Grid>
    
    {/* SECCIÓN 2: SISTEMA DE SEGURIDAD SOCIAL */}
    <Grid item xs={12}>
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
        Sistema de Seguridad Social
      </Typography>
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="EPS"
        value={form.paciente.eps}
        onChange={(e) => handleChange('paciente', 'eps', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="AFP"
        value={form.paciente.afp}
        onChange={(e) => handleChange('paciente', 'afp', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        label="ARL"
        value={form.paciente.arl}
        onChange={(e) => handleChange('paciente', 'arl', e.target.value)}
      />
    </Grid>
  </Grid>
</TabPanel>

{/* TAB 4: ANTECEDENTES LABORALES */}
<TabPanel value={tabValue} index={3}>
  <Typography variant="h6" gutterBottom>Antecedentes Laborales</Typography>
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Tipo de Vinculación"
        value={form.antecedentesLaborales.tipoVinculacion}
        onChange={(e) => handleChange('antecedentesLaborales', 'tipoVinculacion', e.target.value)}
      >
        <MenuItem value="">Seleccione...</MenuItem>
        <MenuItem value="Empleado">Empleado</MenuItem>
        <MenuItem value="Independiente">Independiente</MenuItem>
        <MenuItem value="Contratista">Contratista</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Empresa"
        value={form.antecedentesLaborales.empresa}
        onChange={(e) => handleChange('antecedentesLaborales', 'empresa', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Cargo/Ocupación"
        value={form.antecedentesLaborales.ocupacion}
        onChange={(e) => handleChange('antecedentesLaborales', 'ocupacion', e.target.value)}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Antigüedad"
        value={form.antecedentesLaborales.antiguedad}
        onChange={(e) => handleChange('antecedentesLaborales', 'antiguedad', e.target.value)}
        placeholder="Ej: 5 años 3 meses"
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Descripción de Cargos Desempeñados"
        value={form.antecedentesLaborales.descripcionCargos}
        onChange={(e) => handleChange('antecedentesLaborales', 'descripcionCargos', e.target.value)}
      />
    </Grid>
  </Grid>
</TabPanel>

{/* TAB 5: HISTORIAL CLÍNICO */}
<TabPanel value={tabValue} index={4}>
  <Typography variant="h6" gutterBottom>Historial Clínico</Typography>
  <TextField
    fullWidth
    required
    multiline
    rows={10}
    label="Historial Clínico Detallado"
    value={form.historialClinico}
    onChange={(e) => handleChange(null, 'historialClinico', e.target.value)}
    placeholder="Describa el historial médico del paciente, antecedentes, evolución de la enfermedad, tratamientos recibidos, etc."
  />
</TabPanel>

{/* TAB 6: DIAGNÓSTICOS */}
<TabPanel value={tabValue} index={5}>
  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
    Diagnósticos (Clasificación Internacional CIE-11)
  </Typography>
  
  <Grid container spacing={3}>
    {/* DIAGNÓSTICO PRINCIPAL */}
    <Grid item xs={12}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
        Diagnóstico Principal *
      </Typography>
      <Autocomplete
        fullWidth
        options={diagnosticoPrincipalOptions}
        getOptionLabel={(option) => `${option.codigo} - ${limpiarHTML(option.nombre)}`}
        loading={diagnosticoPrincipalLoading}
        value={form.diagnosticoPrincipal}
        onInputChange={(event, value) => {
          if (value) buscarDiagnosticoPrincipal(value);
        }}
        onChange={(event, value) => {
          setForm({ ...form, diagnosticoPrincipal: value });
        }}
        componentsProps={{
          popper: {
            style: { width: 'fit-content', minWidth: '700px', maxWidth: '900px' }
          }
        }}
        ListboxProps={{
          style: {
            maxHeight: '400px',
          },
        }}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <li key={option.codigo || option.uri} {...otherProps} style={{ 
              whiteSpace: 'normal', 
              wordWrap: 'break-word',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              minWidth: '650px',
            }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  {option.codigo}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {limpiarHTML(option.nombre)}
                </Typography>
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            required
            fullWidth
            placeholder="Buscar enfermedad CIE-11 (mínimo 3 caracteres)"
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: '56px',
              }
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {diagnosticoPrincipalLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
      
      {/* Mostrar el diagnóstico seleccionado como chip */}
      {form.diagnosticoPrincipal && (
        <Box sx={{ mt: 2 }}>
          <Chip
            label={`Seleccionado: ${form.diagnosticoPrincipal.codigo} - ${limpiarHTML(form.diagnosticoPrincipal.nombre)}`}
            onDelete={() => setForm({ ...form, diagnosticoPrincipal: null })}
            color="primary"
            sx={{ 
              height: 'auto',
              py: 1,
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordWrap: 'break-word',
                display: 'block',
              }
            }}
          />
        </Box>
      )}
    </Grid>

    {/* DIAGNÓSTICOS SECUNDARIOS */}
    <Grid item xs={12}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1 }}>
        Diagnósticos Secundarios (Opcionales - puede seleccionar múltiples)
      </Typography>
      <Autocomplete
        fullWidth
        multiple
        options={secundariosOptions}
        getOptionLabel={(option) => `${option.codigo} - ${limpiarHTML(option.nombre)}`}
        loading={secundariosLoading}
        value={form.diagnosticosSecundarios}
        onInputChange={(event, value) => {
          if (value) buscarDiagnosticosSecundarios(value);
        }}
        onChange={(event, value) => {
          setForm({ ...form, diagnosticosSecundarios: value });
        }}
        componentsProps={{
          popper: {
            style: { width: 'fit-content', minWidth: '700px', maxWidth: '900px' }
          }
        }}
        ListboxProps={{
          style: {
            maxHeight: '400px',
          },
        }}
        renderOption={(props, option) => {
          const { key, ...otherProps } = props;
          return (
            <li key={option.codigo || option.uri} {...otherProps} style={{ 
              whiteSpace: 'normal', 
              wordWrap: 'break-word',
              padding: '12px 16px',
              borderBottom: '1px solid #f0f0f0',
              minWidth: '650px',
            }}>
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" color="primary" fontWeight="bold">
                  {option.codigo}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {limpiarHTML(option.nombre)}
                </Typography>
              </Box>
            </li>
          );
        }}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...otherProps } = getTagProps({ index });
            return (
              <Chip
                key={option.codigo || option.uri}
                label={`${option.codigo} - ${limpiarHTML(option.nombre)}`}
                {...otherProps}
                size="small"
                sx={{ 
                  height: 'auto',
                  py: 0.5,
                  '& .MuiChip-label': {
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                  }
                }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder="Buscar enfermedades adicionales"
            sx={{
              '& .MuiOutlinedInput-root': {
                minHeight: '56px',
              }
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {secundariosLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Grid>
  </Grid>
</TabPanel>

{/* TAB 7: PORCENTAJES */}
<TabPanel value={tabValue} index={6}>
  <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
    Porcentajes de Pérdida de Capacidad Laboral
  </Typography>
  <Grid container spacing={3}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        required
        type="number"
        label="Porcentaje PCL (%)"
        value={form.porcentajePCL}
        onChange={(e) => handleChange(null, 'porcentajePCL', e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
        helperText="Campo obligatorio"
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        type="number"
        label="Deficiencia (%)"
        value={form.deficiencia}
        onChange={(e) => handleChange(null, 'deficiencia', e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        type="number"
        label="Discapacidad (%)"
        value={form.discapacidad}
        onChange={(e) => handleChange(null, 'discapacidad', e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        type="number"
        label="Minusvalía (%)"
        value={form.minusvalia}
        onChange={(e) => handleChange(null, 'minusvalia', e.target.value)}
        inputProps={{ min: 0, max: 100, step: 0.1 }}
      />
    </Grid>
  </Grid>
</TabPanel>


{/* TAB 8: OBSERVACIONES */}
<TabPanel value={tabValue} index={7}>
  <Typography variant="h6" gutterBottom>Observaciones y Recomendaciones</Typography>
  <Grid container spacing={2}>
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Observaciones"
        value={form.observaciones}
        onChange={(e) => handleChange(null, 'observaciones', e.target.value)}
        placeholder="Observaciones adicionales sobre la evaluación"
      />
    </Grid>
    <Grid item xs={12}>
      <TextField
        fullWidth
        multiline
        rows={6}
        label="Recomendaciones"
        value={form.recomendaciones}
        onChange={(e) => handleChange(null, 'recomendaciones', e.target.value)}
        placeholder="Recomendaciones médicas y plan de tratamiento"
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        select
        label="Estado del Dictamen"
        value={form.estado}
        onChange={(e) => handleChange(null, 'estado', e.target.value)}
      >
        <MenuItem value="borrador">Borrador</MenuItem>
        <MenuItem value="completada">Completada</MenuItem>
        <MenuItem value="revisada">Revisada</MenuItem>
      </TextField>
    </Grid>
  </Grid>
</TabPanel>
          {/* BOTONES DE NAVEGACIÓN Y GUARDAR */}
<Box display="flex" justifyContent="space-between" mt={4}>
  <Button
    variant="outlined"
    onClick={() => setTabValue(Math.max(0, tabValue - 1))}
    disabled={tabValue === 0}
  >
    ← Anterior
  </Button>

  <Box display="flex" gap={2}>
    <Button
      variant="outlined"
      onClick={() => navigate("/dashboard")}
      disabled={loading}
    >
      Cancelar
    </Button>

    {tabValue === 7 ? (
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={loading}
      >
        {loading ? "Guardando..." : "Guardar Evaluación"}
      </Button>
    ) : (
      <Button
        variant="contained"
        onClick={() => setTabValue(Math.min(7, tabValue + 1))}
      >
        Siguiente →
      </Button>
    )}
  </Box>
</Box>
        </Box>
      </Paper>
    </Container>
  );
}