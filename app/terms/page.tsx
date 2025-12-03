export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: November 18, 2024</p>
        </div>

        <div className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using Chameleon AI Chat ("the Service"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              Chameleon AI Chat is a web-based platform that provides access to multiple AI language models through
              third-party APIs (primarily OpenRouter). The Service allows users to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Chat with various AI models using their own API keys</li>
              <li>Access 18+ AI personas with different personalities</li>
              <li>Track API usage costs</li>
              <li>Export conversation data</li>
              <li>Use web search functionality (optional)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. User Accounts</h2>
            <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You must provide a valid email address to create an account</li>
              <li>You are responsible for maintaining the confidentiality of your password</li>
              <li>You must be at least 13 years old to use the Service</li>
              <li>One person or entity may not maintain more than one account</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Guest Mode</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Guest mode allows temporary use without creating an account</li>
              <li>Guest data is stored locally in your browser only</li>
              <li>We are not responsible for data loss in guest mode</li>
              <li>Guest mode requires you to provide your own API keys</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Account Security</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You are responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>We are not liable for losses due to stolen or compromised credentials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. API Keys and Payment</h2>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
              <p className="font-semibold text-amber-600 dark:text-amber-400">⚠️ IMPORTANT - READ CAREFULLY</p>
            </div>

            <h3 className="text-xl font-semibold mb-2">4.1 Your Responsibility</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>You provide your own API keys</strong> for OpenRouter, Tavily, Serper, etc.</li>
              <li><strong>You are 100% responsible for all costs</strong> incurred through your API keys</li>
              <li><strong>We do NOT pay for any API usage</strong></li>
              <li><strong>We do NOT refund any API costs</strong></li>
              <li><strong>Monitor your usage</strong> through the cost tracking feature</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.2 API Key Security</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Keep your API keys confidential</li>
              <li>Do not share your API keys with others</li>
              <li>Set spending limits on your API provider accounts</li>
              <li>We store API keys encrypted, but you are responsible for their security</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">4.3 No Payment to Us</h3>
            <p className="text-muted-foreground">
              The Service itself is currently free to use. You only pay your API providers (OpenRouter, etc.) directly.
              We may introduce paid features in the future with advance notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Acceptable Use Policy</h2>
            <h3 className="text-xl font-semibold mb-2">5.1 You agree NOT to:</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Generate, store, or share illegal content</li>
              <li>Harass, abuse, or harm others</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Interfere with or disrupt the Service's operation</li>
              <li>Use automated tools to scrape or abuse the Service</li>
              <li>Share your account credentials with others</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Use the Service to spam or send unsolicited messages</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Consequences</h3>
            <p className="text-muted-foreground">
              Violation of this Acceptable Use Policy may result in:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Immediate termination of your account</li>
              <li>Legal action if applicable</li>
              <li>Reporting to authorities for illegal activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. AI-Generated Content</h2>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <p className="font-semibold text-blue-600 dark:text-blue-400">ℹ️ AI Disclaimer</p>
            </div>

            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>AI can make mistakes:</strong> AI-generated responses may be inaccurate, incomplete, or misleading</li>
              <li><strong>Not professional advice:</strong> Content is not medical, legal, financial, or professional advice</li>
              <li><strong>Verify important information:</strong> Always verify critical information with authoritative sources</li>
              <li><strong>Your responsibility:</strong> You are solely responsible for how you use AI-generated content</li>
              <li><strong>No guarantees:</strong> We make no warranties about accuracy, reliability, or fitness for any purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Intellectual Property</h2>
            <h3 className="text-xl font-semibold mb-2">7.1 Your Content</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You retain ownership of your chat messages and data</li>
              <li>You grant us a license to store and process your data to provide the Service</li>
              <li>You can export or delete your data at any time</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Our Property</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>The Service's code, design, and branding are our property</li>
              <li>You may not copy, modify, or reverse-engineer the Service</li>
              <li>Persona designs and descriptions are our intellectual property</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">7.3 AI-Generated Content</h3>
            <p className="text-muted-foreground">
              AI-generated responses are subject to the terms of the AI provider (OpenRouter, etc.).
              We claim no ownership of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Data and Privacy</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>We collect and use data as described in our <a href="/privacy" className="underline">Privacy Policy</a></li>
              <li>You can export your data at any time</li>
              <li>You can delete your account and all data in Settings</li>
              <li>We use Supabase for data storage with Row-Level Security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">9. Disclaimers and Limitations of Liability</h2>
            <h3 className="text-xl font-semibold mb-2">9.1 "AS IS" Service</h3>
            <p className="text-muted-foreground mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
              <li>ACCURACY OR RELIABILITY OF RESULTS</li>
            </ul>

            <h3 className="text-xl font-semibold mb-2 mt-4">9.2 Limitation of Liability</h3>
            <p className="text-muted-foreground mb-2 uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>We are NOT liable for any API costs you incur</li>
              <li>We are NOT liable for data loss (keep backups!)</li>
              <li>We are NOT liable for service interruptions or downtime</li>
              <li>We are NOT liable for AI-generated content or its consequences</li>
              <li>We are NOT liable for third-party services (OpenRouter, Supabase, etc.)</li>
              <li>Our total liability shall not exceed $100 USD</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">10. Indemnification</h2>
            <p className="text-muted-foreground">
              You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses (including legal fees)
              arising from:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>Content you submit or generate</li>
              <li>Your API usage and associated costs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">11. Termination</h2>
            <h3 className="text-xl font-semibold mb-2">11.1 By You</h3>
            <p className="text-muted-foreground">
              You may terminate your account at any time through Settings. Your data will be deleted within 30 days.
            </p>

            <h3 className="text-xl font-semibold mb-2 mt-4">11.2 By Us</h3>
            <p className="text-muted-foreground mb-2">
              We may suspend or terminate your account immediately if:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>You violate these Terms</li>
              <li>You engage in illegal activity</li>
              <li>Your account is inactive for over 2 years</li>
              <li>We discontinue the Service (with 30 days notice)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">12. Changes to Service and Terms</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Service Changes:</strong> We may modify or discontinue features at any time</li>
              <li><strong>Terms Changes:</strong> We may update these Terms with notice on this page</li>
              <li><strong>Continued Use:</strong> Continued use after changes constitutes acceptance</li>
              <li><strong>Notification:</strong> Significant changes will be announced via email or in-app notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">13. Third-Party Services</h2>
            <p className="text-muted-foreground mb-2">
              The Service integrates with third-party services. You are also subject to their terms:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>OpenRouter: <a href="https://openrouter.ai/terms" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/terms</a></li>
              <li>Supabase: <a href="https://supabase.com/terms" target="_blank" rel="noopener noreferrer" className="underline">supabase.com/terms</a></li>
              <li>Tavily, Serper: Check their respective terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">14. Governing Law and Disputes</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>These Terms are governed by the laws of your jurisdiction</li>
              <li>Any disputes shall be resolved through binding arbitration</li>
              <li>You waive the right to participate in class-action lawsuits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">15. Miscellaneous</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and us</li>
              <li><strong>Severability:</strong> If any provision is invalid, the rest remains in effect</li>
              <li><strong>No Waiver:</strong> Our failure to enforce any right doesn't waive that right</li>
              <li><strong>Assignment:</strong> You may not transfer your rights; we may assign ours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">16. Contact Us</h2>
            <p className="text-muted-foreground">
              Questions about these Terms? Contact us:
            </p>
            <div className="p-4 rounded-lg bg-muted/50 mt-3">
              <p className="font-mono text-sm">robchameleon@proton.me</p>
              <p className="text-sm text-muted-foreground mt-2">We aim to respond within 48 hours.</p>
            </div>
          </section>

          <div className="p-6 rounded-lg bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 border border-green-500/20 mt-8">
            <p className="font-semibold mb-2">📝 Summary (Not Legally Binding)</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• You use your own API keys and pay your own API costs</li>
              <li>• We're not responsible for AI mistakes or your API bills</li>
              <li>• Don't do illegal stuff or abuse the service</li>
              <li>• You can delete your account and data anytime</li>
              <li>• Service provided "as is" with no warranties</li>
            </ul>
          </div>
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
