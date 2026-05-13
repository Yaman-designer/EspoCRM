import { redirect } from 'next/navigation'

// الـ middleware يعيد التوجيه للصفحات المناسبة
// هذه الصفحة تُعيد التوجيه للوحة التحكم كاحتياط
export default function Home() {
  redirect('/dashboard')
}
