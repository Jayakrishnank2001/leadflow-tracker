import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LeadsPage } from '@/pages/LeadsPage'
import { leadService } from '@/services/lead.service'
import type { Lead } from '@/types/lead'

vi.mock('@/services/lead.service', () => ({
  leadService: {
    list: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  },
}))

const service = vi.mocked(leadService)

const lead: Lead = {
  _id: '1',
  id: '1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '+1 555 010 1000',
  status: 'New',
  createdAt: 'Sep 23, 2026',
  updatedAt: '2026-09-23T10:12:31.004Z',
}

function page(data: Lead[]) {
  return { data, pagination: { page: 1, limit: 5, total: data.length, totalPages: 1 } }
}

/** `list` is also used for the stats cards; only the table call carries a search term. */
function searchCalls() {
  return service.list.mock.calls
    .map(([params]) => params as { search?: string })
    .filter((params) => params.search !== undefined)
}

beforeEach(() => {
  vi.clearAllMocks()
  service.list.mockResolvedValue(page([lead]))
  service.create.mockResolvedValue(lead)
  service.updateStatus.mockResolvedValue(lead)
  service.remove.mockResolvedValue(undefined)
})

describe('LeadsPage', () => {
  it('renders the leads returned by the API', async () => {
    render(<LeadsPage />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    expect(screen.getByText('Showing 1-1 of 1 leads')).toBeInTheDocument()
  })

  it('shows the empty state when the API returns no leads', async () => {
    service.list.mockResolvedValue(page([]))
    render(<LeadsPage />)

    expect(await screen.findByText('No leads found')).toBeInTheDocument()
    expect(screen.getByText('Showing 0-0 of 0 leads')).toBeInTheDocument()
  })

  it('shows an error banner when the list request fails', async () => {
    service.list.mockRejectedValue(new Error('Failed to reach the API'))
    render(<LeadsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to reach the API')
  })

  it('debounces search so only the settled term reaches the API', async () => {
    vi.useFakeTimers()
    try {
      render(<LeadsPage />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500)
      })
      expect(searchCalls()).toHaveLength(0)

      const searchInput = screen.getByLabelText('Search leads')
      fireEvent.change(searchInput, { target: { value: 'grace' } })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200)
      })
      fireEvent.change(searchInput, { target: { value: 'grace hopper' } })

      await act(async () => {
        await vi.advanceTimersByTimeAsync(499)
      })
      expect(searchCalls()).toHaveLength(0)

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(searchCalls().map((params) => params.search)).toEqual(['grace hopper'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('creates a lead and refetches the list', async () => {
    const user = userEvent.setup()
    render(<LeadsPage />)
    await screen.findByText('Ada Lovelace')
    service.list.mockClear()

    // While the modal is closed this is the only "Create lead" button.
    await user.click(screen.getByRole('button', { name: /Create lead/ }))
    await user.type(screen.getByPlaceholderText('e.g. Alex Morgan'), 'Grace Hopper')
    await user.type(screen.getByPlaceholderText('alex@company.com'), 'grace@example.com')
    await user.type(screen.getByPlaceholderText('+1 (555) 000-0000'), '+1 555 010 2000')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create lead' }))

    expect(service.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Grace Hopper', email: 'grace@example.com' }),
    )
    await waitFor(() => expect(service.list).toHaveBeenCalled())
  })

  it('updates a status from the row dropdown', async () => {
    const user = userEvent.setup()
    render(<LeadsPage />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: 'Change status from New' }))
    await user.click(screen.getByRole('option', { name: /Qualified/ }))

    expect(service.updateStatus).toHaveBeenCalledWith('1', 'Qualified')
  })

  it('deletes a lead from the row actions menu', async () => {
    const user = userEvent.setup()
    render(<LeadsPage />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: 'Actions for Ada Lovelace' }))
    await user.click(screen.getByRole('button', { name: /Delete lead/ }))

    expect(service.remove).toHaveBeenCalledWith('1')
  })

  it('filters the list when a stats card is clicked', async () => {
    const user = userEvent.setup()
    render(<LeadsPage />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: /Qualified/ }))

    await waitFor(() => {
      const statuses = service.list.mock.calls.map(([params]) => (params as { status?: string }).status)
      expect(statuses).toContain('Qualified')
    })
  })
})
