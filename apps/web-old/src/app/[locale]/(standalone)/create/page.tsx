"use client"

import { useState } from 'react'
import { useRouter } from '@/i18n/routing'
import { X, Image as ImageIcon, Video, BarChart3, MapPin, Globe, Users, Lock, ChevronDown, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { currentUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const audiences = [
  { id: 'public', icon: Globe, label: 'الجميع' },
  { id: 'followers', icon: Users, label: 'المتابعين فقط' },
  { id: 'private', icon: Lock, label: 'خاص' },
]

export default function CreatePostPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [audience, setAudience] = useState('public')
  const [showAudienceMenu, setShowAudienceMenu] = useState(false)

  const maxLength = 500
  const needsApproval = currentUser.tier >= 3

  const handleSubmit = () => {
    // In real app, would submit to API
    router.push('/')
  }

  const selectedAudience = audiences.find(a => a.id === audience)!

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">منشور جديد</h1>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className={cn(
              needsApproval ? "bg-accent hover:bg-accent/90" : ""
            )}
          >
            {needsApproval ? 'إرسال للموافقة' : 'نشر'}
          </Button>
        </div>
      </header>

      {/* Approval notice */}
      {needsApproval && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent-light border-b border-accent/20">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-sm text-foreground">
            بوستك هيتراجع قبل النشر
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4">
        {/* Author row */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-foreground">{currentUser.name}</p>
            {/* Audience selector */}
            <div className="relative">
              <button
                onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface text-sm text-muted-foreground hover:bg-border transition-colors"
              >
                <selectedAudience.icon className="w-3.5 h-3.5" />
                <span>{selectedAudience.label}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              
              {showAudienceMenu && (
                <div className="absolute top-full start-0 mt-1 py-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[150px]">
                  {audiences.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setAudience(a.id)
                        setShowAudienceMenu(false)
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors",
                        audience === a.id
                          ? "bg-primary-light text-primary"
                          : "text-foreground hover:bg-surface"
                      )}
                    >
                      <a.icon className="w-4 h-4" />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Text area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="شارك رأيك..."
          maxLength={maxLength}
          className="w-full min-h-[200px] bg-transparent text-foreground text-lg leading-relaxed placeholder:text-muted-foreground resize-none outline-none"
          autoFocus
        />

        {/* Character counter */}
        <div className="flex justify-end mt-2">
          <span className={cn(
            "text-sm",
            content.length > maxLength * 0.9
              ? "text-destructive"
              : "text-muted-foreground"
          )}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      {/* Media toolbar */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-primary">
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary">
            <MapPin className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
