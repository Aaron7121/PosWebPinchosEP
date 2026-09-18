import { Howl, Howler } from 'howler'

export type SoundKind = 'nuevo' | 'listo' | 'cobrado'

/* ================================================================== *
 * 1. CONFIGURACIÓN — aquí cambias archivo, volumen y vibración
 * ================================================================== */

/** Carpeta pública donde viven los audios (equivale a public/sounds/) */
const RUTA_SONIDOS = '/sounds/'

/** Volumen global 0 - 1. Multiplica el volumen de TODOS los sonidos. */
export const VOLUMEN_MAESTRO = 1

/** Nota sintetizada (solo se usa en el respaldo, cuando falta el archivo) */
interface Nota {
  freq: number
  atraso: number
  dur: number
}

/** Tono sintetizado de respaldo */
interface Tono {
  onda: OscillatorType
  notas: Nota[]
  ganancia: number
  repeticiones: number
  intervaloRepeticion: number
}

interface SonidoConfig {
  /** Nombre del archivo dentro de public/sounds/ (mp3, wav u ogg) */
  archivo: string
  /** Volumen propio de este sonido, 0 - 1 */
  volumen: number
  /** Vibración del móvil en ms: [espera, vibra, pausa, vibra, ...] */
  vibrar: number | number[]
  /** Lo que suena si el archivo no existe o falla la carga */
  respaldo: Tono
}

const SONIDOS: Record<SoundKind, SonidoConfig> = {
  nuevo: {
    archivo: 'nuevo.mp3',
    volumen: 0.8,
    vibrar: [0, 180, 120, 180],
    respaldo: {
      onda: 'square',
      notas: [
        { freq: 880, atraso: 0, dur: 0.16 },
        { freq: 1174.66, atraso: 0.14, dur: 0.24 },
      ],
      ganancia: 0.9,
      repeticiones: 1,
      intervaloRepeticion: 0.55,
    },
  },
  listo: {
    archivo: 'listo.mp3',
    volumen: 0.8,
    vibrar: [0, 150, 100, 150],
    respaldo: {
      onda: 'triangle',
      notas: [
        { freq: 659.25, atraso: 0, dur: 0.14 },
        { freq: 880, atraso: 0.12, dur: 0.28 },
      ],
      ganancia: 0.9,
      repeticiones: 1,
      intervaloRepeticion: 0.5,
    },
  },
  cobrado: {
    archivo: 'cobradoo.mp3',
    volumen: 0.0,
    vibrar: [0, 120, 80, 120, 80, 120],
    respaldo: {
      onda: 'square',
      notas: [
        { freq: 523.25, atraso: 0, dur: 0.1 },
        { freq: 659.25, atraso: 0.09, dur: 0.1 },
        { freq: 783.99, atraso: 0.18, dur: 0.3 },
      ],
      ganancia: 0.0,
      repeticiones: 1,
      intervaloRepeticion: 0.45,
    },
  },
}

/* ================================================================== *
 * 2. MOTOR — Howler.js
 * ================================================================== */

const reproductores = new Map<SoundKind, Howl>()
const sinArchivo = new Set<SoundKind>()

function obtenerReproductor(kind: SoundKind): Howl | null {
  // Ya se comprobó que el archivo no existe: no se vuelve a pedir
  if (sinArchivo.has(kind)) return null

  const existente = reproductores.get(kind)
  if (existente) return existente

  const def = SONIDOS[kind]
  const howl = new Howl({
    src: [`${RUTA_SONIDOS}${def.archivo}`],
    volume: Math.min(1, def.volumen * VOLUMEN_MAESTRO),
    preload: true,
    onloaderror: () => {
      // Todavía no has puesto el archivo: se usará el respaldo sintetizado
      sinArchivo.add(kind)
      reproductores.delete(kind)
    },
  })

  reproductores.set(kind, howl)
  return howl
}

// Precarga al importar el módulo, para que el primer aviso ya suene
for (const kind of Object.keys(SONIDOS) as SoundKind[]) {
  obtenerReproductor(kind)
}

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (!audioContext) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!Ctor) return null
    audioContext = new Ctor()
  }
  return audioContext
}

/* ================================================================== *
 * 3. RESPALDO — Web Audio API (tonos sintetizados, sin archivos)
 * ================================================================== */

export function unlockAudio() {
  // Desbloquea el contexto de Howler (requisito de los navegadores móviles)
  if (Howler.ctx.state === 'suspended') void Howler.ctx.resume()

  // Desbloquea el contexto del respaldo, si ya se llegó a crear
  if (audioContext && audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

function programarTonos(
  ctx: AudioContext,
  destino: AudioNode,
  tono: Tono,
  inicioBase: number,
) {
  for (const nota of tono.notas) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = tono.onda
    osc.frequency.value = nota.freq

    const t0 = inicioBase + nota.atraso
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(tono.ganancia, t0 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + nota.dur)

    osc.connect(gain)
    gain.connect(destino)
    osc.start(t0)
    osc.stop(t0 + nota.dur + 0.05)
  }
}

function tocarRespaldo(tono: Tono) {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -12
  compressor.knee.value = 20
  compressor.ratio.value = 8
  compressor.attack.value = 0.003
  compressor.release.value = 0.25
  compressor.connect(ctx.destination)

  for (let i = 0; i < tono.repeticiones; i += 1) {
    programarTonos(ctx, compressor, tono, ctx.currentTime + i * tono.intervaloRepeticion)
  }
}

function vibrar(patron: number | number[]) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(patron)
  } catch {
    // Vibración no soportada
  }
}

/* ================================================================== *
 * 4. API PÚBLICA
 * ================================================================== */

/**
 * Reproduce el sonido de un evento del POS.
 * Usa el archivo de public/sounds/ y, si todavía no existe, el tono de respaldo.
 */
export function playSound(kind: SoundKind) {
  unlockAudio()

  const def = SONIDOS[kind]
  const howl = obtenerReproductor(kind)

  if (howl && howl.state() === 'loaded') {
    howl.play()
  } else {
    tocarRespaldo(def.respaldo)
  }

  vibrar(def.vibrar)
}

/**
 * Reintenta cargar el archivo de un sonido.
 * Útil si acabas de agregar el .mp3 y no quieres recargar la página.
 */
export function recargarSonido(kind: SoundKind) {
  sinArchivo.delete(kind)
  reproductores.delete(kind)
  obtenerReproductor(kind)
}
