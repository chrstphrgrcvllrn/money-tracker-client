import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  SunIcon,
  MoonIcon,
  EllipsisHorizontalIcon,
  CalculatorIcon,
  CalendarIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";

import { useTheme } from "@/components/useTheme";
import DropletSolidIcon from "@/components/icons/DropletSolidIcon";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/useLogout";
import { primaryNavItems, secondaryNavItems } from "@/layout/navConfig";
import { useQuickActionModals } from "@/layout/useQuickActionModals";

export default function BottomNavBar() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const { pathname } = useLocation();
  const username = useAuthStore((s) => s.user?.username);
  const logout = useLogout();
  const { openCalculator, openCalendar, openWater, modals } = useQuickActionModals();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the menu on an outside tap or Escape.
  useEffect(() => {
    if (!moreOpen) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  // Less-used pages live behind the "More" (…) button instead of the main grid.
  // (Shared with SidebarNav via navConfig, so the two lists can't drift apart.)
  const moreItems = secondaryNavItems;
  const moreActive = moreItems.some((item) => pathname.startsWith(item.path));
  const navItems = primaryNavItems;

  return (
    <>
      <nav
        className={`md:hidden fixed bottom-0 left-0 w-full z-50 px-4 py-2 backdrop-blur-xl border-t ${
          isLight
            ? "bg-[rgba(248,250,252,0.85)] border-black/10"
            : "bg-[rgba(20,20,20,0.85)] border-white/10"
        }`}
      >
        <style>{`
          @keyframes nav-icon-pop {
            0% { transform: scale(0.7); }
            60% { transform: scale(1.15); }
            100% { transform: scale(1); }
          }
          .nav-icon-active {
            animation: nav-icon-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>

        <div className="grid grid-cols-6 gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center text-xs ${
                  isActive ? "text-[var(--accent)]" : "text-[var(--nav-inactive)]"
                }`
              }
            >
              {({ isActive }) => {
                const Icon = isActive ? item.activeIcon : item.icon;

                return (
                  <>
                    <Icon
                      key={isActive ? `${item.name}-active` : `${item.name}-inactive`}
                      className={`w-6 h-6 mb-1 ${isActive ? "nav-icon-active" : ""}`}
                    />
                    <span className="font-semibold text-center">{item.name}</span>
                  </>
                );
              }}
            </NavLink>
          ))}

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center text-xs text-[var(--nav-inactive)]"
          >
            {isLight ? (
              <MoonIcon key="theme-dark" className="w-6 h-6 mb-1 nav-icon-active" />
            ) : (
              <SunIcon key="theme-light" className="w-6 h-6 mb-1 nav-icon-active" />
            )}
            <span className="font-semibold text-center">
              {isLight ? "Dark" : "Light"}
            </span>
          </button>

          {/* WATER — quick access directly on the bar, not tucked in More */}
          <button
            onClick={openWater}
            className="flex flex-col items-center justify-center text-xs text-[var(--nav-inactive)]"
          >
            <DropletSolidIcon className="w-6 h-6 mb-1" />
            <span className="font-semibold text-center">Water</span>
          </button>

          {/* MORE — Buy List + Tracker */}
          <div ref={moreRef} className="relative flex">
            <button
              onClick={() => setMoreOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={`flex-1 flex flex-col items-center justify-center text-xs ${
                moreActive || moreOpen ? "text-[var(--accent)]" : "text-[var(--nav-inactive)]"
              }`}
            >
              <EllipsisHorizontalIcon className="w-6 h-6 mb-1" />
              <span className="font-semibold text-center">More</span>
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute bottom-full right-0 mb-3 w-44 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] shadow-2xl py-1"
              >
                {username && (
                  <p className="px-4 pt-2 pb-1 text-xs text-[var(--text-secondary)] truncate">
                    Signed in as <span className="font-semibold text-[var(--text-primary)]">{username}</span>
                  </p>
                )}

                {moreItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    role="menuitem"
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 text-sm font-semibold ${
                        isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                      }`
                    }
                  >
                    {({ isActive }) => {
                      const Icon = isActive ? item.activeIcon : item.icon;
                      return (
                        <>
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </>
                      );
                    }}
                  </NavLink>
                ))}

                <button
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false);
                    openCalculator();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                >
                  <CalculatorIcon className="w-5 h-5" />
                  Calculator
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false);
                    openCalendar();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                >
                  <CalendarIcon className="w-5 h-5" />
                  Calendar
                </button>

                <NavLink
                  to="/account"
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 text-sm font-semibold ${
                      isActive ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                    }`
                  }
                >
                  <UserCircleIcon className="w-5 h-5" />
                  Account
                </NavLink>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
                >
                  <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Rendered outside the <nav>: its backdrop-blur would otherwise become the
          containing block for the modal's fixed overlay. */}
      {modals}
    </>
  );
}
