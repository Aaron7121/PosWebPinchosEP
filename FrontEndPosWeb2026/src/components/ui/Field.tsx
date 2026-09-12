import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
}

const baseClasses =
  'rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100'

export function Input({ label, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        id={inputId}
        className={`${baseClasses} ${className ?? ''}`}
        {...props}
      />
    </label>
  )
}

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <textarea
        id={inputId}
        className={`${baseClasses} min-h-24 resize-y ${className ?? ''}`}
        {...props}
      />
    </label>
  )
}
