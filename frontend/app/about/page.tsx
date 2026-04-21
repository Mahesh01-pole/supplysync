import Link from 'next/link';
import { Package, Users, Globe, Zap, Shield, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'About Us | SupplySync',
  description: 'Learn about SupplySync — the team building the future of intelligent B2B supply chain management.',
};

const stats = [
  { label: 'Enterprise Clients', value: '500+' },
  { label: 'Orders Processed Daily', value: '1M+' },
  { label: 'Countries Served', value: '42' },
  { label: 'Uptime SLA', value: '99.9%' },
];

const values = [
  { icon: Zap, title: 'Speed & Efficiency', description: 'We obsess over milliseconds so your supply chain never skips a beat.' },
  { icon: Shield, title: 'Security First', description: 'Enterprise-grade encryption and compliance baked in from day one.' },
  { icon: Globe, title: 'Global Reach', description: 'Seamless cross-border logistics with real-time currency and regulation support.' },
  { icon: TrendingUp, title: 'Data-Driven', description: 'Predictive analytics that turn historical patterns into actionable insights.' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-24 md:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="container text-center space-y-6 max-w-3xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Package className="h-4 w-4" />
            About SupplySync
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Reimagining the{' '}
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              supply chain
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            SupplySync was founded in 2021 with a single mission: make B2B supply chain management as intelligent and effortless as possible for every business — from fast-growing startups to Fortune 500 enterprises.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border/40 py-16">
        <div className="container grid grid-cols-2 gap-8 md:grid-cols-4 px-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <p className="text-4xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container max-w-4xl mx-auto px-4 space-y-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
            We believe the backbone of global commerce — supply chains — should be intelligent, transparent, and accessible. 
            By combining real-time data, AI-driven allocation algorithms, and optimized routing, SupplySync empowers procurement 
            teams and suppliers to collaborate with unprecedented efficiency.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20 border-y border-border/40">
        <div className="container px-4">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">What We Stand For</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-background p-6 space-y-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="py-20">
        <div className="container max-w-2xl mx-auto text-center px-4 space-y-6">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-7 w-7" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Join Our Team</h2>
          <p className="text-muted-foreground leading-relaxed">
            We&apos;re a remote-first team of engineers, designers, and supply-chain experts spread across 15 countries. If you&apos;re passionate about solving hard logistics problems at scale, we&apos;d love to hear from you.
          </p>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors duration-200"
          >
            View Open Roles
          </Link>
        </div>
      </section>
    </main>
  );
}
