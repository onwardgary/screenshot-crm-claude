import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-4 p-8">
        <FileQuestion className="h-12 w-12 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}