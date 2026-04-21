import Link from 'next/link';
import { Package, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-zinc-50/50 dark:bg-zinc-950/50 mt-auto transition-colors duration-200">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-8">
          <div className="space-y-6 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="rounded-xl flex items-center justify-center bg-primary/10 p-2 text-primary shadow-inner transition-transform group-hover:scale-105 duration-200">
                <Package className="h-6 w-6" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                SupplySync
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Intelligent B2B supply chain solutions with real-time order allocation, optimized delivery routing, and predictive analytics.
            </p>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="font-semibold text-foreground tracking-tight">Platform</h3>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary hover:underline underline-offset-4 transition-all">Order Allocation</Link></li>
              <li><Link href="/track" className="hover:text-primary hover:underline underline-offset-4 transition-all">Delivery Routing</Link></li>
              <li><Link href="/track" className="hover:text-primary hover:underline underline-offset-4 transition-all">Real-time Tracking</Link></li>
              <li><Link href="/supplier/dashboard" className="hover:text-primary hover:underline underline-offset-4 transition-all">Analytics Dashboard</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-foreground tracking-tight">Company</h3>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary hover:underline underline-offset-4 transition-all">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline underline-offset-4 transition-all">Careers</Link></li>
              <li><Link href="/case-studies" className="hover:text-primary hover:underline underline-offset-4 transition-all">Case Studies</Link></li>
              <li><Link href="/contact" className="hover:text-primary hover:underline underline-offset-4 transition-all">Contact Sales</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-foreground tracking-tight">Legal</h3>
            <ul className="space-y-3.5 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-primary hover:underline underline-offset-4 transition-all">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary hover:underline underline-offset-4 transition-all">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary hover:underline underline-offset-4 transition-all">Cookie Settings</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-border/40 text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="flex items-center gap-1">
            Built with <Heart className="h-4 w-4 text-destructive fill-destructive" /> by the SupplySync Team
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              All Systems Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
