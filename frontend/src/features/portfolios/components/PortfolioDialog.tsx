import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useCreatePortfolio, useUpdatePortfolio } from '../hooks'
import type { PortfolioDto } from '@/lib/api'

const portfolioSchema = z.object({
  portfolioName: z.string().min(1, 'Portfolio name is required').max(100),
  baseCurrency: z.string().min(1, 'Currency is required'),
})

type PortfolioFormData = z.infer<typeof portfolioSchema>

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL']

interface PortfolioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio?: PortfolioDto | null
}

export function PortfolioDialog({ open, onOpenChange, portfolio }: PortfolioDialogProps) {
  const createPortfolio = useCreatePortfolio()
  const updatePortfolio = useUpdatePortfolio()
  const isEditing = !!portfolio?.portfolioId

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PortfolioFormData>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      portfolioName: portfolio?.portfolioName || '',
      baseCurrency: portfolio?.baseCurrency || 'USD',
    },
  })

  const baseCurrency = watch('baseCurrency')

  const onSubmit = async (data: PortfolioFormData) => {
    try {
      if (isEditing && portfolio?.portfolioId) {
        await updatePortfolio.mutateAsync({
          portfolioId: portfolio.portfolioId,
          data: { ...data, portfolioId: portfolio.portfolioId },
        })
      } else {
        await createPortfolio.mutateAsync(data)
      }
      reset()
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Portfolio' : 'Create Portfolio'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your portfolio details.'
              : 'Create a new portfolio to track your investments.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="portfolioName">Portfolio Name</Label>
              <Input id="portfolioName" placeholder="My Portfolio" {...register('portfolioName')} />
              {errors.portfolioName && (
                <p className="text-sm text-destructive">{errors.portfolioName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseCurrency">Base Currency</Label>
              <Select
                value={baseCurrency}
                onValueChange={(value) => setValue('baseCurrency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.baseCurrency && (
                <p className="text-sm text-destructive">{errors.baseCurrency.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
