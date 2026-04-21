import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | SupplySync',
  description: 'The terms and conditions governing your use of the SupplySync platform.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the SupplySync platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service. These terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    title: '2. Use of the Service',
    body: `You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service to transmit any unlawful, harmful, threatening, abusive, or otherwise objectionable content; to impersonate any person or entity; or to interfere with or disrupt the integrity or performance of the Service.`,
  },
  {
    title: '3. Accounts',
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account. We reserve the right to terminate accounts that violate these Terms.`,
  },
  {
    title: '4. Intellectual Property',
    body: `The Service and its original content, features, and functionality are and will remain the exclusive property of SupplySync Inc. and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of SupplySync Inc.`,
  },
  {
    title: '5. Subscription and Billing',
    body: `Certain features of the Service are available on a subscription basis. Fees are billed in advance on a monthly or annual cycle. You authorise us to charge your payment method for all fees incurred. Refunds are issued at our sole discretion except where required by law.`,
  },
  {
    title: '6. Limitation of Liability',
    body: `To the maximum extent permitted by applicable law, SupplySync Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, the Service. Our total liability shall not exceed the amount paid by you to SupplySync in the 12 months preceding the claim.`,
  },
  {
    title: '7. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict-of-law provisions. Any disputes shall be resolved exclusively in the state or federal courts located in San Francisco County, California.`,
  },
  {
    title: '8. Changes to Terms',
    body: `We reserve the right to modify these Terms at any time. We will provide notice of material changes via email or a prominent notice on the Service at least 14 days before the change takes effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms.`,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-20">
        <div className="container max-w-2xl mx-auto text-center px-4 space-y-5">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Effective date: <span className="font-medium text-foreground">January 1, 2025</span></p>
          <p className="text-muted-foreground leading-relaxed">
            Please read these Terms carefully before using the SupplySync platform. They govern your relationship with us.
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
