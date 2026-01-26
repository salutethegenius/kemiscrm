'use client'

import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/compliance" className="text-blue-600 hover:underline text-sm">
          ← Back to Compliance
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Privacy Policy</h1>
        <p className="text-gray-500 mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Kemis CRM ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Customer Relationship Management (CRM) platform, in compliance with the Bahamas Data Protection Act and international data protection standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">2.1 Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name, email address, phone number</li>
                  <li>Company information</li>
                  <li>Billing and payment information</li>
                  <li>User account credentials</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2.2 Business Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Contact information of your clients and leads</li>
                  <li>Deal and pipeline information</li>
                  <li>Invoice and financial records</li>
                  <li>Employee and HR data</li>
                  <li>Activities, notes, and communications</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our CRM services</li>
              <li>Process transactions and manage your account</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>Location:</strong> Your data is stored on secure servers provided by Supabase, with data centers located in the United States and other regions as specified by our hosting provider.
              </p>
              <p>
                <strong>Security Measures:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encryption in transit (HTTPS/TLS)</li>
                <li>Encryption at rest (database-level encryption)</li>
                <li>Row-level security policies</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Automated backups with 30-day retention</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights (Bahamas Data Protection Act & GDPR)</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Under applicable data protection laws, you have the following rights:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("Right to be Forgotten")</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we process your data</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please visit the <Link href="/compliance" className="text-blue-600 hover:underline">Compliance page</Link> or contact us directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal data for as long as necessary to provide our services and comply with legal obligations. When you delete your account or request data deletion, we will delete your data within 30 days, except where we are required to retain it for legal, accounting, or regulatory purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:
            </p>
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Kemis CRM</p>
              <p className="text-sm text-gray-600">Email: info@drewbersolutions.com</p>
              <p className="text-sm text-gray-600">Location: Bahamas</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
