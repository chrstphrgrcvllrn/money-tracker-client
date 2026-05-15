import { NavLink } from "react-router-dom";
import {
  BanknotesIcon as BanknotesOutline,
  BuildingLibraryIcon as BuildingLibraryOutline,
  CurrencyDollarIcon as CurrencyDollarOutline,
  ReceiptPercentIcon as ReceiptPercentOutline,
  DocumentTextIcon as DocumentTextOutline,
  // CalculatorIcon as CalculatorOutline,
  CalendarDaysIcon as CalendarDaysOutline,
  TvIcon as TvOutline,
} from "@heroicons/react/24/outline";

import {
  BanknotesIcon as BanknotesSolid,
  BuildingLibraryIcon as BuildingLibrarySolid,
  CurrencyDollarIcon as CurrencyDollarSolid,
  ReceiptPercentIcon as ReceiptPercentSolid,
  DocumentTextIcon as DocumentTextSolid,
  // CalculatorIcon as CalculatorSolid,
  CalendarDaysIcon as CalendarDaysSolid,
  TvIcon as TvSolid,
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
      name: "Watchlist",
      path: "/watchlist",
      icon: TvOutline,
      activeIcon: TvSolid,
    },
    {
      name: "Calendar",
      path: "/calendar",
      icon: CalendarDaysOutline,
      activeIcon: CalendarDaysSolid,
    },
       {
      name: "Subscription",
      path: "/subscription",
      icon: CalendarDaysOutline,
      activeIcon: CalendarDaysSolid,
    },
    // {
    //   name: "Calculator",
    //   path: "/calculator",
    //   icon: CalculatorOutline,
    //   activeIcon: CalculatorSolid,
    // },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full grid grid-cols-5 py-3 z-50 px-4 bg-[rgba(17,19,18,0.55)] backdrop-blur-xl border border-white/10">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-xs ${
              isActive ? "text-[#dff966]" : "text-[#999794]"
            }`
          }
        >
          {({ isActive }) => {
            const Icon = isActive ? item.activeIcon : item.icon;

            return (
              <>
                <Icon className="w-6 h-6 mb-1" />
                <span className="font-semibold">{item.name}</span>
              </>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}