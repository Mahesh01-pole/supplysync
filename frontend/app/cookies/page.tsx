'use client';

import { useState } from 'react';
import { Cookie, CheckCircle2 } from 'lucide-react';

const cookieTypes = [
  {
    id: 'essential',
    label: 'Essential Cookies',
    description: 'Required for the platform to function correctly. These cannot be disabled.',
    forced: true,
  },
  {
    id: 'analytics',
    label: 'Analytics Cookies',
    description: 'Help us understand how visitors interact with our platform so we can improve it.',
    forced: false,
  },
  {
    id: 'marketing',
    label: 'Marketing Cookies',
    description: 'Used to deliver personalised advertisements and track the effectiveness of our campaigns.',
    forced: false,
  },
  {
    id: 'preferences',
    label: 'Preference Cookies',
    description: 'Remember your settings and preferences to provide a personalised experience.',
    forced: false,
  },
];

export default function CookiesPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    essential: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setPrefs((p) => ({ ...p, [id]: !p[id] }));
    setSaved(false);
  };

  const save = () => setSaved(true);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background py-20">
        <div className="container max-w-2xl mx-auto text-center px-4 space-y-5">
          <div className="flex justify-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Cookie className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Cookie Settings</h1>
          <p className="text-muted-foreground leading-relaxed">
            Manage how SupplySync uses cookies on your device. Your preferences are saved locally and respected across all sessions.
          </p>
        </div>
      </section>

      {/* Cookie controls */}
      <section className="py-16">
        <div className="container max-w-2xl mx-auto px-4 space-y-6">
          {cookieTypes.map(({ id, label, description, forced }) => (
            <div
              key={id}
              className="flex items-start justify-between gap-6 rounded-2xl border border-border/60 bg-muted/20 p-6 hover:border-primary/30 transition-colors duration-200"
            >
              <div className="space-y-1 flex-1">
                <p className="font-semibold">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
              <button
                id={`toggle-${id}`}
                role="switch"
                aria-checked={prefs[id]}
                onClick={() => !forced && toggle(id)}
                disabled={forced}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  prefs[id] ? 'bg-primary' : 'bg-muted-foreground/30'
                } ${forced ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    prefs[id] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-4 pt-2">
            <button
              id="save-cookie-prefs"
              onClick={save}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save Preferences
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 animate-in fade-in duration-300">
                <CheckCircle2 className="h-4 w-4" /> Preferences saved
              </span>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
