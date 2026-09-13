import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { uploadImage } from '../../api/client'

interface ImageUploadProps {
  value: string
  onChange: (path: string) => void
  tipo: 'platos' | 'categorias'
}

export function ImageUpload({ value, onChange, tipo }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file, tipo)
      onChange(result.path)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo subir la imagen',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">Imagen</span>
      <div className="flex items-center gap-3">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          {value ? (
            <img
              src={value}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? 'Subiendo...' : value ? 'Cambiar' : 'Subir imagen'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Quitar
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-400">JPG, PNG o WEBP (máx. 5 MB).</p>
    </div>
  )
}
