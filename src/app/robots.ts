import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://eblacrm.com'

  return {
    rules: [
      {
        userAgent: '*',
        // Only the login page is public — dashboard routes redirect to login anyway.
        allow: '/login',
        disallow: ['/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
