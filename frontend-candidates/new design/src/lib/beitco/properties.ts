import heroImg from "@/assets/hero-home.jpg";
import maadi from "@/assets/area-maadi.jpg";
import zayed from "@/assets/area-sheikh-zayed.jpg";
import alex from "@/assets/area-alexandria.jpg";
import newCairo from "@/assets/area-new-cairo.jpg";

export type PropertyType = "Apartment" | "Room" | "Bed";

export type Review = {
  id: string;
  author: string;
  initials: string;
  monthsLived: number;
  rating: number;
  date: string;
  body: string;
};

export type QA = {
  id: string;
  q: string;
  a?: string;
  asker: string;
  answerer?: string;
  date: string;
};

export type PropertyDetail = {
  id: string;
  title: string;
  area: string;
  address: string;
  type: PropertyType;
  price: number;
  trust: number;
  verified: boolean;
  reviewsCount: number;
  residents: number;
  images: string[];
  description: string;
  quality: {
    internet: number;
    safety: number;
    noise: number;
    maintenance: number;
    cleanliness: number;
  };
  amenities: string[];
  costs: { label: string; amount: number }[];
  beds?: { total: number; occupied: number };
  landlord: { name: string; initials: string; trust: number; responseRate: number; verified: boolean };
  reviews: Review[];
  qa: QA[];
};

const sample: Record<string, PropertyDetail> = {
  "1": {
    id: "1",
    title: "Sunlit 2-bedroom near AUC",
    area: "New Cairo · 5th Settlement",
    address: "South 90 Road, 5th Settlement, New Cairo",
    type: "Apartment",
    price: 18500,
    trust: 9.2,
    verified: true,
    reviewsCount: 24,
    residents: 6,
    images: [heroImg, newCairo, maadi, zayed],
    description:
      "Bright, quiet 2-bedroom apartment 8 minutes from AUC. Fully furnished, fiber internet, secured compound with 24/7 guard. Ideal for a young couple or two professionals sharing.",
    quality: { internet: 9.4, safety: 9.1, noise: 8.7, maintenance: 9.0, cleanliness: 9.3 },
    amenities: [
      "WiFi 200 Mbps",
      "Air Conditioning",
      "Washing Machine",
      "Microwave",
      "Refrigerator",
      "Elevator",
      "Covered Parking",
      "24/7 Security",
      "Furnished",
    ],
    costs: [
      { label: "Rent", amount: 18500 },
      { label: "Internet", amount: 450 },
      { label: "Electricity (avg)", amount: 900 },
      { label: "Water", amount: 120 },
      { label: "Service fee", amount: 350 },
    ],
    landlord: {
      name: "Mostafa H.",
      initials: "MH",
      trust: 9.4,
      responseRate: 97,
      verified: true,
    },
    reviews: [
      {
        id: "r1",
        author: "Nour A.",
        initials: "NA",
        monthsLived: 11,
        rating: 9.4,
        date: "Mar 2026",
        body:
          "Genuinely one of the calmest streets in 5th Settlement. Internet never drops during calls, AC works in every room, and Mostafa fixes things within a day.",
      },
      {
        id: "r2",
        author: "Karim S.",
        initials: "KS",
        monthsLived: 6,
        rating: 9.0,
        date: "Jan 2026",
        body:
          "Great value for the area. Slightly noisy on Friday evenings because of the nearby café, but otherwise spotless and very safe.",
      },
      {
        id: "r3",
        author: "Yasmine R.",
        initials: "YR",
        monthsLived: 14,
        rating: 9.6,
        date: "Nov 2025",
        body:
          "Lived here through two contracts. Landlord respects boundaries, never enters without notice. Building staff are professional.",
      },
    ],
    qa: [
      {
        id: "q1",
        asker: "Omar",
        answerer: "Mostafa H. (Landlord)",
        date: "2 weeks ago",
        q: "How reliable is the internet for video calls during the day?",
        a: "Fiber 200/200. Two tenants work remote full-time without issues.",
      },
      {
        id: "q2",
        asker: "Sara",
        date: "5 days ago",
        q: "Is there a supermarket within walking distance?",
      },
    ],
  },
  "3": {
    id: "3",
    title: "Students coliving · Bed rental",
    area: "Maadi · Road 9",
    address: "Road 9, Maadi, Cairo",
    type: "Bed",
    price: 3200,
    trust: 8.1,
    verified: false,
    reviewsCount: 32,
    residents: 8,
    images: [maadi, heroImg, newCairo, alex],
    description:
      "Coliving space for students and remote workers, walking distance to Road 9 cafés and Maadi metro. Shared kitchen, weekly cleaning included.",
    quality: { internet: 8.4, safety: 8.6, noise: 7.4, maintenance: 8.0, cleanliness: 8.5 },
    amenities: ["WiFi 100 Mbps", "Air Conditioning", "Washing Machine", "Shared Kitchen", "Weekly Cleaning", "Workspace"],
    costs: [
      { label: "Bed rental", amount: 3200 },
      { label: "Utilities (incl.)", amount: 0 },
      { label: "Cleaning", amount: 0 },
    ],
    beds: { total: 8, occupied: 6 },
    landlord: { name: "Beitco Coliving", initials: "BC", trust: 8.6, responseRate: 92, verified: true },
    reviews: [
      {
        id: "r1",
        author: "Hana M.",
        initials: "HM",
        monthsLived: 4,
        rating: 8.4,
        date: "Apr 2026",
        body: "Clean, friendly housemates, great location. Can get a bit noisy on weekends.",
      },
    ],
    qa: [],
  },
};

export function getProperty(id: string): PropertyDetail | undefined {
  return sample[id] ?? sample["1"];
}
