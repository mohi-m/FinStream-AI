import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { EmptyState, ErrorState, Loading } from '@/components/common'
import { usePortfolios, useHoldings, useDeletePortfolio, useDeleteHolding } from './hooks'
import {
  PortfolioDialog,
  HoldingDialog,
  DeleteConfirmDialog,
  PortfolioCommentary,
  PortfolioSummaryCards,
} from './components'
import { PortfolioAnalytics } from './components/PortfolioAnalytics'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Edit, Trash2, Briefcase, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui'
import type { PortfolioDto, HoldingDto } from '@/lib/api'

export function PortfoliosPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null)
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioDto | null>(null)
  const [holdingDialogOpen, setHoldingDialogOpen] = useState(false)
  const [editingHolding, setEditingHolding] = useState<HoldingDto | null>(null)
  const [deletePortfolioOpen, setDeletePortfolioOpen] = useState(false)
  const [deleteHoldingOpen, setDeleteHoldingOpen] = useState(false)
  const [deletingHolding, setDeletingHolding] = useState<HoldingDto | null>(null)

  const pageContainerClass = 'mx-auto w-full max-w-screen-2xl px-1 sm:px-3 lg:px-4'

  const {
    data: portfoliosData,
    isLoading: portfoliosLoading,
    error: portfoliosError,
  } = usePortfolios()
  const portfolios = portfoliosData?.content || []
  const activePortfolioId = selectedPortfolioId || portfolios[0]?.portfolioId || null
  const selectedPortfolio = portfolios.find((p) => p.portfolioId === activePortfolioId)
  const hasActivePortfolio = portfolios.length > 0 && !!activePortfolioId

  const { data: holdingsData, isLoading: holdingsLoading } = useHoldings(activePortfolioId || '')
  const holdings = holdingsData?.content || []

  const deletePortfolioMutation = useDeletePortfolio()
  const deleteHoldingMutation = useDeleteHolding()

  const handleCreatePortfolio = () => {
    setEditingPortfolio(null)
    setPortfolioDialogOpen(true)
  }

  const handleEditPortfolio = (portfolio: PortfolioDto) => {
    setEditingPortfolio(portfolio)
    setPortfolioDialogOpen(true)
  }

  const handleDeletePortfolio = () => {
    if (activePortfolioId) {
      deletePortfolioMutation.mutate(activePortfolioId, {
        onSuccess: () => {
          setSelectedPortfolioId(null)
          setDeletePortfolioOpen(false)
        },
      })
    }
  }

  const handleCreateHolding = () => {
    setEditingHolding(null)
    setHoldingDialogOpen(true)
  }

  const handleEditHolding = (holding: HoldingDto) => {
    setEditingHolding(holding)
    setHoldingDialogOpen(true)
  }

  const handleDeleteHolding = () => {
    if (activePortfolioId && deletingHolding?.tickerId) {
      deleteHoldingMutation.mutate(
        { portfolioId: activePortfolioId, tickerId: deletingHolding.tickerId },
        {
          onSuccess: () => {
            setDeletingHolding(null)
            setDeleteHoldingOpen(false)
          },
        }
      )
    }
  }

  if (portfoliosLoading) {
    return (
      <div className={pageContainerClass}>
        <div className="flex items-center justify-center h-[50vh]">
          <Loading message="Loading portfolios..." />
        </div>
      </div>
    )
  }

  if (portfoliosError) {
    return (
      <div className={pageContainerClass}>
        <ErrorState message="Failed to load portfolios" />
      </div>
    )
  }

  return (
    <div
      className={`${pageContainerClass} space-y-6 ${hasActivePortfolio ? 'lg:flex lg:flex-col lg:space-y-4 2xl:h-[calc(100dvh-7.5rem)]' : ''}`}
    >
      {/* Header with Portfolio Dropdown */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center">
          <h1 className="text-2xl font-bold sm:text-3xl">My Portfolio</h1>
          {portfolios.length > 0 && (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Select
                value={activePortfolioId || ''}
                onValueChange={(value) => setSelectedPortfolioId(value)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Select portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios.map((portfolio) => (
                    <SelectItem key={portfolio.portfolioId} value={portfolio.portfolioId || ''}>
                      {portfolio.portfolioName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPortfolio && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleEditPortfolio(selectedPortfolio)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Portfolio
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setDeletePortfolioOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Portfolio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
        <Button onClick={handleCreatePortfolio} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              title="No Portfolios Yet"
              description="Create your first portfolio to start tracking your investments."
              icon={<Briefcase className="h-12 w-12 text-muted-foreground" />}
              action={{
                label: 'Create Portfolio',
                onClick: handleCreatePortfolio,
              }}
            />
          </CardContent>
        </Card>
      ) : activePortfolioId ? (
        <>
          {/* Two-column layout: Commentary (left) + Holdings & Analytics (right) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 2xl:min-h-0 2xl:flex-1">
            {/* Left Column: AI Commentary */}
            <div className="lg:col-span-2 2xl:min-h-0">
              <PortfolioCommentary portfolioId={activePortfolioId} />
            </div>

            {/* Right Column: Portfolio Detail */}
            <div className="lg:col-span-3 lg:flex lg:flex-col lg:gap-4 2xl:min-h-0">
              <PortfolioSummaryCards
                holdings={holdings}
                baseCurrency={selectedPortfolio?.baseCurrency || 'USD'}
                isLoading={holdingsLoading}
                className="shrink-0"
              />

              <Tabs
                defaultValue="analytics"
                className="space-y-6 lg:flex lg:flex-col lg:space-y-4 2xl:min-h-0 2xl:flex-1"
              >
                <TabsList className="w-full rounded-full">
                  <TabsTrigger value="analytics" className="flex-1 rounded-full">
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="holdings" className="flex-1 rounded-full">
                    Holdings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="mt-0 2xl:min-h-0 2xl:flex-1">
                  <PortfolioAnalytics
                    holdings={holdings}
                    baseCurrency={selectedPortfolio?.baseCurrency || 'USD'}
                    className="2xl:h-full"
                  />
                </TabsContent>

                <TabsContent value="holdings" className="mt-0 2xl:min-h-0 2xl:flex-1">
                  <Card className="lg:flex lg:flex-col 2xl:h-full">
                    <CardHeader>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-lg">Holdings</CardTitle>
                        <Button onClick={handleCreateHolding} className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Holding
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="2xl:min-h-0 2xl:flex-1 2xl:overflow-auto">
                      {holdingsLoading ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                          ))}
                        </div>
                      ) : holdings.length === 0 ? (
                        <EmptyState
                          title="No Holdings"
                          description="Add your first stock holding to start tracking your portfolio."
                          action={{
                            label: 'Add Holding',
                            onClick: handleCreateHolding,
                          }}
                        />
                      ) : (
                        <Table className="min-w-160">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Ticker</TableHead>
                              <TableHead className="text-left">Quantity</TableHead>
                              <TableHead className="text-left">Invested Amount</TableHead>
                              <TableHead className="hidden md:table-cell">Notes</TableHead>
                              <TableHead className="hidden lg:table-cell">
                                Last Invested Date
                              </TableHead>
                              <TableHead className="w-20"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {holdings.map((holding) => (
                              <TableRow key={holding.tickerId}>
                                <TableCell className="font-medium">{holding.tickerId}</TableCell>
                                <TableCell className="text-left">{holding.quantity}</TableCell>
                                <TableCell className="text-left">
                                  {typeof holding.investedAmount === 'number'
                                    ? formatCurrency(
                                        holding.investedAmount,
                                        selectedPortfolio?.baseCurrency
                                      )
                                    : '-'}
                                </TableCell>
                                <TableCell className="hidden max-w-48 truncate md:table-cell">
                                  {holding.notes || '-'}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  {holding.updatedAt ? formatDate(holding.updatedAt) : '-'}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditHolding(holding)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setDeletingHolding(holding)
                                          setDeleteHoldingOpen(true)
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      ) : null}

      {/* Dialogs */}
      <PortfolioDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        portfolio={editingPortfolio}
      />

      {activePortfolioId && (
        <HoldingDialog
          open={holdingDialogOpen}
          onOpenChange={setHoldingDialogOpen}
          portfolioId={activePortfolioId}
          holding={editingHolding}
        />
      )}

      <DeleteConfirmDialog
        open={deletePortfolioOpen}
        onOpenChange={setDeletePortfolioOpen}
        onConfirm={handleDeletePortfolio}
        title="Delete Portfolio"
        description="Are you sure you want to delete this portfolio? All holdings will be removed. This action cannot be undone."
        isDeleting={deletePortfolioMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteHoldingOpen}
        onOpenChange={setDeleteHoldingOpen}
        onConfirm={handleDeleteHolding}
        title="Remove Holding"
        description={`Are you sure you want to remove ${deletingHolding?.tickerId} from this portfolio?`}
        isDeleting={deleteHoldingMutation.isPending}
      />
    </div>
  )
}
