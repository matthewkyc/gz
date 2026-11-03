import TripApp from "@/components/TripApp";
import { loadContent } from "@/lib/content";

export default function Page() {
  const { trip, places } = loadContent();
  return <TripApp trip={trip} places={places} />;
}
