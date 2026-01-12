import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getDateRange(range: '1M' | '3M' | '6M' | '1Y' | 'MAX'): { from: string; to: string } {
  const to = new Date()
  const from = new Date()

  switch (range) {
    case '1M':
      from.setMonth(from.getMonth() - 1)
      break
    case '3M':
      from.setMonth(from.getMonth() - 3)
      break
    case '6M':
      from.setMonth(from.getMonth() - 6)
      break
    case '1Y':
      from.setFullYear(from.getFullYear() - 1)
      break
    case 'MAX':
      from.setFullYear(from.getFullYear() - 10)
      break
  }

  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}
