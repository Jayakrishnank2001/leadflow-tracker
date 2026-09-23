import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LeadForm } from '@/components/LeadForm'
import { ApiError } from '@/lib/api'

const nameInput = () => screen.getByPlaceholderText('e.g. Alex Morgan')
const emailInput = () => screen.getByPlaceholderText('alex@company.com')
const phoneInput = () => screen.getByPlaceholderText('+1 (555) 000-0000')
const submitButton = () => screen.getByRole('button', { name: 'Create lead' })

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined), onClose = vi.fn()) {
  render(<LeadForm open onClose={onClose} onSubmit={onSubmit} />)
  return { onSubmit, onClose }
}

async function fillValidFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(nameInput(), 'Ada Lovelace')
  await user.type(emailInput(), 'ada@example.com')
  await user.type(phoneInput(), '+1 555 010 1000')
}

describe('LeadForm', () => {
  it('renders nothing while closed', () => {
    render(<LeadForm open={false} onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits trimmed values and clears the form afterwards', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.type(nameInput(), '  Ada Lovelace  ')
    await user.type(emailInput(), 'ada@example.com')
    await user.type(phoneInput(), '+1 555 010 1000')
    await user.click(submitButton())

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+1 555 010 1000',
      status: 'New',
    })
    expect(nameInput()).toHaveValue('')
  })

  it('blocks submission and shows per-field messages for an empty form', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await user.click(submitButton())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Phone is required')).toBeInTheDocument()
  })

  it('rejects a phone number that contains letters', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(phoneInput(), '555-CALL-NOW')
    await user.click(submitButton())

    expect(screen.getByText('Phone must contain only numbers')).toBeInTheDocument()
  })

  it('rejects a phone number with too few digits', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(phoneInput(), '555010')
    await user.click(submitButton())

    expect(screen.getByText('Phone must contain between 7 and 15 digits')).toBeInTheDocument()
  })

  it('shows the server error under the matching field for a duplicate email', async () => {
    const user = userEvent.setup()
    const message = 'A lead with this email already exists'
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, message, { email: message }))
    renderForm(onSubmit)

    await fillValidFields(user)
    await user.click(submitButton())

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(emailInput()).toHaveAttribute('aria-invalid', 'true')
    // The dialog stays open so the user can correct the address.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('falls back to a form-level banner for unexpected failures', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network down'))
    renderForm(onSubmit)

    await fillValidFields(user)
    await user.click(submitButton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
  })

  it('submits the status chosen in the dropdown', async () => {
    const user = userEvent.setup()
    const { onSubmit } = renderForm()

    await fillValidFields(user)
    await user.click(screen.getByRole('button', { name: 'Lead status' }))
    await user.click(screen.getByRole('option', { name: /Qualified/ }))
    await user.click(submitButton())

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ status: 'Qualified' }))
  })

  it('closes through the header button', async () => {
    const user = userEvent.setup()
    const { onClose } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Close dialog' }))

    expect(onClose).toHaveBeenCalled()
  })
})
