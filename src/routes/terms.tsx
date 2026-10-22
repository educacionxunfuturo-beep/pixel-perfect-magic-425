import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection as Section, legalLink } from "@/components/fp/LegalPage";

// Plain-language terms for the app and bookings (Ontario). The owner reviews them; update the date on any change.
const EFFECTIVE = "October 23, 2026";
const EMAIL = "DogGroomingToronto@gmail.com";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — The Fresh Pooch" },
      { name: "description", content: "The rules for booking mobile dog grooming with The Fresh Pooch and for using our app, Customer Portal and AI assistant." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      eyebrow="The fine print, in plain words"
      title="Terms of Use"
      intro={`Effective ${EFFECTIVE}. By booking or using The Fresh Pooch app you agree to these terms.`}
      toc={[
        ["service", "Our service"],
        ["bookings", "Bookings and prices"],
        ["cancellations", "Cancellations and weather"],
        ["dogs", "Your dog's health and safety"],
        ["access", "Access to your home"],
        ["payments", "Payments"],
        ["accounts", "Your account"],
        ["qimmiq", "Qimmiq, our AI assistant"],
        ["liability", "Responsibility"],
        ["changes", "Changes and contact"],
      ]}
    >
      <Section id="service" title="Our service">
        <p>The Fresh Pooch Mobile Dog Grooming ("we") grooms dogs one-on-one inside our mobile spa van, parked at your home in Toronto and nearby areas. These terms cover our website and app, the Customer Portal, our AI assistant Qimmiq and the grooming appointments booked through them.</p>
      </Section>

      <Section id="bookings" title="Bookings and prices">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>A booking made online is a <strong>request</strong>. It is confirmed only when we confirm it to you.</li>
          <li>Online prices are estimates based on breed, size and coat. The final price is confirmed before the groom and may change if the coat condition (for example, heavy matting) or the dog's behaviour needs extra time.</li>
          <li>Please give accurate information about your dog, your address and how to reach you.</li>
        </ul>
      </Section>

      <Section id="cancellations" title="Cancellations and weather">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>We send reminders 48 and 24 hours before your appointment.</li>
          <li>Cancellations with less than 24 hours' notice incur a fee of 50% of the service price.</li>
          <li>During severe winter storms we reschedule your appointment at no cost.</li>
          <li>If we cannot reach your dog at the agreed time (no one home, no access), the visit may count as a late cancellation.</li>
        </ul>
      </Section>

      <Section id="dogs" title="Your dog's health and safety">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your dog must be up to date on Rabies, DHPP and Bordetella. You can upload the certificates in the Customer Portal.</li>
          <li>Tell us before the groom about any health condition, injury, recent surgery, allergy, anxiety or history of biting.</li>
          <li>Our groomer may pause or stop a groom if continuing would put your dog or the groomer at risk. In that case you pay only for the work done.</li>
          <li>If your dog seems unwell or is injured during the groom, we stop, contact you and, in an emergency, seek veterinary care.</li>
        </ul>
      </Section>

      <Section id="access" title="Access to your home">
        <p>If you give us a lockbox or door code, you confirm you are allowed to share it. We use it only to collect and return your dog on the day of the visit, and we show it only to our team. You can change or remove it in the Customer Portal at any time.</p>
      </Section>

      <Section id="payments" title="Payments">
        <p>Today you pay the groomer at the end of the visit, with any payment method we accept at that time. If online payment is added, it will be processed securely by our payment provider and the conditions will appear before you pay. Prices are in Canadian dollars and include applicable taxes only where stated.</p>
      </Section>

      <Section id="accounts" title="Your account">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Accounts are for adults (18+). Keep your password private; you are responsible for bookings made from your account.</li>
          <li>You can download your data or delete your account at any time, as explained in our <a href="/privacy" className={legalLink}>Privacy Policy</a>.</li>
          <li>We may close an account used for fraud, abuse or false bookings.</li>
        </ul>
      </Section>

      <Section id="qimmiq" title="Qimmiq, our AI assistant">
        <p>Qimmiq answers automatically and may make mistakes. Prices, availability and appointments are only final when our team confirms them.</p>
      </Section>

      <Section id="liability" title="Responsibility">
        <p>We groom with care and follow professional practice. To the extent Ontario law allows, we are not responsible for problems caused by information that was not shared with us (such as a health condition) or for pre-existing conditions that grooming reveals, such as skin irritation under heavy matting. Nothing in these terms limits your rights under the Ontario Consumer Protection Act.</p>
      </Section>

      <Section id="changes" title="Changes and contact">
        <p>We may update these terms; the new version applies to bookings made after its effective date. These terms are governed by the laws of Ontario and Canada.</p>
        <p>Questions? Email <a href={`mailto:${EMAIL}`} className={legalLink}>{EMAIL}</a> or call or WhatsApp <a href="tel:+16474511747" className={legalLink}>(647) 451-1747</a>.</p>
      </Section>
    </LegalPage>
  );
}
