import { NavLink } from "react-router-dom";
import {
  // HomeIcon,
  BanknotesIcon,
   BuildingLibraryIcon,
  CurrencyDollarIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
    CalculatorIcon,
      CalendarDaysIcon,
      TvIcon
} from "@heroicons/react/24/outline";

export default function BottomNavBar() {
  const navItems = [
    // { name: "Home", path: "/", icon: HomeIcon },
    { name: "Loans", path: "/loans", icon: BanknotesIcon },
    { name: "Savings", path: "/savings", icon: BuildingLibraryIcon },
    { name: "Salary", path: "/salary", icon: CurrencyDollarIcon },
    { name: "Expenses", path: "/expenses", icon: ReceiptPercentIcon },
    { name: "Bills", path: "/bills", icon: ReceiptPercentIcon },
    { name: "Notes", path: "/notes", icon: DocumentTextIcon },
      { name: "Thoughts", path: "/thoughts", icon: DocumentTextIcon },
  { name: "Watchlist", path: "/watchlist", icon: TvIcon },  
    { name: "Exercise", path: "/calendar", icon: CalendarDaysIcon }, 
     { name: "Calc", path: "/calculator", icon: CalculatorIcon },


  ];

  return (
<nav className="fixed bottom-0 left-0 w-full  grid grid-cols-5 py-3 z-50 px-4   bg-[rgba(17,19,18,0.55)] backdrop-blur-xl border border-white/10">
 {/* bg-[#111312]  */}
  {navItems.map((item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.name}
        to={item.path}
        className={({ isActive }) =>
          `flex flex-col items-center justify-center text-xs ${
            isActive ? "text-[#EB5647]" : "text-[#999794]"
            // isActive ? "text-white" : "text-[#EB5647]"
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