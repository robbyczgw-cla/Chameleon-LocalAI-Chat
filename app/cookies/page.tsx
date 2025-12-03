export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: November 18, 2024</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. What Are Cookies?</h2>
            <p className="text-muted-foreground">
              Cookies are small text files stored on your device when you visit a website. They help websites remember
              your preferences and provide a better user experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Cookies We Use</h2>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  Essential Cookies (Required)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies are necessary for the Service to function. You cannot opt out of these.
                </p>
                <div className="space-y-2">
                  <div className="text-sm">
                    <p className="font-semibold">Authentication Cookies (Supabase)</p>
                    <ul className="list-disc pl-5 text-muted-foreground mt-1">
                      <li><strong>Purpose:</strong> Keep you logged in across sessions</li>
                      <li><strong>Duration:</strong> Session-based or up to 7 days</li>
                      <li><strong>Cookie names:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">sb-*-auth-token</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">⚙️</span>
                  Functional Cookies (Recommended)
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  These cookies enhance functionality and user experience.
                </p>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="font-semibold">Guest Mode Flag</p>
                    <ul className="list-disc pl-5 text-muted-foreground mt-1">
                      <li><strong>Purpose:</strong> Remember if you're using guest mode</li>
                      <li><strong>Duration:</strong> 30 days</li>
                      <li><strong>Cookie name:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">guest-mode</code></li>
                    </ul>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold">Cookie Consent</p>
                    <ul className="list-disc pl-5 text-muted-foreground mt-1">
                      <li><strong>Purpose:</strong> Remember your cookie preferences</li>
                      <li><strong>Duration:</strong> 1 year</li>
                      <li><strong>Cookie name:</strong> <code className="text-xs bg-muted px-1 py-0.5 rounded">chameleon-cookie-consent</code></li>
                    </ul>
                  </div>

                  <div className="text-sm">
                    <p className="font-semibold">Theme Preference</p>
                    <ul className="list-disc pl-5 text-muted-foreground mt-1">
                      <li><strong>Purpose:</strong> Remember dark/light mode preference</li>
                      <li><strong>Duration:</strong> Persistent (no expiry)</li>
                      <li><strong>Storage:</strong> localStorage (not a cookie technically)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-400">✗</span>
                  Analytics & Advertising Cookies (Not Used)
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong>We do NOT use:</strong>
                </p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Google Analytics or similar tracking</li>
                  <li>Facebook Pixel or social media trackers</li>
                  <li>Advertising cookies or retargeting</li>
                  <li>Third-party analytics services</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. localStorage and sessionStorage</h2>
            <p className="text-muted-foreground mb-3">
              We also use browser storage mechanisms (not technically cookies, but similar):
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-1">localStorage</h4>
                <p className="text-sm text-muted-foreground">Stores settings, chat history, API keys (encrypted), preferences</p>
                <p className="text-xs text-muted-foreground mt-1"><strong>Duration:</strong> Persistent until you clear browser data</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-1">sessionStorage</h4>
                <p className="text-sm text-muted-foreground">Temporary storage for current session data</p>
                <p className="text-xs text-muted-foreground mt-1"><strong>Duration:</strong> Until you close the browser tab</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground mb-3">
              Our third-party service providers may set their own cookies:
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold">Supabase (Authentication & Database)</h4>
                <p className="text-sm text-muted-foreground">Sets authentication cookies to keep you logged in</p>
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-xs underline">
                  View Supabase Privacy Policy →
                </a>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <h4 className="font-semibold">Vercel (Hosting)</h4>
                <p className="text-sm text-muted-foreground">May set cookies for CDN and analytics (server-side only)</p>
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-xs underline">
                  View Vercel Privacy Policy →
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Managing Cookies</h2>

            <h3 className="text-xl font-semibold mb-2">5.1 Browser Settings</h3>
            <p className="text-muted-foreground mb-2">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
              <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies and Site Data</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies and site permissions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Our Cookie Banner</h3>
            <p className="text-muted-foreground">
              On your first visit, you'll see a cookie consent banner. You can:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Accept:</strong> Allow all cookies (recommended for best experience)</li>
              <li><strong>Decline:</strong> Only essential cookies (may limit functionality)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Clearing Cookies</h3>
            <p className="text-muted-foreground">
              To clear cookies and localStorage:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Use your browser's "Clear browsing data" feature</li>
              <li>Select "Cookies" and "Cached images and files"</li>
              <li><strong>Warning:</strong> This will log you out and clear your settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Impact of Blocking Cookies</h2>
            <p className="text-muted-foreground mb-2">
              If you block or delete cookies:
            </p>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">Essential Cookies Blocked:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>✗ You cannot stay logged in</li>
                  <li>✗ Authentication will fail</li>
                  <li>✗ Service will not function properly</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Functional Cookies Blocked:</p>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>⚠ You'll need to reconfigure settings each visit</li>
                  <li>⚠ Theme preferences won't be saved</li>
                  <li>⚠ Guest mode may not work correctly</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Cookie Lifespan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-muted">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left border-b border-muted">Cookie Name</th>
                    <th className="p-3 text-left border-b border-muted">Type</th>
                    <th className="p-3 text-left border-b border-muted">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="p-3 border-b border-muted"><code className="text-xs bg-muted px-1 py-0.5 rounded">sb-*-auth-token</code></td>
                    <td className="p-3 border-b border-muted">Essential</td>
                    <td className="p-3 border-b border-muted">7 days or session</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-muted"><code className="text-xs bg-muted px-1 py-0.5 rounded">guest-mode</code></td>
                    <td className="p-3 border-b border-muted">Functional</td>
                    <td className="p-3 border-b border-muted">30 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 border-b border-muted"><code className="text-xs bg-muted px-1 py-0.5 rounded">chameleon-cookie-consent</code></td>
                    <td className="p-3 border-b border-muted">Functional</td>
                    <td className="p-3 border-b border-muted">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Updates to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated
              "Last updated" date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Contact Us</h2>
            <p className="text-muted-foreground">
              Questions about our use of cookies?
            </p>
            <div className="p-4 rounded-lg bg-muted/50 mt-3">
              <p className="font-mono text-sm">robchameleon@proton.me</p>
            </div>
          </section>

          <div className="p-6 rounded-lg bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/20 mt-8">
            <p className="font-semibold mb-2">🍪 Quick Summary</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• We use minimal cookies - only what's needed for the service</li>
              <li>• Essential cookies: Authentication (can't opt out)</li>
              <li>• Functional cookies: Preferences, guest mode (recommended)</li>
              <li>• NO tracking, analytics, or advertising cookies</li>
              <li>• You control cookies through browser settings</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t flex items-center justify-between">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </a>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </div>
  )
}
