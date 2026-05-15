import type { Metadata } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const savedTheme = cookieStore.get("ebla-crm-theme")?.value

  /*
   * Bake the theme class into the server-rendered HTML so the browser
   * receives the correct class on the very first byte — zero flash.
   */
  const themeClass = savedTheme === "dark" ? "dark" : ""

  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased ${themeClass}`.trim()}
    >
      <body className="min-h-full flex flex-col">
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
