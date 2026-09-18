# Sonidos de notificaciones

Aquí van los archivos de audio del POS. Los reproduce **Howler.js** (ver `src/utils/sound.ts`).

## Archivos esperados

| Archivo | Evento | Se usa en |
|---|---|---|
| `nuevo.mp3` | Llega un pedido nuevo | `notificar({ tipo: 'nuevo' })` |
| `listo.mp3` | Un pedido pasó a "listo" | `notificar({ tipo: 'listo' })` |
| `cobrado.mp3` | Se registró un pago | `showVisto(id)` |

Basta con dejar los `.mp3` con **exactamente esos nombres** en esta carpeta. No hay que tocar código.

> Mientras falte un archivo, suena un **tono sintetizado de respaldo**, así que la app nunca queda muda. Ese respaldo se configura en `SONIDOS[*].respaldo` de `src/utils/sound.ts`.

## Formatos

- `.mp3` → mejor compatibilidad (recomendado).
- `.wav` → sin compresión, pesado.
- `.ogg` → buena calidad/tamaño, no soportado en Safari antiguo.

Si cambias de formato, actualiza el campo `archivo` en `src/utils/sound.ts`.

## Recomendaciones

- **Duración**: 0.5 – 1.5 s. Más largo no aporta y molesta en horas pico.
- **Peso**: menos de 100 KB por archivo.
- **Volumen**: normaliza los tres al mismo nivel; si uno está más fuerte se nota. El ajuste fino se hace con el campo `volumen` (0 – 1) de cada sonido.
- **Inicio**: que el sonido arranque de inmediato, sin silencio al principio.

## Dónde conseguir sonidos gratis

| Sitio | Licencia |
|---|---|
| [Pixabay Sound Effects](https://pixabay.com/sound-effects/) | Libre, sin atribución |
| [Mixkit](https://mixkit.co/free-sound-effects/) | Libre |
| [Freesound](https://freesound.org/) | Variable (revisa cada archivo) |
| [Zapsplat](https://www.zapsplat.com/) | Libre con cuenta |

## Agregar un tipo de sonido nuevo

1. Crea el `.mp3` en esta carpeta (ej. `cancelado.mp3`).
2. En `src/utils/sound.ts`, agrégalo al tipo `SoundKind` y a `SONIDOS`.
3. Llama `playSound('cancelado')` donde lo necesites.
