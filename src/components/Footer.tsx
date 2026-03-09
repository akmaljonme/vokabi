import { Mail, Phone, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-14 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-display font-bold tracking-tight">
</span>
            </div>
            <p className="text-secondary-foreground/50 text-sm leading-relaxed mb-6">
              IELTS va CEFR imtihonlariga professional tayyorgarlik platformasi. Bilimingizni sinang va rivojlantiring.
            </p>
            <div className="flex gap-3">
              {['facebook', 'twitter', 'instagram', 'youtube'].map((s) => <a key={s} className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-primary transition-colors text-xs font-bold uppercase tracking-wider" href="#">
                  {s[0]}
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-secondary-foreground/70">Product</h4>
            <ul className="space-y-3">
              {['Practice Tests', 'Mock Exams', 'Study Materials', 'Progress Tracking'].map((item) =>
              <li key={item}>
                  <a href="#" className="text-secondary-foreground/50 hover:text-primary transition-colors text-sm">{item}</a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-secondary-foreground/70">Company</h4>
            <ul className="space-y-3">
              {['About Us', 'Blog', 'Careers', 'Contact'].map((item) =>
              <li key={item}>
                  <a href="#" className="text-secondary-foreground/50 hover:text-primary transition-colors text-sm">{item}</a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-5 text-secondary-foreground/70">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-secondary-foreground/50 text-sm">​akmalkarimboyev529@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-secondary-foreground/50 text-sm">+998 92 198 1401</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-secondary-foreground/30 text-xs">© 2026 Vokabi. All rights reserved. Created by Akmal Karimboyev

          </p>
          <div className="flex gap-6 text-xs">
            {['Privacy Policy', 'Terms of Service'].map((item) =>
            <a key={item} href="#" className="text-secondary-foreground/30 hover:text-primary transition-colors">{item}</a>
            )}
          </div>
        </div>
      </div>
    </footer>);

};