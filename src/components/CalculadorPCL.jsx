import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, Divider, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Collapse, Card, CardContent,
  LinearProgress, CircularProgress, Tooltip, Stack,
  Checkbox, FormControlLabel, FormGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CloseIcon from '@mui/icons-material/Close';
import { obtenerCatalogo, obtenerCapitulos, obtenerModuladores } from '../services/calculoService';
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

// ─── Motor de consistencia ────────────────────────────────────────────────────
// Mapeo: capítulo → clase mínima (0=leve,1=mod,2=mod-severo,3=severo) → dominio AVD
const CONSISTENCIA_MAPPING = {
  1:  { d4: 1, d5: 1, d6: 2 },           // Musculo-esquelético
  2:  { d4: 1, d5: 3, d6: 3 },           // Cardiovascular
  3:  { d4: 1, d5: 2, d6: 2 },           // Respiratorio
  4:  { d5: 2, d6: 2 },                  // Digestivo
  5:  { d5: 2 },                         // Urinario
  6:  { d1: 0, d3: 1, d4: 1, d5: 2, d6: 3 }, // Nervioso estructural (TCE, ACV, EM, lesión medular)
  7:  { d4: 2, d5: 2 },                  // VIH / Inmunológico
  8:  { d4: 2, d5: 2 },                  // Endocrino
  9:  { d4: 2 },                         // Hematológico
  10: { d5: 1 },                         // Dermatológico
  11: { d1: 0, d3: 1, d4: 1, d5: 3, d6: 3 }, // Oftalmológico
  12: { d1: 1, d3: 2, d4: 1, d5: 2, d6: 3 }, // Nervioso funcional
  13: { d3: 2 },                         // Auditivo
  14: { d1: 1, d3: 1, d5: 2, d6: 3 },   // Salud mental
};

// Convierte el id de clase a nivel de severidad (0-3)
const CLASE_A_NIVEL = {
  '0': -1,
  'I': 0, '1': 0,
  'II': 1, '2': 1,
  'III': 2, '3': 2,
  'IV': 3, '4': 3, 'V': 3, '5': 3,
};

const AVD_NOMBRES_MAP = {
  d1: 'Aprendizaje y aplicación del conocimiento',
  d3: 'Comunicación',
  d4: 'Movilidad',
  d5: 'Autocuidado personal',
  d6: 'Vida doméstica',
};

const AVD_RAZONES = {
  1:  { d4: 'limitación osteoarticular afecta desplazamiento y uso de extremidades',   d5: 'el dolor y la limitación articular comprometen el autocuidado', d6: 'la limitación severa restringe las actividades del hogar' },
  2:  { d4: 'la disnea o claudicación limitan el desplazamiento',                       d5: 'la insuficiencia cardíaca severa limita el autocuidado por fatiga', d6: 'la cardiopatía severa restringe las labores domésticas' },
  3:  { d4: 'la disnea en esfuerzo limita la movilidad',                               d5: 'la disnea moderada-severa afecta el autocuidado', d6: 'la disnea severa restringe las actividades del hogar' },
  4:  { d5: 'los síntomas digestivos o la desnutrición afectan el autocuidado',         d6: 'la patología digestiva limita la preparación de alimentos' },
  5:  { d5: 'la insuficiencia renal grave compromete la higiene y el autocuidado' },
  6:  { d1: 'toda lesión neurológica puede comprometer cognición y aprendizaje',        d3: 'la afasia o disartria limitan la comunicación',                  d4: 'el déficit motor afecta la movilidad', d5: 'la dependencia neurológica compromete el autocuidado', d6: 'la dependencia severa restringe la vida doméstica' },
  7:  { d4: 'la inmunodeficiencia avanzada limita la deambulación por fatiga',          d5: 'las complicaciones del SIDA avanzado comprometen el autocuidado' },
  8:  { d4: 'las complicaciones crónicas endocrinas limitan la movilidad',              d5: 'el descontrol metabólico severo compromete el autocuidado' },
  9:  { d4: 'la anemia severa o hemopatía grave limita la deambulación' },
  10: { d5: 'las lesiones cutáneas extensas afectan la higiene y el autocuidado' },
  11: { d1: 'la pérdida visual compromete la lectura y el aprendizaje',                 d3: 'la baja visión dificulta la comunicación escrita',               d4: 'la baja visión severa limita la movilidad independiente', d5: 'la ceguera limita el autocuidado sin entrenamiento especializado', d6: 'la ceguera severa restringe las actividades del hogar' },
  12: { d1: 'el trastorno neurológico compromete la cognición y el aprendizaje',        d3: 'la disartria o afasia afectan la comunicación',                 d4: 'el trastorno motor afecta la movilidad', d5: 'la discapacidad neurológica severa compromete el autocuidado', d6: 'la dependencia grave restringe las labores domésticas' },
  13: { d3: 'la hipoacusia severa compromete la comunicación verbal y social' },
  14: { d1: 'el trastorno mental afecta la concentración y el aprendizaje',             d3: 'el aislamiento social afecta la comunicación',                  d5: 'el deterioro funcional compromete el autocuidado', d6: 'la desorganización grave restringe la vida doméstica' },
};

