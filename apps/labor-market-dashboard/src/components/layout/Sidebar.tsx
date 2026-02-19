import { Link, useLocation } from 'wouter';

/** Props for the Sidebar component. */
export interface SidebarProps {
  /** Whether the sidebar is expanded */
  isOpen: boolean;
  /** Callback to toggle sidebar open/closed */
  onToggle: () => void;
}

/**
 * Collapsible sidebar navigation.
 *
 * Shows icon-only links when collapsed, icon + text when expanded.
 * Uses wouter `<Link>` with `className` callback for active styling
 * and `useLocation()` for `aria-current="page"` on the active link.
 */
export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();

  const linkClass = (active: boolean) =>
    `flex h-11 items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
      isOpen ? 'px-3' : 'justify-center px-0'
    } ${
      active
        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <nav
      aria-label="Main navigation"
      className={`flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200 ${
        isOpen ? 'w-56' : 'w-14'
      }`}
    >
      {/* Toggle button */}
      <div
        className={`flex h-14 items-center border-b border-slate-200 ${
          isOpen ? 'justify-end px-2' : 'justify-center'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          {isOpen ? (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Navigation links */}
      <div className="flex flex-col gap-1 p-2">
        <Link
          href="/"
          className={linkClass}
          aria-current={location === '/' ? 'page' : undefined}
        >
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75h6.5v6.5h-6.5zM13.75 3.75h6.5v6.5h-6.5zM3.75 13.75h6.5v6.5h-6.5zM13.75 13.75h6.5v6.5h-6.5z"
            />
          </svg>
          <span className={isOpen ? 'block' : 'hidden'}>Dashboard</span>
        </Link>

        <Link
          href="/config"
          className={linkClass}
          aria-current={location === '/config' ? 'page' : undefined}
        >
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className={isOpen ? 'block' : 'hidden'}>Configuration</span>
        </Link>
      </div>
    </nav>
  );
}
