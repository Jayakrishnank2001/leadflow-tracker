import { CustomSelect } from '@/components/CustomSelect'
import { LEAD_STATUSES, type LeadStatus } from '@/types/lead'

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: 'bg-sky-100 text-sky-700',
  Contacted: 'bg-amber-100 text-amber-700',
  Qualified: 'bg-emerald-100 text-emerald-700',
  Converted: 'bg-teal-100 text-teal-700',
}

interface LeadStatusSelectProps {
  status: LeadStatus
  onChange: (status: LeadStatus) => void
}

export function LeadStatusSelect({ status, onChange }: LeadStatusSelectProps) {
  return (
    <CustomSelect
      value={status}
      options={LEAD_STATUSES}
      onChange={(value) => onChange(value as LeadStatus)}
      ariaLabel={`Change status from ${status}`}
      tone={`status-select ${STATUS_STYLES[status]}`}
    />
  )
}
