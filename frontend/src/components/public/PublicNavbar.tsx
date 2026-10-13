import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, Menu, X } from 'lucide-react';
import { UserRole } from '../../types';

interface PublicNavbarProps {
  onLoginClick: (role?: UserRole) => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onLoginClick,
  onNavigateSection
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['hero', 'benefits', 'services', 'features', 'demos', 'about'];
      const scrollPos = window.scrollY + 120;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About Us', id: 'about' },
    { label: 'Benefits', id: 'benefits' },
    { label: 'Services', id: 'services' },
    { label: 'Features', id: 'features' },
    { label: 'Demo', id: 'demos' },
  ];

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    setActiveSection(id);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'h-16 bg-white/95 backdrop-blur-md border-b border-border shadow-card'
          : 'h-20 bg-page/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Text Logo Left */}
        <div
          onClick={() => handleLinkClick('hero')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-8 h-8 rounded-full bg-panel-light border border-border flex items-center justify-center text-forest group-hover:bg-panel transition-colors">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-tight text-forest font-semibold leading-tight">
              NEUROFUSION <span className="font-sans font-light text-muted text-xs tracking-wider">AI</span>
            </span>
            <span className="text-[10px] text-muted font-sans tracking-wide">
              Multimodal Neuroscience Research Platform
            </span>
          </div>
        </div>

        {/* Links with scroll-spy green active state */}
        <nav className="hidden lg:flex items-center gap-7 font-sans text-xs tracking-wide">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`transition-colors py-1 relative ${
                  isActive
                    ? 'text-forest font-semibold'
                    : 'text-muted hover:text-forest'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA: Sign in pill */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => onLoginClick('doctor')}
            className="px-5 py-2 text-xs font-sans font-medium text-forest hover:text-forest-dark transition-colors"
          >
            Sign in
          </button>

          <button
            onClick={() => onLoginClick()}
            className="px-6 py-2 rounded-full bg-forest text-white hover:bg-forest-light text-xs font-sans font-medium transition-all shadow-card flex items-center gap-1.5"
          >
            <span>Enter Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-full text-forest hover:bg-panel-light transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-border px-6 py-5 space-y-3 font-sans text-xs shadow-modal">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`block w-full text-left py-2 font-medium ${
                activeSection === link.id ? 'text-forest font-semibold' : 'text-muted'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-4 border-t border-border flex gap-3">
            <button
              onClick={() => { setMobileMenuOpen(false); onLoginClick('doctor'); }}
              className="flex-1 py-2.5 rounded-full border border-forest text-forest font-medium text-center"
            >
              Sign in
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onLoginClick(); }}
              className="flex-1 py-2.5 rounded-full bg-forest text-white font-medium text-center shadow-card"
            >
              Enter Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
export default PublicNavbar;
