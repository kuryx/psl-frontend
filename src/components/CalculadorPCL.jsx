import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, Divider, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Collapse, Card, CardContent,
  LinearProgress, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { obtenerCatalogo, obtenerCapitulos } from '../services/calculoService';
import { calcularPCLLocal } from '../utils/calculoPCL';

// ─── Dominios CIF para Título II ─────────────────────────────────────────────
const AVD_DOMAINS = [
  {
    id: 'd1', nombre: 'Aprendizaje y aplicación del conocimiento',
    items: [
      { id: 'd110', nombre: 'Observar' },
      { id: 'd115', nombre: 'Escuchar' },
      { id: 'd140', nombre: 'Aprender a leer' },
      { id: 'd150', nombre: 'Aprender a calcular' },
      { id: 'd163', nombre: 'Pensar' },
      { id: 'd166', nombre: 'Leer' },
      { id: 'd170', nombre: 'Escribir' },
      { id: 'd172', nombre: 'Calcular' },
      { id: 'd175', nombre: 'Resolver problemas' },
      { id: 'd1751', nombre: 'Resolver problemas sencillos' },
    ],
  },
  {
    id: 'd3', nombre: 'Comunicación',
    items: [
      { id: 'd310', nombre: 'Recibir mensajes no verbales' },
      { id: 'd315', nombre: 'Producir mensajes no verbales' },
      { id: 'd320', nombre: 'Lenguaje de signos' },
      { id: 'd325', nombre: 'Mensajes escritos recibidos' },
      { id: 'd330', nombre: 'Hablar' },
      { id: 'd335', nombre: 'Producir mensajes no verbales' },
      { id: 'd345', nombre: 'Escribir mensajes' },
      { id: 'd350', nombre: 'Conversación' },
      { id: 'd355', nombre: 'Discusión' },
      { id: 'd360', nombre: 'Dispositivos de comunicación' },
    ],
  },
  {
    id: 'd4', nombre: 'Movilidad',
    items: [
      { id: 'd410', nombre: 'Cambiar postura corporal' },
      { id: 'd415', nombre: 'Mantener posición del cuerpo' },
      { id: 'd430', nombre: 'Levantar y llevar objetos' },
      { id: 'd440', nombre: 'Uso fino de la mano' },
      { id: 'd445', nombre: 'Uso de la mano y el brazo' },
      { id: 'd455', nombre: 'Desplazarse' },
      { id: 'd460', nombre: 'Desplazarse por distintos lugares' },
      { id: 'd465', nombre: 'Desplazarse con equipamiento' },
      { id: 'd470', nombre: 'Uso de medios de transporte' },
      { id: 'd475', nombre: 'Conducir' },
    ],
  },
  {
    id: 'd5', nombre: 'Autocuidado personal',
    items: [
      { id: 'd510', nombre: 'Lavarse' },
      { id: 'd520', nombre: 'Cuidado de partes del cuerpo' },
      { id: 'd530', nombre: 'Higiene personal / excreción' },
      { id: 'd540', nombre: 'Vestirse' },
      { id: 'd5401', nombre: 'Ponerse la ropa' },
      { id: 'd5402', nombre: 'Quitarse la ropa' },
      { id: 'd550', nombre: 'Comer' },
      { id: 'd560', nombre: 'Beber' },
      { id: 'd570', nombre: 'Cuidado de la propia salud' },
      { id: 'd5701', nombre: 'Administrar dieta y forma física' },
    ],
  },
  {
    id: 'd6', nombre: 'Vida doméstica',
    items: [
      { id: 'd610', nombre: 'Adquisición de vivienda' },
      { id: 'd620', nombre: 'Adquisición de bienes y servicios' },
      { id: 'd6200', nombre: 'Comprar' },
      { id: 'd630', nombre: 'Preparar comidas' },
      { id: 'd640', nombre: 'Quehaceres del hogar' },
      { id: 'd6402', nombre: 'Limpiar la casa' },
      { id: 'd650', nombre: 'Cuidado de objetos del hogar' },
      { id: 'd660', nombre: 'Ayudar a los demás' },
      { id: 'd6504', nombre: 'Cuidar de otros' },
      { id: 'd6506', nombre: 'Ayudar a otros' },
    ],
  },
];

