import { NavLink } from "react-router-dom";
import type { NavLinkRenderProps } from "react-router-dom";
import { CalculatorIcon, SunIcon, MoonIcon } from "@heroicons/react/24/outline";

import { useTheme } from "@/components/useTheme";
import { primaryNavItems, secondaryNavItems } from "@/layout/navConfig";
import { useQuickActionModals } from "@/layout/useQuickActionModals";

const linkClass = ({ isActive }: NavLinkRenderProps) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
    isActive
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : "text-[var(--text-primary)] hover:bg-[var(--bg-input)]"
  }`;

const actionClass =
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-input)]";

// Desktop sidebar: every page is listed inline (no "More" menu needed).
// Profile (account + log out) and Calendar/Water are regular pages from navConfig.
export default function SidebarNav() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const { openCalculator, modals } = useQuickActionModals();

  const pageLinks = [...primaryNavItems, ...secondaryNavItems];

  return (
    <>
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 md:flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Money Tracker</h1>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-1">
          {pageLinks.map((item) => (
            <NavLink key={item.name} to={item.path} className={linkClass}>
              {({ isActive }: NavLinkRenderProps) => {
                const Icon = isActive ? item.activeIcon : item.icon;
                return (
                  <>
                    <Icon className="w-5 h-5 shrink-0" />
                    {item.name}
                  </>
                );
              }}
            </NavLink>
          ))}

          <div className="pt-2 mt-2 border-t border-[var(--border-subtle)] space-y-1">
            <button onClick={openCalculator} className={actionClass}>
              <CalculatorIcon className="w-5 h-5 shrink-0" />
              Calculator
            </button>
          </div>
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-[var(--border-subtle)] space-y-1 shrink-0">
          <button onClick={toggleTheme} className={actionClass}>
            {isLight ? <MoonIcon className="w-5 h-5 shrink-0" /> : <SunIcon className="w-5 h-5 shrink-0" />}
            {isLight ? "Dark mode" : "Light mode"}
          </button>
        </div>
      </aside>

      {modals}
    </>
  );
}
