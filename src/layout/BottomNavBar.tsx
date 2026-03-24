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
    { name: "Salary", path: "/salary", icon: CurrencyDollarIcon },
    { name: "Bills", path: "/bills", icon: ReceiptPercentIcon },
    { name: "Notes", path: "/notes", icon: DocumentTextIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-mist-900 flex justify-around py-3 z-50 px-4">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${
                isActive ? "text-[#F2F211]" : "text-gray-400"
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