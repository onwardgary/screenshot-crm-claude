'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Upload, Menu, X } from 'lucide-react'

interface NavbarProps {
  currentPage?: 'home' | 'dashboard' | 'upload' | 'activities' | 'contacts'
}

export default function Navbar({ currentPage = 'home' }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-r from-sky-400 to-blue-500 rounded-lg"></div>
<h1 className="text-lg sm:text-xl font-semibold text-slate-900 hidden sm:block">
              Activity Dashboard
            </h1>
            <h1 className="text-lg font-semibold text-slate-900 sm:hidden">
              Dashboard
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {currentPage === 'home' ? (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/activities">Activities</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/contacts">Contacts</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700" size="sm">
                  <Link href="/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  asChild 
                  variant={currentPage === 'dashboard' ? 'default' : 'outline'} 
                  size="sm"
                  className={currentPage === 'dashboard' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                >
                  <Link href="/">Dashboard</Link>
                </Button>
                <Button 
                  asChild 
                  variant={currentPage === 'activities' ? 'default' : 'outline'} 
                  size="sm"
                  className={currentPage === 'activities' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : ''}
                >
                  <Link href="/activities">Activities</Link>
                </Button>
                <Button 
                  asChild 
                  variant={currentPage === 'contacts' ? 'default' : 'outline'} 
                  size="sm"
                  className={currentPage === 'contacts' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                >
                  <Link href="/contacts">Contacts</Link>
                </Button>
                <Button asChild className={currentPage === 'upload' ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'} size="sm">
                  <Link href="/upload">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Link>
                </Button>
              </div>
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
              {currentPage === 'home' ? (
                <div className="space-y-1">
                  <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                    <Link href="/activities" onClick={() => setIsMobileMenuOpen(false)}>
                      📱 Activities
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start" size="sm">
                    <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)}>
                      👥 Contacts
                    </Link>
                  </Button>
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <Button 
                      asChild 
                      className="w-full justify-start bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700" 
                      size="sm"
                    >
                      <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshot
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1 mb-3">
                    <Button 
                      asChild 
                      variant={currentPage === 'dashboard' ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${currentPage === 'dashboard' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}`}
                      size="sm"
                    >
                      <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                        📊 Dashboard
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant={currentPage === 'activities' ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${currentPage === 'activities' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' : ''}`}
                      size="sm"
                    >
                      <Link href="/activities" onClick={() => setIsMobileMenuOpen(false)}>
                        📱 Activities
                      </Link>
                    </Button>
                    <Button 
                      asChild 
                      variant={currentPage === 'contacts' ? 'default' : 'ghost'} 
                      className={`w-full justify-start ${currentPage === 'contacts' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}`}
                      size="sm"
                    >
                      <Link href="/contacts" onClick={() => setIsMobileMenuOpen(false)}>
                        👥 Contacts
                      </Link>
                    </Button>
                  </div>
                  <div className="border-t border-slate-200 pt-2">
                    <Button 
                      asChild 
                      className={`w-full justify-start ${currentPage === 'upload' ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700' : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'}`}
                      size="sm"
                    >
                      <Link href="/upload" onClick={() => setIsMobileMenuOpen(false)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Screenshot
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