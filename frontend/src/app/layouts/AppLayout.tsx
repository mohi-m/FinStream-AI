import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, Briefcase, User, LogOut, Search } from 'lucide-react'
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Skeleton,
} from '@/components/ui'
import { useAuth } from '@/app/providers'
import { useTickersSearch } from '@/features/stocks/hooks'
import { useDebounce } from '@/lib/utils/hooks'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/app/overview', icon: TrendingUp, label: 'Overview' },
  { to: '/app/portfolios', icon: Briefcase, label: 'My Portfolio' },
  { to: '/app/profile', icon: User, label: 'Profile' },
]

function TopNav({ className }: { className?: string }) {
  return (
    <nav className={cn('flex items-center justify-center gap-2 lg:gap-4', className)}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const desktopSearchContainerRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchContainerRef = useRef<HTMLDivElement | null>(null)
  const debouncedQuery = useDebounce(searchQuery.trim(), 300)
  const {
    data: searchResults,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
  } = useTickersSearch(debouncedQuery, 0, 10)
  const hasSearchQuery = searchQuery.trim().length > 0

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const isInsideDesktopSearch = desktopSearchContainerRef.current?.contains(target)
      const isInsideMobileSearch = mobileSearchContainerRef.current?.contains(target)

      if (!isInsideDesktopSearch && !isInsideMobileSearch) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  const navigateToTicker = (tickerId: string) => {
    const normalizedTicker = tickerId.trim().toUpperCase()
    if (!normalizedTicker) return

    setSearchQuery(normalizedTicker)
    setIsSearchOpen(false)
    navigate(`/app/overview?ticker=${encodeURIComponent(normalizedTicker)}`)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const firstMatchTicker = searchResults?.content?.[0]?.tickerId
    if (firstMatchTicker) {
      navigateToTicker(firstMatchTicker)
      return
    }

    const normalizedTicker = searchQuery.trim().toUpperCase()
    if (!normalizedTicker) {
      setIsSearchOpen(false)
      return
    }

    navigateToTicker(normalizedTicker)
  }

  const renderSearchResults = (className: string) => {
    if (!isSearchOpen || !hasSearchQuery) return null

    return (
      <div
        className={cn(
          'absolute top-[calc(100%+0.5rem)] z-50 rounded-md border border-border bg-background p-2 shadow-lg',
          className
        )}
      >
        {isSearchLoading || isSearchFetching ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : searchResults?.content && searchResults.content.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {searchResults.content.map((ticker, index) => (
              <button
                type="button"
                key={ticker.tickerId || `${ticker.companyName}-${index}`}
                className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                onClick={() => ticker.tickerId && navigateToTicker(ticker.tickerId)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{ticker.tickerId}</p>
                  <p className="truncate text-xs text-muted-foreground">{ticker.companyName}</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {ticker.sector || 'N/A'}
                </Badge>
              </button>
            ))}
          </div>
        ) : (
          <p className="py-3 text-center text-sm text-muted-foreground">
            No tickers found for "{debouncedQuery}"
          </p>
        )}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <NavLink
            to="/app/overview"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            FinStream
          </NavLink>
        </div>

        <TopNav className="hidden md:flex" />

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <div className="hidden lg:flex items-center">
            <div ref={desktopSearchContainerRef} className="relative w-md">
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticker or company..."
                  className="h-9 w-full rounded-full border-border/60 bg-muted/30 pl-10 focus-visible:ring-primary/30"
                  value={searchQuery}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearchOpen(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setIsSearchOpen(false)
                    }
                  }}
                />
              </form>

              {renderSearchResults('right-0 w-full')}
            </div>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.photoURL || undefined}
                    alt={user?.displayName || 'User'}
                  />
                  <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{user?.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/app/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border-t border-border/60 px-3 py-2 lg:hidden">
        <div ref={mobileSearchContainerRef} className="relative w-full">
          <form onSubmit={handleSearchSubmit}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticker or company..."
              className="h-9 w-full rounded-full border-border/60 bg-muted/30 pl-10 focus-visible:ring-primary/30"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsSearchOpen(true)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsSearchOpen(false)
                }
              }}
            />
          </form>

          {renderSearchResults('left-0 right-0')}
        </div>
      </div>

      <div className="border-t border-border/60 px-3 py-2 md:hidden">
        <TopNav className="w-full justify-start overflow-x-auto" />
      </div>
    </header>
  )
}

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 p-4 lg:p-6"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
