import ScreenshotUpload from '@/components/ScreenshotUpload'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg"></div>
            <h1 className="text-xl font-semibold text-slate-900">Screenshot CRM</h1>
          </div>
          <Button asChild variant="outline">
            <Link href="/leads">View Leads</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm font-medium text-slate-600 mb-6">
            ✨ AI-Powered Lead Extraction
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Turn Screenshots Into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Organized Leads
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload screenshots from WhatsApp, Instagram, TikTok, or any messaging platform. 
            Our AI extracts contact details, tracks conversations, and organizes your sales pipeline automatically.
          </p>
        </div>
        
        <ScreenshotUpload />
      </div>
    </div>
  )
}
