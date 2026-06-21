"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ListingCard } from "@/components/listing-card"
import { PostCard } from "@/components/post-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockListings, mockPosts } from "@/lib/mock-data"
import { Home, FileText, Bookmark } from "lucide-react"

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState("listings")
  
  // Simulate saved items (in real app, this would come from user data)
  const savedListings = mockListings.slice(0, 4)
  const savedPosts = mockPosts.slice(0, 3)

  return (
    <AppShell showBackButton title="المحفوظات" showBottomNav={false}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-14 z-30 bg-background border-b">
          <TabsList className="w-full h-12 rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="listings" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Home className="h-4 w-4 ml-2" />
              العقارات ({savedListings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="posts"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <FileText className="h-4 w-4 ml-2" />
              المنشورات ({savedPosts.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="listings" className="mt-0 p-4">
          {savedListings.length > 0 ? (
            <div className="space-y-4">
              {savedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">لا توجد عقارات محفوظة</h3>
              <p className="text-muted-foreground text-sm">
                احفظ العقارات التي تعجبك للرجوع إليها لاحقاً
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="posts" className="mt-0">
          {savedPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">لا توجد منشورات محفوظة</h3>
              <p className="text-muted-foreground text-sm">
                احفظ المنشورات المهمة للرجوع إليها لاحقاً
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
