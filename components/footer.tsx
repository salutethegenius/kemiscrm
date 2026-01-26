'use client'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 w-full">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
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
    </footer>
  )
}
