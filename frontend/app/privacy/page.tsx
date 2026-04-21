import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | SupplySync',
  description: 'How SupplySync collects, uses, and protects your data.',
};

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly to us, such as when you create an account, place an order, or contact our support team. This includes your name, email address, company details, billing information, and any communications you send us. We also automatically collect certain technical information when you use our platform, including IP addresses, browser type, pages visited, and usage patterns through cookies and similar tracking technologies.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to provide, maintain, and improve our services; process transactions; send transactional and promotional communications; monitor and analyse usage trends; detect and prevent fraudulent transactions; and comply with legal obligations. We do not sell your personal information to third parties.`,
  },
  {
    title: '3. Sharing of Information',
    body: `We may share your information with third-party vendors and service providers (e.g., payment processors, cloud hosting), with your consent, or as required by law. We require all third parties to respect the security of your personal data and to treat it in accordance with applicable law.`,
  },
  {
    title: '4. Data Retention',
    body: `We retain personal data for as long as necessary to fulfil the purposes for which it was collected, including satisfying legal, accounting, or reporting requirements. When data is no longer needed, it is securely deleted or anonymised.`,
  },
  {
    title: '5. Security',
    body: `We employ industry-standard security measures, including TLS encryption in transit, AES-256 encryption at rest, regular penetration testing, and SOC 2 Type II compliance, to protect your information against unauthorised access, alteration, disclosure, or destruction.`,
  },
  {
    title: '6. Your Rights',
    body: `Depending on your location, you may have the right to access, correct, or delete your personal data; object to or restrict certain processing; and request data portability. To exercise any of these rights, please contact us at privacy@supplysync.io.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated effective date. Continued use of the platform after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: '8. Contact Us',
    body: `If you have questions about this Privacy Policy, please contact our Data Protection Officer at privacy@supplysync.io or write to us at SupplySync Inc., 123 Market Street, Navi Mumbai, CA 94105.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-20">
        <div className="container max-w-2xl mx-auto text-center px-4 space-y-5">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Effective date: <span className="font-medium text-foreground">January 1, 2025</span></p>
          <p className="text-muted-foreground leading-relaxed">
            At SupplySync, your privacy is a core commitment, not an afterthought. This policy explains exactly how we handle your data.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16">
        <div className="container max-w-3xl mx-auto px-4 space-y-10">
          {sections.map((s) => (
            <div key={s.title} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
