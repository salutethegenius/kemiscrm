'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ExternalLink, Clock, Video } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 mt-1">Schedule and manage your appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cal.com Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Cal.com Integration
            </CardTitle>
            <CardDescription>
              Connect Cal.com for powerful scheduling capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Why Cal.com?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Automatic timezone handling</li>
                <li>• Google Calendar & Outlook sync</li>
                <li>• Custom booking pages</li>
                <li>• Automatic reminders</li>
                <li>• Zoom/Meet integration</li>
              </ul>
            </div>
            <Button asChild>
              <a href="https://cal.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Set Up Cal.com
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common scheduling tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://cal.com/event-types" target="_blank" rel="noopener noreferrer">
                <Clock className="h-4 w-4 mr-2" />
                Manage Event Types
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://cal.com/bookings" target="_blank" rel="noopener noreferrer">
                <CalendarIcon className="h-4 w-4 mr-2" />
                View Bookings
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="https://cal.com/settings/my-account/conferencing" target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" />
                Connect Video Conferencing
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Embed Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Embed Your Booking Page</CardTitle>
            <CardDescription>Add your Cal.com booking widget to your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <pre>{`<!-- Add this to your website -->
<script>
  (function (C, A, L) {
    let p = function (a, ar) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal;
      let ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement("script")).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        api.q = api.q || [];
        typeof namespace === "string" ? (cal.ns[namespace] = api) && p(api, ar) : p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", {origin:"https://cal.com"});
  Cal("ui", {"styles":{"branding":{"brandColor":"#3B82F6"}}});
</script>

<!-- Add a button to trigger the booking popup -->
<button data-cal-link="YOUR-USERNAME/30min">
  Book a Call
</button>`}</pre>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Replace <code className="bg-gray-100 px-1 rounded">YOUR-USERNAME/30min</code> with your Cal.com event link.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
