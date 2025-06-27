import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Upload, Users, TrendingUp } from 'lucide-react'

export default function LeadsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="leads" />

      {/* Header Section */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Lead Management</h1>
              <p className="text-slate-600 text-lg">Choose a view to manage your leads effectively</p>
            </div>
          </div>
          
          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lead Inbox */}
            <Link href="/leads/inbox" className="group h-full">
              <div className="bg-white rounded-xl border border-amber-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-amber-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">Raw</Badge>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Lead Inbox</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Review and qualify raw leads from screenshot imports. Perfect first step to organize leads.
                </p>
                <div className="flex items-center text-amber-600 text-sm font-medium group-hover:text-amber-700">
                  View Inbox <TrendingUp className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            {/* Active Pipeline */}
            <Link href="/leads/pipeline" className="group h-full">
              <div className="bg-white rounded-xl border border-green-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-green-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Active Pipeline</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Focus on qualified leads in your active sales process. Track follow-ups and conversions.
                </p>
                <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                  View Pipeline <TrendingUp className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            {/* Archive */}
            <Link href="/leads/archive" className="group h-full">
              <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-slate-300 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-400 to-gray-500 rounded-lg flex items-center justify-center">
                    <Badge className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-slate-100 text-slate-700">Completed</Badge>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Archive</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Completed, merged, and archived leads for reference. Keep your historical data organized.
                </p>
                <div className="flex items-center text-slate-600 text-sm font-medium group-hover:text-slate-700">
                  View Archive <TrendingUp className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}