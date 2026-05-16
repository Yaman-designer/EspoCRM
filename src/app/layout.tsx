import type { Metadata, Viewport } from "next"
import { Poppins, Geist_Mono } from "next/font/google"
import { cookies } from "next/headers"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/providers/AuthProvider"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import type { Theme } from "@/components/providers/ThemeProvider"
import "./globals.css"

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F6F8" },
    { media: "(prefers-color-scheme: dark)",  color: "#0F1115" },
  ],
}

export const metadata: Metadata = {
  title: {
    template: "%s | Ebla CRM",
    default: "Ebla CRM — Real Estate Suite",
  },
  description:
    "Enterprise customer relationship management system for real estate professionals. Manage properties, leads, deals, and pipeline in one place.",
  keywords: ["CRM", "Real Estate", "Property Management", "Lead Tracking", "Pipeline"],
  authors: [{ name: "Ebla" }],
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    type: "website",
    siteName: "Ebla CRM",
    title: "Ebla CRM — Real Estate Suite",
    description: "Enterprise real estate CRM. Manage properties, leads, and deals.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Ebla CRM — Real Estate Suite",
    description: "Enterprise real estate CRM.",
  },
}

/*
 * Inline blocking script — rendered inside <head> by a Server Component so
 * there is no React client-side warning.
 *
 * Execution order on every page load:
 *   1. Browser parses <head> → encounters this <script> → BLOCKS, runs it
 *   2. Script reads localStorage and applies/removes .dark BEFORE CSS parses
 *   3. CSS parses with the correct class already set → first paint is correct
 *   4. React hydrates → ThemeProvider reads the same DOM class → zero mismatch
 *
 * This is the belt-and-suspenders companion to the server-side cookie baking:
 *   • Cookie  → lets the server emit the right HTML class (Layer 1)
 *   • Script  → guarantees the class is correct before first paint (Layer 2)
 *   • ThemeProvider → keeps React state in sync after hydration (Layer 3)
 *
 * Using localStorage (not cookies) here because localStorage is synchronous
 * and always reflects the user's last explicit choice, making it the most
 * reliable client-side source of truth.
 */
const THEME_INIT_SCRIPT = `(function(){try{var k='ebla-crm-theme',t=localStorage.getItem(k),h=document.documentElement;if(t==='dark'){h.classList.add('dark')}else if(t==='light'){h.classList.remove('dark')}}catch(e){}})();`

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const savedTheme   = cookieStore.get("ebla-crm-theme")?.value

  /*
   * Server bakes the theme class from the cookie so the HTML delivered to
   * the browser already has the right class — no waiting for JS to run.
   * initialTheme is passed to ThemeProvider so its useSyncExternalStore
   * server-snapshot matches this baked HTML exactly.
   */
  const initialTheme: Theme = savedTheme === "dark" ? "dark" : "light"
  const themeClass           = initialTheme === "dark" ? "dark" : ""

  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased ${themeClass}`.trim()}
    >
      {/*
       * Explicit <head> so the blocking script lands here, not in <body>.
       * Scripts in <head> execute BEFORE <body> renders — the earliest
       * possible moment. Next.js merges this with the metadata API output.
       */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>

      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={initialTheme}>
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
