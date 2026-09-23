import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search-wrap">
      <Search size={17} />
      <input
        aria-label="Search leads"
        placeholder="Search by name, email, or phone..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
