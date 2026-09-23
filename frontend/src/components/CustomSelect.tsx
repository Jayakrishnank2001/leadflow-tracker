import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

interface CustomSelectProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  ariaLabel: string
  tone?: string
}

interface MenuPosition {
  top: number
  left: number
  width: number
}

const MENU_GAP = 8
const MIN_MENU_WIDTH = 142
const ESTIMATED_MENU_HEIGHT = 44

// The trigger's own hover style uses `transform`, which turns it into a
// stacking context. A menu nested inside it can therefore be painted under
// the next table row's pills. Rendering the menu in a body portal with
// `position: fixed` takes it out of that context completely.
function computePosition(anchor: DOMRect, menuHeight: number): MenuPosition {
  const width = Math.max(anchor.width, MIN_MENU_WIDTH)
  const spaceBelow = window.innerHeight - anchor.bottom - MENU_GAP
  const spaceAbove = anchor.top - MENU_GAP
  const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
  const left = Math.min(anchor.left, Math.max(MENU_GAP, window.innerWidth - width - MENU_GAP))

  return {
    top: openAbove ? anchor.top - MENU_GAP - menuHeight : anchor.bottom + MENU_GAP,
    left,
    width,
  }
}

export function CustomSelect({ value, options, onChange, ariaLabel, tone = 'neutral' }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Pin the menu to the trigger and follow it while the page scrolls.
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return

    const updatePosition = () => {
      const anchor = rootRef.current?.getBoundingClientRect()
      if (!anchor) return
      const menuHeight = menuRef.current?.offsetHeight ?? ESTIMATED_MENU_HEIGHT
      setMenuPosition(computePosition(anchor, menuHeight))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  // Correct the position once the real menu height is known (first open
  // renders from an estimate, so a menu near the bottom edge can flip up).
  useLayoutEffect(() => {
    if (!open || !menuRef.current || !rootRef.current) return

    const anchor = rootRef.current.getBoundingClientRect()
    const next = computePosition(anchor, menuRef.current.offsetHeight)
    setMenuPosition((current) =>
      current && current.top === next.top && current.left === next.left && current.width === next.width ? current : next,
    )
  }, [open, menuPosition])

  // Close on outside click / Escape. Opening another dropdown is an
  // outside click for this one, so no cross-component signal is needed.
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const insideTrigger = rootRef.current?.contains(target) ?? false
      const insideMenu = menuRef.current?.contains(target) ?? false
      if (!insideTrigger && !insideMenu) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`custom-select ${tone} ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open &&
        menuPosition &&
        createPortal(
          <div
            ref={menuRef}
            className="select-menu select-menu-portal"
            role="listbox"
            id={menuId}
            aria-label={ariaLabel}
            style={{ top: menuPosition.top, left: menuPosition.left, minWidth: menuPosition.width }}
          >
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
          </div>,
          document.body,
        )}
    </div>
  )
}


