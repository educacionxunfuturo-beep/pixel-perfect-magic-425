import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection as Section } from "@/components/fp/LegalPage";

// Written for Canada's federal privacy law (PIPEDA) and anti-spam law (CASL). Update the date when it changes.
const EFFECTIVE = "October 22, 2026";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — The Fresh Pooch" },
      { name: "description", content: "How The Fresh Pooch collects, uses, protects and deletes your personal information, under Canadian privacy law (PIPEDA)." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your privacy"
      title="Privacy Policy"
      intro={`Effective ${EFFECTIVE}. Applies to The Fresh Pooch app, the Customer Portal and our AI assistant Qimmiq.`}
      toc={[
            ["summary", "In short"],
            ["collect", "What we collect"],
            ["use", "Why we use it"],
            ["share", "Who we share it with"],
            ["outside-canada", "Storage outside Canada"],
            ["cookies", "Cookies and local storage"],
            ["ai", "Qimmiq, our AI assistant"],
            ["retention", "How long we keep it"],
            ["rights", "Your rights"],
            ["delete-account", "Delete your account"],
            ["security", "Security and breaches"],
            ["emails", "Emails and messages"],
            ["contact", "Contact and complaints"],
      ]}
    >
          <Section id="summary" title="In short">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>We collect only what we need to groom your dog at your door: your contact details, address, your dog's details, access instructions and vaccine records.</li>
              <li>We never sell your information and we do not use advertising or tracking cookies.</li>
              <li>You can see, download, correct or delete your data at any time from the Customer Portal.</li>
              <li>We follow Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).</li>
            </ul>
          </Section>

          <Section id="collect" title="What we collect">
            <p><strong>When you create an account or book:</strong> name, email, phone, service address or postal code, your dog's name, breed and weight, grooming notes, the access code or instructions you choose to give us, your preferred time window and the price of the service.</p>
            <p><strong>Vaccine records:</strong> expiry dates and the certificates you upload (Rabies, Bordetella, DHPP).</p>
            <p><strong>After a visit:</strong> the groomer's report card (coat, skin, ears, nails, temperament).</p>
            <p><strong>When you chat with Qimmiq:</strong> the messages you type.</p>
            <p><strong>Technical data:</strong> your IP address and browser type, used for a short time to keep the service secure (for example, to stop repeated sign-in attempts). We do not build profiles or track you across other websites.</p>
            <p>We do not collect payment card numbers: today you pay the groomer directly. If online payment is added, it will be handled by a certified payment provider (Stripe) and we will update this policy.</p>
          </Section>

          <Section id="use" title="Why we use it">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To quote, confirm and deliver your grooming appointment, and to find and enter your home safely.</li>
              <li>To check that your dog's vaccines are up to date, for the safety of your dog, other dogs and our staff.</li>
              <li>To contact you about your bookings (confirmations, reminders, weather changes).</li>
              <li>To answer your questions through Qimmiq.</li>
              <li>To keep the records Canadian tax law requires.</li>
            </ul>
            <p>We ask for your consent when you create an account or send a booking request. You may withdraw it at any time (see "Delete your account"); we may then be unable to provide the service.</p>
          </Section>

          <Section id="share" title="Who we share it with">
            <p>Only our own team (the owner and your groomer) sees your booking details. We use these service providers, who process data on our behalf under their own security and privacy commitments:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Cloudflare</strong>: hosts the app and its database.</li>
              <li><strong>Google (Gemini)</strong>: generates Qimmiq's answers from the messages you type.</li>
              <li><strong>Google Fonts</strong>: delivers the typefaces of the site (your browser sends your IP address to Google).</li>
              <li>If enabled: <strong>Stripe</strong> (online payments), <strong>Twilio</strong> (text messages) and <strong>Resend</strong> (emails).</li>
            </ul>
            <p>Links to WhatsApp, Instagram, Facebook and Google Maps open those services, which have their own privacy policies. We disclose information to authorities only when the law requires it.</p>
          </Section>

          <Section id="outside-canada" title="Storage outside Canada">
            <p>Our providers may store or process your information in the United States or other countries. When that happens it is subject to the laws of those countries, and their authorities may be able to access it. We choose providers that protect data with encryption and strict access controls.</p>
          </Section>

          <Section id="cookies" title="Cookies and local storage">
            <p>We use only what the app needs to work. There are <strong>no advertising, analytics or tracking cookies</strong>.</p>
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Type</th><th className="px-4 py-2.5">Purpose</th><th className="px-4 py-2.5">Lasts</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr><td className="px-4 py-2.5 font-mono text-xs">fp_client</td><td className="px-4 py-2.5">Cookie, essential</td><td className="px-4 py-2.5">Keeps you signed in to the Customer Portal</td><td className="px-4 py-2.5">30 days or until you log out</td></tr>
                  <tr><td className="px-4 py-2.5 font-mono text-xs">fp_staff</td><td className="px-4 py-2.5">Cookie, essential</td><td className="px-4 py-2.5">Keeps our staff signed in to the dashboard</td><td className="px-4 py-2.5">8 hours</td></tr>
                  <tr><td className="px-4 py-2.5 font-mono text-xs">fp_*</td><td className="px-4 py-2.5">Local storage, functional</td><td className="px-4 py-2.5">Remembers your choices on this device: this notice, dismissed pop-ups, bookings in progress</td><td className="px-4 py-2.5">Until you clear your browser</td></tr>
                </tbody>
              </table>
            </div>
            <p>You can delete them from your browser settings at any time; you will then need to sign in again.</p>
          </Section>

          <Section id="ai" title="Qimmiq, our AI assistant">
            <p>Qimmiq is an AI assistant. Its answers are generated automatically by Google Gemini and may contain mistakes: prices and appointments are confirmed by our team. Please do not type sensitive information (such as health or financial details) in the chat. Messages are sent to Google to produce an answer; we do not store your chat history on our servers.</p>
          </Section>

          <Section id="retention" title="How long we keep it">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Your account, dog profile, access code and vaccine certificates:</strong> until you delete your account.</li>
              <li><strong>Booking records:</strong> 6 years, as the Canada Revenue Agency requires. After you delete your account they keep only the date, service and price, without your name or contact details.</li>
              <li><strong>Password reset links:</strong> 24 hours.</li>
            </ul>
          </Section>

          <Section id="rights" title="Your rights">
            <p>Under PIPEDA you can ask to see the personal information we hold about you, to correct it, and to withdraw your consent. In the Customer Portal you can:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>update your access code, notes and vaccine records;</li>
              <li><strong>download a copy of your data</strong> (Privacy & account → Download my data);</li>
              <li><strong>delete your account</strong> (see below).</li>
            </ul>
            <p>For anything else, contact us and we will answer within 30 days.</p>
          </Section>

          <Section id="delete-account" title="Delete your account">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Open <a href="/?account" className="font-semibold text-teal underline">the Customer Portal</a> and sign in.</li>
              <li>Scroll to <strong>Privacy & account</strong> and choose <strong>Delete my account</strong>.</li>
              <li>Enter your password to confirm. Deletion is immediate.</li>
            </ol>
            <p>What is deleted: your profile, your dog's records, your access code, your vaccine certificates and any password reset links. Upcoming bookings are cancelled. Past bookings keep only anonymous totals for tax purposes.</p>
            <p>Can't sign in? Email <a href="mailto:DogGroomingToronto@gmail.com" className="font-semibold text-teal underline">DogGroomingToronto@gmail.com</a> from the address on your account, or message us on WhatsApp at <a href="tel:+16474511747" className="font-semibold text-teal underline">(647) 451-1747</a>, and we will delete it for you within 30 days.</p>
          </Section>

          <Section id="security" title="Security and breaches">
            <p>Connections are encrypted (HTTPS). Passwords are stored only as salted hashes, sessions use secure HttpOnly cookies, and access codes are shown only to our team. If a breach creates a real risk of significant harm, we will notify you and the Office of the Privacy Commissioner of Canada as PIPEDA requires.</p>
            <p>Accounts are for adults (18+). Our service is not directed at children.</p>
          </Section>

          <Section id="emails" title="Emails and messages">
            <p>We send booking messages (confirmations, reminders) because you asked for the service. Promotional emails are sent only if you subscribe, as Canada's Anti-Spam Legislation (CASL) requires, and every one includes a way to unsubscribe.</p>
          </Section>

          <Section id="contact" title="Contact and complaints">
            <p>Our Privacy Officer is the owner of The Fresh Pooch Mobile Dog Grooming, Toronto, Ontario. Contact us by email at <a href="mailto:DogGroomingToronto@gmail.com" className="font-semibold text-teal underline">DogGroomingToronto@gmail.com</a>, or by phone or WhatsApp at <a href="tel:+16474511747" className="font-semibold text-teal underline">(647) 451-1747</a>.</p>
            <p>If you are not satisfied with our answer, you can complain to the <a href="https://www.priv.gc.ca" target="_blank" rel="noreferrer" className="font-semibold text-teal underline">Office of the Privacy Commissioner of Canada</a>.</p>
            <p>We will post any change to this policy on this page, with a new effective date. See also our <a href="/terms" className="font-semibold text-teal underline">Terms of Use</a>.</p>
          </Section>
    </LegalPage>
  );
}
