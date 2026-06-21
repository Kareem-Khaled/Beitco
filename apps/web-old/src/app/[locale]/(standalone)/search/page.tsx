"use client"

import { useState } from "react"
import { Link } from "@/i18n/routing"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ListingCard } from "@/components/listing-card"
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Home,
  Users,
  MapPin
} from "lucide-react"
import { mockListings, mockUsers, mockGroups } from "@/lib/mock-data"

const recentSearches = [
  "شقق للبيع في التجمع الخامس",
  "فيلا مع حديقة",
  "استوديو للإيجار",
  "عقارات الشيخ زايد"
]

const trendingSearches = [
  "العاصمة الإدارية",
  "مدينتي",
  "الرحاب",
  "أكتوبر",
  "الساحل الشمالي"
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowResults(true)
  }

  const clearSearch = () => {
    setQuery("")
    setShowResults(false)
  }

  // Filter results based on query
  const filteredListings = mockListings.filter(l => 
    l.title.includes(query) || l.location.city.includes(query) || l.location.area.includes(query)
  ).slice(0, 3)
  
  const filteredUsers = mockUsers.filter(u => 
    u.name.includes(query)
  ).slice(0, 3)
  
  const filteredGroups = mockGroups.filter(g => 
    g.name.includes(query)
  ).slice(0, 2)

  return (
    <>
      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowResults(e.target.value.length > 0)
            }}
            placeholder="ابحث عن عقارات، أشخاص، مجموعات..."
            className="pr-10 pl-10 h-12 text-base"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {!showResults ? (
          <>
            {/* Recent Searches */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  عمليات البحث الأخيرة
                </h3>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  مسح الكل
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => handleSearch(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Trending Searches */}
            <div className="mb-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4" />
                الأكثر بحثاً
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSearch(search)}
                  >
                    <MapPin className="h-3 w-3 ml-1" />
                    {search}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Quick Categories */}
            <div>
              <h3 className="font-semibold mb-3">تصفح حسب النوع</h3>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">عقارات للبيع</p>
                      <p className="text-xs text-muted-foreground">1,234 عقار</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
                      <Home className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">عقارات للإيجار</p>
                      <p className="text-xs text-muted-foreground">856 عقار</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">وسطاء عقاريون</p>
                      <p className="text-xs text-muted-foreground">423 وسيط</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">مجموعات</p>
                      <p className="text-xs text-muted-foreground">89 مجموعة</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Search Results */}
            {filteredListings.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    العقارات
                  </h3>
                  <Link href={`/listings?q=${query}`} className="text-sm text-primary">
                    عرض الكل
                  </Link>
                </div>
                <div className="space-y-3">
                  {filteredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} variant="compact" />
                  ))}
                </div>
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    الأشخاص
                  </h3>
                  <Link href={`/users?q=${query}`} className="text-sm text-primary">
                    عرض الكل
                  </Link>
                </div>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0 divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                      >
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.role}</p>
                        </div>
                        {user.isVerified && (
                          <Badge variant="secondary" className="text-xs">موثق</Badge>
                        )}
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {filteredGroups.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  المجموعات
                </h3>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0 divide-y divide-border">
                    {filteredGroups.map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-accent transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{group.name}</p>
                          <p className="text-xs text-muted-foreground">{group.memberCount.toLocaleString()} عضو</p>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {filteredListings.length === 0 && filteredUsers.length === 0 && filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">لا توجد نتائج</h3>
                <p className="text-muted-foreground text-sm">
                  جرب البحث بكلمات مختلفة
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
