export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: November 18, 2024</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Chameleon AI Chat ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data.
              This privacy policy explains how we collect, use, and safeguard your information when you use our AI chat platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-2">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Email address (for account creation and authentication)</li>
              <li>Password (encrypted and stored securely via Supabase)</li>
              <li>Account creation date and last login timestamp</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Chat messages and conversation history</li>
              <li>Selected AI models and personas</li>
              <li>Custom settings and preferences</li>
              <li>API usage statistics and cost tracking data</li>
              <li>File uploads (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address (via hosting provider logs)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">2.4 Guest Mode Data</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Guest users: All data stored in browser localStorage only</li>
              <li>No server-side storage for guest sessions</li>
              <li>Data cleared when browser cache is cleared</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Provide Service:</strong> Process your chat requests, sync data across devices, maintain conversation history</li>
              <li><strong>Personalization:</strong> Remember your preferences, personas, and settings</li>
              <li><strong>Cost Tracking:</strong> Calculate and display your API usage costs</li>
              <li><strong>Authentication:</strong> Verify your identity and secure your account</li>
              <li><strong>Service Improvement:</strong> Analyze usage patterns to improve features</li>
              <li><strong>Communication:</strong> Send important updates about the service (can be disabled)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">We use the following third-party services:</p>

            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold">Supabase (Database & Authentication)</h4>
                <p className="text-sm text-muted-foreground">Stores user accounts, chat history, and settings. Privacy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/privacy</a></p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold">OpenRouter (AI Models)</h4>
                <p className="text-sm text-muted-foreground">Processes chat requests. You use your own API key. Privacy: <a href="https://openrouter.ai/privacy" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/privacy</a></p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold">Tavily / Serper (Web Search - Optional)</h4>
                <p className="text-sm text-muted-foreground">Web search functionality. Only if you enable and provide API keys.</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold">Vercel (Hosting)</h4>
                <p className="text-sm text-muted-foreground">Hosts the application. Privacy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">vercel.com/legal/privacy-policy</a></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. API Keys and Payment Information</h2>
            <p className="text-muted-foreground mb-2">
              <strong>Important:</strong> We do NOT store your API keys on our servers. You provide your own API keys for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>OpenRouter (required for AI chat)</li>
              <li>Tavily or Serper (optional for web search)</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              API keys are stored encrypted in your browser's localStorage or in your Supabase user settings.
              <strong> You are responsible for all costs incurred through your API keys.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Data Storage and Security</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Location:</strong> Data stored in Supabase servers (configurable region)</li>
              <li><strong>Encryption:</strong> All data encrypted in transit (HTTPS) and at rest</li>
              <li><strong>Access Control:</strong> Row-Level Security (RLS) ensures users can only access their own data</li>
              <li><strong>Passwords:</strong> Hashed using industry-standard bcrypt algorithm</li>
              <li><strong>Guest Mode:</strong> Data stored locally in browser only, not on our servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Your Rights (GDPR / CCPA)</h2>
            <p className="text-muted-foreground mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Delete your account and all associated data</li>
              <li><strong>Data Portability:</strong> Export your chat history and settings</li>
              <li><strong>Withdraw Consent:</strong> Stop using our service at any time</li>
              <li><strong>Object:</strong> Object to processing of your personal data</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise these rights, delete your account in Settings or contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-2">We use cookies for:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Essential:</strong> Authentication sessions (Supabase auth cookies)</li>
              <li><strong>Functional:</strong> Guest mode flag, theme preferences</li>
              <li><strong>Analytics:</strong> We do NOT use third-party analytics cookies</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              See our <a href="/cookies" className="underline">Cookie Policy</a> for more details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Data Retention</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Active Accounts:</strong> Data retained as long as your account is active</li>
              <li><strong>Deleted Accounts:</strong> All data permanently deleted within 30 days of account deletion</li>
              <li><strong>Guest Mode:</strong> Data deleted when browser cache is cleared</li>
              <li><strong>Backups:</strong> Backup data deleted within 90 days of account deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for users under 13 years of age. We do not knowingly collect personal information
              from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate
              safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of significant changes by
              posting the new policy on this page and updating the "Last updated" date. Continued use of the service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this privacy policy or how we handle your data, please contact us at:
            </p>
            <div className="p-4 rounded-lg bg-muted/50 mt-3">
              <p className="font-mono text-sm">robchameleon@proton.me</p>
              <p className="text-sm text-muted-foreground mt-2">We aim to respond to all inquiries within 48 hours.</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
