import { NavLink } from "react-router-dom";
import type { NavLinkRenderProps } from "react-router-dom";
import {
  CalculatorIcon,
  CalendarIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

import { useTheme } from "@/components/useTheme";
import DropletSolidIcon from "@/components/icons/DropletSolidIcon";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useLogout";
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

// Desktop counterpart to BottomNavBar: a persistent left column instead of a
// fixed bottom bar, with every page listed (no "More" menu needed — there's
// room). Hidden below the md breakpoint; BottomNavBar is hidden at and above it.
export default function SidebarNav() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const username = useAuthStore((s) => s.user?.username);
  const logout = useLogout();
  const { openCalculator, openCalendar, openWater, modals } = useQuickActionModals();

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
            <button onClick={openCalendar} className={actionClass}>
              <CalendarIcon className="w-5 h-5 shrink-0" />
              Calendar
            </button>
            <button onClick={openWater} className={actionClass}>
              <DropletSolidIcon className="w-5 h-5 shrink-0" />
              Water
            </button>
          </div>
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-[var(--border-subtle)] space-y-1 shrink-0">
          {username && (
            <p className="px-3 pb-1 text-xs text-[var(--text-secondary)] truncate">
              Signed in as <span className="font-semibold text-[var(--text-primary)]">{username}</span>
            </p>
          )}

          <NavLink to="/account" className={linkClass}>
            <UserCircleIcon className="w-5 h-5 shrink-0" />
            Account
          </NavLink>

          <button onClick={toggleTheme} className={actionClass}>
            {isLight ? <MoonIcon className="w-5 h-5 shrink-0" /> : <SunIcon className="w-5 h-5 shrink-0" />}
            {isLight ? "Dark mode" : "Light mode"}
          </button>

          <button onClick={logout} className={`${actionClass} text-[var(--danger)]`}>
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
            Log out
          </button>
        </div>
      </aside>

      {modals}
    </>
  );
}
