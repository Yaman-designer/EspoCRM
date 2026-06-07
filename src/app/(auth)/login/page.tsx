import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Log in',
  description:
    'Sign in to Ebla CRM — your professional platform for managing leads, contacts, contracts, and real estate pipelines.',
  // Override the root layout default so search engines can index the login page.
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    title: 'Log in | Ebla CRM',
    description:
      'Sign in to Ebla CRM — manage leads, contacts, contracts, and real estate pipelines in one place.',
    images: [
      {
        url: '/images/crm-hero.webp',
        width: 640,
        height: 700,
        alt: 'Ebla CRM Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log in | Ebla CRM',
    description: 'Sign in to Ebla CRM — your all-in-one sales and real estate management platform.',
    images: ['/images/crm-hero.webp'],
  },
}

export default function LoginPage() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center
        bg-linear-to-br from-[#0C3E74] via-[#1571C0] to-[#0E5299]
        lg:justify-center lg:p-6 xl:p-8"
    >
      {/* ── Page-level ambient orbs — reduced intensity so form takes priority ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/7 blur-3xl animate-[float_12s_ease-in-out_infinite]" />
        <div className="absolute top-[8%] right-[3%] h-52 w-52 rounded-full bg-white/7 blur-3xl animate-[float_9s_ease-in-out_infinite_1.5s]" />
        <div className="absolute bottom-[4%] right-[2%] h-60 w-60 rounded-full bg-white/5 blur-3xl animate-[float_13s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-[15%] left-[4%] h-44 w-44 rounded-full bg-white/5 blur-2xl animate-[float_10s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[45%] left-[1%] h-28 w-28 rounded-full bg-white/9 blur-xl animate-[float_8s_ease-in-out_infinite_0.7s]" />
        <div className="absolute top-[22%] right-[1%] h-16 w-16 rounded-full bg-white/10 blur-lg animate-[float_7s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[35%] right-[5%] h-20 w-20 rounded-full bg-white/8 blur-xl animate-[float_11s_ease-in-out_infinite_0.9s]" />
        <div className="absolute top-[62%] right-[8%] h-8 w-8 rounded-full bg-white/14 blur-sm animate-[float_6s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[15%] left-[8%] h-10 w-10 rounded-full bg-white/12 blur-md animate-[float_8s_ease-in-out_infinite_2.1s]" />
      </div>

      {/* ══════════════════════════════════════
          Main card
          · Mobile  → full-screen stacked
          · Desktop → floating card, side-by-side
      ══════════════════════════════════════ */}
      <div
        className="relative z-10 flex w-full flex-col
          min-h-screen lg:min-h-0
          bg-white
          lg:max-w-[980px] lg:flex-row
          lg:overflow-hidden lg:rounded-3xl
          lg:shadow-[0_24px_64px_rgba(0,0,0,0.22),0_6px_20px_rgba(0,0,0,0.10)]
          animate-[fade-in-up_0.7s_ease-out_both]"
      >

        {/* ══════════════════════
            MOBILE HEADER
            Blue gradient + hero + wavy bottom
        ══════════════════════ */}
        <div className="relative overflow-hidden lg:hidden">

          {/* Gradient base */}
          <div className="absolute inset-0 bg-linear-to-br from-[#0B3A6E] via-[#176FC2] to-[#0E5298]" />

          {/* Blobs */}
          <div aria-hidden className="absolute -top-8 -right-8 h-48 w-48 rounded-full bg-white/7 blur-3xl animate-[float_10s_ease-in-out_infinite]" />
          <div aria-hidden className="absolute top-[8%] left-[6%] h-24 w-24 rounded-full bg-white/8 blur-2xl animate-[float_8s_ease-in-out_infinite_1s]" />
          <div aria-hidden className="absolute bottom-[30%] right-[8%] h-16 w-16 rounded-full bg-white/9 blur-xl animate-[float_7s_ease-in-out_infinite_0.5s]" />

          {/* Illustration + brand */}
          <div className="relative z-10 flex flex-col items-center pb-24 pt-10 px-8">
            {/* Radial glow behind illustration */}
            <div
              aria-hidden
              className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-white/13 blur-3xl"
            />

            <div className="relative w-52 sm:w-64 animate-[fade-in-up_0.8s_ease-out_both]">
              <Image
                src="/images/crm-hero.webp"
                alt="CRM Dashboard"
                width={500}
                height={550}
                className="w-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.32)]"
                priority
              />
            </div>

            {/* Mobile product statement */}
            <p className="mt-3 max-w-[260px] text-center text-[0.78rem] font-medium leading-relaxed text-white/60">
              Manage customers, analytics, sales, and workflows — one unified platform.
            </p>
          </div>

          {/* Wavy white bottom */}
          <div aria-hidden className="absolute bottom-0 left-0 right-0 h-16">
            <svg viewBox="0 0 390 64" className="h-full w-full" preserveAspectRatio="none">
              <path d="M0,64 L0,26 C130,4 260,52 390,26 L390,64 Z" fill="white" />
            </svg>
          </div>
        </div>

        {/* ══════════════════════
            DESKTOP LEFT PANEL
            Illustration + blobs + product statement
        ══════════════════════ */}
        <div className="relative hidden lg:flex lg:w-[46%] flex-col items-center justify-center overflow-hidden">

          {/* Azure fill */}
          <div className="absolute inset-0 bg-[#EBF4FF]" />

          {/* Outer organic blob */}
          <div
            aria-hidden
            className="absolute bg-[#D4E9FF]/70"
            style={{ inset: '8%', borderRadius: '44% 56% 58% 42% / 46% 44% 56% 54%' }}
          />

          {/* Inner organic blob */}
          <div
            aria-hidden
            className="absolute bg-[#BDD9FF]/50"
            style={{ inset: '18%', borderRadius: '38% 62% 55% 45% / 50% 40% 60% 50%' }}
          />

          {/* Radial glow behind illustration */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-[#176FC2]/16 blur-3xl"
          />

          {/* Floating accent dots */}
          <div aria-hidden className="absolute top-[9%]  right-[16%] h-8  w-8  rounded-full bg-[#176FC2]/15 blur-sm  animate-[float_7s_ease-in-out_infinite_0.4s]" />
          <div aria-hidden className="absolute top-[14%] left-[13%]  h-5  w-5  rounded-full bg-[#176FC2]/20          animate-[float_9s_ease-in-out_infinite_1.2s]" />
          <div aria-hidden className="absolute bottom-[13%] left-[10%] h-10 w-10 rounded-full bg-[#176FC2]/12 blur-md animate-[float_8s_ease-in-out_infinite_0.8s]" />
          <div aria-hidden className="absolute bottom-[10%] right-[12%] h-6  w-6  rounded-full bg-[#176FC2]/18          animate-[float_6s_ease-in-out_infinite_2s]" />
          <div aria-hidden className="absolute top-[46%]  left-[4%]   h-4  w-4  rounded-full bg-[#176FC2]/25          animate-[float_5s_ease-in-out_infinite_0.2s]" />

          {/* Illustration — enlarged ~20% */}
          <div className="relative z-10 w-full max-w-[430px] px-5 animate-[fade-in-up_0.9s_ease-out_0.2s_both]">
            <Image
              src="/images/crm-hero.webp"
              alt="CRM dashboard illustration"
              width={640}
              height={700}
              className="w-full object-contain drop-shadow-[0_24px_60px_rgba(23,111,194,0.30)]"
              priority
            />
          </div>

          {/* Product statement */}
          <div className="relative z-10 mt-3 px-10 text-center animate-[fade-in-up_1s_ease-out_0.35s_both]">
            <p className="mx-auto max-w-[280px] text-[0.78rem] font-medium leading-relaxed text-[#1B5D75]/70">
              Manage customers, analytics, sales, and workflows in one unified CRM platform.
            </p>
          </div>

          {/* ── Right-edge separator — smooth S-curve ── */}
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-[110px]">
            <svg viewBox="0 0 110 600" className="h-full w-full" preserveAspectRatio="none">
              <path
                d="M110,0 L72,0 C102,110 102,220 58,300 C14,380 14,490 72,600 L110,600 Z"
                fill="white"
              />
            </svg>
          </div>
        </div>

        {/* ══════════════════════
            FORM PANEL
            Right on desktop · Bottom on mobile
        ══════════════════════ */}
        <div
          className="relative flex flex-1 flex-col items-center justify-center
            gap-6 overflow-hidden
            px-6 py-10
            sm:px-10 sm:py-12
            lg:px-12 xl:px-16
            bg-linear-to-br from-white via-white to-[#EFF7FF]/60
            animate-[fade-in-up_0.7s_ease-out_0.12s_both]"
        >
          {/* Subtle depth shapes — give the panel visual richness */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-14 -right-14 h-60 w-60 rounded-full bg-[#EBF4FF]/90 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#EEF5FF]/70 blur-3xl" />
            <div className="absolute top-1/2 right-4 h-24 w-24 rounded-full bg-[#E3EFFE]/60 blur-2xl animate-[float_16s_ease-in-out_infinite_4s]" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            <LoginForm />
          </div>

          <p className="relative z-10 select-none text-center text-[11px] text-muted-foreground/50">
            &copy; 2026 Ebla CRM &mdash; All rights reserved
          </p>
        </div>

      </div>
    </main>
  )
}
