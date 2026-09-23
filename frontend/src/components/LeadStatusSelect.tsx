import { CustomSelect } from '@/components/CustomSelect'
import { LEAD_STATUSES, type LeadStatus } from '@/types/lead'

const STATUS_STYLES: Record<LeadStatus, string> = {
  New: 'bg-sky-50 text-sky-700 ring-sky-200',
  Contacted: 'bg-amber-50 text-amber-700 ring-amber-200',
  Qualified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Converted: 'bg-teal-50 text-teal-700 ring-teal-200',
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
