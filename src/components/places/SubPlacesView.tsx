import type { SubPlace } from "@/types/places.type";
import SpotsView from "./SpotsView";

type Props = {
  subPlaces: SubPlace[];
  onOpenImages: (images: string[], index: number) => void;
};

// Read-only list of the places inside a country, each with its spots.
export default function SubPlacesView({ subPlaces, onOpenImages }: Props) {
  if (subPlaces.length === 0) return null;

  return (
    <div className="space-y-5">
      {subPlaces.map((sp) => (
        <div key={sp._id} className="space-y-3">
          <p className="text-base font-semibold">{sp.name}</p>
          <SpotsView spots={sp.spots} onOpenImages={onOpenImages} />
        </div>
      ))}
    </div>
  );
}
