import { useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
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
  Textarea,
} from '@/components/ui'
import { TickerSearch } from '@/features/stocks/components/TickerSearch'
import { useCreateHolding, useUpdateHolding } from '../hooks'
import { priceApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import type { HoldingDto, TickerDto } from '@/lib/api'

const holdingSchema = z.object({
  tickerId: z.string().min(1, 'Ticker is required'),
  quantity: z.number().gt(0, 'Quantity must be greater than 0'),
  boughtAt: z.number().min(0, 'Bought at must be 0 or greater'),
  notes: z.string().optional(),
})

type HoldingFormData = z.infer<typeof holdingSchema>

interface HoldingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioId: string
  holding?: HoldingDto | null
}

export function HoldingDialog({ open, onOpenChange, portfolioId, holding }: HoldingDialogProps) {
  const createHolding = useCreateHolding()
  const updateHolding = useUpdateHolding()
  const isEditing = !!holding?.tickerId
  const [isFetchingDefaultPrice, setIsFetchingDefaultPrice] = useState(false)
  const [defaultPrice, setDefaultPrice] = useState<number | null>(null)
  const [selectedTicker, setSelectedTicker] = useState<TickerDto | null>(
    holding ? { tickerId: holding.tickerId } : null
  )

  const defaultBoughtAt =
    holding && holding.quantity > 0
      ? (holding.investedAmount || 0) / holding.quantity
      : holding?.investedAmount || 0

  const getDefaultFormValues = () => ({
    tickerId: holding?.tickerId || '',
    quantity: holding?.quantity || 0,
    boughtAt: defaultBoughtAt,
    notes: holding?.notes || '',
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: getDefaultFormValues(),
  })

  const resetDialogForm = () => {
    reset(getDefaultFormValues())
    setDefaultPrice(null)
    setSelectedTicker(holding ? { tickerId: holding.tickerId } : null)
    setIsFetchingDefaultPrice(false)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetDialogForm()
    }
    onOpenChange(nextOpen)
  }

  const quantity = watch('quantity')
  const boughtAt = watch('boughtAt')
  const calculatedInvestedAmount =
    (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(boughtAt) ? boughtAt : 0)

  const handleTickerSelect = async (ticker: TickerDto) => {
    const tickerId = ticker.tickerId || ''
    setSelectedTicker(ticker)
    setValue('tickerId', tickerId, { shouldValidate: true })

    if (!tickerId) {
      return
    }

    setIsFetchingDefaultPrice(true)
    try {
      const latestPrice = await priceApi.getLatest(tickerId)
      if (typeof latestPrice.close === 'number') {
        setValue('boughtAt', latestPrice.close, { shouldValidate: true })
        setDefaultPrice(latestPrice.close)
      } else {
        setDefaultPrice(null)
      }
    } catch {
      setDefaultPrice(null)
    } finally {
      setIsFetchingDefaultPrice(false)
    }
  }

  const onSubmit = async (data: HoldingFormData) => {
    if (data.quantity <= 0) {
      toast.warning('Quantity must be greater than 0.')
      return
    }

    const investedAmount = data.quantity * data.boughtAt
    const normalizedNotes = data.notes?.trim()

    try {
      if (isEditing && holding?.tickerId) {
        await updateHolding.mutateAsync({
          portfolioId,
          tickerId: holding.tickerId,
          data: {
            portfolioId,
            tickerId: holding.tickerId,
            quantity: data.quantity,
            investedAmount,
            notes: normalizedNotes || undefined,
          },
        })
      } else {
        await createHolding.mutateAsync({
          portfolioId,
          data: {
            portfolioId,
            tickerId: data.tickerId,
            quantity: data.quantity,
            investedAmount,
            notes: normalizedNotes || undefined,
          },
        })
      }
      handleDialogOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  const onInvalid = (formErrors: FieldErrors<HoldingFormData>) => {
    const quantityError = formErrors.quantity?.message
    if (typeof quantityError === 'string') {
      toast.warning(quantityError)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the holding details.'
              : 'Add a new stock holding to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
          <div className="space-y-4 py-4">
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="holding-ticker-search">Ticker</Label>
                {selectedTicker ? (
                  <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-medium">{selectedTicker.tickerId}</span>
                      {selectedTicker.companyName && (
                        <span className="ml-2 text-muted-foreground">
                          - {selectedTicker.companyName}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTicker(null)
                        setDefaultPrice(null)
                        setValue('tickerId', '')
                        setValue('boughtAt', 0)
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <TickerSearch
                    embedded
                    inputId="holding-ticker-search"
                    onSelect={handleTickerSelect}
                  />
                )}
                {errors.tickerId && (
                  <p className="text-sm text-destructive">{errors.tickerId.message}</p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="space-y-2">
                <Label>Ticker</Label>
                <Input value={holding?.tickerId || ''} disabled />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Shares)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  placeholder="0"
                  {...register('quantity', { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">{errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="boughtAt">Bought At (Price Per Share)</Label>
                <Input
                  id="boughtAt"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('boughtAt', { valueAsNumber: true })}
                />
                {errors.boughtAt && (
                  <p className="text-sm text-destructive">{errors.boughtAt.message}</p>
                )}
                {!isEditing && selectedTicker && (
                  <p className="text-xs text-muted-foreground">
                    {isFetchingDefaultPrice
                      ? 'Loading current price...'
                      : typeof defaultPrice === 'number'
                        ? `Defaulted to current price: ${formatCurrency(defaultPrice)}`
                        : 'Current price unavailable. You can enter bought at manually.'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">Calculated Invested Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(calculatedInvestedAmount)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this holding..."
                {...register('notes')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || (!isEditing && !selectedTicker)}>
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Holding'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
