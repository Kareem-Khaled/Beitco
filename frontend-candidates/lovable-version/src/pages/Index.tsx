import { useState, useEffect } from "react";
import PostCard from "@/components/feed/PostCard";
import SkeletonCard from "@/components/feed/SkeletonCard";
import { mockPosts } from "@/data/mockData";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "foryou", label: "لك" },
  { id: "following", label: "المتابَعين" },
  { id: "videos", label: "📹 فيديو" },
];

export default function Index() {
  const [activeTab, setActiveTab] = useState("foryou");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-[680px] mx-auto">
      {/* Feed Tabs */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-caption font-medium touch-target transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 inset-x-4 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          mockPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
