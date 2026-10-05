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
import {
  CalendarIcon as CalendarOutline,
  UserCircleIcon as UserCircleOutline,
  ClockIcon as ClockOutline,
} from "@heroicons/react/24/outline";
import {
  CalendarIcon as CalendarSolid,
  UserCircleIcon as UserCircleSolid,
  ClockIcon as ClockSolid,
} from "@heroicons/react/24/solid";
import DropletSolidIcon from "@/components/icons/DropletSolidIcon";

export type NavIcon = React.ComponentType<{ className?: string }>;

export type NavItem = {
  name: string;
  path: string;
  icon: NavIcon;
  activeIcon: NavIcon;
};

// Shared by BottomNavBar (mobile) and SidebarNav (desktop) so the two can't
// drift apart — a page added to one always shows up in the other.
export const primaryNavItems: NavItem[] = [
  { name: "Loans", path: "/loans", icon: BanknotesOutline, activeIcon: BanknotesSolid },
  { name: "Savings", path: "/savings", icon: BuildingLibraryOutline, activeIcon: BuildingLibrarySolid },
  { name: "Salary", path: "/salary", icon: CurrencyDollarOutline, activeIcon: CurrencyDollarSolid },
  { name: "Expenses", path: "/expenses", icon: ReceiptPercentOutline, activeIcon: ReceiptPercentSolid },
  { name: "Bills", path: "/bills", icon: ReceiptPercentOutline, activeIcon: ReceiptPercentSolid },
  { name: "Notes", path: "/notes", icon: DocumentTextOutline, activeIcon: DocumentTextSolid },
  { name: "Thoughts", path: "/thoughts", icon: DocumentTextOutline, activeIcon: DocumentTextSolid },
  { name: "Notebook", path: "/notebook", icon: BookOpenOutline, activeIcon: BookOpenSolid },
  { name: "Water", path: "/water", icon: DropletSolidIcon, activeIcon: DropletSolidIcon },
];

// On mobile these live behind the bottom nav's "More" menu to save space; the
// desktop sidebar has the room to list them inline with everything else.
export const secondaryNavItems: NavItem[] = [
  { name: "Buy List", path: "/subscription", icon: CalendarDaysOutline, activeIcon: CalendarDaysSolid },
  { name: "Tracker", path: "/tracker", icon: CheckCircleOutline, activeIcon: CheckCircleSolid },
  { name: "Calendar", path: "/calendar", icon: CalendarOutline, activeIcon: CalendarSolid },
  { name: "OT Pay", path: "/ot-pay", icon: ClockOutline, activeIcon: ClockSolid },
  { name: "Profile", path: "/account", icon: UserCircleOutline, activeIcon: UserCircleSolid },
];
