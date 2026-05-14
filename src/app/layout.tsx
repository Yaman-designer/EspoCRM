import type { Metadata } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import Script from "next/script"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
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
})

export const metadata: Metadata = {
  title: { template: "%s | Ebla CRM", default: "Ebla CRM" },
  description: "Customer Relationship Management System",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="ebla-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var e=localStorage.getItem('ebla-crm-theme')||'light';document.documentElement.classList.toggle('dark','dark'===e)}catch(t){}}()`,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <Toaster richColors />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
