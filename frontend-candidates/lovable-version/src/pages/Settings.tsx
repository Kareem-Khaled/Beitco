import { useState } from "react";
import { mockUsers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Moon, Sun, Globe, Bell, Lock, Trash2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

function SettingRow({
  icon: Icon,
  label,
  trailing,
  danger,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3.5 touch-target transition-colors hover:bg-accent",
        danger && "text-destructive"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1 text-start text-body">{label}</span>
      {trailing || <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform",
          checked ? "start-[22px]" : "start-0.5"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const user = mockUsers[0];
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [notifications, setNotifications] = useState(true);

  const toggleDark = (value: boolean) => {
    setDarkMode(value);
    document.documentElement.classList.toggle("dark", value);
  };

  return (
    <div className="max-w-[680px] mx-auto pb-8">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 h-14 border-b border-border">
        <Link to="/profile" className="touch-target flex items-center justify-center">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-h2 font-bold">الإعدادات</h1>
      </div>

      {/* Profile Section */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-h3 font-semibold">{user.name}</p>
          <p className="text-caption text-muted-foreground">{user.city} · {user.role}</p>
        </div>
        <Button variant="outline" size="sm">تعديل</Button>
      </div>

      {/* Settings Groups */}
      <div className="divide-y divide-border">
        <div className="py-2">
          <p className="px-4 py-2 text-micro text-muted-foreground font-semibold">المظهر واللغة</p>
          <SettingRow
            icon={darkMode ? Moon : Sun}
            label="الوضع الليلي"
            trailing={<ToggleSwitch checked={darkMode} onChange={toggleDark} />}
          />
          <SettingRow icon={Globe} label="اللغة" trailing={<span className="text-caption text-muted-foreground">العربية</span>} />
        </div>

        <div className="py-2">
          <p className="px-4 py-2 text-micro text-muted-foreground font-semibold">الإشعارات والخصوصية</p>
          <SettingRow
            icon={Bell}
            label="الإشعارات"
            trailing={<ToggleSwitch checked={notifications} onChange={setNotifications} />}
          />
          <SettingRow icon={Lock} label="الخصوصية" />
        </div>

        <div className="py-2">
          <p className="px-4 py-2 text-micro text-muted-foreground font-semibold">الحساب</p>
          <SettingRow icon={Trash2} label="حذف الحساب" danger />
        </div>
      </div>
    </div>
  );
}
