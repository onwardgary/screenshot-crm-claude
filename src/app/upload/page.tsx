import MultiScreenshotUpload from '@/components/MultiScreenshotUpload'
import Navbar from '@/components/Navbar'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="upload" />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm font-medium text-slate-600 mb-6">
            ✨ AI-Powered Activity Tracking
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Turn Screenshots Into
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Activity Performance
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Upload screenshots from WhatsApp, Instagram, TikTok, or any messaging platform. 
            Our AI tracks your conversation activities and helps you stay consistent with your outreach goals.
          </p>
        </div>
        
        <MultiScreenshotUpload />
      </div>
    </div>
  )
}