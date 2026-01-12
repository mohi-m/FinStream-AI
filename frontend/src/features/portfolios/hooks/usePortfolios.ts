import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioApi, holdingApi } from '@/lib/api'
import type { PortfolioDto, HoldingDto } from '@/lib/api'
import { toast } from 'sonner'

export function usePortfolios(page = 0, size = 20) {
  return useQuery({
    queryKey: ['portfolios', page, size],
    queryFn: () => portfolioApi.getAll({ page, size }),
  })
}

export function usePortfolio(portfolioId: string) {
  return useQuery({
    queryKey: ['portfolios', portfolioId],
    queryFn: () => portfolioApi.getById(portfolioId),
    enabled: !!portfolioId,
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PortfolioDto) => portfolioApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      toast.success('Portfolio created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create portfolio: ${error.message}`)
    },
  })
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ portfolioId, data }: { portfolioId: string; data: PortfolioDto }) =>
      portfolioApi.update(portfolioId, data),
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      queryClient.invalidateQueries({ queryKey: ['portfolios', portfolioId] })
      toast.success('Portfolio updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update portfolio: ${error.message}`)
    },
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (portfolioId: string) => portfolioApi.delete(portfolioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      toast.success('Portfolio deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete portfolio: ${error.message}`)
    },
  })
}

export function useHoldings(portfolioId: string, page = 0, size = 50) {
  return useQuery({
    queryKey: ['holdings', portfolioId, page, size],
    queryFn: () => holdingApi.getAll(portfolioId, { page, size }),
    enabled: !!portfolioId,
  })
}

export function useCreateHolding() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ portfolioId, data }: { portfolioId: string; data: HoldingDto }) =>
      holdingApi.create(portfolioId, data),
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['holdings', portfolioId] })
      toast.success('Holding added successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to add holding: ${error.message}`)
    },
  })
}

export function useUpdateHolding() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      portfolioId,
      tickerId,
      data,
    }: {
      portfolioId: string
      tickerId: string
      data: HoldingDto
    }) => holdingApi.update(portfolioId, tickerId, data),
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['holdings', portfolioId] })
      toast.success('Holding updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update holding: ${error.message}`)
    },
  })
}

export function useDeleteHolding() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ portfolioId, tickerId }: { portfolioId: string; tickerId: string }) =>
      holdingApi.delete(portfolioId, tickerId),
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ['holdings', portfolioId] })
      toast.success('Holding removed successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove holding: ${error.message}`)
    },
  })
}