// ─── Sección A: Restricciones del rol laboral (máx. 19 pts) ─────────────────
const ROL_LABORAL_ITEMS = [
  { id: "rl1",  puntos: 2, descripcion: "Esfuerzo físico intenso: levantar, cargar, empujar o jalar ≥ 25 lb (11 kg) de forma regular" },
  { id: "rl2",  puntos: 2, descripcion: "Bipedestación o marcha prolongada: permanecer de pie o caminar > 2 horas continuas" },
  { id: "rl3",  puntos: 2, descripcion: "Movimientos repetitivos de miembros superiores o tronco: ensamble, digitación, costura" },
  { id: "rl4",  puntos: 2, descripcion: "Exposición a agentes físicos adversos: ruido intenso, vibración, temperaturas extremas, radiación" },
  { id: "rl5",  puntos: 2, descripcion: "Exposición a agentes químicos: polvos, gases, vapores, solventes o irritantes" },
  { id: "rl6",  puntos: 2, descripcion: "Manejo de maquinaria peligrosa o trabajo en alturas (> 1.5 m sobre el nivel del suelo)" },
  { id: "rl7",  puntos: 2, descripcion: "Conducción de vehículos de trabajo: camiones, montacargas, maquinaria pesada u otros" },
  { id: "rl8",  puntos: 2, descripcion: "Concentración sostenida o toma de decisiones complejas bajo presión de tiempo" },
  { id: "rl9",  puntos: 2, descripcion: "Interacción social requerida por el rol: atención al cliente, docencia, trabajo en equipo estrecho" },
  { id: "rl10", puntos: 1, descripcion: "Restricción global: no puede desempeñar ninguna forma de empleo competitivo remunerado" },
];

// ─── Sección B: Restricciones de autosuficiencia económica (máx. 5 pts) ─────
const AUTOSUF_ITEMS = [
  { id: "as1", puntos: 2, descripcion: "No puede manejar dinero, realizar transacciones bancarias o administrar sus finanzas básicas" },
  { id: "as2", puntos: 2, descripcion: "Depende económicamente de terceros para cubrir necesidades básicas (alimentación, transporte, vivienda)" },
  { id: "as3", puntos: 1, descripcion: "Pérdida total de capacidad de generar ingresos propios por su condición de salud" },
];

// ─── Sección C: Edad cronológica — Decreto 1507/2014 Tabla 4 (máx. 6 pts) ──
const EDAD_TABLA = [
  { maxEdad: 35, puntos: 0, label: "≤ 35 años — Sin restricción adicional por edad" },
  { maxEdad: 45, puntos: 2, label: "36–45 años — Restricción leve por edad" },
  { maxEdad: 55, puntos: 4, label: "46–55 años — Restricción moderada por edad" },
  { maxEdad: Infinity, puntos: 6, label: "> 55 años — Restricción máxima por edad" },
];

const calcularPuntosEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  const edad = Math.floor((hoy - nac) / (365.25 * 24 * 60 * 60 * 1000));
  return (EDAD_TABLA.find(r => edad <= r.maxEdad) || EDAD_TABLA.at(-1)).puntos;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function CalculadorPCL({ formData, onChange }) {
  const [capitulos,      setCapitulos]      = useState([]);
  const [tablasPorCap,   setTablasPorCap]   = useState({});
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [mostrarCalculo, setMostrarCalculo] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState(null);

  // Estado del diálogo — selección
  const [capSel,    setCapSel]    = useState('');
  const [tablaSel,  setTablaSel]  = useState(null);
  const [claseSel,  setClaseSel]  = useState(null);
  const [valorDial, setValorDial] = useState('');

  // Estado del diálogo — CFM
  const [moduladoresPorCap, setModuladoresPorCap] = useState({});   // caché por capítulo
  const [cfpBase,  setCfpBase]  = useState(null);                   // valor referencia de la clase
  const [cfmSels,  setCfmSels]  = useState({ cfm1: null, cfm2: null, cfm3: null });
  const [loadingMod, setLoadingMod] = useState(false);
  const [editIdx, setEditIdx]   = useState(null); // null=nuevo, number=editando fila existente

  // Accesores al formData — useMemo para evitar objetos nuevos en cada render
  const deficiencias = useMemo(() => formData.detalleDeficiencias || [], [formData.detalleDeficiencias]);
  const rolLaboral   = useMemo(() => formData.valoracionRolLaboral || {
    restriccionesRolLaboral: 0,
    restriccionesRolLaboralItems: [],
    restriccionesAutosuficiencia: 0,
    restriccionesAutosuficienciaItems: [],
    restriccionesEdad: 0,
  }, [formData.valoracionRolLaboral]);
  const avds         = useMemo(() => formData.avdsDetalle || initAvds(), [formData.avdsDetalle]);

  // Ref siempre actualizado — evita closures obsoletos en useEffects
  const rolLaboralRef = useRef(rolLaboral);
  rolLaboralRef.current = rolLaboral;

  // ── Resultado calculado — derivado puro, sin estado ──────────────────────
  const resultado = useMemo(
    () => calcularPCLLocal(deficiencias, rolLaboral, avds),
    [deficiencias, rolLaboral, avds]
  );

  // ── Motor de consistencia ─────────────────────────────────────────────────
  const [sugerenciasRevisadas, setSugerenciasRevisadas] = useState(new Set());
  const avdSectionRef = useRef(null);

  const sugerencias = useMemo(() => {
    if (deficiencias.length === 0) return [];
    const pending = {}; // domId → { causas[], urgencia }
    for (const def of deficiencias) {
      const cap = parseInt((def.capitulo || '').replace('Cap. ', ''));
      const nivel = CLASE_A_NIVEL[def.clase] ?? -1;
      if (nivel < 0 || isNaN(cap)) continue;
      const mapping = CONSISTENCIA_MAPPING[cap];
      if (!mapping) continue;
      for (const [domId, minNivel] of Object.entries(mapping)) {
        if (nivel < minNivel) continue;
        const totalDom = Object.values(avds[domId] || {}).reduce((s, v) => s + (parseFloat(v) || 0), 0);
        if (totalDom > 0) continue; // ya calificado
        if (!pending[domId]) pending[domId] = { causas: [], urgencia: 'media' };
        if (!pending[domId].causas.includes(def.descripcion)) pending[domId].causas.push(def.descripcion);
        if (nivel >= 2) pending[domId].urgencia = 'alta';
      }
    }
    return Object.entries(pending)
      .filter(([domId]) => !sugerenciasRevisadas.has(domId))
      .map(([domId, info]) => ({ domId, nombre: AVD_NOMBRES_MAP[domId] || domId, ...info }))
      .sort((a, b) => (b.urgencia === 'alta' ? 1 : 0) - (a.urgencia === 'alta' ? 1 : 0));
  }, [deficiencias, avds, sugerenciasRevisadas]);

  const handleAbrirAVD = (domId) => {
    setExpandedDomain(domId);
    setTimeout(() => avdSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  };

  const descartarSugerencia = (domId) => {
    setSugerenciasRevisadas(prev => new Set([...prev, domId]));
  };

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

  // ── Cargar moduladores CFM cuando cambia el capítulo ─────────────────────
  useEffect(() => {
    if (!capSel) return;
    if (moduladoresPorCap[capSel]) return;  // ya está en caché
    (async () => {
      setLoadingMod(true);
      try {
        const mods = await obtenerModuladores(capSel);
        setModuladoresPorCap(prev => ({ ...prev, [capSel]: mods }));
      } catch { /* sin conectividad */ }
      finally { setLoadingMod(false); }
    })();
  }, [capSel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-calcular puntos de edad (Sección C) al cambiar la fecha ─────────
  useEffect(() => {
    const ptos = calcularPuntosEdad(formData.fechaNacimiento);
    if (rolLaboralRef.current.restriccionesEdad === ptos) return;
    onChange(null, 'valoracionRolLaboral', { ...rolLaboralRef.current, restriccionesEdad: ptos });
  }, [formData.fechaNacimiento, onChange]);

  // ── Recalcular valorDial cuando cambian los CFM ───────────────────────────
  useEffect(() => {
    if (cfpBase === null || !claseSel || !tablaSel) return;
    const cl = tablaSel.clases.find(c => c.id === claseSel);
    if (!cl) return;
    const cfmTotal = Object.values(cfmSels).reduce((s, v) => s + (v ?? 0), 0);
    const computed = Math.min(cl.max, Math.max(cl.min, cfpBase + cfmTotal));
    setValorDial(String(computed));
  }, [cfmSels, cfpBase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Agregar deficiencia desde el diálogo ─────────────────────────────────
  const handleAgregarDeficiencia = () => {
    if (!tablaSel || !claseSel || valorDial === '') return;
    const clase = tablaSel.clases.find(c => c.id === claseSel);
    const valor = parseFloat(valorDial);
    if (isNaN(valor) || valor < clase.min || valor > clase.max) return;

    const mods = moduladoresPorCap[capSel] || [];
    const cfmTotal = Object.values(cfmSels).reduce((s, v) => s + (v ?? 0), 0);

    // Construir el detalle de cada CFM seleccionado
    const cfmDetalle = {};
    ['cfm1', 'cfm2', 'cfm3'].forEach(key => {
      const modDef = mods.find(m => m.id === key);
      if (!modDef) return;
      const val = cfmSels[key] ?? 0;
      const opcion = modDef.opciones.find(o => o.valor === val);
      cfmDetalle[key] = {
        nombre:     modDef.nombre,
        valor:      val,
        descripcion: opcion?.descripcion ?? '',
      };
    });

    const nueva = {
      idCatalogo:       tablaSel.id,
      descripcion:      tablaSel.nombre,
      capitulo:         `Cap. ${tablaSel.capitulo}`,
      tabla:            tablaSel.tabla,
      clase:            claseSel,
      claseDescripcion: clase.nombre,
      valorAsignado:    valor,
      cfmDetalle:       Object.keys(cfmDetalle).length > 0 ? { cfmTotal, ...cfmDetalle } : undefined,
    };

    if (editIdx !== null) {
      onChange(null, 'detalleDeficiencias', deficiencias.map((d, i) => i === editIdx ? nueva : d));
    } else {
      onChange(null, 'detalleDeficiencias', [...deficiencias, nueva]);
    }
    setDialogOpen(false);
    resetDialog();
  };

  const resetDialog = () => {
    setCapSel(''); setTablaSel(null); setClaseSel(null);
    setValorDial(''); setCfpBase(null); setCfmSels({ cfm1: null, cfm2: null, cfm3: null });
    setEditIdx(null);
  };

  const handleEditarDeficiencia = (idx) => {
    const d = deficiencias[idx];
    const cap = (d.capitulo || '').replace('Cap. ', '');
    const tabla = (tablasPorCap[cap] || []).find(t => t.id === d.idCatalogo);
    if (!tabla) return;
    const cfm = d.cfmDetalle;
    setCapSel(cap);
    setTablaSel(tabla);
    setClaseSel(d.clase);
    setCfpBase(d.valorAsignado - (cfm?.cfmTotal ?? 0));
    setCfmSels({
      cfm1: cfm?.cfm1?.valor ?? null,
      cfm2: cfm?.cfm2?.valor ?? null,
      cfm3: cfm?.cfm3?.valor ?? null,
    });
    setValorDial(String(d.valorAsignado));
    setEditIdx(idx);
    setDialogOpen(true);
  };

  const eliminarDeficiencia = idx => {
    onChange(null, 'detalleDeficiencias', deficiencias.filter((_, i) => i !== idx));
  };

  const handleRolChange = (campo, val) => {
    onChange(null, 'valoracionRolLaboral', { ...rolLaboral, [campo]: parseFloat(val) || 0 });
  };

  const handleRolItemToggle = (itemId) => {
    const current = rolLaboralRef.current;
    const items = current.restriccionesRolLaboralItems || [];
    const newItems = items.includes(itemId) ? items.filter(id => id !== itemId) : [...items, itemId];
    const total = Math.min(19, ROL_LABORAL_ITEMS.filter(i => newItems.includes(i.id)).reduce((s, i) => s + i.puntos, 0));
    onChange(null, 'valoracionRolLaboral', { ...current, restriccionesRolLaboralItems: newItems, restriccionesRolLaboral: total });
  };

  const handleAutosufItemToggle = (itemId) => {
    const current = rolLaboralRef.current;
    const items = current.restriccionesAutosuficienciaItems || [];
    const newItems = items.includes(itemId) ? items.filter(id => id !== itemId) : [...items, itemId];
    const total = Math.min(5, AUTOSUF_ITEMS.filter(i => newItems.includes(i.id)).reduce((s, i) => s + i.puntos, 0));
    onChange(null, 'valoracionRolLaboral', { ...current, restriccionesAutosuficienciaItems: newItems, restriccionesAutosuficiencia: total });
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
                  {['Deficiencia', 'Cap.', 'Tabla', 'Clase', 'Valor', 'CFM', ''].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {deficiencias.map((def, i) => {
                  const cfm = def.cfmDetalle;
                  const cfmLabel = cfm?.cfmTotal != null
                    ? (cfm.cfmTotal > 0 ? `+${cfm.cfmTotal}` : String(cfm.cfmTotal))
                    : '—';
                  const cfmTooltip = cfm
                    ? [
                        cfm.cfm1 && `CFM1 ${cfm.cfm1.nombre}: ${cfm.cfm1.descripcion} (+${cfm.cfm1.valor})`,
                        cfm.cfm2 && `CFM2 ${cfm.cfm2.nombre}: ${cfm.cfm2.descripcion} (+${cfm.cfm2.valor})`,
                        cfm.cfm3 && `CFM3 ${cfm.cfm3.nombre}: ${cfm.cfm3.descripcion} (+${cfm.cfm3.valor})`,
                      ].filter(Boolean).join('\n')
                    : 'Sin factores moduladores registrados';
                  return (
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
                        <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{cfmTooltip}</span>} arrow>
                          <Chip
                            label={cfmLabel}
                            size="small"
                            color={cfm?.cfmTotal > 0 ? 'warning' : cfm?.cfmTotal < 0 ? 'success' : 'default'}
                            variant={cfm ? 'filled' : 'outlined'}
                            sx={{ cursor: 'help', minWidth: 36 }}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Editar CFM y valor">
                          <IconButton size="small" color="primary" onClick={() => handleEditarDeficiencia(i)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar deficiencia">
                          <IconButton size="small" color="error" onClick={() => eliminarDeficiencia(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      {/* ══ MOTOR DE CONSISTENCIA ══════════════════════════════════════════ */}
      {deficiencias.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: sugerencias.length > 0 ? 'warning.main' : 'success.main' }}>
          <Box display="flex" alignItems="center" gap={1} mb={sugerencias.length > 0 ? 2 : 0}>
            {sugerencias.length > 0
              ? <WarningAmberIcon color="warning" />
              : <CheckCircleOutlineIcon color="success" />}
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold"
                color={sugerencias.length > 0 ? 'warning.dark' : 'success.dark'}>
                {sugerencias.length > 0
                  ? `Motor de consistencia — ${sugerencias.length} dominio${sugerencias.length > 1 ? 's' : ''} sin puntuar`
                  : 'Consistencia verificada'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sugerencias.length > 0
                  ? 'Basado en las deficiencias registradas, los siguientes dominios AVD probablemente deberían tener un puntaje mayor a 0.'
                  : 'Los dominios AVD son coherentes con las deficiencias registradas en Título I.'}
              </Typography>
            </Box>
          </Box>

          {sugerencias.map(({ domId, nombre, causas, urgencia }) => {
            const cap = parseInt((deficiencias.find(d => {
              const c = parseInt((d.capitulo || '').replace('Cap. ', ''));
              return CONSISTENCIA_MAPPING[c]?.[domId] !== undefined;
            })?.capitulo || '').replace('Cap. ', ''));
            const razon = AVD_RAZONES[cap]?.[domId] || 'afecta este dominio funcional';
            return (
              <Box key={domId} sx={{
                p: 1.5, mb: 1, borderRadius: 1,
                bgcolor: urgencia === 'alta' ? 'warning.50' : 'grey.50',
                border: '1px solid', borderColor: urgencia === 'alta' ? 'warning.200' : 'grey.300',
              }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Chip
                        label={domId.toUpperCase()}
                        size="small"
                        color={urgencia === 'alta' ? 'warning' : 'default'}
                        sx={{ fontWeight: 'bold', minWidth: 36 }}
                      />
                      <Typography variant="body2" fontWeight="bold">{nombre}</Typography>
                      {urgencia === 'alta' && (
                        <Chip label="Alta prioridad" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Motivo: {razon}.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Relacionado con: {causas.slice(0, 2).map((c, i) => (
                        <em key={i}>{c}{i < Math.min(causas.length, 2) - 1 ? ', ' : ''}</em>
                      ))}{causas.length > 2 && ` y ${causas.length - 2} más`}.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="flex-start">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<OpenInNewIcon fontSize="small" />}
                      onClick={() => handleAbrirAVD(domId)}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Abrir AVD
                    </Button>
                    <Tooltip title="Marcar como revisado (descartar sugerencia)">
                      <IconButton size="small" onClick={() => descartarSugerencia(domId)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Paper>
      )}

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

        {/* ── Sección A — Restricciones del rol laboral (máx. 19 pts) ── */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Sección A — Restricciones del rol laboral
            </Typography>
            <Chip
              label={`${rolLaboral.restriccionesRolLaboral ?? 0} / 19 pts`}
              color={(rolLaboral.restriccionesRolLaboral ?? 0) > 0 ? 'primary' : 'default'}
              size="small"
            />
          </Box>
          <FormGroup>
            {ROL_LABORAL_ITEMS.map(item => {
              const checked = (rolLaboral.restriccionesRolLaboralItems || []).includes(item.id);
              return (
                <FormControlLabel
                  key={item.id}
                  sx={{ alignItems: 'flex-start', mb: 0.5 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => handleRolItemToggle(item.id)}
                      sx={{ pt: 0.3 }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="body2" sx={{ mt: 0.2 }}>{item.descripcion}</Typography>
                      <Chip
                        label={`+${item.puntos}`}
                        size="small"
                        color={checked ? 'warning' : 'default'}
                        variant={checked ? 'filled' : 'outlined'}
                        sx={{ minWidth: 36, flexShrink: 0 }}
                      />
                    </Box>
                  }
                />
              );
            })}
          </FormGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Subtotal A:</Typography>
            <LinearProgress
              variant="determinate"
              value={((rolLaboral.restriccionesRolLaboral ?? 0) / 19) * 100}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ minWidth: 55 }}>
              {rolLaboral.restriccionesRolLaboral ?? 0} / 19 pts
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Sección B — Autosuficiencia económica (máx. 5 pts) ─────── */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Sección B — Restricciones de autosuficiencia económica
            </Typography>
            <Chip
              label={`${rolLaboral.restriccionesAutosuficiencia ?? 0} / 5 pts`}
              color={(rolLaboral.restriccionesAutosuficiencia ?? 0) > 0 ? 'primary' : 'default'}
              size="small"
            />
          </Box>
          <FormGroup>
            {AUTOSUF_ITEMS.map(item => {
              const checked = (rolLaboral.restriccionesAutosuficienciaItems || []).includes(item.id);
              return (
                <FormControlLabel
                  key={item.id}
                  sx={{ alignItems: 'flex-start', mb: 0.5 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      onChange={() => handleAutosufItemToggle(item.id)}
                      sx={{ pt: 0.3 }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="body2" sx={{ mt: 0.2 }}>{item.descripcion}</Typography>
                      <Chip
                        label={`+${item.puntos}`}
                        size="small"
                        color={checked ? 'warning' : 'default'}
                        variant={checked ? 'filled' : 'outlined'}
                        sx={{ minWidth: 36, flexShrink: 0 }}
                      />
                    </Box>
                  }
                />
              );
            })}
          </FormGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Subtotal B:</Typography>
            <LinearProgress
              variant="determinate"
              value={((rolLaboral.restriccionesAutosuficiencia ?? 0) / 5) * 100}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ minWidth: 55 }}>
              {rolLaboral.restriccionesAutosuficiencia ?? 0} / 5 pts
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* ── Sección C — Edad cronológica (auto-calculado) ─────────────── */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Sección C — Restricciones por edad cronológica
            </Typography>
            <Chip
              label={`${rolLaboral.restriccionesEdad ?? 0} / 6 pts`}
              color={(rolLaboral.restriccionesEdad ?? 0) > 0 ? 'primary' : 'default'}
              size="small"
            />
          </Box>
          {(() => {
            const ptos = rolLaboral.restriccionesEdad ?? 0;
            const banda = EDAD_TABLA.find(r => ptos === r.puntos) || EDAD_TABLA.at(-1);
            const sinFecha = !formData.fechaNacimiento;
            return (
              <Alert
                severity={sinFecha ? 'warning' : ptos > 0 ? 'info' : 'success'}
                sx={{ mb: 1 }}
              >
                <Typography variant="body2">
                  {sinFecha
                    ? 'Ingrese la fecha de nacimiento del paciente para calcular automáticamente los puntos por edad.'
                    : `${banda.label} → ${ptos} puntos asignados automáticamente (Decreto 1507/2014 Tabla 4)`}
                </Typography>
              </Alert>
            );
          })()}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 80 }}>Subtotal C:</Typography>
            <LinearProgress
              variant="determinate"
              value={((rolLaboral.restriccionesEdad ?? 0) / 6) * 100}
              sx={{ flex: 1, height: 6, borderRadius: 3 }}
            />
            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ minWidth: 55 }}>
              {rolLaboral.restriccionesEdad ?? 0} / 6 pts
            </Typography>
          </Box>
        </Box>

        {/* ── Total rol laboral ──────────────────────────────────────────── */}
        {resultado && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 130 }}>
              Total Rol Laboral (A+B+C):
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(resultado.tituloII.totalRolLaboral / 30) * 100}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="h6" fontWeight="bold" color="primary.main" sx={{ minWidth: 55 }}>
              {resultado.tituloII.totalRolLaboral.toFixed(2)}%
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* AVDs — dominios CIF */}
        <Typography ref={avdSectionRef} variant="subtitle2" fontWeight="bold" gutterBottom>
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
      <Dialog open={dialogOpen} onClose={() => { setDialogOpen(false); resetDialog(); }} maxWidth="md" fullWidth keepMounted={false} disablePortal>
        <DialogTitle>
          {editIdx !== null ? 'Editar deficiencia' : 'Agregar deficiencia'} — Catálogo Manual Único (Dec. 1507/2014)
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>

            {/* ── Paso 1: Capítulo y Tabla ───────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Capítulo del Manual Único"
                value={capSel}
                onChange={e => {
                  const cap = e.target.value;
                  setCapSel(cap);
                  setTablaSel(null); setClaseSel(null); setValorDial('');
                  setCfpBase(null); setCfmSels({ cfm1: null, cfm2: null, cfm3: null });
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

            <Grid item xs={12} md={6}>
              <TextField
                select fullWidth label="Tabla de deficiencia"
                value={tablaSel?.id || ''}
                disabled={!capSel}
                onChange={e => {
                  const t = (tablasPorCap[capSel] || []).find(x => x.id === e.target.value);
                  setTablaSel(t);
                  setClaseSel(null); setValorDial('');
                  setCfpBase(null); setCfmSels({ cfm1: null, cfm2: null, cfm3: null });
                }}
              >
                {(tablasPorCap[capSel] || []).map(t => (
                  <MenuItem key={t.id} value={t.id}>Tab. {t.tabla} — {t.nombre}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {tablaSel && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ py: 0.5 }}>
                  <Typography variant="body2" fontWeight="bold">{tablaSel.nombre}</Typography>
                  <Typography variant="caption">{tablaSel.descripcion}</Typography>
                </Alert>
              </Grid>
            )}

            {/* ── Paso 2: Clase ─────────────────────────────────────────── */}
            {tablaSel && (
              <Grid item xs={12} md={6}>
                <TextField
                  select fullWidth label="Clase de deficiencia (CFP)"
                  value={claseSel || ''}
                  onChange={e => {
                    const clId = e.target.value;
                    setClaseSel(clId);
                    const cl = tablaSel.clases.find(c => c.id === clId);
                    if (cl) {
                      const base = cl.referencia ?? cl.min;
                      setCfpBase(base);
                      // Reiniciar CFMs; el useEffect recalculará el valor
                      setCfmSels({ cfm1: null, cfm2: null, cfm3: null });
                    }
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

            {/* Rango de la clase seleccionada */}
            {claseSel && (() => {
              const cl = tablaSel.clases.find(c => c.id === claseSel);
              return (
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 1.5, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Rango de la clase
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2">Mín: <strong>{cl.min}%</strong></Typography>
                      <Typography variant="body2">Ref: <strong>{cl.referencia ?? cl.min}%</strong></Typography>
                      <Typography variant="body2">Máx: <strong>{cl.max}%</strong></Typography>
                    </Stack>
                    {cl.referencia && (
                      <Typography variant="caption" color="text.secondary">
                        El valor de referencia (CFP) es el punto de partida antes de aplicar CFM
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })()}

            {/* ── Paso 3: Factores Moduladores (CFM) ────────────────────── */}
            {claseSel && (
              <>
                <Grid item xs={12}>
                  <Divider>
                    <Chip
                      label={loadingMod ? 'Cargando factores moduladores…' : 'Factores Moduladores — CFM (Dec. 1507/2014)'}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Divider>
                </Grid>

                {loadingMod && (
                  <Grid item xs={12} display="flex" justifyContent="center">
                    <CircularProgress size={24} />
                  </Grid>
                )}

                {(moduladoresPorCap[capSel] || []).map(mod => {
                  const cfmKey = mod.id; // "cfm1" | "cfm2" | "cfm3"
                  return (
                    <Grid item xs={12} key={cfmKey}>
                      <TextField
                        select fullWidth
                        label={`${mod.tipo} — ${mod.nombre}`}
                        value={cfmSels[cfmKey] ?? ''}
                        helperText={mod.descripcion}
                        onChange={e => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setCfmSels(prev => ({ ...prev, [cfmKey]: val }));
                        }}
                      >
                        <MenuItem value="">
                          <em>No aplica / Sin información</em>
                        </MenuItem>
                        {mod.opciones.map(op => (
                          <MenuItem key={op.valor} value={op.valor}>
                            <Box>
                              <Chip
                                label={op.valor >= 0 ? `+${op.valor}` : String(op.valor)}
                                size="small"
                                color={op.valor > 0 ? 'warning' : op.valor < 0 ? 'success' : 'default'}
                                sx={{ mr: 1, minWidth: 32 }}
                              />
                              {op.descripcion}
                            </Box>
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  );
                })}

                {/* ── Paso 4: Valor final ─────────────────────────────── */}
                {(() => {
                  const cl = tablaSel.clases.find(c => c.id === claseSel);
                  const cfmTotal = Object.values(cfmSels).reduce((s, v) => s + (v ?? 0), 0);
                  const v = parseFloat(valorDial);
                  const fuera = valorDial !== '' && (isNaN(v) || v < cl.min || v > cl.max);
                  return (
                    <>
                      {/* Resumen del cálculo CFM */}
                      {cfmTotal !== 0 && (
                        <Grid item xs={12}>
                          <Box sx={{ p: 1.5, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">Cálculo CFM</Typography>
                            <Typography variant="body2">
                              CFP base: <strong>{cfpBase}%</strong>
                              {' '}+{' '}ajuste CFM: <strong>{cfmTotal > 0 ? `+${cfmTotal}` : cfmTotal}</strong>
                              {' '}={' '}
                              <strong>{Math.min(cl.max, Math.max(cl.min, cfpBase + cfmTotal))}%</strong>
                              {' '}(dentro del rango {cl.min}–{cl.max}%)
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={`Valor asignado final (${cl.min}% – ${cl.max}%)`}
                          type="number"
                          value={valorDial}
                          onChange={e => setValorDial(e.target.value)}
                          inputProps={{ min: cl.min, max: cl.max, step: 0.5 }}
                          error={fuera}
                          helperText={fuera
                            ? `Debe estar entre ${cl.min}% y ${cl.max}%`
                            : 'Calculado automáticamente por CFM. Puede ajustarlo si es necesario.'}
                          sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', fontSize: '1.1rem' } }}
                        />
                      </Grid>
                    </>
                  );
                })()}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); resetDialog(); }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAgregarDeficiencia}
            disabled={!tablaSel || !claseSel || valorDial === ''}
          >
            {editIdx !== null ? 'Guardar cambios' : 'Agregar deficiencia'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}