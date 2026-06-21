import { PropertyCard, type Property } from "./PropertyCard";
import { SectionHeader } from "./SectionHeader";
import heroImg from "@/assets/hero-home.jpg";
import maadi from "@/assets/area-maadi.jpg";
import zayed from "@/assets/area-sheikh-zayed.jpg";
import alex from "@/assets/area-alexandria.jpg";

const items: Property[] = [
  {
    id: "1",
    title: "Sunlit 2-bedroom near AUC",
    area: "New Cairo · 5th Settlement",
    type: "Apartment",
    price: 18500,
    trust: 9.2,
    reviews: 24,
    residents: 6,
    internet: 9.4,
    image: heroImg,
    verified: true,
  },
  {
    id: "2",
    title: "Quiet room in shared villa",
    area: "Sheikh Zayed · Beverly Hills",
    type: "Room",
    price: 6500,
    trust: 8.7,
    reviews: 11,
    residents: 4,
    internet: 8.9,
    image: zayed,
    verified: true,
  },
  {
    id: "3",
    title: "Students coliving · Bed rental",
    area: "Maadi · Road 9",
    type: "Bed",
    price: 3200,
    trust: 8.1,
    reviews: 32,
    residents: 8,
    internet: 8.4,
    image: maadi,
    beds: { total: 8, available: 2 },
  },
  {
    id: "4",
    title: "Sea-view studio for remote work",
    area: "Alexandria · Stanley",
    type: "Apartment",
    price: 12000,
    trust: 9.0,
    reviews: 19,
    residents: 3,
    internet: 9.6,
    image: alex,
    verified: true,
  },
];

export function FeaturedHousing() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Featured housing"
        title="Verified, reviewed, and ready to move in"
        description="A mix of apartments, rooms and beds — each one scored by people who actually live there."
      />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <PropertyCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}
