'use client'

import Link from 'next/link'
import { FileText, Shield, Mail, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Kemis CRM</span>
            </div>
            <p className="text-sm text-gray-600">
              Professional Customer Relationship Management platform designed for modern businesses.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>Bahamas</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Contacts
                </Link>
              </li>
              <li>
                <Link href="/pipeline" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Pipeline
                </Link>
              </li>
              <li>
                <Link href="/invoices" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                  Invoices
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal & Compliance</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/compliance/privacy" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                  <FileText className="h-3 w-3 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/compliance" className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center">
                  <Shield className="h-3 w-3 mr-2" />
                  Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:info@drewbersolutions.com" 
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  info@drewbersolutions.com
                </a>
              </li>
              <li className="text-sm text-gray-600">
                <p className="mb-1">Support Hours:</p>
                <p className="text-xs">Monday - Friday</p>
                <p className="text-xs">9:00 AM - 5:00 PM EST</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-600">
              © {currentYear} Kemis CRM. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>Compliant with Bahamas Data Protection Act</span>
              <span className="hidden md:inline">•</span>
              <span>GDPR Ready</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
