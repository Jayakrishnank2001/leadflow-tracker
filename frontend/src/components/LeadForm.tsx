import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LEAD_STATUSES, type CreateLeadInput, type LeadStatus } from '@/types/lead'

interface LeadFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateLeadInput) => void
}

export function LeadForm({ open, onClose, onSubmit }: LeadFormProps) {
  const [form, setForm] = useState<CreateLeadInput>({ name: '', email: '', phone: '', status: 'New' })

  if (!open) return null

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit({ ...form })
    setForm({ name: '', email: '', phone: '', status: 'New' })
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-header">
          <div>
            <h2 id="dialog-title">Create a new lead</h2>
            <p>Add a prospect to your pipeline.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. Alex Morgan"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="alex@company.com"
            />
          </label>
          <label>
            Phone
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as LeadStatus })}
            >
              {LEAD_STATUSES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="create-button">
              Create lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
