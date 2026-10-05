import { WaterBody } from "@/components/WaterModal";

export default function WaterPage() {
  return (
    <div className="max-w-md md:max-w-xl mx-auto px-6 pt-8 pb-10 text-[var(--text-primary)]">
      <h1 className="text-lg font-semibold mb-6">Water</h1>
      <WaterBody />
    </div>
  );
}
