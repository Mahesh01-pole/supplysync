import Link from 'next/link';
import { ArrowRight, BarChart2, Clock, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Case Studies | SupplySync',
  description: 'See how leading enterprises use SupplySync to transform their supply chain operations.',
};

const cases = [
  {
    company: 'MegaMart Retail',
    industry: 'Retail & E-commerce',
    summary: 'Reduced order allocation time by 78% and cut delivery costs by $2.4M annually by switching to SupplySync\'s AI-powered routing engine.',
    metrics: [
      { icon: Clock, label: 'Faster Allocation', value: '78%' },
      { icon: TrendingUp, label: 'Cost Savings/yr', value: '$2.4M' },
      { icon: BarChart2, label: 'On-time Deliveries', value: '97.2%' },
    ],
    tag: 'Retail',
    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
  },
  {
    company: 'GlobalPharma Ltd.',
    industry: 'Pharmaceutical',
    summary: 'Achieved full cold-chain compliance and real-time visibility across 12 distribution centres, eliminating $900K in spoilage losses.',
    metrics: [
      { icon: Clock, label: 'Visibility Lag', value: '<2s' },
      { icon: TrendingUp, label: 'Spoilage Eliminated', value: '$900K' },
      { icon: BarChart2, label: 'Compliance Score', value: '100%' },
    ],
    tag: 'Pharma',
    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
  },
  {
    company: 'AutoParts Direct',
    industry: 'Automotive',
    summary: 'Scaled supplier network from 40 to 200+ vendors in 6 months with zero disruption, processing 3× more orders on the same team headcount.',
    metrics: [
      { icon: Clock, label: 'Scale-up Time', value: '6 mo' },
      { icon: TrendingUp, label: 'Order Volume Increase', value: '3×' },
      { icon: BarChart2, label: 'Suppliers Onboarded', value: '200+' },
    ],
    tag: 'Automotive',
    color: 'from-orange-500/10 to-rose-500/10 border-orange-500/20',
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="container text-center max-w-3xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            Customer Stories
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Real results from{' '}
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              real companies
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Discover how SupplySync customers are cutting costs, boosting efficiency, and scaling operations faster than ever.
          </p>
        </div>
      </section>

      {/* Case study cards */}
      <section className="py-20">
        <div className="container px-4 space-y-10 max-w-5xl mx-auto">
          {cases.map((c) => (
            <div
              key={c.company}
              className={`rounded-2xl border bg-gradient-to-br ${c.color} p-8 space-y-6 hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">{c.tag}</span>
                  <h2 className="text-2xl font-bold mt-1">{c.company}</h2>
                  <p className="text-sm text-muted-foreground">{c.industry}</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{c.summary}</p>
              <div className="grid grid-cols-3 gap-6">
                {c.metrics.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="space-y-1.5">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-muted/30 py-16">
        <div className="container text-center max-w-xl mx-auto px-4 space-y-5">
          <h2 className="text-2xl font-bold">Ready to write your own success story?</h2>
          <p className="text-muted-foreground">Talk to our team and get a personalised demo tailored to your industry.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contact Sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
