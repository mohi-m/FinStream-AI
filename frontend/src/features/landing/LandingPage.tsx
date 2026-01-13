import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  ArrowRight,
  Sparkles,
  Globe,
  Users,
  ChevronRight,
  Play,
  Check,
  Star,
} from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { useAuth } from '@/app/providers'
import { LoginDialog } from '@/features/auth'

const features = [
  {
    icon: TrendingUp,
    title: 'Real-Time Market Data',
    description: 'Access live stock prices and historical data for informed investment decisions.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: PieChart,
    title: 'Portfolio Analytics',
    description:
      'Track your holdings with comprehensive allocation charts and performance metrics.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Financial Insights',
    description: 'Analyze company financials including revenue, earnings, and cash flow.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with enterprise-grade security and encryption.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance for instant data loading and smooth interactions.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: LineChart,
    title: 'Smart Watchlists',
    description: 'Create custom watchlists to monitor your favorite stocks effortlessly.',
    gradient: 'from-indigo-500 to-blue-500',
  },
]

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.5, delay }}
    className={`absolute rounded-full blur-3xl ${className}`}
  />
)

export function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useEffect(() => {
    if (!loading && user) {
      navigate('/app/stocks')
    }
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

        {/* Animated gradient orbs */}
        <FloatingOrb
          className="w-[600px] h-[600px] -top-32 -right-32 bg-gradient-to-br from-primary/30 to-blue-500/20 animate-pulse-glow"
          delay={0}
        />
        <FloatingOrb
          className="w-[500px] h-[500px] top-1/2 -left-48 bg-gradient-to-br from-violet-500/20 to-purple-500/10 animate-pulse-glow"
          delay={0.5}
        />
        <FloatingOrb
          className="w-[400px] h-[400px] bottom-0 right-1/4 bg-gradient-to-br from-cyan-500/15 to-teal-500/10 animate-pulse-glow"
          delay={1}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold tracking-tight">FinStream</span>
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="hidden md:flex items-center gap-8"
          >
            {['Features', 'Pricing', 'About'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="ghost" onClick={() => setLoginOpen(true)}>
              Log In
            </Button>
            <Button
              onClick={() => setLoginOpen(true)}
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg shadow-primary/25"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/30 backdrop-blur-sm mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Introducing AI-Powered Insights</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]"
          >
            The Future of
            <br />
            <span className="gradient-text animate-gradient">Portfolio Management</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Track stocks, manage portfolios, and unlock powerful financial insights with our
            next-generation platform. Make smarter investment decisions with real-time data.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="h-14 px-8 text-base bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-xl shadow-primary/30 group"
              onClick={() => setLoginOpen(true)}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base border-border/50 hover:bg-muted/50 group"
            >
              <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Bank-level security</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {/* ================= 3D DASHBOARD VISUALIZATION ================= */}
        <div className="perspective-container relative mt-12 h-[500px] md:h-[800px] w-full flex justify-center">
          {/* The Tilted Dashboard Container */}
          <div className="tilted-dashboard glass-effect bg-[#0f1623] rounded-2xl md:rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/80 w-full max-w-6xl h-full relative z-20 overflow-hidden flex flex-col">
            {/* Fake Browser Header */}
            <div className="h-10 border-b border-slate-700/50 bg-slate-900/50 flex items-center px-4 gap-4 shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-black/20 text-slate-500 text-xs px-3 py-1 rounded-md flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  www.finstream-ai.app
                </div>
              </div>
              <div className="w-12"></div> {/* Spacer */}
            </div>

            {/* Dashboard Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-16 md:w-64 border-r border-slate-700/30 bg-slate-900/30 p-4 hidden md:flex flex-col gap-4">
                <div className="flex items-center gap-3 p-3 bg-primary/10 text-primary rounded-lg border border-primary/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span className="font-medium text-sm">Dashboard</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800/50 rounded-lg transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  <span className="font-medium text-sm">Markets</span>
                </div>
                <div className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800/50 rounded-lg transition">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium text-sm">Analytics</span>
                </div>
                <div className="mt-auto p-4 bg-linear-to-br from-primary/20 to-purple-500/10 rounded-xl border border-primary/10">
                  <div className="text-xs font-bold text-white mb-1">Pro Plan</div>
                  <div className="text-[10px] text-slate-400">Expires in 12 days</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 md:p-8 bg-[#0B101B] overflow-hidden relative">
                {/* Background Grid for Charts */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                ></div>

                {/* Header Info */}
                <div className="flex justify-between items-end mb-8 relative z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Portfolio Overview</h2>
                    <p className="text-slate-400 text-sm">Welcome back, Alex.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white tracking-tight">$142,500.24</div>
                    <div className="text-emerald-400 text-sm font-medium flex justify-end items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                          clipRule="evenodd"
                        />
                      </svg>
                      +2.4% Today
                    </div>
                  </div>
                </div>

                {/* Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                  {/* Card 1 */}
                  <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl backdrop-blur-sm">
                    <div className="flex justify-between mb-4">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-black font-bold text-xs">
                        AAPL
                      </div>
                      <span className="text-emerald-400 text-xs">+1.2%</span>
                    </div>
                    <div className="h-12 w-full flex items-end gap-1 opacity-50">
                      <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[40%]"></div>
                      <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[60%]"></div>
                      <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[50%]"></div>
                      <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[80%]"></div>
                      <div className="w-1/5 bg-emerald-500 rounded-t-sm h-[70%]"></div>
                    </div>
                    <div className="mt-2 font-bold text-lg">$189.45</div>
                  </div>
                  {/* Card 2 */}
                  <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl backdrop-blur-sm hidden md:block">
                    <div className="flex justify-between mb-4">
                      <div className="h-8 w-8 rounded-full bg-[#76b900] flex items-center justify-center text-black font-bold text-xs">
                        NVDA
                      </div>
                      <span className="text-emerald-400 text-xs">+4.5%</span>
                    </div>
                    {/* CSS Line Chart */}
                    <div className="h-12 w-full relative overflow-hidden">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 100 40"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0,35 C20,35 20,10 40,20 C60,30 60,5 100,0"
                          fill="none"
                          stroke="#76b900"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d="M0,35 C20,35 20,10 40,20 C60,30 60,5 100,0 L100,40 L0,40 Z"
                          fill="url(#gradNvda)"
                          opacity="0.2"
                        />
                        <defs>
                          <linearGradient id="gradNvda" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#76b900', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#76b900', stopOpacity: 0 }} />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <div className="mt-2 font-bold text-lg">$460.18</div>
                  </div>
                  {/* Card 3 */}
                  <div className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-xl backdrop-blur-sm hidden md:block">
                    <div className="flex justify-between mb-4">
                      <div className="h-8 w-8 rounded-full bg-[#000] border border-white/20 flex items-center justify-center text-white font-bold text-xs">
                        TSLA
                      </div>
                      <span className="text-red-400 text-xs">-0.8%</span>
                    </div>
                    <div className="h-12 w-full flex items-end gap-1 opacity-50">
                      <div className="w-1/5 bg-red-500 rounded-t-sm h-[70%]"></div>
                      <div className="w-1/5 bg-red-500 rounded-t-sm h-[50%]"></div>
                      <div className="w-1/5 bg-red-500 rounded-t-sm h-[60%]"></div>
                      <div className="w-1/5 bg-red-500 rounded-t-sm h-[40%]"></div>
                      <div className="w-1/5 bg-red-500 rounded-t-sm h-[30%]"></div>
                    </div>
                    <div className="mt-2 font-bold text-lg">$242.50</div>
                  </div>
                </div>

                {/* Main Chart Area */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 h-64 md:h-96 relative w-full overflow-hidden">
                  <div className="flex justify-between mb-4">
                    <div className="text-sm font-medium text-slate-300">Performance (YTD)</div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 text-xs bg-slate-700 rounded text-slate-300">
                        1D
                      </span>
                      <span className="px-2 py-1 text-xs bg-primary text-white rounded">1W</span>
                      <span className="px-2 py-1 text-xs bg-slate-700 rounded text-slate-300">
                        1M
                      </span>
                    </div>
                  </div>
                  {/* Large Simulated Chart */}
                  <div className="absolute bottom-0 left-0 right-0 top-16 px-4">
                    <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                      <path
                        d="M0,130 C40,120 60,140 100,100 C140,60 160,90 200,70 C240,50 280,80 320,40 C360,0 380,20 400,10"
                        fill="none"
                        stroke="#4F75FF"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                      <path
                        d="M0,130 C40,120 60,140 100,100 C140,60 160,90 200,70 C240,50 280,80 320,40 C360,0 380,20 400,10 L400,150 L0,150 Z"
                        fill="url(#gradMain)"
                        opacity="0.3"
                      />
                      <defs>
                        <linearGradient id="gradMain" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#4F75FF', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: '#4F75FF', stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FLOATING UI ELEMENTS (Outside the main dashboard for depth) */}

          {/* Floating Alert 1 */}
          <div className="absolute top-[10%] -right-4 md:-right-2 z-30 animate-float hidden md:block">
            <div className="glass-effect p-4 rounded-xl shadow-3xl border-20 border-emerald-500 w-64">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/20 p-1.5 rounded-md text-emerald-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <span className="font-bold text-white text-sm">Price Alert</span>
                </div>
                <span className="text-[10px] text-slate-500">2m ago</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                <span className="font-bold text-white">AMD</span> has crossed the 50-day moving
                average.
              </p>
            </div>
          </div>

          {/* Floating Alert 2 (Left side) */}
          <div className="absolute bottom-[20%] -left-4 md:-left-12 z-30 hidden animate-float md:block">
            <div className="glass-effect p-3 rounded-xl shadow-2xl flex items-center gap-3 w-56">
              <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <div>
                <div className="text-xs text-slate-400">AI Confidence</div>
                <div className="text-white font-bold">94% Bullish</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mb-6"
          >
            Features
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold"
          >
            Everything You Need to
            <br />
            <span className="gradient-text">Succeed</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Powerful tools designed to help you track, analyze, and grow your investments with
            confidence.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full group bg-background/50 border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 overflow-hidden relative">
                {/* Gradient hover effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                />

                <CardHeader className="relative">
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-violet-600" />

          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(white 1px, transparent 1px),
                               linear-gradient(90deg, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative px-8 py-20 md:py-28 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
            >
              Ready to Transform Your
              <br />
              Investment Journey?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xl text-white/80 max-w-2xl mx-auto"
            >
              Join thousands of investors who trust FinStream for their portfolio management needs.
              Start your free trial today.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-base font-semibold shadow-xl group"
                onClick={() => setLoginOpen(true)}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-base font-semibold bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Schedule a Demo
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">FinStream</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The next-generation platform for modern investors.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 FinStream. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
