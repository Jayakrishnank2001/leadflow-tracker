import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/CustomSelect'
import { ApiError } from '@/lib/api'
import { LEAD_STATUSES, type CreateLeadInput, type LeadStatus } from '@/types/lead'

interface LeadFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateLeadInput) => Promise<void>
}

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'status' | 'form', string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/

function validateLocal(form: CreateLeadInput): FormErrors {
  const errors: FormErrors = {}

  if (form.name.trim().length === 0) {
    errors.name = 'Name is required'
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (form.phone.trim().length === 0) {
    errors.phone = 'Phone is required'
  } else if (!PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = 'Phone must contain only numbers'
  } else if (form.phone.replace(/\D/g, '').length < 7 || form.phone.replace(/\D/g, '').length > 15) {
    errors.phone = 'Phone must contain between 7 and 15 digits'
  }

  return errors
}

export function LeadForm({ open, onClose, onSubmit }: LeadFormProps) {
  const [form, setForm] = useState<CreateLeadInput>({ name: '', email: '', phone: '', status: 'New' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!open) return null

  const setField = (field: keyof CreateLeadInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    // Clear the field error as the user fixes it.
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const localErrors = validateLocal(form)
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
      })
      setForm({ name: '', email: '', phone: '', status: 'New' })
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else {
        setErrors({ form: err instanceof Error ? err.message : 'Failed to create lead' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose()
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-header">
          <div>
            <h2 id="dialog-title">Create a new lead</h2>
            <p>Add a prospect to your pipeline.</p>
          </div>
          <button className="icon-button" onClick={handleClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          {errors.form && (
            <p className="form-error" role="alert">
              {errors.form}
            </p>
          )}
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Alex Morgan"
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              placeholder="alex@company.com"
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label>
            Phone
            <input
              required
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              placeholder="+1 (555) 000-0000"
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <label>
            Status
            <CustomSelect
              value={form.status}
              options={LEAD_STATUSES}
              onChange={(value) => setField('status', value as LeadStatus)}
              ariaLabel="Lead status"
            />
            {errors.status && <span className="field-error">{errors.status}</span>}
          </label>
          <div className="dialog-actions">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="create-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

