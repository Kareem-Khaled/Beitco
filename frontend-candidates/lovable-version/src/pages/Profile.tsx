import { useState } from "react";
import { mockUsers, mockPosts, mockListings, formatPrice } from "@/data/mockData";
import { BadgeCheck, Settings, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/feed/PostCard";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const user = mockUsers[0]; // Current user

const profileTabs = [
  { id: "posts", label: "منشورات" },
  { id: "listings", label: "عقارات" },
  { id: "likes", label: "إعجابات" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="max-w-[680px] mx-auto pb-8">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-bl from-primary to-primary-hover" />
        <div className="absolute -bottom-12 start-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-[96px] h-[96px] rounded-full border-4 border-background object-cover"
          />
        </div>
        <Link to="/settings" className="absolute top-3 end-3">
          <Button variant="ghost" size="icon" className="bg-background/50 backdrop-blur-sm">
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>

      {/* Info */}
      <div className="pt-14 px-4">
        <div className="flex items-center gap-1.5">
          <h1 className="text-h1 font-bold">{user.name}</h1>
          {user.verified && <BadgeCheck className="w-5 h-5 text-success" />}
        </div>
        <p className="text-caption text-muted-foreground mt-1">{user.bio}</p>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "منشور", value: user.postsCount },
            { label: "متابِع", value: user.followers },
            { label: "متابَع", value: user.following },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-mono text-h3 font-bold">{stat.value.toLocaleString("ar-EG")}</p>
              <p className="text-micro text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1 gap-2">
            <UserPlus className="w-4 h-4" />
            متابعة
          </Button>
          <Button variant="outline" className="flex-1 gap-2">
            <MessageCircle className="w-4 h-4" />
            رسالة
          </Button>
        </div>

        {/* Tier Progress */}
        <div className="mt-4 bg-gold-light rounded-card p-4 border border-gold/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption font-semibold">تقدم المستوى</span>
            <span className="text-micro text-muted-foreground">المستوى ٣ ← ٢</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gold rounded-full" style={{ width: "65%" }} />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-micro">
              <span>✅</span><span>تأكيد الهاتف</span>
            </div>
            <div className="flex items-center gap-2 text-micro">
              <span>✅</span><span>٥+ منشورات</span>
            </div>
            <div className="flex items-center gap-2 text-micro">
              <span>☐</span><span>تحقق الهوية</span>
            </div>
          </div>
          <Button variant="gold" size="sm" className="mt-3 w-full">تحقق الآن</Button>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-border mt-6">
        {profileTabs.map((tab) => (
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

      <div className="p-4 space-y-4">
        {activeTab === "posts" &&
          mockPosts
            .filter((p) => p.author.id === user.id)
            .map((post) => <PostCard key={post.id} post={post} />)}

        {activeTab === "listings" && (
          <div className="grid grid-cols-1 gap-3">
            {mockListings
              .filter((l) => l.agent.id === user.id)
              .map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="bg-card rounded-card shadow-card overflow-hidden flex gap-3"
                >
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-28 h-28 object-cover shrink-0"
                    loading="lazy"
                  />
                  <div className="p-3 flex-1 min-w-0">
                    <p className="font-mono text-body font-bold text-primary">
                      {formatPrice(listing.price, listing.purpose)}
                    </p>
                    <p className="text-caption truncate mt-0.5">{listing.title}</p>
                    <p className="text-micro text-muted-foreground mt-0.5">📍 {listing.location}</p>
                  </div>
                </Link>
              ))}
          </div>
        )}

        {activeTab === "likes" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-display mb-2">❤️</span>
            <p className="text-body text-muted-foreground">لم تعجبك أي منشورات بعد</p>
            <Button variant="outline" className="mt-4">استكشف المنشورات</Button>
          </div>
        )}
      </div>
    </div>
  );
}
