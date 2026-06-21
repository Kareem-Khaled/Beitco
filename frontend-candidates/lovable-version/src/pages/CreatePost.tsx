import { useState } from "react";
import { mockUsers } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Camera, ImageIcon } from "lucide-react";

export default function CreatePost() {
  const user = mockUsers[0];
  const [content, setContent] = useState("");
  const isVerified = user.tier <= 2;
  const maxChars = 2000;

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 h-14 border-b border-border">
        <Button variant="ghost" size="sm">إلغاء</Button>
        <Button
          size="sm"
          variant={isVerified ? "default" : "gold-outline"}
          disabled={!content.trim()}
        >
          {isVerified ? "نشر" : "إرسال للموافقة"}
        </Button>
      </div>

      {!isVerified && (
        <div className="mx-4 mt-4 p-3 bg-gold-light rounded-card border border-gold/20 text-caption">
          💡 بوستك هيتراجع قبل النشر
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-body">{user.name}</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
              placeholder="شارك رأيك..."
              className="w-full mt-2 bg-transparent text-body placeholder:text-muted-foreground resize-none focus:outline-none min-h-[200px]"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button className="touch-target flex items-center justify-center text-primary">
              <Camera className="w-5 h-5" />
            </button>
            <button className="touch-target flex items-center justify-center text-primary">
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
          <span className="text-micro text-muted-foreground font-mono">
            {content.length}/{maxChars}
          </span>
        </div>
      </div>
    </div>
  );
}
