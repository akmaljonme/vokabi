import { useState } from 'react';
import { ChevronDown, Menu, X, MapPin } from 'lucide-react';

interface HeaderProps {
  onNavigate: (view: 'landing' | 'levels') => void;
}

export const Header = ({ onNavigate }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('landing')}
          >
            <span className="text-xl lg:text-2xl font-display font-bold text-secondary">
              CEFR
            </span>
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-xl lg:text-2xl font-display font-bold text-primary">
              TEST HUB
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <div 
              className="relative"
              onMouseEnter={() => setIsPracticeOpen(true)}
              onMouseLeave={() => setIsPracticeOpen(false)}
            >
              <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors font-medium">
                Practice Tests
                <ChevronDown className={`w-4 h-4 transition-transform ${isPracticeOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isPracticeOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-2 animate-fade-in">
                  {['A1', 'A2', 'B1', 'B2', 'C1'].map((level) => (
                    <button
                      key={level}
                      onClick={() => onNavigate('levels')}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                    >
                      {level} Level Tests
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <a href="#materials" className="text-foreground hover:text-primary transition-colors font-medium">
              Study Materials
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-foreground hover:text-primary transition-colors font-medium">
              FAQ
            </a>
          </nav>

          {/* Auth Button */}
          <div className="hidden lg:block">
            <button className="btn-primary">
              Authenticate
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <button 
              onClick={() => {
                onNavigate('levels');
                setIsMenuOpen(false);
              }}
              className="text-left py-2 font-medium"
            >
              Practice Tests
            </button>
            <a href="#materials" className="py-2 font-medium">Study Materials</a>
            <a href="#pricing" className="py-2 font-medium">Pricing</a>
            <a href="#faq" className="py-2 font-medium">FAQ</a>
            <button className="btn-primary w-full mt-2">
              Authenticate
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
