import type { Metadata } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { I18nProvider } from "@/i18n/I18nProvider"
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
        url: "/imges/crm-hero.webp",
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
    images: ["/imges/crm-hero.webp"],
  },
  // Dashboard pages are behind auth — don't index them by default.
  // Individual public pages (login) override this with robots: { index: true }.
  robots: { index: false, follow: true },
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
