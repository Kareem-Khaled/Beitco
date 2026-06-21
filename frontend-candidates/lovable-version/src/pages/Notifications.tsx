import { mockNotifications } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { useState } from "react";

const filterTabs = [
  { id: "all", label: "الكل" },
  { id: "social", label: "اجتماعي" },
  { id: "listings", label: "عقارات" },
  { id: "approvals", label: "موافقات" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="p-4">
        <h1 className="text-h1 font-bold">الإشعارات</h1>
      </div>

      <div className="flex border-b border-border">
        {filterTabs.map((tab) => (
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
        <div className="px-4 py-2">
          <span className="text-micro font-semibold text-muted-foreground">اليوم</span>
        </div>
        {mockNotifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 transition-colors",
              !notification.read && "bg-primary-light/30"
            )}
          >
            {!notification.read && (
              <span className="w-2 h-2 rounded-full bg-success mt-2 shrink-0" />
            )}
            {notification.users.length > 0 && (
              <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                {notification.users.slice(0, 2).map((u) => (
                  <img
                    key={u.id}
                    src={u.avatar}
                    alt={u.name}
                    className="w-10 h-10 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-caption text-foreground leading-relaxed">{notification.content}</p>
              <p className="text-micro text-muted-foreground mt-1">{notification.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
