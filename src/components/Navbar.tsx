'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Upload, Menu, X } from 'lucide-react'

interface NavbarProps {
  currentPage?: 'home' | 'leads' | 'inbox' | 'pipeline' | 'archive'
  showLeadTabs?: boolean
}

export default function Navbar({ currentPage = 'home', showLeadTabs = false }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg"></div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 hidden sm:block">
              Screenshot CRM
            </h1>
            <h1 className="text-lg font-semibold text-slate-900 sm:hidden">
              CRM
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {showLeadTabs ? (
              <>
                <div className="flex items-center gap-1">
                  <Button 
                    asChild 
                    variant={currentPage === 'leads' ? 'default' : 'outline'} 
                    size="sm" 
                    className={currentPage === 'leads' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                  >
                    <Link href="/leads">Active</Link>
                  </Button>
                  <Button 
                    asChild 
                    variant={currentPage === 'archive' ? 'default' : 'outline'} 
                    size="sm"
                    className={currentPage === 'archive' ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : ''}
                  >
                    <Link href="/leads/archive">Archive</Link>
                  </Button>
                </div>
                <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700" size="sm">
                  <Link href="/">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Link>
                </Button>
              </>
            ) : currentPage === 'home' ? (
              <Button asChild variant="outline">
                <Link href="/leads">View Leads</Link>
              </Button>
            ) : (
              <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700">
                <Link href="/">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Screenshot
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {showLeadTabs ? (
                <>
                  {/* Lead tabs for mobile */}
                  <div className="space-y-1 mb-3">
                    <Button 
                      asChild 
                      variant={currentPage === 'leads' ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${currentPage === 'leads' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                      size="sm"
                    >
                      <Link href="/leads" onClick={() => setIsMobileMenuOpen(false)}>
                        Active
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant={currentPage === 'archive' ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${currentPage === 'archive' ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : ''}`}
                      size="sm"
                    >
                      <Link href="/leads/archive" onClick={() => setIsMobileMenuOpen(false)}>
                        Archive
                      </Link>
                    </Button>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <Button 
                      asChild 
                      className="w-full justify-start bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700" 
                      size="sm"
                    >
                      <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshot
                      </Link>
                    </Button>
                  </div>
                </>
              ) : currentPage === 'home' ? (
                <Button asChild variant="outline" className="w-full justify-start" size="sm">
                  <Link href="/leads" onClick={() => setIsMobileMenuOpen(false)}>
                    View Leads
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    asChild 
                    className="w-full justify-start bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700" 
                    size="sm"
                  >
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Screenshot
                    </Link>
                  </Button>
                  
                  {/* Additional mobile-only links */}
                  <div className="pt-2 border-t border-slate-200 mt-2">
                    <Button asChild variant="ghost" className="w-full justify-start text-slate-600" size="sm">
                      <Link href="/leads" onClick={() => setIsMobileMenuOpen(false)}>
                        Active Leads
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="w-full justify-start text-slate-600" size="sm">
                      <Link href="/leads/archive" onClick={() => setIsMobileMenuOpen(false)}>
                        Archive
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}