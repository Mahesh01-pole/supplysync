'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
        <div className="container text-center max-w-2xl mx-auto px-4 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Mail className="h-4 w-4" /> Contact Sales
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Let&apos;s talk{' '}
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">supply chain</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Our team typically responds within 2 business hours. Fill in the form and we&apos;ll be in touch.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Get in touch</h2>
              <p className="text-muted-foreground leading-relaxed">
                Whether you&apos;re ready to get started, need a live demo, or just have questions — we&apos;re here to help.
              </p>
            </div>
            <div className="space-y-5">
              {[
                { icon: Mail, label: 'Email', value: 'sales@supplysync.io' },
                { icon: Phone, label: 'Phone', value: '+1 (800) 555-SYNC' },
                { icon: MapPin, label: 'HQ', value: 'Navi Mumbai ,CA · Remote-first' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
                <CheckCircle2 className="h-14 w-14 text-green-500" />
                <h3 className="text-xl font-semibold">Message Sent!</h3>
                <p className="text-muted-foreground text-sm">Our sales team will reach out within 2 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {(['name', 'email', 'company'] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <label htmlFor={field} className="text-sm font-medium capitalize">{field === 'name' ? 'Full Name' : field === 'email' ? 'Work Email' : 'Company'}</label>
                    <input
                      id={field}
                      type={field === 'email' ? 'email' : 'text'}
                      required
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
                      placeholder={field === 'name' ? 'Jane Smith' : field === 'email' ? 'jane@company.com' : 'Acme Inc.'}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-medium">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
                    placeholder="Tell us about your supply chain challenges…"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Send Message <Send className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