const AVD_OPCIONES = [
  { value: 0,   label: 'A — Sin dificultad (0)' },
  { value: 0.1, label: 'B — Dificultad leve (0.1)' },
  { value: 0.2, label: 'C — Dificultad moderada (0.2)' },
  { value: 0.3, label: 'D — Dificultad severa (0.3)' },
  { value: 0.4, label: 'E — Dificultad completa (0.4)' },
];

const initAvds = () => {
  const avds = {};
  AVD_DOMAINS.forEach(d => {
    avds[d.id] = {};
    d.items.forEach(it => { avds[d.id][it.id] = 0; });
  });
  return avds;
};

const NIVEL_COLOR = {
  'Incapacidad permanente parcial': 'info',
  'Invalidez': 'warning',
  'Gran invalidez': 'error',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CalculadorPCL({ formData, onChange }) {
  const [capitulos,      setCapitulos]      = useState([]);
  const [tablasPorCap,   setTablasPorCap]   = useState({});
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [mostrarCalculo, setMostrarCalculo] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState(null);

  // Estado del diálogo
  const [capSel,    setCapSel]    = useState('');
  const [tablaSel,  setTablaSel]  = useState(null);
  const [claseSel,  setClaseSel]  = useState(null);
  const [valorDial, setValorDial] = useState('');

  // Accesores al formData — useMemo para evitar objetos nuevos en cada render
  const deficiencias = useMemo(() => formData.detalleDeficiencias || [], [formData.detalleDeficiencias]);
  const rolLaboral   = useMemo(() => formData.valoracionRolLaboral || { restriccionesRolLaboral: 0, restriccionesAutosuficiencia: 0, restriccionesEdad: 0 }, [formData.valoracionRolLaboral]);
  const avds         = useMemo(() => formData.avdsDetalle || initAvds(), [formData.avdsDetalle]);

  // ── Resultado calculado — derivado puro, sin estado ──────────────────────
  const resultado = useMemo(
    () => calcularPCLLocal(deficiencias, rolLaboral, avds),
    [deficiencias, rolLaboral, avds]
  );

  // ── Sincronizar PCL al formData del padre solo cuando cambia el valor ─────
  const prevPCL = useRef(null);
  useEffect(() => {
    const pcl   = resultado.pclRedondeada;
    const def   = resultado.tituloI.valorPonderado;
    const nivel = resultado.nivelPerdida;
    if (prevPCL.current?.pcl === pcl && prevPCL.current?.nivel === nivel) return;
    prevPCL.current = { pcl, nivel };
    onChange(null, 'porcentajePCL', pcl);
    onChange(null, 'deficiencia',   def);
    onChange(null, 'nivelPerdida',  nivel);
  }, [resultado, onChange]);

  // ── Cargar catálogo una sola vez ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingCatalogo(true);
      try {
        const [caps, tablas] = await Promise.all([obtenerCapitulos(), obtenerCatalogo()]);
        setCapitulos(caps);
        const agrupado = {};
        tablas.forEach(t => {
          if (!agrupado[t.capitulo]) agrupado[t.capitulo] = [];
          agrupado[t.capitulo].push(t);
        });
        setTablasPorCap(agrupado);
      } catch { /* servidor puede no estar corriendo en dev */ }
      finally { setLoadingCatalogo(false); }
    })();
  }, []);

  // ── Agregar deficiencia desde el diálogo ─────────────────────────────────
  const handleAgregarDeficiencia = () => {
    if (!tablaSel || !claseSel || valorDial === '') return;
    const clase = tablaSel.clases.find(c => c.id === claseSel);
    const valor = parseFloat(valorDial);
    if (isNaN(valor) || valor < clase.min || valor > clase.max) return;

    const nueva = {
      idCatalogo:       tablaSel.id,
      descripcion:      tablaSel.nombre,
      capitulo:         `Cap. ${tablaSel.capitulo}`,
      tabla:            tablaSel.tabla,
      clase:            claseSel,
      claseDescripcion: clase.nombre,
      valorAsignado:    valor,
    };
    onChange(null, 'detalleDeficiencias', [...deficiencias, nueva]);
    setDialogOpen(false);
    setCapSel(''); setTablaSel(null); setClaseSel(null); setValorDial('');
  };

  const eliminarDeficiencia = idx => {
    onChange(null, 'detalleDeficiencias', deficiencias.filter((_, i) => i !== idx));
  };

  const handleRolChange = (campo, val) => {
    onChange(null, 'valoracionRolLaboral', { ...rolLaboral, [campo]: parseFloat(val) || 0 });
  };

  const handleAvdChange = (dom, item, val) => {
    onChange(null, 'avdsDetalle', {
      ...avds,
      [dom]: { ...avds[dom], [item]: parseFloat(val) || 0 },
    });
  };

  const totalAvdDominio = domId => {
    if (!avds[domId]) return 0;
    return Object.values(avds[domId]).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* ══ RESUMEN DE PCL ══════════════════════════════════════════════════ */}
      {resultado && (
        <Card sx={{ mb: 3, border: '2px solid', borderColor: resultado.esInvalidez ? 'warning.main' : 'primary.main' }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">

              {/* Número grande */}
              <Grid item xs={12} md={3} textAlign="center">
                <Typography
                  variant="h2"
                  fontWeight="bold"
                  color={resultado.esInvalidez ? 'warning.main' : 'primary.main'}
                >
                  {resultado.pclRedondeada}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PCL Total — Dec. 1507/2014
                </Typography>
              </Grid>

              {/* Desglose */}
              <Grid item xs={12} md={6}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Título I (Deficiencias)</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {resultado.tituloI.valorPonderado.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (sin ponderar: {resultado.tituloI.valorSinPonderar.toFixed(2)}% × 0.5)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Título II (Rol laboral + AVD)</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {resultado.tituloII.valorFinal.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({resultado.tituloII.totalRolLaboral.toFixed(2)}% + {resultado.tituloII.totalAVDs.toFixed(2)}%)
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>

              {/* Nivel */}
              <Grid item xs={12} md={3} textAlign="center">
                <Chip
                  label={resultado.nivelPerdida}
                  color={NIVEL_COLOR[resultado.nivelPerdida] || 'default'}
                  icon={resultado.esInvalidez ? <WarningAmberIcon /> : undefined}
                  sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}
                />
                {resultado.esInvalidez && (
                  <Typography variant="caption" display="block" color="warning.main" mt={0.5}>
                    ⚠️ PCL ≥ 50% — Se declara INVALIDEZ
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Detalle Balthazard */}
            <Button
              size="small"
              sx={{ mt: 1 }}
              startIcon={mostrarCalculo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setMostrarCalculo(!mostrarCalculo)}
            >
              {mostrarCalculo ? 'Ocultar detalle del cálculo' : 'Ver pasos (fórmula de Balthazard)'}
            </Button>
            {mostrarCalculo && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Fórmula: A + (100 – A) × B / 100 — ordenado de mayor a menor
                </Typography>
                {resultado.tituloI.pasos.length === 0
                  ? <Typography variant="caption">Sin deficiencias registradas.</Typography>
                  : resultado.tituloI.pasos.map((p, i) => (
                    <Typography key={i} variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                      Paso {p.paso}: {p.descripcion}
                    </Typography>
                  ))}
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" display="block">
                  Sin ponderar: <strong>{resultado.tituloI.valorSinPonderar.toFixed(2)}%</strong> × 0.5
                  = <strong>{resultado.tituloI.valorPonderado.toFixed(2)}%</strong> (Título I ponderado)
                </Typography>
                <Typography variant="caption" display="block">
                  Título II: {resultado.tituloII.totalRolLaboral.toFixed(2)}% (rol) +{' '}
                  {resultado.tituloII.totalAVDs.toFixed(2)}% (AVD) = <strong>{resultado.tituloII.valorFinal.toFixed(2)}%</strong>
                </Typography>
                <Typography variant="caption" display="block" fontWeight="bold">
                  PCL: {resultado.tituloI.valorPonderado.toFixed(2)} + {resultado.tituloII.valorFinal.toFixed(2)}
                  = {resultado.pclTotal.toFixed(2)}% → redondeado: <strong>{resultado.pclRedondeada}%</strong>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══ TÍTULO I — DEFICIENCIAS ════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Título I — Valoración de Deficiencias
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Combinación Balthazard, ponderado al 50% — Manual Único Dec. 1507/2014
            </Typography>
          </Box>
          {loadingCatalogo && <CircularProgress size={20} />}
        </Box>

        {deficiencias.length > 0 ? (
          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {['Deficiencia', 'Cap.', 'Tabla', 'Clase', 'Valor', ''].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {deficiencias.map((def, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{def.descripcion}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption">{def.capitulo}</Typography></TableCell>
                    <TableCell><Chip label={`Tab. ${def.tabla}`} size="small" /></TableCell>
                    <TableCell>
                      <Chip label={def.claseDescripcion || def.clase} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {def.valorAsignado}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => eliminarDeficiencia(i)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sin deficiencias agregadas. Use el botón para registrar las secuelas funcionales del paciente
            según las tablas del Manual Único (Decreto 1507/2014).
          </Alert>
        )}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          disabled={loadingCatalogo}
        >
          Agregar deficiencia
        </Button>
      </Paper>

      {/* ══ TÍTULO II — ROL LABORAL ════════════════════════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Título II — Rol Laboral y Áreas Ocupacionales
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Rol laboral (máx. 30%) + Actividades de vida diaria CIF (máx. 20%)
            </Typography>
          </Box>
          {resultado && (
            <Typography variant="h5" fontWeight="bold" color="secondary.main">
              {resultado.tituloII.valorFinal.toFixed(2)}%
            </Typography>
          )}
        </Box>

        {/* Puntuaciones rol laboral */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Rol laboral (máx. 30%)
        </Typography>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              label="Restricciones del rol laboral"
              type="number"
              value={rolLaboral.restriccionesRolLaboral || 0}
              onChange={e => handleRolChange('restriccionesRolLaboral', e.target.value)}
              inputProps={{ min: 0, max: 19, step: 1 }}
              helperText="Puntos 0 – 19"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              label="Restricciones autosuficiencia económica"
              type="number"
              value={rolLaboral.restriccionesAutosuficiencia || 0}
              onChange={e => handleRolChange('restriccionesAutosuficiencia', e.target.value)}
              inputProps={{ min: 0, max: 5, step: 1 }}
              helperText="Puntos 0 – 5"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth size="small"
              label="Restricciones por edad cronológica"
              type="number"
              value={rolLaboral.restriccionesEdad || 0}
              onChange={e => handleRolChange('restriccionesEdad', e.target.value)}
              inputProps={{ min: 0, max: 6, step: 1 }}
              helperText="Puntos 0 – 6"
            />
          </Grid>
          {resultado && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ minWidth: 150 }}>
                  Total rol laboral:
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(resultado.tituloII.totalRolLaboral / 30) * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ minWidth: 50 }}>
                  {resultado.tituloII.totalRolLaboral.toFixed(2)}%
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ mb: 2 }} />

        {/* AVDs — dominios CIF */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Actividades de vida diaria — CIF (máx. 20%)
        </Typography>
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
          <Typography variant="caption">
            Calificación: <strong>A=0</strong> Sin dificultad |&nbsp;
            <strong>B=0.1</strong> Leve |&nbsp;
            <strong>C=0.2</strong> Moderada |&nbsp;
            <strong>D=0.3</strong> Severa |&nbsp;
            <strong>E=0.4</strong> Completa
          </Typography>
        </Alert>

        {AVD_DOMAINS.map(domain => {
          const total = totalAvdDominio(domain.id);
          const expanded = expandedDomain === domain.id;
          return (
            <Box
              key={domain.id}
              sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            >
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 1.5, cursor: 'pointer',
                  bgcolor: expanded ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => setExpandedDomain(expanded ? null : domain.id)}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={domain.id.toUpperCase()} size="small" color="primary" variant="outlined" />
                  <Typography variant="body2" fontWeight="medium">{domain.nombre}</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={`${total.toFixed(1)} pts`}
                    size="small"
                    color={total > 0 ? 'primary' : 'default'}
                  />
                  {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </Box>
              </Box>

              <Collapse in={expanded} unmountOnExit>
                <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={1}>
                    {domain.items.map(item => (
                      <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <TextField
                          select fullWidth size="small"
                          label={`${item.id}: ${item.nombre}`}
                          value={avds[domain.id]?.[item.id] ?? 0}
                          onChange={e => handleAvdChange(domain.id, item.id, e.target.value)}
                        >
                          {AVD_OPCIONES.map(op => (
                            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Collapse>
            </Box>
          );
        })}

        {resultado && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ minWidth: 120 }}>Total AVDs:</Typography>
            <LinearProgress
              variant="determinate"
              value={(resultado.tituloII.totalAVDs / 20) * 100}
              color="secondary"
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="h6" fontWeight="bold" color="secondary.main" sx={{ minWidth: 50 }}>
              {resultado.tituloII.totalAVDs.toFixed(2)}%
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ══ CAMPOS ADICIONALES (fechas, origen, riesgo) ═════════════════════ */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Información adicional del dictamen
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Fecha de Estructuración" type="date"
              value={formData.fechaEstructuracion || ''}
              onChange={e => onChange(null, 'fechaEstructuracion', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth label="Fecha de Declaratoria" type="date"
              value={formData.fechaDeclaratoria || ''}
              onChange={e => onChange(null, 'fechaDeclaratoria', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Origen"
              value={formData.origen || 'Enfermedad común'}
              onChange={e => onChange(null, 'origen', e.target.value)}
            >
              {['Enfermedad común', 'Enfermedad laboral', 'Accidente de trabajo', 'Accidente común'].map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Riesgo"
              value={formData.riesgo || 'Común'}
              onChange={e => onChange(null, 'riesgo', e.target.value)}
            >
              <MenuItem value="Común">Común</MenuItem>
              <MenuItem value="Laboral">Laboral</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth label="Nivel de Pérdida"
              value={formData.nivelPerdida || 'Incapacidad permanente parcial'}
              onChange={e => onChange(null, 'nivelPerdida', e.target.value)}
            >
              {['Incapacidad permanente parcial', 'Invalidez', 'Gran invalidez', 'Muerte'].map(v => (
                <MenuItem key={v} value={v}>{v}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ══ DIÁLOGO — AGREGAR DEFICIENCIA ══════════════════════════════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth keepMounted={false} disablePortal>
        <DialogTitle>
          Agregar deficiencia — Catálogo Manual Único (Dec. 1507/2014)
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* Capítulo */}
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Capítulo del Manual Único"
                value={capSel}
                onChange={e => {
                  setCapSel(e.target.value);
                  setTablaSel(null); setClaseSel(null); setValorDial('');
                }}
              >
                {capitulos.length === 0
                  ? <MenuItem disabled>Cargando catálogo…</MenuItem>
                  : capitulos.map(c => (
                    <MenuItem key={c.numero} value={c.numero}>
                      Cap. {c.numero} — {c.nombre}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>

            {/* Tabla */}
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Tabla de deficiencia"
                value={tablaSel?.id || ''}
                disabled={!capSel}
                onChange={e => {
                  const t = (tablasPorCap[capSel] || []).find(x => x.id === e.target.value);
                  setTablaSel(t); setClaseSel(null); setValorDial('');
                }}
              >
                {(tablasPorCap[capSel] || []).map(t => (
                  <MenuItem key={t.id} value={t.id}>Tab. {t.tabla} — {t.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Descripción de la tabla */}
            {tablaSel && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2" fontWeight="bold">{tablaSel.nombre}</Typography>
                  <Typography variant="caption">{tablaSel.descripcion}</Typography>
                </Alert>
              </Grid>
            )}

            {/* Clase */}
            {tablaSel && (
              <Grid item xs={12} md={6}>
                <TextField
                  select fullWidth label="Clase"
                  value={claseSel || ''}
                  onChange={e => {
                    setClaseSel(e.target.value);
                    const cl = tablaSel.clases.find(c => c.id === e.target.value);
                    if (cl) setValorDial(cl.referencia ?? cl.min);
                  }}
                >
                  {tablaSel.clases.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nombre} ({c.min}–{c.max}%) — {c.descripcion}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {/* Valor */}
            {claseSel && (() => {
              const cl = tablaSel.clases.find(c => c.id === claseSel);
              const v = parseFloat(valorDial);
              const fuera = valorDial !== '' && (isNaN(v) || v < cl.min || v > cl.max);
              return (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={`Valor asignado (${cl.min}% – ${cl.max}%)`}
                    type="number"
                    value={valorDial}
                    onChange={e => setValorDial(e.target.value)}
                    inputProps={{ min: cl.min, max: cl.max, step: 0.5 }}
                    error={fuera}
                    helperText={fuera ? `Debe estar entre ${cl.min}% y ${cl.max}%` : `Rango: ${cl.min}% — ${cl.max}%`}
                  />
                </Grid>
              );
            })()}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDialogOpen(false);
            setCapSel(''); setTablaSel(null); setClaseSel(null); setValorDial('');
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAgregarDeficiencia}
            disabled={!tablaSel || !claseSel || valorDial === ''}
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}