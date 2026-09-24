import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BanknotesIcon as BanknotesOutline,
  BuildingLibraryIcon as BuildingLibraryOutline,
  CurrencyDollarIcon as CurrencyDollarOutline,
  ReceiptPercentIcon as ReceiptPercentOutline,
  DocumentTextIcon as DocumentTextOutline,
  CalendarDaysIcon as CalendarDaysOutline,
  BookOpenIcon as BookOpenOutline,
  CheckCircleIcon as CheckCircleOutline,
  SunIcon,
  MoonIcon,
  EllipsisHorizontalIcon,
  CalculatorIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

import {
  BanknotesIcon as BanknotesSolid,
  BuildingLibraryIcon as BuildingLibrarySolid,
  CurrencyDollarIcon as CurrencyDollarSolid,
  ReceiptPercentIcon as ReceiptPercentSolid,
  DocumentTextIcon as DocumentTextSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  BookOpenIcon as BookOpenSolid,
  CheckCircleIcon as CheckCircleSolid,
} from "@heroicons/react/24/solid";

import { useTheme } from "@/components/useTheme";
import CalculatorModal from "@/components/CalculatorModal";
import CalendarModal from "@/components/CalendarModal";
import WaterModal from "@/components/WaterModal";
import DropletSolidIcon from "@/components/icons/DropletSolidIcon";

export default function BottomNavBar() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
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
  const moreItems = [
    {
      name: "Buy List",
      path: "/subscription",
      icon: CalendarDaysOutline,
      activeIcon: CalendarDaysSolid,
    },
    {
      name: "Tracker",
      path: "/tracker",
      icon: CheckCircleOutline,
      activeIcon: CheckCircleSolid,
    },
  ];

  const moreActive = moreItems.some((item) => pathname.startsWith(item.path));

  const navItems = [
    {
      name: "Loans",
      path: "/loans",
      icon: BanknotesOutline,
      activeIcon: BanknotesSolid,
    },
    {
      name: "Savings",
      path: "/savings",
      icon: BuildingLibraryOutline,
      activeIcon: BuildingLibrarySolid,
    },
    {
      name: "Salary",
      path: "/salary",
      icon: CurrencyDollarOutline,
      activeIcon: CurrencyDollarSolid,
    },
    {
      name: "Expenses",
      path: "/expenses",
      icon: ReceiptPercentOutline,
      activeIcon: ReceiptPercentSolid,
    },
    {
      name: "Bills",
      path: "/bills",
      icon: ReceiptPercentOutline,
      activeIcon: ReceiptPercentSolid,
    },
    {
      name: "Notes",
      path: "/notes",
      icon: DocumentTextOutline,
      activeIcon: DocumentTextSolid,
    },
    {
      name: "Thoughts",
      path: "/thoughts",
      icon: DocumentTextOutline,
      activeIcon: DocumentTextSolid,
    },
    {
      name: "House",
      path: "/house-expenses",
      icon: CalendarDaysOutline,
      activeIcon: CalendarDaysSolid,
    },
    {
      name: "Notebook",
      path: "/notebook",
      icon: BookOpenOutline,
      activeIcon: BookOpenSolid,
    },
  ];

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 w-full z-50 px-4 py-2 backdrop-blur-xl border-t ${
          isLight
            ? "bg-[rgba(245,245,245,0.85)] border-black/10"
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
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
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
            className="flex flex-col items-center justify-center text-xs text-[var(--text-secondary)]"
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

          {/* MORE — Buy List + Tracker */}
          <div ref={moreRef} className="relative flex">
            <button
              onClick={() => setMoreOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              className={`flex-1 flex flex-col items-center justify-center text-xs ${
                moreActive || moreOpen ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
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
                    setCalculatorOpen(true);
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
                    setCalendarOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                >
                  <CalendarIcon className="w-5 h-5" />
                  Calendar
                </button>

                <button
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false);
                    setWaterOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                >
                  <DropletSolidIcon className="w-5 h-5" />
                  Water
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Rendered outside the <nav>: its backdrop-blur would otherwise become the
          containing block for the modal's fixed overlay. */}
      <CalculatorModal open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <WaterModal open={waterOpen} onClose={() => setWaterOpen(false)} />
    </>
  );
}
