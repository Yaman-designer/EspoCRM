import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { logoutAction } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User } from 'lucide-react'

export const metadata: Metadata = {
  title: 'لوحة التحكم',
}

export default async function DashboardPage() {
  const session = await auth()
  const userName = session?.user?.name ?? 'المستخدم'
  const initials = userName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email ?? ''}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" size="sm" type="submit">
            <LogOut className="me-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </form>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            مرحباً بك في Ebla CRM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            تم تسجيل الدخول بنجاح. لوحة التحكم الرئيسية جاهزة.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
