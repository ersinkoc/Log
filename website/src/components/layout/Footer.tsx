import { Heart } from 'lucide-react';
import { GITHUB_REPO, PACKAGE_NAME } from '../../lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>by</span>
            <a
              href="https://github.com/ersinkoc"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 dark:text-white hover:text-emerald-500 transition-colors"
            >
              Ersin Koç
            </a>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a
              href={`https://github.com/${GITHUB_REPO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 transition-colors"
            >
              GitHub
            </a>
            <a
              href={`https://www.npmjs.com/package/${PACKAGE_NAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-500 transition-colors"
            >
              npm
            </a>
            <span>MIT License</span>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            © {currentYear} {PACKAGE_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
