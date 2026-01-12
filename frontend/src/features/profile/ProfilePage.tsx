import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/app/providers'
import { useMe, useUpdateMe } from './hooks'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Skeleton,
} from '@/components/ui'
import { ErrorState } from '@/components/common'
import { Check, LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { data: userData, isLoading, error } = useMe()
  const updateMutation = useUpdateMe()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
    },
  })

  useEffect(() => {
    if (userData) {
      reset({ fullName: userData.fullName || '' })
    }
  }, [userData, reset])

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(
      { fullName: data.fullName },
      {
        onSuccess: () => {
          reset(data)
        },
      }
    )
  }

  const handleSignOut = async () => {
    await signOut()
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

  if (error) {
    return <ErrorState message="Failed to load profile" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
              <AvatarFallback className="text-2xl">{getInitials(user?.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.displayName || 'User'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" {...register('fullName')} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email is managed by your authentication provider
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uid">User ID</Label>
                <Input
                  id="uid"
                  value={user?.uid || ''}
                  disabled
                  className="bg-muted font-mono text-sm"
                />
              </div>

              <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending ? (
                  'Saving...'
                ) : updateMutation.isSuccess && !isDirty ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
          <CardDescription>Manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground">
                Sign out of your account on this device
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider</span>
              <span className="font-medium capitalize">
                {user?.providerData?.[0]?.providerId?.replace('.com', '') || 'Unknown'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account Created</span>
              <span className="font-medium">
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : 'Unknown'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sign In</span>
              <span className="font-medium">
                {user?.metadata?.lastSignInTime
                  ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                  : 'Unknown'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
