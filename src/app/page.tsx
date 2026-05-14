import { redirect } from 'next/navigation'

// The middleware handles routing to appropriate pages
// This page redirects to the dashboard as a fallback
export default function Home() {
  redirect('/dashboard')
}
