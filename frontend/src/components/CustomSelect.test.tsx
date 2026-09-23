import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CustomSelect } from '@/components/CustomSelect'

function renderSelect(onChange = vi.fn()) {
  render(
    <CustomSelect
      value="New"
      options={['New', 'Contacted', 'Qualified']}
      onChange={onChange}
      ariaLabel="Lead status"
    />,
  )

  return { onChange, trigger: screen.getByRole('button', { name: 'Lead status' }) }
}

describe('CustomSelect', () => {
  it('shows the current value with the menu closed', () => {
    const { trigger } = renderSelect()

    expect(trigger).toHaveTextContent('New')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens the menu with every option and marks the selected one', async () => {
    const user = userEvent.setup()
    const { trigger } = renderSelect()

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: /New/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('reports the chosen value and closes the menu', async () => {
    const user = userEvent.setup()
    const { trigger, onChange } = renderSelect()

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: /Qualified/ }))

    expect(onChange).toHaveBeenCalledWith('Qualified')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes when the trigger is clicked again', async () => {
    const user = userEvent.setup()
    const { trigger } = renderSelect()

    await user.click(trigger)
    await user.click(trigger)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    const { trigger } = renderSelect()

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes on an outside click', async () => {
    const user = userEvent.setup()
    const { trigger } = renderSelect()

    await user.click(trigger)
    await user.click(document.body)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
