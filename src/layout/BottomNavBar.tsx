import { NavLink } from "react-router-dom";

export default function BottomNavBar() {
  const navItems = [
    { name: "Home", path: "/" },
    { name: "Loans", path: "/loans" },
    { name: "Salary", path: "/salary" },
    { name: "Bills", path: "/bills" },
    { name: "Notes", path: "/notes" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-mist-900 flex justify-around py-6 z-50 px-4">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center text-sm ${
              isActive ? "text-[#94C93D]" : "text-gray-400"
            }`
          }
        >
          {/* You can replace the span with icons if you want */}
          <span className="font-semibold">{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
}