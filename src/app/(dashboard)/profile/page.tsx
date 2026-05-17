'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { Camera, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { session } = useAuth()

  const [form, setForm] = useState({
    name: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
    phone: '',
    bio: '',
  })
  const [saved, setSaved] = useState(false)

  const initials = (form.name || 'U').slice(0, 2).toUpperCase()

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-design-xs flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl select-none">
            {initials}
          </div>
          <button
            type="button"
            aria-label="Change avatar"
            className={cn(
              'absolute bottom-0 end-0 flex h-7 w-7 items-center justify-center rounded-full',
              'border-2 border-background bg-primary text-primary-foreground shadow-design-sm',
              'hover:bg-primary/90 transition-colors',
            )}
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="text-center sm:text-start">
          <p className="text-lg font-semibold text-foreground">{form.name || 'Your Name'}</p>
          <p className="text-sm text-muted-foreground">{form.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">Real Estate Agent · Ebla CRM</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-design-xs space-y-5">
        <p className="text-sm font-semibold text-foreground border-b border-border pb-3">
          Personal Information
        </p>

        {/* Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={cn(
              'w-full h-10 rounded-xl border border-border bg-muted/40 px-3.5',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none focus:border-ring focus:ring-4 focus:ring-ring/12 transition-all duration-200',
            )}
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={cn(
              'w-full h-10 rounded-xl border border-border bg-muted/40 px-3.5',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none focus:border-ring focus:ring-4 focus:ring-ring/12 transition-all duration-200',
            )}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="+971 50 000 0000"
            className={cn(
              'w-full h-10 rounded-xl border border-border bg-muted/40 px-3.5',
              'text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none focus:border-ring focus:ring-4 focus:ring-ring/12 transition-all duration-200',
            )}
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            Personal Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell your clients a bit about yourself..."
            className={cn(
              'w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5',
              'text-sm text-foreground placeholder:text-muted-foreground resize-none',
              'outline-none focus:border-ring focus:ring-4 focus:ring-ring/12 transition-all duration-200',
            )}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className={cn(
              'flex h-10 items-center gap-2 rounded-xl bg-primary px-5',
              'text-sm font-semibold text-primary-foreground shadow-design-sm',
              'hover:bg-primary/90 active:scale-[0.98] transition-all duration-200',
            )}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
          {saved && (
            <p className="text-sm font-medium text-[#12B76A]">Profile updated successfully</p>
          )}
        </div>
      </form>

    </div>
  )
}
