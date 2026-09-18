export function CampoMonto({
  label,
  value,
  onChange,
  placeholder,
  min,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type="number"
        min={min}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  )
}
