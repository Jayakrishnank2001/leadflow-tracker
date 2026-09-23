import { CustomSelect } from '@/components/CustomSelect'
import { LEAD_STATUSES, type StatusFilter } from '@/types/lead'

interface StatusFilterProps {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <CustomSelect
      value={value}
      options={['All statuses', ...LEAD_STATUSES]}
      onChange={(option) => onChange(option as StatusFilter)}
      ariaLabel="Filter leads by status"
    />
  )
}
