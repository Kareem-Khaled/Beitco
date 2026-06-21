"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Edit, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockConversations } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'listing', label: 'محادثات العقارات' },
  { id: 'direct', label: 'رسائل مباشرة' },
]

export default function MessagesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('listing')

  const filteredConversations = mockConversations.filter((c) => c.type === activeTab)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="flex-1 font-semibold text-foreground text-center">الرسائل</h1>
          <Button variant="ghost" size="icon">
            <Edit className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground"
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

      {/* Conversations list */}
      <div className="divide-y divide-border">
        {filteredConversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="flex gap-3 p-4 hover:bg-surface transition-colors"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="w-14 h-14">
                <AvatarImage src={conversation.participant.avatar} alt={conversation.participant.name} />
                <AvatarFallback>{conversation.participant.name[0]}</AvatarFallback>
              </Avatar>
              {conversation.unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {conversation.unreadCount}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name & time */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "font-medium truncate",
                    conversation.unreadCount > 0 ? "text-foreground" : "text-foreground"
                  )}>
                    {conversation.participant.name}
                  </span>
                  {conversation.participant.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {conversation.lastMessageTime}
                </span>
              </div>

              {/* Listing context card */}
              {conversation.listing && (
                <div className="flex gap-2 p-2 rounded-md bg-surface mb-2">
                  <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={conversation.listing.images[0]}
                      alt={conversation.listing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{conversation.listing.title}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatPrice(conversation.listing.price)} EGP
                    </p>
                  </div>
                </div>
              )}

              {/* Last message */}
              <p className={cn(
                "text-sm truncate",
                conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {conversation.lastMessage}
              </p>
            </div>
          </Link>
        ))}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
              <Edit className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">لا توجد محادثات</h3>
            <p className="text-sm text-muted-foreground text-center">
              {activeTab === 'listing' 
                ? 'ستظهر هنا المحادثات المتعلقة بالعقارات'
                : 'ابدأ محادثة جديدة مع أي شخص'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
