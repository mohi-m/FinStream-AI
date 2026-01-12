import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Github } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Separator,
} from '@/components/ui'
import { useAuth } from '@/app/providers'
import { toast } from 'sonner'

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { signInWithGoogle, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<'google' | 'github' | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google')
      await signInWithGoogle()
      toast.success('Welcome to FinStream!')
      onOpenChange(false)
      navigate('/app/stocks')
    } catch (error) {
      console.error('Google sign in error:', error)
      toast.error('Failed to sign in with Google')
    } finally {
      setLoading(null)
    }
  }

  const handleGitHubSignIn = async () => {
    try {
      setLoading('github')
      await signInWithGitHub()
      toast.success('Welcome to FinStream!')
      onOpenChange(false)
      navigate('/app/stocks')
    } catch (error) {
      console.error('GitHub sign in error:', error)
      toast.error('Failed to sign in with GitHub')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Welcome to FinStream</DialogTitle>
          <DialogDescription className="text-center">
            Sign in to access your financial dashboard
          </DialogDescription>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12"
            onClick={handleGitHubSignIn}
            disabled={loading !== null}
          >
            {loading === 'github' ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <Github className="mr-2 h-5 w-5" />
            )}
            Continue with GitHub
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
