import { NavLink } from "react-router-dom";
import {
  BanknotesIcon as BanknotesOutline,
  BuildingLibraryIcon as BuildingLibraryOutline,
  CurrencyDollarIcon as CurrencyDollarOutline,
  ReceiptPercentIcon as ReceiptPercentOutline,
  DocumentTextIcon as DocumentTextOutline,
  CalendarDaysIcon as CalendarDaysOutline,
  BookOpenIcon as BookOpenOutline,
  CheckCircleIcon as CheckCircleOutline,
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

export default function BottomNavBar() {
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
      name: "Buy List",
      path: "/subscription",
      icon: CalendarDaysOutline,
      activeIcon: CalendarDaysSolid,
    },
    {
      name: "Notebook",
      path: "/notebook",
      icon: BookOpenOutline,
      activeIcon: BookOpenSolid,
    },
    {
      name: "Tracker",
      path: "/tracker",
      icon: CheckCircleOutline,
      activeIcon: CheckCircleSolid,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 px-4 py-2 bg-[rgba(17,19,18,0.55)] backdrop-blur-xl border-t border-white/10">
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
                isActive ? "text-[#B98953]" : "text-[#999794]"
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
      </div>
    </nav>
  );
}
