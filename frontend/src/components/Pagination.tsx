interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, index) => (
        <button
          key={index + 1}
          className={page === index + 1 ? 'active' : ''}
          onClick={() => onChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}
      <button
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  )
}
