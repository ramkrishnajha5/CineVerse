import { Link } from 'wouter';
import { ExternalLink, Heart } from 'lucide-react';
import { SiX, SiFacebook, SiInstagram, SiYoutube } from 'react-icons/si';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'GameVerse' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const featureLinks = [
    {
      label: 'Trending Content',
      action: () => {
        const element = document.querySelector('[data-testid="trending-section"]');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: 'Popular Trailers',
      action: () => {
        const element = document.querySelector('[data-testid="popular-trailers-section"]');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: 'Regional Movies',
      action: () => {
        const element = document.querySelector('[data-testid="popular-movies-by-region"]');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    {
      label: 'Recommendations',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
  ];

  const socialLinks = [
    {
      href: 'https://x.com',
      label: 'X (Twitter)',
      icon: <SiX className="w-5 h-5" />
    },
    {
      href: 'https://facebook.com',
      label: 'Facebook',
      icon: <SiFacebook className="w-5 h-5" />
    },
    {
      href: 'https://instagram.com',
      label: 'Instagram',
      icon: <SiInstagram className="w-5 h-5" />
    },
    {
      href: 'https://youtube.com',
      label: 'YouTube',
      icon: <SiYoutube className="w-5 h-5" />
    },
  ];

  return (
    <footer className="bg-muted/50 border-t border-border py-12" data-testid="footer">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Footer Navigation */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Navigation</h3>
              <ul className="space-y-2 text-sm">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      data-testid={`footer-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="footer-about-link"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="footer-contact-link"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="footer-privacy-link"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    data-testid="footer-terms-link"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-sm">
                {featureLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-muted-foreground hover:text-primary transition-colors text-left"
                      data-testid={`footer-feature-${link.label.toLowerCase().replace(' ', '-')}`}
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-200"
                    title={link.label}
                    data-testid={`footer-social-${link.label.toLowerCase().split(' ')[0]}`}
                  >
                    {link.icon}
                    <span className="sr-only">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-sm text-muted-foreground" data-testid="copyright">
                © {currentYear} CineVerse. All rights reserved.
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <span data-testid="powered-by">Powered by TMDB</span>
                <div className="flex items-center space-x-1" data-testid="made-with-love">
                  <span>Made with</span>
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  <span>by</span>
                  <a
                    href="https://www.instagram.com/ramkrishnajha5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    Ram Krishna
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
