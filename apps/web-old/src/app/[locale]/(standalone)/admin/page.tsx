"use client"

import { useState } from 'react'
import {
  Users,
  FileText,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  MoreHorizontal,
  Eye,
  UserCog,
  Ban,
  Trash2,
  Search,
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  Flag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { mockUsers } from '@/lib/mock-data'

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'moderation', label: 'المراجعة', icon: ClipboardList },
  { id: 'users', label: 'المستخدمين', icon: UserCircle },
  { id: 'reports', label: 'البلاغات', icon: Flag },
]

const stats = [
  { label: 'إجمالي المستخدمين', value: '12,847', trend: 'up', change: '+12%', icon: Users },
  { label: 'منشورات اليوم', value: '234', trend: 'up', change: '+8%', icon: FileText },
  { label: 'بانتظار الموافقة', value: '18', trend: 'down', change: '-5%', icon: Clock },
  { label: 'بلاغات', value: '7', trend: 'up', change: '+2', icon: AlertTriangle },
]

const pendingPosts = [
  { id: '1', author: mockUsers[1]!, preview: 'نصائح مهمة لشراء عقار في المناطق الجديدة...', submittedAt: 'منذ ساعتين' },
  { id: '2', author: mockUsers[3]!, preview: 'تجربتي في البحث عن شقة في المعادي...', submittedAt: 'منذ ٣ ساعات' },
  { id: '3', author: mockUsers[1]!, preview: 'أسعار العقارات في العاصمة الإدارية...', submittedAt: 'منذ ٥ ساعات' },
]

const reports = [
  { id: '1', reporter: mockUsers[1]!, content: 'محتوى مسيء في التعليقات...', reason: 'محتوى غير لائق', time: 'منذ ساعة' },
  { id: '2', reporter: mockUsers[3]!, content: 'إعلان مضلل عن أسعار...', reason: 'معلومات خاطئة', time: 'منذ ٣ ساعات' },
]

const allUsers = [
  { ...mockUsers[4]!, status: 'active' as const, joinedAt: '2024-01-01', postsCount: 312 },
  { ...mockUsers[0]!, status: 'active' as const, joinedAt: '2024-01-05', postsCount: 89 },
  { ...mockUsers[2]!, status: 'active' as const, joinedAt: '2024-01-10', postsCount: 156 },
  { ...mockUsers[1]!, status: 'active' as const, joinedAt: '2024-01-15', postsCount: 12 },
  { ...mockUsers[3]!, status: 'suspended' as const, joinedAt: '2024-01-20', postsCount: 3 },
]

const tierColors: Record<number, string> = {
  1: 'bg-primary text-primary-foreground',
  2: 'bg-green-500 text-white',
  3: 'bg-amber-500 text-white',
  4: 'bg-muted text-muted-foreground',
  5: 'bg-destructive text-destructive-foreground',
}

const tierLabels: Record<number, string> = {
  1: 'مشرف',
  2: 'موثق',
  3: 'عضو',
  4: 'زائر',
  5: 'مقيد',
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [_selectedPostId, setSelectedPostId] = useState<string | null>(null)

  const handleReject = (postId: string) => {
    setSelectedPostId(postId)
    setRejectModalOpen(true)
  }

  const confirmReject = () => {
    // Handle rejection logic
    setRejectModalOpen(false)
    setRejectReason('')
    setSelectedPostId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:end-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-s border-border bg-card">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground">بيتكو</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Tab Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-bold text-primary">لوحة التحكم</h1>
        </div>
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:me-64 p-4 lg:p-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="bg-card rounded-xl p-4 shadow-sm border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          stat.trend === 'up' ? 'text-green-600' : 'text-destructive'
                        )}
                      >
                        {stat.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <p className="font-mono text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Pending */}
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">بانتظار الموافقة</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('moderation')}>
                    عرض الكل
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {pendingPosts.slice(0, 2).map((post) => (
                    <div key={post.id} className="p-4 flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{post.author.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{post.preview}</p>
                        <p className="text-xs text-muted-foreground mt-1">{post.submittedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">آخر البلاغات</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')}>
                    عرض الكل
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={report.reporter.avatar} />
                        <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{report.reporter.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{report.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                            {report.reason}
                          </span>
                          <span className="text-xs text-muted-foreground">{report.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">قائمة المراجعة</h2>
            <div className="bg-card rounded-xl shadow-sm border border-border divide-y divide-border">
              {pendingPosts.map((post) => (
                <div key={post.id} className="p-4 flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{post.author.name}</p>
                    <p className="text-muted-foreground mt-1">{post.preview}</p>
                    <p className="text-xs text-muted-foreground mt-2">{post.submittedAt}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    >
                      <Check className="w-4 h-4" />
                      موافقة
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => handleReject(post.id)}
                    >
                      <X className="w-4 h-4" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">إدارة المستخدمين</h2>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="بحث..."
                  className="h-9 ps-9 pe-4 rounded-lg bg-surface border border-border focus:border-primary outline-none text-sm"
                />
              </div>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface border-b border-border">
                    <tr>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">المستخدم</th>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">المستوى</th>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">المنشورات</th>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">تاريخ الانضمام</th>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="text-start px-4 py-3 text-sm font-medium text-muted-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {allUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium", tierColors[user.tier])}>
                            {tierLabels[user.tier]}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{user.postsCount}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{user.joinedAt}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              user.status === 'active'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-destructive/10 text-destructive'
                            )}
                          >
                            {user.status === 'active' ? 'نشط' : 'موقوف'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 me-2" />
                                عرض الملف
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserCog className="w-4 h-4 me-2" />
                                تغيير المستوى
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-amber-600">
                                <Ban className="w-4 h-4 me-2" />
                                إيقاف
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 me-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">البلاغات</h2>
            <div className="bg-card rounded-xl shadow-sm border border-border divide-y divide-border">
              {reports.map((report) => (
                <div key={report.id} className="p-4 flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={report.reporter.avatar} />
                    <AvatarFallback>{report.reporter.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{report.reporter.name}</p>
                      <span className="text-xs text-muted-foreground">أبلغ عن محتوى</span>
                    </div>
                    <p className="text-muted-foreground mt-1">{report.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                        {report.reason}
                      </span>
                      <span className="text-xs text-muted-foreground">{report.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="destructive">
                      حذف المحتوى
                    </Button>
                    <Button size="sm" variant="outline">
                      تجاهل البلاغ
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-4">سبب الرفض</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب رفض المنشور..."
              className="w-full h-32 p-3 rounded-lg bg-surface border border-border focus:border-primary outline-none resize-none text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
              >
                تأكيد الرفض
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRejectModalOpen(false)
                  setRejectReason('')
                }}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
