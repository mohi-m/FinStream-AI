import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { EmptyState, ErrorState, Loading } from '@/components/common'
import { usePortfolios, useHoldings, useDeletePortfolio, useDeleteHolding } from './hooks'
import {
  PortfolioDialog,
  HoldingDialog,
  DeleteConfirmDialog,
  PortfolioAnalytics,
} from './components'
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

  const {
    data: portfoliosData,
    isLoading: portfoliosLoading,
    error: portfoliosError,
  } = usePortfolios()
  const portfolios = portfoliosData?.content || []
  const selectedPortfolio = portfolios.find((p) => p.portfolioId === selectedPortfolioId)

  const { data: holdingsData, isLoading: holdingsLoading } = useHoldings(selectedPortfolioId || '')
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
    if (selectedPortfolioId) {
      deletePortfolioMutation.mutate(selectedPortfolioId, {
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
    if (selectedPortfolioId && deletingHolding?.tickerId) {
      deleteHoldingMutation.mutate(
        { portfolioId: selectedPortfolioId, tickerId: deletingHolding.tickerId },
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
      <div className="flex items-center justify-center h-[50vh]">
        <Loading message="Loading portfolios..." />
      </div>
    )
  }

  if (portfoliosError) {
    return <ErrorState message="Failed to load portfolios" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolios</h1>
          <p className="text-muted-foreground">Manage your investment portfolios</p>
        </div>
        <Button onClick={handleCreatePortfolio}>
          <Plus className="h-4 w-4 mr-2" />
          Create Portfolio
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Portfolio List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Portfolios</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {portfolios.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No portfolios yet</p>
                  <Button variant="link" onClick={handleCreatePortfolio}>
                    Create your first portfolio
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {portfolios.map((portfolio) => (
                    <div
                      key={portfolio.portfolioId}
                      className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedPortfolioId === portfolio.portfolioId ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedPortfolioId(portfolio.portfolioId || null)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{portfolio.portfolioName}</p>
                          <Badge variant="secondary" className="mt-1">
                            {portfolio.baseCurrency}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPortfolio(portfolio)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedPortfolioId(portfolio.portfolioId || null)
                                setDeletePortfolioOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Detail */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedPortfolioId ? (
            <Card>
              <CardContent className="py-16">
                <EmptyState
                  title="Select a Portfolio"
                  description="Choose a portfolio from the list to view its holdings and analytics."
                  icon={<Briefcase className="h-12 w-12 text-muted-foreground" />}
                />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Portfolio Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedPortfolio?.portfolioName}</CardTitle>
                      <CardDescription>
                        Created{' '}
                        {selectedPortfolio?.createdAt
                          ? formatDate(selectedPortfolio.createdAt)
                          : 'N/A'}
                      </CardDescription>
                    </div>
                    <Button onClick={handleCreateHolding}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Holding
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              {/* Holdings Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Holdings</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticker</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Cash Balance</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-20"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {holdings.map((holding) => (
                          <TableRow key={holding.tickerId}>
                            <TableCell className="font-medium">{holding.tickerId}</TableCell>
                            <TableCell className="text-right">{holding.quantity}</TableCell>
                            <TableCell className="text-right">
                              {holding.cashBalance
                                ? formatCurrency(
                                    holding.cashBalance,
                                    selectedPortfolio?.baseCurrency
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell className="max-w-50 truncate">
                              {holding.notes || '-'}
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
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setDeletingHolding(holding)
                                      setDeleteHoldingOpen(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
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

              {/* Portfolio Analytics */}
              <PortfolioAnalytics
                holdings={holdings}
                baseCurrency={selectedPortfolio?.baseCurrency || 'USD'}
              />
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <PortfolioDialog
        open={portfolioDialogOpen}
        onOpenChange={setPortfolioDialogOpen}
        portfolio={editingPortfolio}
      />

      {selectedPortfolioId && (
        <HoldingDialog
          open={holdingDialogOpen}
          onOpenChange={setHoldingDialogOpen}
          portfolioId={selectedPortfolioId}
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
