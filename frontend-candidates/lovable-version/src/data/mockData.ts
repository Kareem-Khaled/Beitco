// Mock data for the Beitco app

export interface User {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  tier: 1 | 2 | 3 | 4 | 5;
  role: string;
  bio?: string;
  city: string;
  followers: number;
  following: number;
  postsCount: number;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images?: string[];
  listing?: Listing;
  isVideo?: boolean;
  videoThumbnail?: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  timestamp: string;
}

export interface Listing {
  id: string;
  title: string;
  images: string[];
  price: number;
  location: string;
  city: string;
  type: string;
  purpose: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  area: number;
  finishing?: string;
  floor?: number;
  furnished?: boolean;
  description?: string;
  agent: User;
  rating: number;
  reviewCount: number;
  responseTime: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
  replies?: Comment[];
  pinned?: boolean;
}

export interface ChatConversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: number;
  listing?: Listing;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "approval" | "listing_match" | "price_drop";
  content: string;
  timestamp: string;
  read: boolean;
  users: User[];
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "أحمد محمد",
    avatar: "https://i.pravatar.cc/120?img=11",
    verified: true,
    tier: 2,
    role: "وسيط",
    bio: "وسيط عقاري معتمد | خبرة ١٠ سنوات في القاهرة الجديدة",
    city: "القاهرة",
    followers: 2340,
    following: 180,
    postsCount: 156,
  },
  {
    id: "2",
    name: "سارة أحمد",
    avatar: "https://i.pravatar.cc/120?img=5",
    verified: true,
    tier: 2,
    role: "وسيط",
    bio: "متخصصة في عقارات الساحل الشمالي والعين السخنة",
    city: "الإسكندرية",
    followers: 1890,
    following: 220,
    postsCount: 98,
  },
  {
    id: "3",
    name: "محمد علي",
    avatar: "https://i.pravatar.cc/120?img=12",
    verified: false,
    tier: 3,
    role: "مشتري",
    bio: "باحث عن شقة في التجمع الخامس",
    city: "القاهرة",
    followers: 45,
    following: 120,
    postsCount: 12,
  },
  {
    id: "4",
    name: "فاطمة حسن",
    avatar: "https://i.pravatar.cc/120?img=9",
    verified: true,
    tier: 1,
    role: "مدير",
    bio: "مديرة بيتكو — نبني مجتمع عقاري أفضل",
    city: "القاهرة",
    followers: 5600,
    following: 50,
    postsCount: 320,
  },
];

export const mockPosts: Post[] = [
  {
    id: "1",
    author: mockUsers[0],
    content: "نصيحة مهمة لأي حد بيشتري شقة: اتأكد من صحة التراخيص قبل ما تدفع أي فلوس. كتير ناس بتقع في مشاكل قانونية بسبب عدم التحقق. 📋✅",
    images: [],
    likes: 234,
    comments: 45,
    shares: 89,
    liked: false,
    saved: false,
    timestamp: "منذ ٣ ساعات",
  },
  {
    id: "2",
    author: mockUsers[1],
    content: "شقة جديدة متاحة في مدينتي — تشطيب سوبر لوكس، إطلالة على الحديقة 🏡",
    listing: {
      id: "l1",
      title: "شقة ٣ غرف في مدينتي",
      images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop"],
      price: 2850000,
      location: "مدينتي، القاهرة الجديدة",
      city: "القاهرة",
      type: "شقة",
      purpose: "sale",
      bedrooms: 3,
      bathrooms: 2,
      area: 165,
      finishing: "سوبر لوكس",
      floor: 5,
      furnished: false,
      description: "شقة رائعة في مدينتي بإطلالة مميزة على الحديقة. تشطيب سوبر لوكس، ٣ غرف نوم و٢ حمام. الدور الخامس بمصعد. قريبة من جميع الخدمات.",
      agent: mockUsers[1],
      rating: 4.8,
      reviewCount: 127,
      responseTime: "خلال ساعة",
    },
    likes: 156,
    comments: 32,
    shares: 67,
    liked: true,
    saved: true,
    timestamp: "منذ ٥ ساعات",
  },
  {
    id: "3",
    author: mockUsers[3],
    content: "📢 تحديث مهم: أضفنا ميزة البحث المتقدم! دلوقتي تقدر تفلتر العقارات حسب المنطقة والسعر والمساحة. جربوها وقولولنا رأيكم 🚀",
    likes: 567,
    comments: 123,
    shares: 200,
    liked: false,
    saved: false,
    timestamp: "منذ يوم",
  },
  {
    id: "4",
    author: mockUsers[2],
    content: "حد عنده تجربة مع كمبوند ماونتن فيو في التجمع؟ محتاج آراء حقيقية من ناس ساكنة هناك 🤔",
    likes: 89,
    comments: 67,
    shares: 12,
    liked: false,
    saved: false,
    timestamp: "منذ ٦ ساعات",
  },
  {
    id: "5",
    author: mockUsers[0],
    content: "فيلا فاخرة للبيع في الشيخ زايد — حديقة خاصة ومسبح 🏊‍♂️",
    listing: {
      id: "l2",
      title: "فيلا فاخرة في الشيخ زايد",
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop"],
      price: 12500000,
      location: "الشيخ زايد، الجيزة",
      city: "الجيزة",
      type: "فيلا",
      purpose: "sale",
      bedrooms: 5,
      bathrooms: 4,
      area: 380,
      finishing: "سوبر لوكس",
      floor: 0,
      furnished: true,
      description: "فيلا فاخرة مستقلة في أرقى مناطق الشيخ زايد. حديقة خاصة كبيرة مع مسبح. ٥ غرف نوم ماستر. تشطيب فاخر بأعلى المواصفات.",
      agent: mockUsers[0],
      rating: 4.9,
      reviewCount: 89,
      responseTime: "خلال ٣٠ دقيقة",
    },
    likes: 312,
    comments: 78,
    shares: 145,
    liked: false,
    saved: false,
    timestamp: "منذ ٨ ساعات",
  },
];

