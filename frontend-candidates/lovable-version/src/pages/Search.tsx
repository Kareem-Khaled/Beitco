import { useState } from "react";
import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { mockPosts, mockListings, mockUsers } from "@/data/mockData";
import { formatPrice } from "@/data/mockData";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const searchTabs = [
  { id: "all", label: "الكل" },
  { id: "posts", label: "منشورات" },
  { id: "listings", label: "عقارات" },
  { id: "people", label: "أشخاص" },
];

const trendingTags = [
  "#التجمع_الخامس",
  "#شقق_للبيع",
  "#العاصمة_الإدارية",
  "#إيجار_القاهرة",
  "#الساحل_الشمالي",
  "#مدينتي",
];

export default function SearchPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في بيتكو..."
            className="w-full h-12 ps-12 pe-4 rounded-pill bg-muted text-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {searchTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-3 text-caption font-medium touch-target transition-colors relative",
              activeTab === tab.id ? "text-primary" : "text-muted-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Trending */}
        {!query && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="text-h3 font-semibold">الأكثر بحثاً</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag}
                  className="px-4 py-2 rounded-pill bg-primary-light text-primary text-caption font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* People Section */}
        {(activeTab === "all" || activeTab === "people") && (
          <div className="mb-6">
            <h3 className="text-h3 font-semibold mb-3">أشخاص</h3>
            <div className="space-y-3">
              {mockUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 bg-card rounded-card shadow-card p-3">
                  <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold truncate">{user.name}</span>
                      {user.verified && <BadgeCheck className="w-4 h-4 text-success shrink-0" />}
                    </div>
                    <span className="text-micro text-muted-foreground">{user.followers} متابع</span>
                  </div>
                  <Button size="sm" variant="outline">متابعة</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listings Section */}
        {(activeTab === "all" || activeTab === "listings") && (
          <div>
            <h3 className="text-h3 font-semibold mb-3">عقارات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockListings.map((listing) => (
                <div key={listing.id} className="bg-card rounded-card shadow-card overflow-hidden">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                  <div className="p-3">
                    <p className="font-mono text-h3 font-bold text-primary">
                      {formatPrice(listing.price, listing.purpose)}
                    </p>
                    <p className="text-caption text-foreground mt-1">{listing.title}</p>
                    <p className="text-micro text-muted-foreground mt-0.5">📍 {listing.location}</p>
                    <div className="flex items-center gap-3 mt-2 text-micro text-muted-foreground">
                      <span>🛏️ {listing.bedrooms}</span>
                      <span>🚿 {listing.bathrooms}</span>
                      <span>📐 {listing.area} م²</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
