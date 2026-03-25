import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  BanknotesIcon,
   BuildingLibraryIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function BottomNavBar() {
  const navItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Loans", path: "/loans", icon: BanknotesIcon },
    { name: "Savings", path: "/savings", icon: BuildingLibraryIcon },
    { name: "Notes", path: "/notes", icon: DocumentTextIcon },
    { name: "Salary", path: "/salary", icon: CurrencyDollarIcon },
    { name: "Expenses", path: "/expenses", icon: ReceiptPercentIcon },
    { name: "Bills", path: "/bills", icon: ReceiptPercentIcon },

  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#111111] border-t border-[#1d1d1d] flex justify-around py-3 z-50 px-4">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${
                isActive ? "text-[#01E777]" : "text-gray-400"
              }`
            }
          >
            <Icon className="w-6 h-6 mb-1" />
            <span className="font-semibold">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}