export const mockListings: Listing[] = [
  {
    id: "l1",
    title: "شقة ٣ غرف في مدينتي",
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    ],
    price: 2850000,
    location: "مدينتي، القاهرة الجديدة",
    city: "القاهرة",
    type: "شقة",
    purpose: "sale",
    bedrooms: 3,
    bathrooms: 2,
    area: 165,
    finishing: "سوبر لوكس",
    floor: 5,
    furnished: false,
    description: "شقة رائعة في مدينتي بإطلالة مميزة على الحديقة.",
    agent: mockUsers[1],
    rating: 4.8,
    reviewCount: 127,
    responseTime: "خلال ساعة",
  },
  {
    id: "l2",
    title: "فيلا فاخرة في الشيخ زايد",
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop",
    ],
    price: 12500000,
    location: "الشيخ زايد، الجيزة",
    city: "الجيزة",
    type: "فيلا",
    purpose: "sale",
    bedrooms: 5,
    bathrooms: 4,
    area: 380,
    finishing: "سوبر لوكس",
    floor: 0,
    furnished: true,
    description: "فيلا فاخرة مستقلة في أرقى مناطق الشيخ زايد.",
    agent: mockUsers[0],
    rating: 4.9,
    reviewCount: 89,
    responseTime: "خلال ٣٠ دقيقة",
  },
  {
    id: "l3",
    title: "استوديو في العاصمة الإدارية",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    ],
    price: 950000,
    location: "العاصمة الإدارية الجديدة",
    city: "القاهرة",
    type: "استوديو",
    purpose: "sale",
    bedrooms: 1,
    bathrooms: 1,
    area: 55,
    finishing: "نصف تشطيب",
    floor: 8,
    furnished: false,
    description: "استوديو بإطلالة بانورامية في العاصمة الإدارية.",
    agent: mockUsers[1],
    rating: 4.5,
    reviewCount: 34,
    responseTime: "خلال ساعتين",
  },
  {
    id: "l4",
    title: "شقة إيجار في المعادي",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
    ],
    price: 15000,
    location: "المعادي، القاهرة",
    city: "القاهرة",
    type: "شقة",
    purpose: "rent",
    bedrooms: 2,
    bathrooms: 1,
    area: 120,
    finishing: "سوبر لوكس",
    floor: 3,
    furnished: true,
    description: "شقة مفروشة بالكامل في المعادي للإيجار الشهري.",
    agent: mockUsers[0],
    rating: 4.7,
    reviewCount: 56,
    responseTime: "خلال ساعة",
  },
];

export const mockComments: Comment[] = [
  {
    id: "c1",
    author: mockUsers[2],
    content: "كلام مهم جداً! أنا وقعت في المشكلة دي قبل كده. لازم الناس تاخد بالها.",
    timestamp: "منذ ساعة",
    likes: 23,
    liked: false,
    pinned: true,
    replies: [
      {
        id: "c1r1",
        author: mockUsers[0],
        content: "فعلاً، والأفضل تستعين بمحامي متخصص في العقارات.",
        timestamp: "منذ ٤٥ دقيقة",
        likes: 12,
        liked: false,
      },
    ],
  },
  {
    id: "c2",
    author: mockUsers[1],
    content: "شكراً على النصيحة يا أحمد! 🙏",
    timestamp: "منذ ساعتين",
    likes: 8,
    liked: true,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "like",
    content: "أحمد وسارة و٨ آخرين عملوا لايك على بوستك",
    timestamp: "منذ ١٠ دقائق",
    read: false,
    users: [mockUsers[0], mockUsers[1]],
  },
  {
    id: "n2",
    type: "comment",
    content: "محمد علّق على بوستك: \"كلام مهم جداً!\"",
    timestamp: "منذ ساعة",
    read: false,
    users: [mockUsers[2]],
  },
  {
    id: "n3",
    type: "follow",
    content: "فاطمة حسن بدأت متابعتك",
    timestamp: "منذ ٣ ساعات",
    read: true,
    users: [mockUsers[3]],
  },
  {
    id: "n4",
    type: "listing_match",
    content: "عقار جديد يطابق بحثك: شقة ٣ غرف في التجمع الخامس",
    timestamp: "منذ ٥ ساعات",
    read: true,
    users: [],
  },
];

export const mockConversations: ChatConversation[] = [
  {
    id: "ch1",
    user: mockUsers[1],
    lastMessage: "أيوه الشقة لسه متاحة، تحب تعمل معاينة؟",
    timestamp: "منذ ٥ دقائق",
    unread: 2,
    listing: mockListings[0],
  },
  {
    id: "ch2",
    user: mockUsers[0],
    lastMessage: "تمام، هبعتلك التفاصيل",
    timestamp: "منذ ساعة",
    unread: 0,
  },
  {
    id: "ch3",
    user: mockUsers[2],
    lastMessage: "شكراً جداً على المساعدة!",
    timestamp: "أمس",
    unread: 0,
  },
];

export function formatPrice(price: number, purpose?: "sale" | "rent"): string {
  const formatted = price.toLocaleString("ar-EG");
  if (purpose === "rent") {
    return `${formatted} ج.م/شهر`;
  }
  return `${formatted} ج.م`;
}
