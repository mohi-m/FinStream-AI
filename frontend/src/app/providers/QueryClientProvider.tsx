import {
  QueryClient,
  QueryClientProvider as TanstackQueryClientProvider,
} from '@tanstack/react-query'
import type { ReactNode } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export function QueryClientProvider({ children }: { children: ReactNode }) {
  return <TanstackQueryClientProvider client={queryClient}>{children}</TanstackQueryClientProvider>
}
