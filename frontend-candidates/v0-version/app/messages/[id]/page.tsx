"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Phone, MoreHorizontal, Camera, Mic, Send, BadgeCheck, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockConversations, mockListings, currentUser } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

const quickReplies = [
  'هل متاح؟',
  'السعر؟',
  'ممكن زيارة؟',
]

// Mock messages
const mockMessages = [
  {
    id: '1',
    senderId: '2',
    content: 'مرحباً، أنا مهتم بالشقة دي',
    time: '10:30 ص',
    isRead: true,
  },
  {
    id: '2',
    senderId: '1',
    content: 'أهلاً وسهلاً! أيوه الشقة متاحة',
    time: '10:32 ص',
    isRead: true,
  },
  {
    id: '3',
    senderId: '2',
    content: 'ممتاز، ممكن أعرف السعر النهائي؟',
    time: '10:33 ص',
    isRead: true,
  },
  {
    id: '4',
    senderId: '1',
    content: 'السعر ٣.٥ مليون جنيه قابل للتفاوض البسيط',
    time: '10:35 ص',
    isRead: true,
  },
  {
    id: '5',
    senderId: '2',
    content: 'تمام، ممكن أزورها امتى؟',
    time: '10:40 ص',
    isRead: false,
  },
]

export default function ChatPage({ params }: PageProps) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)

  // In real app, would fetch conversation by ID
  const conversation = mockConversations[0]
  const listing = mockListings[0]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price)
  }

  const handleSend = () => {
    if (!message.trim()) return

    const newMessage = {
      id: String(messages.length + 1),
      senderId: currentUser.id,
      content: message,
      time: 'الآن',
      isRead: false,
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  const handleQuickReply = (reply: string) => {
    setMessage(reply)
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Link href={`/profile/${conversation.participant.id}`} className="flex-1 flex items-center gap-3 mx-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.participant.avatar} alt={conversation.participant.name} />
              <AvatarFallback>{conversation.participant.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground truncate">
                  {conversation.participant.name}
                </span>
                {conversation.participant.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">متصل الآن</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Pinned listing card */}
      {conversation.type === 'listing' && listing && (
        <Link
          href={`/listings/${listing.id}`}
          className="flex gap-3 p-3 mx-4 mt-3 rounded-lg bg-surface border border-border"
        >
          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{listing.title}</p>
            <p className="font-mono text-sm text-primary mt-0.5">
              {formatPrice(listing.price)} EGP
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {listing.location.area}، {listing.location.city}
            </p>
          </div>
        </Link>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUser.id
          return (
            <div
              key={msg.id}
              className={cn(
                "flex",
                isOwn ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-es-none"
                    : "bg-surface text-foreground rounded-ee-none"
                )}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  isOwn ? "justify-start" : "justify-end"
                )}>
                  <span className={cn(
                    "text-xs",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {msg.time}
                  </span>
                  {isOwn && (
                    msg.isRead ? (
                      <CheckCheck className="w-3.5 h-3.5 text-primary-foreground/70" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-primary-foreground/70" />
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick replies */}
      <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              className="px-4 py-2 rounded-full bg-surface text-sm text-foreground whitespace-nowrap hover:bg-border transition-colors"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Camera className="w-5 h-5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Mic className="w-5 h-5 text-primary" />
          </Button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اكتب رسالتك..."
            className="flex-1 h-10 px-4 rounded-full bg-surface border border-transparent focus:border-primary outline-none text-foreground placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="rounded-full flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
