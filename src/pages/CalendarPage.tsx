import { CalendarBody } from "@/components/CalendarModal";

export default function CalendarPage() {
  return (
    <div className="max-w-md md:max-w-3xl mx-auto px-6 pt-8 pb-10 text-[var(--text-primary)]">
      <h1 className="text-lg font-semibold mb-6">Calendar</h1>
      <CalendarBody />
    </div>
  );
}
