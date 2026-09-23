import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface CustomSelectProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  ariaLabel: string
  tone?: string
}

export function CustomSelect({ value, options, onChange, ariaLabel, tone = 'neutral' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`custom-select ${tone} ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? 'selected' : ''}
              key={option}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
            >
              {option === value && <span className="option-check">✓</span>}
              <span>{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
