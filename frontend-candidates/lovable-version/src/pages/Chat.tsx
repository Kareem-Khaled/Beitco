import { mockConversations, formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";

const chatTabs = [
  { id: "listings", label: "محادثات العقارات" },
  { id: "direct", label: "رسائل مباشرة" },
];

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("listings");

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="p-4">
        <h1 className="text-h1 font-bold">الرسائل</h1>
      </div>

      <div className="flex border-b border-border">
        {chatTabs.map((tab) => (
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

      <div className="divide-y divide-border">
        {mockConversations.map((conv) => (
          <div key={conv.id} className="flex items-start gap-3 p-4 hover:bg-accent transition-colors cursor-pointer">
            <div className="relative shrink-0">
              <img src={conv.user.avatar} alt={conv.user.name} className="w-12 h-12 rounded-full object-cover" />
              {conv.unread > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-micro font-bold flex items-center justify-center">
                  {conv.unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className={cn("font-semibold truncate", conv.unread > 0 && "font-bold")}>
                    {conv.user.name}
                  </span>
                  {conv.user.verified && <BadgeCheck className="w-4 h-4 text-success shrink-0" />}
                </div>
                <span className="text-micro text-muted-foreground shrink-0">{conv.timestamp}</span>
              </div>
              {conv.listing && (
                <div className="flex items-center gap-2 mt-1 p-1.5 bg-muted rounded text-micro">
                  <span>🏠</span>
                  <span className="truncate">{conv.listing.title}</span>
                  <span className="font-mono text-primary font-medium shrink-0">
                    {formatPrice(conv.listing.price, conv.listing.purpose)}
                  </span>
                </div>
              )}
              <p className={cn(
                "text-caption mt-1 truncate",
                conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {conv.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
