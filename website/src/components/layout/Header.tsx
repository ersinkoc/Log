import { Link, NavLink } from 'react-router-dom';
import { Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '../common/ThemeToggle';
import { NAV_ITEMS, GITHUB_REPO, PACKAGE_SHORT_NAME } from '../../lib/constants';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-emerald-500">@oxog/</span>
            <span className="text-zinc-900 dark:text-white">{PACKAGE_SHORT_NAME}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-emerald-500 ${
                    isActive ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </a>
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              ) : (
                <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-zinc-200 dark:border-zinc-800">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block py-2 text-sm font-medium transition-colors hover:text-emerald-500 ${
                    isActive ? 'text-emerald-500' : 'text-zinc-600 dark:text-zinc-400'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
