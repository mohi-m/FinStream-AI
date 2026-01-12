import { useState } from 'react'
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
  Textarea,
} from '@/components/ui'
import { TickerSearch } from '@/features/stocks/components/TickerSearch'
import { useCreateHolding, useUpdateHolding } from '../hooks'
import type { HoldingDto, TickerDto } from '@/lib/api'

const holdingSchema = z.object({
  tickerId: z.string().min(1, 'Ticker is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  cashBalance: z.number().min(0).optional(),
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
  const [selectedTicker, setSelectedTicker] = useState<TickerDto | null>(
    holding ? { tickerId: holding.tickerId } : null
  )

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HoldingFormData>({
    resolver: zodResolver(holdingSchema),
    defaultValues: {
      tickerId: holding?.tickerId || '',
      quantity: holding?.quantity || 0,
      cashBalance: holding?.cashBalance || 0,
      notes: holding?.notes || '',
    },
  })

  const handleTickerSelect = (ticker: TickerDto) => {
    setSelectedTicker(ticker)
    setValue('tickerId', ticker.tickerId || '')
  }

  const onSubmit = async (data: HoldingFormData) => {
    try {
      if (isEditing && holding?.tickerId) {
        await updateHolding.mutateAsync({
          portfolioId,
          tickerId: holding.tickerId,
          data: {
            ...data,
            portfolioId,
          },
        })
      } else {
        await createHolding.mutateAsync({
          portfolioId,
          data: {
            ...data,
            portfolioId,
          },
        })
      }
      reset()
      setSelectedTicker(null)
      onOpenChange(false)
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the holding details.'
              : 'Add a new stock holding to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {!isEditing && (
              <div className="space-y-2">
                <Label>Select Ticker</Label>
                {selectedTicker ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
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
                        setValue('tickerId', '')
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md p-4">
                    <TickerSearch onSelect={handleTickerSelect} />
                  </div>
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

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="cashBalance">Cash Balance (Optional)</Label>
                <Input
                  id="cashBalance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('cashBalance', { valueAsNumber: true })}
                />
                {errors.cashBalance && (
                  <p className="text-sm text-destructive">{errors.cashBalance.message}</p>
                )}
              </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
