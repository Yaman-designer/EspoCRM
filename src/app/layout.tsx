import type { Metadata, Viewport } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { I18nProvider } from "@/i18n/I18nProvider"
import { TouchActivator } from "@/components/TouchActivator"
import "./globals.css"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://eblacrm.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { template: "%s | Ebla CRM", default: "Ebla CRM" },
  description:
    "Ebla CRM — Professional customer relationship management platform for real estate and sales teams. Manage leads, contracts, pipelines, and analytics in one place.",
  keywords: [
    "CRM",
    "customer relationship management",
    "real estate CRM",
    "sales management",
    "pipeline management",
    "Ebla CRM",
  ],
  authors: [{ name: "Ebla CRM" }],
  creator: "Ebla CRM",
  openGraph: {
    type: "website",
    siteName: "Ebla CRM",
    title: "Ebla CRM — Real Estate & Sales Management",
    description:
      "Professional CRM platform for real estate and sales teams. Manage customers, analytics, and workflows in one unified platform.",
    images: [
      {
        url: "/images/crm-hero.webp",
        width: 640,
        height: 700,
        alt: "Ebla CRM Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ebla CRM — Real Estate & Sales Management",
    description:
      "Professional CRM platform for real estate and sales teams.",
    images: ["/images/crm-hero.webp"],
  },
  // Dashboard pages are behind auth — don't index them by default.
  // Individual public pages (login) override this with robots: { index: true }.
  robots: { index: false, follow: true },
}

// BottomNav.tsx and DashboardShell.tsx both position/pad against
// `env(safe-area-inset-bottom)` (the iOS home-indicator/notch clearance) —
// that only ever resolves to a non-zero value when the viewport opts into
// `viewport-fit=cover`. Without it (the framework default), Safari never
// extends the layout viewport under the safe areas, so every env() read in
// this app was silently evaluating to 0 on real notched/home-indicator
// devices — the safe-area-aware CSS already in place had nothing to read.
export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {/* Mobile UX pass (2026-07-24): iOS Safari never triggers CSS
            :active on tap unless some element on the page has a registered
            touch listener — a long-standing WebKit quirk, not a bug in any
            one component. Without this, every `active:` press state this
            app relies on for touch feedback (buttons, cards, document rows,
            tabs) would work on Android/desktop and silently never fire on
            iPhone/iPad. A Client Component (RootLayout itself stays a
            Server Component — DOM event props aren't allowed here, see
            TouchActivator's own note) whose only job is registering that
            listener once. */}
        <TouchActivator />
        <AuthProvider>
          <QueryProvider>
            <I18nProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors />
              </TooltipProvider>
            </I18nProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
