import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { useCommentary, useRefreshCommentary } from '../hooks'
import { Bot, FileText, AlertCircle, Clock, RefreshCw } from 'lucide-react'
import type { TickerCommentaryDto } from '@/lib/api'
import { cn } from '@/lib/utils'

interface PortfolioCommentaryProps {
  portfolioId: string
}

const commentaryCardClassName =
  'relative isolate flex h-full min-h-0 flex-col overflow-hidden border-primary/30 bg-linear-to-b from-primary/5 via-card to-card shadow-xl shadow-primary/10'

const commentaryAccentClassName =
  'pointer-events-none absolute inset-x-0 top-0 h-12 bg-linear-to-b from-primary/20 via-primary/5 to-transparent'

function CommentaryCardShell({
  children,
  rightSlot,
  animateIcon = false,
  contentClassName,
}: {
  children: ReactNode
  rightSlot?: ReactNode
  animateIcon?: boolean
  contentClassName?: string
}) {
  return (
    <Card className={commentaryCardClassName}>
      <div className={commentaryAccentClassName} />
      <CardHeader className="relative z-10 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Bot className={cn('h-5 w-5 text-primary', animateIcon && 'animate-pulse')} />
              <CardTitle className="text-xl leading-none whitespace-nowrap">AI Insights</CardTitle>
              <Badge
                variant="secondary"
                className="border border-primary/20 bg-primary/10 text-primary"
              >
                GPT 5.3
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Institutional-style intelligence for your portfolio.
            </p>
          </div>
          {rightSlot}
        </div>
      </CardHeader>
      <CardContent className={cn('relative z-10', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

function RefreshCommentaryButton({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean
  onRefresh: () => void
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="w-fit shrink-0 border-primary/30 bg-background/80"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  )
}

function CommentarySection({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-headings:mb-1 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-1.5 prose-li:text-muted-foreground prose-li:my-0.5 prose-strong:text-foreground prose-ul:my-1.5 prose-ol:my-1.5 prose-hr:my-3 prose-hr:border-border">
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{text}</ReactMarkdown>
    </div>
  )
}

function TickerCommentaryCard({ ticker }: { ticker: TickerCommentaryDto }) {
  const hasData = ticker.chunksUsed > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="font-mono font-semibold">
          {ticker.tickerId}
        </Badge>
        <span className="text-sm font-medium">{ticker.companyName}</span>
        <Badge variant="secondary" className="text-xs">
          {ticker.sector}
        </Badge>
        {ticker.filingYear && (
          <Badge variant="secondary" className="text-xs">
            <FileText className="h-3 w-3 mr-1" />
            {ticker.filingYear} Filing
          </Badge>
        )}
      </div>

      {hasData ? (
        <CommentarySection text={ticker.commentary} />
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{ticker.commentary}</span>
        </div>
      )}
    </div>
  )
}

export function PortfolioCommentary({ portfolioId }: PortfolioCommentaryProps) {
  const { data: commentary, isLoading, error } = useCommentary(portfolioId)
  const refreshCommentary = useRefreshCommentary()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTicker, setSelectedTicker] = useState<string>('')
  const isRefreshing = refreshCommentary.isPending

  const handleRefreshCommentary = () => {
    if (!portfolioId || isRefreshing) {
      return
    }

    refreshCommentary.mutate(portfolioId)
  }

  if (isLoading) {
    return (
      <CommentaryCardShell
        animateIcon
        rightSlot={
          <Badge variant="outline" className="w-fit">
            Generating...
          </Badge>
        }
        contentClassName="space-y-4 pt-3"
      >
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
          <p className="text-sm font-medium text-foreground">
            Please wait. GPT-5.3 is crunching the analysis for your portfolio.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Fun fact: this response is augmented by SEC 10-K form's data
          </p>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </CommentaryCardShell>
    )
  }

  if (error || !commentary) {
    return (
      <CommentaryCardShell
        rightSlot={
          <RefreshCommentaryButton
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshCommentary}
          />
        }
        contentClassName="pt-3"
      >
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm">Unable to load AI Insights.</p>
          <p className="text-xs mt-1">Please try again later.</p>
        </div>
      </CommentaryCardShell>
    )
  }

  const activeTickerId = selectedTicker || commentary.commentaries[0]?.tickerId || ''
  const activeTicker = commentary.commentaries.find((ticker) => ticker.tickerId === activeTickerId)

  return (
    <CommentaryCardShell
      rightSlot={
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <RefreshCommentaryButton
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshCommentary}
          />
          <div className="flex max-w-full items-center gap-1 rounded-md border border-border/70 bg-background/70 px-2 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="truncate">
              {new Date(commentary.generatedAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
          </div>
        </div>
      }
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden pt-3"
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2"
      >
        <TabsList className="mb-4 w-full shrink-0 rounded-full border border-primary/20 bg-primary/10 p-1">
          <TabsTrigger
            value="overview"
            className="flex-1 rounded-full data-[state=active]:bg-background/95 data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="tickers"
            className="flex-1 rounded-full data-[state=active]:bg-background/95 data-[state=active]:shadow-sm"
          >
            By Ticker ({commentary.commentaries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 min-h-0 flex-1 overflow-y-auto pr-2">
          <CommentarySection text={commentary.portfolioOverview} />
        </TabsContent>

        <TabsContent value="tickers" className="mt-0 min-h-0 flex-1">
          <div className="flex h-full min-h-0 flex-col gap-4">
            <Select value={activeTickerId} onValueChange={(value) => setSelectedTicker(value)}>
              <SelectTrigger className="w-full shrink-0 border-primary/20 bg-background/70">
                <SelectValue placeholder="Select a ticker" />
              </SelectTrigger>
              <SelectContent>
                {commentary.commentaries.map((ticker) => (
                  <SelectItem key={ticker.tickerId} value={ticker.tickerId}>
                    {ticker.tickerId} — {ticker.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="min-h-0 flex-1 overflow-y-auto pr-2">
              {activeTicker ? (
                <TickerCommentaryCard ticker={activeTicker} />
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>No ticker-level commentary is available yet.</span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </CommentaryCardShell>
  )
}
