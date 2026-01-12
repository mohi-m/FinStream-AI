import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/lib/api'
import type { AppUserDto } from '@/lib/api'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: userApi.getMe,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AppUserDto) => userApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
