import { NavLink } from 'react-router-dom';
import { DOCS_NAV } from '../../lib/constants';

export function DocsSidebar() {
  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <nav className="sticky top-20 space-y-6">
        {DOCS_NAV.map((section) => (
          <div key={section.title}>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-2">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `block px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`
                    }
                  >
                    {item.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
