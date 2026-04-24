import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Tabs,
  Tab,
  Grid,
  MenuItem,
  Autocomplete,
  Chip,
  Alert,
  Divider,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { crearEvaluacion, buscarEnfermedadesCIE11 } from "../services/evaluationService";
import { buscarCIUO } from "../services/Ciuoservice";

export default function NewEvaluation() {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Búsqueda de enfermedades CIE-11
  const [, setBusquedaPrincipal] = useState("");
  const [resultadosPrincipal, setResultadosPrincipal] = useState([]);
  const [loadingPrincipal, setLoadingPrincipal] = useState(false);

  const [busquedaSecundarios, setBusquedaSecundarios] = useState("");
  const [resultadosSecundarios, setResultadosSecundarios] = useState([]);
  const [loadingSecundarios, setLoadingSecundarios] = useState(false);

  // Búsqueda de ocupaciones CIUO
  const [, setBusquedaCIUO] = useState("");
  const [resultadosCIUO, setResultadosCIUO] = useState([]);
  const [loadingCIUO, setLoadingCIUO] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Tab 1: Información del Dictamen
    informacionDictamen: {
      fechaDictamen: new Date().toISOString().split("T")[0],
      motivoCalificacion: "PCL (Dec 1507/2014)",
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
      correoElectronicoSolicitante: "",
    },

    // Tab 2: Entidad Calificadora
    entidadCalificadora: {
      nombre: "",
      identificacion: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      correoElectronico: "",
    },

    // Tab 3: Datos del Paciente
    paciente: {
      nombreCompleto: "",
      tipoIdentificacion: "CC",
      cedula: "",
      lugarExpedicion: "",
      fechaNacimiento: "",
      lugarNacimiento: "",
      edad: "",
      genero: "",
      estadoCivil: "",
      escolaridad: "",
      direccion: "",
      ciudad: "",
      telefonos: [""],
      correoElectronico: "",
      ocupacion: "",
      etapasCicloVital: "Población en edad económicamente activa",
      tipoUsuarioSGSS: "",
      eps: "",
      afp: "",
      arl: "",
      companiaSeguro: "",
    },

    // Tab 4: Antecedentes Laborales
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

    // Tab 5: Historial Clínico
    historialClinico: "",
    resumenCaso: "",
    calificacionPrimeraOportunidad: "",
    procesoRehabilitacion: "No aplica",

    // Tab 6: Diagnósticos
    diagnosticoPrincipal: {
      codigo: "",
      nombre: "",
      fechaDiagnostico: "",
      diagnosticoEspecifico: "",
    },
    diagnosticosSecundarios: [],

    // Tab 7: Porcentajes PCL
    porcentajePCL: "",
    deficiencia: "",
    discapacidad: "",
    minusvalia: "",
    fechaEstructuracion: "",
    fechaDeclaratoria: "",
    origen: "Enfermedad común",
    riesgo: "Común",
    nivelPerdida: "Incapacidad permanente parcial",

    // Tab 8: Observaciones
    observaciones: "",
    recomendaciones: "",
    sustentacionFechaEstructuracion: "",
    muerte: false,
    fechaDefuncion: "",
    ayudaTercerosABC: false,
    ayudaTercerosDecisiones: false,
    requiereDispositivosApoyo: false,
    enfermedadAltoCosto: false,
    enfermedadDegenerativa: false,
    enfermedadProgresiva: false,
    calificacionIntegral: "No aplica",
    decisionJRCI: "",
    estado: "borrador",
  });

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData({
        ...formData,
        [section]: {
          ...formData[section],
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleTelefonoChange = (index, value) => {
    const newTelefonos = [...formData.paciente.telefonos];
    newTelefonos[index] = value;
    handleChange("paciente", "telefonos", newTelefonos);
  };

  const agregarTelefono = () => {
    handleChange("paciente", "telefonos", [...formData.paciente.telefonos, ""]);
  };

  const eliminarTelefono = (index) => {
    const newTelefonos = formData.paciente.telefonos.filter((_, i) => i !== index);
    handleChange("paciente", "telefonos", newTelefonos);
  };

  // Búsqueda de diagnósticos
  const buscarDiagnosticoPrincipal = async (termino) => {
    if (termino.length < 3) return;
    setLoadingPrincipal(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setResultadosPrincipal(resultados);
    } catch (error) {
      console.error("Error buscando diagnóstico:", error);
    } finally {
      setLoadingPrincipal(false);
    }
  };

  const buscarDiagnosticoSecundario = async (termino) => {
    if (termino.length < 3) return;
    setLoadingSecundarios(true);
    try {
      const resultados = await buscarEnfermedadesCIE11(termino);
      setResultadosSecundarios(resultados);
    } catch (error) {
      console.error("Error buscando diagnóstico:", error);
    } finally {
      setLoadingSecundarios(false);
    }
  };

  const agregarDiagnosticoSecundario = (diagnostico) => {
    const yaExiste = formData.diagnosticosSecundarios.some(
      (d) => d.codigo === diagnostico.codigo
    );
    if (!yaExiste) {
      setFormData({
        ...formData,
        diagnosticosSecundarios: [
          ...formData.diagnosticosSecundarios,
          {
            codigo: diagnostico.codigo,
            nombre: diagnostico.nombre,
            fechaDiagnostico: "",
            diagnosticoEspecifico: "",
          },
        ],
      });
    }
    setBusquedaSecundarios("");
  };

  const eliminarDiagnosticoSecundario = (codigo) => {
    setFormData({
      ...formData,
      diagnosticosSecundarios: formData.diagnosticosSecundarios.filter(
        (d) => d.codigo !== codigo
      ),
    });
  };

  // Búsqueda de ocupaciones CIUO
  const buscarOcupacionCIUO = async (termino) => {
    if (termino.length < 2) return;
    setLoadingCIUO(true);
    try {
      const resultados = await buscarCIUO(termino);
      setResultadosCIUO(resultados);
    } catch (error) {
      console.error("Error buscando ocupación CIUO:", error);
    } finally {
      setLoadingCIUO(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.paciente.nombreCompleto || !formData.paciente.cedula) {
        setError("El nombre y cédula del paciente son obligatorios");
        setLoading(false);
        return;
      }

      if (!formData.diagnosticoPrincipal.codigo) {
        setError("Debe seleccionar un diagnóstico principal");
        setLoading(false);
        return;
      }

      if (!formData.porcentajePCL) {
        setError("Debe ingresar el porcentaje de PCL");
        setLoading(false);
        return;
      }

      // Limpiar teléfonos vacíos
      const datosLimpios = {
        ...formData,
        paciente: {
          ...formData.paciente,
          telefonos: formData.paciente.telefonos.filter((t) => t.trim() !== ""),
        },
      };

      await crearEvaluacion(datosLimpios);
      navigate("/evaluations");
    } catch (error) {
      setError(error.response?.data?.message || "Error al crear evaluación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/evaluations")}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Nueva Evaluación PCL - Dictamen Completo
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          value={tabActual}
          onChange={(e, newValue) => setTabActual(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          <Tab label="1. INFO DICTAMEN" />
          <Tab label="2. ENTIDAD" />
          <Tab label="3. PACIENTE" />
          <Tab label="4. LABORAL" />
          <Tab label="5. CLÍNICO" />
          <Tab label="6. DIAGNÓSTICOS" />
          <Tab label="7. PORCENTAJES" />
          <Tab label="8. OBSERVACIONES" />
        </Tabs>

        {/* TAB 1: INFORMACIÓN DEL DICTAMEN */}
        {tabActual === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Información del Dictamen
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Dictamen"
                  type="date"
                  value={formData.informacionDictamen.fechaDictamen}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "fechaDictamen", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número de Dictamen"
                  value="Se generará automáticamente"
                  disabled
                  helperText="El número se asigna al guardar"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Motivo de Calificación"
                  value={formData.informacionDictamen.motivoCalificacion}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "motivoCalificacion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Calificación"
                  value={formData.informacionDictamen.tipoCalificacion}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "tipoCalificacion", e.target.value)
                  }
                >
                  <MenuItem value="Primera vez">Primera vez</MenuItem>
                  <MenuItem value="Revisión">Revisión</MenuItem>
                  <MenuItem value="Recalificación">Recalificación</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Instancia Actual"
                  value={formData.informacionDictamen.instanciaActual}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "instanciaActual", e.target.value)
                  }
                >
                  <MenuItem value="Primera Instancia">Primera Instancia</MenuItem>
                  <MenuItem value="Segunda Instancia">Segunda Instancia</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primera Oportunidad"
                  value={formData.informacionDictamen.primeraOportunidad}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "primeraOportunidad", e.target.value)
                  }
                  placeholder="Ej: COLPENSIONES"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primera Instancia"
                  value={formData.informacionDictamen.primeraInstancia}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "primeraInstancia", e.target.value)
                  }
                  placeholder="Ej: Junta Regional de Antioquia"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo Solicitante"
                  value={formData.informacionDictamen.tipoSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "tipoSolicitante", e.target.value)
                  }
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="EPS">EPS</MenuItem>
                  <MenuItem value="AFP">AFP</MenuItem>
                  <MenuItem value="ARL">ARL</MenuItem>
                  <MenuItem value="Compañía de Seguros">Compañía de Seguros</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre Solicitante"
                  value={formData.informacionDictamen.nombreSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "nombreSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación Solicitante (NIT)"
                  value={formData.informacionDictamen.identificacionSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "identificacionSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono Solicitante"
                  value={formData.informacionDictamen.telefonoSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "telefonoSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad Solicitante"
                  value={formData.informacionDictamen.ciudadSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "ciudadSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección Solicitante"
                  value={formData.informacionDictamen.direccionSolicitante}
                  onChange={(e) =>
                    handleChange("informacionDictamen", "direccionSolicitante", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico Solicitante"
                  type="email"
                  value={formData.informacionDictamen.correoElectronicoSolicitante}
                  onChange={(e) =>
                    handleChange(
                      "informacionDictamen",
                      "correoElectronicoSolicitante",
                      e.target.value
                    )
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 2: ENTIDAD CALIFICADORA */}
        {tabActual === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Información de la Entidad Calificadora
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Entidad"
                  value={formData.entidadCalificadora.nombre}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "nombre", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación (NIT)"
                  value={formData.entidadCalificadora.identificacion}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "identificacion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.entidadCalificadora.direccion}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "direccion", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.entidadCalificadora.ciudad}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "ciudad", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={formData.entidadCalificadora.telefono}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "telefono", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.entidadCalificadora.correoElectronico}
                  onChange={(e) =>
                    handleChange("entidadCalificadora", "correoElectronico", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 3: DATOS DEL PACIENTE */}
        {tabActual === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Datos del Paciente
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Nombre Completo"
                  value={formData.paciente.nombreCompleto}
                  onChange={(e) =>
                    handleChange("paciente", "nombreCompleto", e.target.value)
                  }
                  required
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Tipo ID"
                  value={formData.paciente.tipoIdentificacion}
                  onChange={(e) =>
                    handleChange("paciente", "tipoIdentificacion", e.target.value)
                  }
                >
                  <MenuItem value="CC">CC</MenuItem>
                  <MenuItem value="TI">TI</MenuItem>
                  <MenuItem value="CE">CE</MenuItem>
                  <MenuItem value="PA">PA</MenuItem>
                  <MenuItem value="RC">RC</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Cédula"
                  value={formData.paciente.cedula}
                  onChange={(e) => handleChange("paciente", "cedula", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lugar de Expedición"
                  value={formData.paciente.lugarExpedicion}
                  onChange={(e) =>
                    handleChange("paciente", "lugarExpedicion", e.target.value)
                  }
                  placeholder="Ej: MEDELLÍN - ANTIOQUIA"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formData.paciente.fechaNacimiento}
                  onChange={(e) =>
                    handleChange("paciente", "fechaNacimiento", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Edad"
                  type="number"
                  value={formData.paciente.edad}
                  onChange={(e) => handleChange("paciente", "edad", e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lugar de Nacimiento"
                  value={formData.paciente.lugarNacimiento}
                  onChange={(e) =>
                    handleChange("paciente", "lugarNacimiento", e.target.value)
                  }
                  placeholder="Ej: Medellín - Antioquia"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Género"
                  value={formData.paciente.genero}
                  onChange={(e) => handleChange("paciente", "genero", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Estado Civil"
                  value={formData.paciente.estadoCivil}
                  onChange={(e) => handleChange("paciente", "estadoCivil", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Soltero">Soltero</MenuItem>
                  <MenuItem value="Casado">Casado</MenuItem>
                  <MenuItem value="Unión libre">Unión libre</MenuItem>
                  <MenuItem value="Divorciado">Divorciado</MenuItem>
                  <MenuItem value="Viudo">Viudo</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Escolaridad"
                  value={formData.paciente.escolaridad}
                  onChange={(e) => handleChange("paciente", "escolaridad", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Ninguna">Ninguna</MenuItem>
                  <MenuItem value="Básica primaria">Básica primaria</MenuItem>
                  <MenuItem value="Básica secundaria">Básica secundaria</MenuItem>
                  <MenuItem value="Bachillerato">Bachillerato</MenuItem>
                  <MenuItem value="Técnico">Técnico</MenuItem>
                  <MenuItem value="Tecnólogo">Tecnólogo</MenuItem>
                  <MenuItem value="Pregrado">Pregrado</MenuItem>
                  <MenuItem value="Posgrado">Posgrado</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ocupación"
                  value={formData.paciente.ocupacion}
                  onChange={(e) => handleChange("paciente", "ocupacion", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={formData.paciente.direccion}
                  onChange={(e) => handleChange("paciente", "direccion", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ciudad"
                  value={formData.paciente.ciudad}
                  onChange={(e) => handleChange("paciente", "ciudad", e.target.value)}
                />
              </Grid>

              {/* Teléfonos múltiples */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Teléfonos
                </Typography>
                {formData.paciente.telefonos.map((telefono, index) => (
                  <Box key={index} display="flex" gap={1} mb={1}>
                    <TextField
                      fullWidth
                      label={`Teléfono ${index + 1}`}
                      value={telefono}
                      onChange={(e) => handleTelefonoChange(index, e.target.value)}
                    />
                    {formData.paciente.telefonos.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => eliminarTelefono(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Button
                  startIcon={<AddIcon />}
                  onClick={agregarTelefono}
                  size="small"
                >
                  Agregar teléfono
                </Button>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={formData.paciente.correoElectronico}
                  onChange={(e) =>
                    handleChange("paciente", "correoElectronico", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Etapas del Ciclo Vital"
                  value={formData.paciente.etapasCicloVital}
                  onChange={(e) =>
                    handleChange("paciente", "etapasCicloVital", e.target.value)
                  }
                />
              </Grid>

              {/* Sistema de Seguridad Social */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Sistema de Seguridad Social
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo Usuario SGSS"
                  value={formData.paciente.tipoUsuarioSGSS}
                  onChange={(e) =>
                    handleChange("paciente", "tipoUsuarioSGSS", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="EPS"
                  value={formData.paciente.eps}
                  onChange={(e) => handleChange("paciente", "eps", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="AFP"
                  value={formData.paciente.afp}
                  onChange={(e) => handleChange("paciente", "afp", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="ARL"
                  value={formData.paciente.arl}
                  onChange={(e) => handleChange("paciente", "arl", e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Compañía de Seguros"
                  value={formData.paciente.companiaSeguro}
                  onChange={(e) =>
                    handleChange("paciente", "companiaSeguro", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 4: ANTECEDENTES LABORALES */}
        {tabActual === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Antecedentes Laborales del Calificado
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Tipo de Vinculación"
                  value={formData.antecedentesLaborales.tipoVinculacion}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "tipoVinculacion", e.target.value)
                  }
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Empleado">Empleado</MenuItem>
                  <MenuItem value="Independiente">Independiente</MenuItem>
                  <MenuItem value="Contratista">Contratista</MenuItem>
                  <MenuItem value="Pensionado">Pensionado</MenuItem>
                  <MenuItem value="Desempleado">Desempleado</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Trabajo/Empleo"
                  value={formData.antecedentesLaborales.trabajoEmpleo}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "trabajoEmpleo", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={resultadosCIUO}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.codigo} - ${option.ocupacion}`
                  }
                  loading={loadingCIUO}
                  value={
                    formData.antecedentesLaborales.codigoCIUO
                      ? {
                          codigo: formData.antecedentesLaborales.codigoCIUO,
                          ocupacion: formData.antecedentesLaborales.ocupacion,
                        }
                      : null
                  }
                  onInputChange={(e, value) => {
                    setBusquedaCIUO(value);
                    if (value.length >= 2) {
                      buscarOcupacionCIUO(value);
                    }
                  }}
                  onChange={(e, value) => {
                    if (value && typeof value === "object") {
                      handleChange("antecedentesLaborales", "codigoCIUO", value.codigo);
                      handleChange("antecedentesLaborales", "ocupacion", value.ocupacion);
                    } else if (!value) {
                      handleChange("antecedentesLaborales", "codigoCIUO", "");
                      handleChange("antecedentesLaborales", "ocupacion", "");
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Ocupación / Código CIUO"
                      placeholder="Escriba al menos 2 caracteres..."
                      helperText="Clasificación Internacional Uniforme de Ocupaciones"
                    />
                  )}
                  componentsProps={{
                    popper: {
                      style: { minWidth: 700 },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {option.codigo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.ocupacion}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Actividad Económica"
                  value={formData.antecedentesLaborales.actividadEconomica}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "actividadEconomica", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Empresa"
                  value={formData.antecedentesLaborales.empresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "empresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Identificación Empresa (NIT)"
                  value={formData.antecedentesLaborales.identificacionEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "identificacionEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Dirección Empresa"
                  value={formData.antecedentesLaborales.direccionEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "direccionEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ciudad Empresa"
                  value={formData.antecedentesLaborales.ciudadEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "ciudadEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono Empresa"
                  value={formData.antecedentesLaborales.telefonoEmpresa}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "telefonoEmpresa", e.target.value)
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Ingreso"
                  type="date"
                  value={formData.antecedentesLaborales.fechaIngreso}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "fechaIngreso", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Antigüedad"
                  value={formData.antecedentesLaborales.antiguedad}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "antiguedad", e.target.value)
                  }
                  placeholder="Ej: 15 años"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción de los Cargos Desempeñados y Duración"
                  multiline
                  rows={4}
                  value={formData.antecedentesLaborales.descripcionCargos}
                  onChange={(e) =>
                    handleChange("antecedentesLaborales", "descripcionCargos", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 5: HISTORIAL CLÍNICO */}
        {tabActual === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Información Clínica y Conceptos
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Resumen del Caso"
                  multiline
                  rows={4}
                  value={formData.resumenCaso}
                  onChange={(e) => handleChange(null, "resumenCaso", e.target.value)}
                  placeholder="Resumen general del caso clínico..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Calificación en Primera Oportunidad"
                  multiline
                  rows={3}
                  value={formData.calificacionPrimeraOportunidad}
                  onChange={(e) =>
                    handleChange(null, "calificacionPrimeraOportunidad", e.target.value)
                  }
                  placeholder="Detalles de la calificación inicial..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Historial Clínico Completo"
                  multiline
                  rows={10}
                  value={formData.historialClinico}
                  onChange={(e) => handleChange(null, "historialClinico", e.target.value)}
                  required
                  placeholder="Descripción detallada del historial clínico del paciente..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Proceso de Rehabilitación"
                  value={formData.procesoRehabilitacion}
                  onChange={(e) =>
                    handleChange(null, "procesoRehabilitacion", e.target.value)
                  }
                >
                  <MenuItem value="Finalizado">Finalizado</MenuItem>
                  <MenuItem value="En curso">En curso</MenuItem>
                  <MenuItem value="No aplica">No aplica</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 6: DIAGNÓSTICOS */}
        {tabActual === 5 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Diagnósticos CIE-11
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Diagnóstico Principal */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Diagnóstico Principal *
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Autocomplete
                  freeSolo
                  options={resultadosPrincipal}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.codigo} - ${option.nombre}`
                  }
                  loading={loadingPrincipal}
                  value={
                    formData.diagnosticoPrincipal.codigo
                      ? formData.diagnosticoPrincipal
                      : null
                  }
                  onInputChange={(e, value) => {
                    setBusquedaPrincipal(value);
                    if (value.length >= 3) {
                      buscarDiagnosticoPrincipal(value);
                    }
                  }}
                  onChange={(e, value) => {
                    if (value && typeof value === "object") {
                      handleChange(null, "diagnosticoPrincipal", {
                        codigo: value.codigo,
                        nombre: value.nombre,
                        fechaDiagnostico: "",
                        diagnosticoEspecifico: "",
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Buscar diagnóstico principal"
                      placeholder="Escriba al menos 3 caracteres..."
                      required
                    />
                  )}
                  componentsProps={{
                    popper: {
                      style: { minWidth: 700 },
                    },
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {option.codigo}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.nombre}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                />
              </Grid>

              {formData.diagnosticoPrincipal.codigo && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Fecha de Diagnóstico"
                      type="date"
                      value={formData.diagnosticoPrincipal.fechaDiagnostico}
                      onChange={(e) =>
                        handleChange(null, "diagnosticoPrincipal", {
                          ...formData.diagnosticoPrincipal,
                          fechaDiagnostico: e.target.value,
                        })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Diagnóstico Específico"
                      value={formData.diagnosticoPrincipal.diagnosticoEspecifico}
                      onChange={(e) =>
                        handleChange(null, "diagnosticoPrincipal", {
                          ...formData.diagnosticoPrincipal,
                          diagnosticoEspecifico: e.target.value,
                        })
                      }
                      placeholder="Detalles adicionales del diagnóstico"
                    />
                  </Grid>
                </>
              )}
            </Grid>

            {/* Diagnósticos Secundarios */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 4 }}>
              Diagnósticos Secundarios
            </Typography>

            <Autocomplete
              freeSolo
              options={resultadosSecundarios}
              getOptionLabel={(option) =>
                typeof option === "string"
                  ? option
                  : `${option.codigo} - ${option.nombre}`
              }
              loading={loadingSecundarios}
              inputValue={busquedaSecundarios}
              onInputChange={(e, value) => {
                setBusquedaSecundarios(value);
                if (value.length >= 3) {
                  buscarDiagnosticoSecundario(value);
                }
              }}
              onChange={(e, value) => {
                if (value && typeof value === "object") {
                  agregarDiagnosticoSecundario(value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar y agregar diagnósticos secundarios"
                  placeholder="Escriba al menos 3 caracteres..."
                />
              )}
              componentsProps={{
                popper: {
                  style: { minWidth: 700 },
                },
              }}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {option.codigo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.nombre}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
            />

            <Box sx={{ mt: 2 }}>
              {formData.diagnosticosSecundarios.map((diagnostico, index) => (
                <Chip
                  key={diagnostico.codigo}
                  label={`${diagnostico.codigo} - ${diagnostico.nombre.substring(
                    0,
                    50
                  )}...`}
                  onDelete={() => eliminarDiagnosticoSecundario(diagnostico.codigo)}
                  sx={{ m: 0.5 }}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* TAB 7: PORCENTAJES PCL */}
        {tabActual === 6 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Porcentajes de Pérdida de Capacidad Laboral
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Porcentaje PCL Total"
                  type="number"
                  value={formData.porcentajePCL}
                  onChange={(e) => handleChange(null, "porcentajePCL", e.target.value)}
                  required
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  helperText="0 - 100%"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Deficiencia"
                  type="number"
                  value={formData.deficiencia}
                  onChange={(e) => handleChange(null, "deficiencia", e.target.value)}
                  inputProps={{ min: 0, max: 50, step: 0.01 }}
                  helperText="0 - 50%"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Discapacidad"
                  type="number"
                  value={formData.discapacidad}
                  onChange={(e) => handleChange(null, "discapacidad", e.target.value)}
                  inputProps={{ min: 0, max: 50, step: 0.01 }}
                  helperText="0 - 50%"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Minusvalía"
                  type="number"
                  value={formData.minusvalia}
                  onChange={(e) => handleChange(null, "minusvalia", e.target.value)}
                  inputProps={{ min: 0, max: 50, step: 0.01 }}
                  helperText="0 - 50%"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Estructuración"
                  type="date"
                  value={formData.fechaEstructuracion}
                  onChange={(e) =>
                    handleChange(null, "fechaEstructuracion", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha de Declaratoria"
                  type="date"
                  value={formData.fechaDeclaratoria}
                  onChange={(e) => handleChange(null, "fechaDeclaratoria", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Origen"
                  value={formData.origen}
                  onChange={(e) => handleChange(null, "origen", e.target.value)}
                >
                  <MenuItem value="Enfermedad común">Enfermedad común</MenuItem>
                  <MenuItem value="Enfermedad laboral">Enfermedad laboral</MenuItem>
                  <MenuItem value="Accidente de trabajo">Accidente de trabajo</MenuItem>
                  <MenuItem value="Accidente común">Accidente común</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Riesgo"
                  value={formData.riesgo}
                  onChange={(e) => handleChange(null, "riesgo", e.target.value)}
                >
                  <MenuItem value="Común">Común</MenuItem>
                  <MenuItem value="Laboral">Laboral</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Nivel de Pérdida"
                  value={formData.nivelPerdida}
                  onChange={(e) => handleChange(null, "nivelPerdida", e.target.value)}
                >
                  <MenuItem value="Incapacidad permanente parcial">
                    Incapacidad permanente parcial
                  </MenuItem>
                  <MenuItem value="Invalidez">Invalidez</MenuItem>
                  <MenuItem value="Gran invalidez">Gran invalidez</MenuItem>
                  <MenuItem value="Muerte">Muerte</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* TAB 8: OBSERVACIONES */}
        {tabActual === 7 && (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Observaciones y Conclusiones
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={4}
                  value={formData.observaciones}
                  onChange={(e) => handleChange(null, "observaciones", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Recomendaciones"
                  multiline
                  rows={4}
                  value={formData.recomendaciones}
                  onChange={(e) => handleChange(null, "recomendaciones", e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sustentación Fecha de Estructuración"
                  multiline
                  rows={3}
                  value={formData.sustentacionFechaEstructuracion}
                  onChange={(e) =>
                    handleChange(null, "sustentacionFechaEstructuracion", e.target.value)
                  }
                />
              </Grid>

              {/* Información Adicional */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Información Adicional
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Ayuda de Terceros para ABC y AVD"
                  value={formData.ayudaTercerosABC.toString()}
                  onChange={(e) =>
                    handleChange(null, "ayudaTercerosABC", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Ayuda de Terceros para Toma de Decisiones"
                  value={formData.ayudaTercerosDecisiones.toString()}
                  onChange={(e) =>
                    handleChange(null, "ayudaTercerosDecisiones", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Requiere Dispositivos de Apoyo"
                  value={formData.requiereDispositivosApoyo.toString()}
                  onChange={(e) =>
                    handleChange(null, "requiereDispositivosApoyo", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Enfermedad de Alto Costo/Catastrófica"
                  value={formData.enfermedadAltoCosto.toString()}
                  onChange={(e) =>
                    handleChange(null, "enfermedadAltoCosto", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Enfermedad Degenerativa"
                  value={formData.enfermedadDegenerativa.toString()}
                  onChange={(e) =>
                    handleChange(null, "enfermedadDegenerativa", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Enfermedad Progresiva"
                  value={formData.enfermedadProgresiva.toString()}
                  onChange={(e) =>
                    handleChange(null, "enfermedadProgresiva", e.target.value === "true")
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Sí</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Calificación Integral"
                  value={formData.calificacionIntegral}
                  onChange={(e) =>
                    handleChange(null, "calificacionIntegral", e.target.value)
                  }
                >
                  <MenuItem value="Sí">Sí</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                  <MenuItem value="No aplica">No aplica</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Decisión frente a JRCI"
                  value={formData.decisionJRCI}
                  onChange={(e) => handleChange(null, "decisionJRCI", e.target.value)}
                >
                  <MenuItem value="">Seleccione...</MenuItem>
                  <MenuItem value="Confirmar">Confirmar</MenuItem>
                  <MenuItem value="Modificar">Modificar</MenuItem>
                  <MenuItem value="Revocar">Revocar</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Estado del Dictamen"
                  value={formData.estado}
                  onChange={(e) => handleChange(null, "estado", e.target.value)}
                >
                  <MenuItem value="borrador">Borrador</MenuItem>
                  <MenuItem value="completada">Completada</MenuItem>
                  <MenuItem value="revisada">Revisada</MenuItem>
                  <MenuItem value="aprobada">Aprobada</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Botones de navegación */}
        <Box display="flex" justifyContent="space-between" mt={4}>
          <Button
            variant="outlined"
            onClick={() => setTabActual(Math.max(0, tabActual - 1))}
            disabled={tabActual === 0}
          >
            ← Anterior
          </Button>

          {tabActual < 7 ? (
            <Button
              variant="contained"
              onClick={() => setTabActual(Math.min(7, tabActual + 1))}
            >
              Siguiente →
            </Button>
          ) : (
            <Box display="flex" gap={2}>
              <Button variant="outlined" onClick={() => navigate("/evaluations")}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Evaluación"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}