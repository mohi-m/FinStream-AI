import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
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
import { useCommentary } from '../hooks'
import { Bot, FileText, AlertCircle, Clock } from 'lucide-react'
import type { TickerCommentaryDto } from '@/lib/api'

interface PortfolioCommentaryProps {
  portfolioId: string
}

const commentaryCardClassName =
  'relative flex h-full flex-col overflow-hidden border-primary/30 bg-gradient-to-b from-primary/5 via-card to-card shadow-xl shadow-primary/10'

function CommentarySection({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:text-sm prose-headings:font-semibold prose-headings:mb-1 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-1.5 prose-li:text-muted-foreground prose-li:my-0.5 prose-strong:text-foreground prose-ul:my-1.5 prose-ol:my-1.5 prose-hr:my-3 prose-hr:border-border">
      <ReactMarkdown>{text}</ReactMarkdown>
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
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTicker, setSelectedTicker] = useState<string>('')

  if (isLoading) {
    return (
      <Card className={commentaryCardClassName}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary animate-pulse" />
                <CardTitle className="text-xl">AI Commentary</CardTitle>
                <Badge
                  variant="secondary"
                  className="border border-primary/20 bg-primary/10 text-primary"
                >
                  GPT 5.3
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Institutional-style intelligence for your portfolio
              </p>
            </div>
            <Badge variant="outline" className="w-fit">
              Generating...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4 pt-3">
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
        </CardContent>
      </Card>
    )
  }

  if (error || !commentary) {
    return (
      <Card className={commentaryCardClassName}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />
        <CardHeader className="relative pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">AI Commentary</CardTitle>
            <Badge
              variant="secondary"
              className="border border-primary/20 bg-primary/10 text-primary"
            >
              Flagship Insight
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Institutional-style intelligence for your portfolio.
          </p>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">Unable to load AI commentary.</p>
            <p className="text-xs mt-1">Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={commentaryCardClassName}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />
      <CardHeader className="relative pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">AI Commentary</CardTitle>
              <Badge
                variant="secondary"
                className="border border-primary/20 bg-primary/10 text-primary"
              >
                Flagship Insight
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Institutional-style intelligence for your portfolio.
            </p>
          </div>
          <div className="flex w-fit items-center gap-1 rounded-md border border-border/70 bg-background/70 px-2 py-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(commentary.generatedAt).toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative flex min-h-0 flex-1 flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col pt-2"
        >
          <TabsList className="mb-4 w-full bg-background/70">
            <TabsTrigger value="overview" className="flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickers" className="flex-1">
              By Ticker ({commentary.commentaries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 min-h-0 flex-1">
            <div className="h-full overflow-y-auto pr-2">
              <CommentarySection text={commentary.portfolioOverview} />
            </div>
          </TabsContent>

          <TabsContent value="tickers" className="mt-0 min-h-0 flex-1">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <Select
                value={selectedTicker || commentary.commentaries[0]?.tickerId || ''}
                onValueChange={(value) => setSelectedTicker(value)}
              >
                <SelectTrigger className="w-full border-primary/20 bg-background/70">
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
                {(() => {
                  const activeTicker = commentary.commentaries.find(
                    (t) => t.tickerId === (selectedTicker || commentary.commentaries[0]?.tickerId)
                  )
                  return activeTicker ? <TickerCommentaryCard ticker={activeTicker} /> : null
                })()}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
