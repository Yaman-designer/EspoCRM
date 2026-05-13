import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// يعمل على Edge Runtime — يستخدم auth.config فقط (بدون Node.js providers)
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * تطبّق على كل المسارات ما عدا:
     * - _next/static  (ملفات البناء الثابتة)
     * - _next/image   (تحسين الصور)
     * - favicon.ico   (أيقونة الموقع)
     * - ملفات الصور العامة
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
