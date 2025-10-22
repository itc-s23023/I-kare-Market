export interface Product {
  id: string
  title: string
  price: number
  description: string
  category: string
  condition: "new" | "like-new" | "good" | "fair"
  images: string[]
  sellerId: string
  sellerName: string
  sellerRating: number
  createdAt: string
  status: "available" | "reserved" | "sold"
}

export interface User {
  id: string
  name: string
  avatar: string
  rating: number
  reviewCount: number
  joinedDate: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
}

export interface Transaction {
  id: string
  productId: string
  buyerId: string
  sellerId: string
  status: "negotiating" | "agreed" | "completed"
  messages: Message[]
}

export interface AuctionProduct {
  id: string
  title: string
  startingPrice: number
  currentBid: number
  buyNowPrice?: number
  description: string
  category: string
  condition: "new" | "like-new" | "good" | "fair"
  images: string[]
  sellerId: string
  sellerName: string
  sellerRating: number
  createdAt: string
  endTime: string
  status: "active" | "ended" | "sold"
  bidCount: number
  highestBidder?: string
  highestBidderName?: string
  isTrading: boolean
}

export interface Bid {
  id: string
  auctionId: string
  bidderId: string
  bidderName: string
  amount: number
  timestamp: string
}

export interface PurchaseHistory {
  id: string
  productId: string
  productName: string
  price: number
  purchaseDate: string
  sellerId: string
  sellerName: string
  type: "product" | "auction"
}

export interface Notification {
  id: string
  type: "purchase" | "bid" | "message" | "sold"
  productId: string
  productName: string
  message: string
  timestamp: string
  read: boolean
}

export interface LikedItem {
  id: string
  itemId: string
  type: "product" | "auction"
  likedAt: string
}

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "微積分の教科書（第3版）",
    price: 2500,
    description: "昨年使用していた微積分の教科書です。書き込みは少なく、状態は良好です。",
    category: "教科書",
    condition: "good",
    images: ["/calculus-textbook.png"],
    sellerId: "user1",
    sellerName: "田中太郎",
    sellerRating: 4.8,
    createdAt: "2024-01-15",
    status: "available",
  },
  {
    id: "2",
    title: "MacBook Pro 13インチ ケース",
    price: 1200,
    description: "未使用に近い状態のMacBookケースです。色はグレー。",
    category: "電子機器",
    condition: "like-new",
    images: ["/macbook-pro-case-grey.jpg"],
    sellerId: "user2",
    sellerName: "佐藤花子",
    sellerRating: 5.0,
    createdAt: "2024-01-14",
    status: "available",
  },
  {
    id: "3",
    title: "ノートパソコンスタンド",
    price: 1800,
    description: "アルミ製のノートパソコンスタンド。角度調整可能です。",
    category: "電子機器",
    condition: "good",
    images: ["/aluminum-laptop-stand.jpg"],
    sellerId: "user3",
    sellerName: "鈴木一郎",
    sellerRating: 4.5,
    createdAt: "2024-01-13",
    status: "available",
  },
  {
    id: "4",
    title: "英語辞書（ジーニアス英和辞典）",
    price: 1500,
    description: "英語の授業で使用していた辞書です。カバー付き。",
    category: "教科書",
    condition: "good",
    images: ["/english-dictionary.png"],
    sellerId: "user1",
    sellerName: "田中太郎",
    sellerRating: 4.8,
    createdAt: "2024-01-12",
    status: "available",
  },
  {
    id: "5",
    title: "ワイヤレスマウス Logicool",
    price: 2000,
    description: "半年使用したワイヤレスマウス。動作良好です。",
    category: "電子機器",
    condition: "good",
    images: ["/logitech-wireless-mouse.jpg"],
    sellerId: "user4",
    sellerName: "山田美咲",
    sellerRating: 4.9,
    createdAt: "2024-01-11",
    status: "available",
  },
  {
    id: "6",
    title: "統計学入門（東京大学出版会）",
    price: 2800,
    description: "統計学の基礎を学ぶのに最適な教科書です。",
    category: "教科書",
    condition: "like-new",
    images: ["/statistics-textbook.jpg"],
    sellerId: "user2",
    sellerName: "佐藤花子",
    sellerRating: 5.0,
    createdAt: "2024-01-10",
    status: "available",
  },
]

export const mockUsers: User[] = [
  {
    id: "user1",
    name: "田中太郎",
    avatar: "/diverse-user-avatars.png",
    rating: 4.8,
    reviewCount: 23,
    joinedDate: "2023-03-15",
  },
  {
    id: "user2",
    name: "佐藤花子",
    avatar: "/diverse-user-avatars.png",
    rating: 5.0,
    reviewCount: 18,
    joinedDate: "2023-05-20",
  },
  {
    id: "user3",
    name: "鈴木一郎",
    avatar: "/diverse-user-avatars.png",
    rating: 4.5,
    reviewCount: 31,
    joinedDate: "2023-02-10",
  },
  {
    id: "user4",
    name: "山田美咲",
    avatar: "/diverse-user-avatars.png",
    rating: 4.9,
    reviewCount: 27,
    joinedDate: "2023-04-05",
  },
  {
    id: "user5",
    name: "高橋健太",
    avatar: "/diverse-user-avatars.png",
    rating: 4.9,
    reviewCount: 15,
    joinedDate: "2023-06-12",
  },
]

export const mockUser: User = {
  id: "current-user",
  name: "山田太郎",
  avatar: "/student-avatar.png",
  rating: 4.7,
  reviewCount: 12,
  joinedDate: "2023-04-01",
}

export const userTransactionCounts: Record<string, number> = {
  user1: 45,
  user2: 32,
  user3: 58,
  user4: 41,
  user5: 28,
}

export const mockAuctions: AuctionProduct[] = [
  {
    id: "a1",
    title: "iPad Air 第5世代 64GB",
    startingPrice: 30000,
    currentBid: 45000,
    buyNowPrice: 60000,
    description: "昨年購入したiPad Air。画面に傷なし、動作良好です。充電器とケース付き。",
    category: "電子機器",
    condition: "like-new",
    images: ["/ipad-air-space-grey.jpg"],
    sellerId: "user5",
    sellerName: "高橋健太",
    sellerRating: 4.9,
    createdAt: "2025-10-20",
    endTime: "2025-10-25T23:59:59",
    status: "active",
    bidCount: 8,
    highestBidder: "user6",
    highestBidderName: "伊藤さくら",
    isTrading: true,
  },
  {
    id: "a2",
    title: "プログラミング言語C++ 第4版",
    startingPrice: 2000,
    currentBid: 3200,
    buyNowPrice: 5000,
    description: "C++の定番教科書。書き込みなし、美品です。",
    category: "教科書",
    condition: "good",
    images: ["/cpp-programming-book.jpg"],
    sellerId: "user1",
    sellerName: "田中太郎",
    sellerRating: 4.8,
    createdAt: "2025-10-19",
    endTime: "2025-10-24T20:00:00",
    status: "active",
    bidCount: 5,
    highestBidder: "user7",
    highestBidderName: "中村優子",
    isTrading: false,
  },
  {
    id: "a3",
    title: "ノイズキャンセリングヘッドホン Sony WH-1000XM4",
    startingPrice: 15000,
    currentBid: 15000,
    buyNowPrice: 28000,
    description: "1年使用したSonyのノイズキャンセリングヘッドホン。音質良好、外箱付き。",
    category: "電子機器",
    condition: "good",
    images: ["/sony-headphones-black.jpg"],
    sellerId: "user3",
    sellerName: "鈴木一郎",
    sellerRating: 4.5,
    createdAt: "2025-10-18",
    endTime: "2025-10-26T18:00:00",
    status: "active",
    bidCount: 0,
    isTrading: true,
  },
  {
    id: "a4",
    title: "関数解析学の基礎（岩波書店）",
    startingPrice: 1500,
    currentBid: 1500,
    description: "数学科向けの関数解析の教科書。状態良好です。",
    category: "教科書",
    condition: "good",
    images: ["/functional-analysis-book.jpg"],
    sellerId: "user2",
    sellerName: "佐藤花子",
    sellerRating: 5.0,
    createdAt: "2025-10-17",
    endTime: "2025-10-23T22:00:00",
    status: "active",
    bidCount: 0,
    isTrading: true,
  },
  {
    id: "a5",
    title: "電子辞書 CASIO EX-word",
    startingPrice: 8000,
    currentBid: 12500,
    buyNowPrice: 18000,
    description: "英語学習に最適な電子辞書。バッテリー良好、ケース付き。",
    category: "電子機器",
    condition: "good",
    images: ["/casio-electronic-dictionary.jpg"],
    sellerId: "user4",
    sellerName: "山田美咲",
    sellerRating: 4.9,
    createdAt: "2025-10-16",
    endTime: "2025-10-27T20:00:00",
    status: "active",
    bidCount: 7,
    highestBidder: "user10",
    highestBidderName: "加藤翔太",
    isTrading: true,
  },
  {
    id: "a6",
    title: "Nintendo Switch 有機ELモデル",
    startingPrice: 25000,
    currentBid: 25000,
    buyNowPrice: 35000,
    description: "半年使用したSwitch。本体、ドック、コントローラー全て揃っています。",
    category: "電子機器",
    condition: "like-new",
    images: ["/nintendo-switch-oled.jpg"],
    sellerId: "user5",
    sellerName: "高橋健太",
    sellerRating: 4.9,
    createdAt: "2025-10-21",
    endTime: "2025-10-28T21:00:00",
    status: "active",
    bidCount: 0,
    isTrading: false,
  },
  {
    id: "a7",
    title: "線形代数学（東京大学出版会）",
    startingPrice: 1800,
    currentBid: 2400,
    description: "線形代数の教科書。マーカーでの線引きあり。",
    category: "教科書",
    condition: "good",
    images: ["/linear-algebra-textbook.jpg"],
    sellerId: "user1",
    sellerName: "田中太郎",
    sellerRating: 4.8,
    createdAt: "2025-10-20",
    endTime: "2025-10-25T19:00:00",
    status: "active",
    bidCount: 3,
    highestBidder: "user11",
    highestBidderName: "木村陽子",
    isTrading: true,
  },
  {
    id: "a8",
    title: "Bluetoothキーボード Logicool K380",
    startingPrice: 2000,
    currentBid: 2000,
    buyNowPrice: 4000,
    description: "コンパクトなBluetoothキーボード。3台まで接続可能。",
    category: "電子機器",
    condition: "good",
    images: ["/logitech-keyboard-k380.jpg"],
    sellerId: "user3",
    sellerName: "鈴木一郎",
    sellerRating: 4.5,
    createdAt: "2025-10-21",
    endTime: "2025-10-29T20:00:00",
    status: "active",
    bidCount: 0,
    isTrading: true,
  },
]

export const mockBids: Record<string, Bid[]> = {
  a1: [
    {
      id: "b1",
      auctionId: "a1",
      bidderId: "user6",
      bidderName: "伊藤さくら",
      amount: 45000,
      timestamp: "2025-10-22T14:30:00",
    },
    {
      id: "b2",
      auctionId: "a1",
      bidderId: "user7",
      bidderName: "中村優子",
      amount: 42000,
      timestamp: "2025-10-22T12:15:00",
    },
    {
      id: "b3",
      auctionId: "a1",
      bidderId: "user8",
      bidderName: "小林大輔",
      amount: 40000,
      timestamp: "2025-10-22T10:00:00",
    },
    {
      id: "b4",
      auctionId: "a1",
      bidderId: "user9",
      bidderName: "渡辺真理",
      amount: 38000,
      timestamp: "2025-10-22T08:20:00",
    },
    {
      id: "b5",
      auctionId: "a1",
      bidderId: "user10",
      bidderName: "加藤翔太",
      amount: 35000,
      timestamp: "2025-10-21T22:10:00",
    },
  ],
  a2: [
    {
      id: "b6",
      auctionId: "a2",
      bidderId: "user7",
      bidderName: "中村優子",
      amount: 3200,
      timestamp: "2025-10-21T16:45:00",
    },
    {
      id: "b7",
      auctionId: "a2",
      bidderId: "user9",
      bidderName: "渡辺真理",
      amount: 2800,
      timestamp: "2025-10-21T14:20:00",
    },
    {
      id: "b8",
      auctionId: "a2",
      bidderId: "user11",
      bidderName: "木村陽子",
      amount: 2500,
      timestamp: "2025-10-21T11:30:00",
    },
  ],
  a5: [
    {
      id: "b9",
      auctionId: "a5",
      bidderId: "user10",
      bidderName: "加藤翔太",
      amount: 12500,
      timestamp: "2025-10-22T13:00:00",
    },
    {
      id: "b10",
      auctionId: "a5",
      bidderId: "user6",
      bidderName: "伊藤さくら",
      amount: 11000,
      timestamp: "2025-10-22T09:45:00",
    },
    {
      id: "b11",
      auctionId: "a5",
      bidderId: "user8",
      bidderName: "小林大輔",
      amount: 10000,
      timestamp: "2025-10-21T20:30:00",
    },
  ],
  a7: [
    {
      id: "b12",
      auctionId: "a7",
      bidderId: "user11",
      bidderName: "木村陽子",
      amount: 2400,
      timestamp: "2025-10-22T11:20:00",
    },
    {
      id: "b13",
      auctionId: "a7",
      bidderId: "user9",
      bidderName: "渡辺真理",
      amount: 2100,
      timestamp: "2025-10-22T08:15:00",
    },
  ],
}

export const mockPurchaseHistory: PurchaseHistory[] = [
  {
    id: "ph1",
    productId: "2",
    productName: "MacBook Pro 13インチ ケース",
    price: 1200,
    purchaseDate: "2024-01-10",
    sellerId: "user2",
    sellerName: "佐藤花子",
    type: "product",
  },
  {
    id: "ph2",
    productId: "5",
    productName: "ワイヤレスマウス Logicool",
    price: 2000,
    purchaseDate: "2024-01-05",
    sellerId: "user4",
    sellerName: "山田美咲",
    type: "product",
  },
  {
    id: "ph3",
    productId: "a2",
    productName: "プログラミング言語C++ 第4版",
    price: 3200,
    purchaseDate: "2023-12-28",
    sellerId: "user1",
    sellerName: "田中太郎",
    type: "auction",
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "sold",
    productId: "1",
    productName: "微積分の教科書（第3版）",
    message: "商品「微積分の教科書（第3版）」が佐藤花子さんに購入されました。",
    timestamp: "2024-01-17T10:30:00",
    read: false,
  },
  {
    id: "n2",
    type: "bid",
    productId: "a1",
    productName: "iPad Air 第5世代 64GB",
    message: "オークション「iPad Air 第5世代 64GB」に新しい入札がありました。",
    timestamp: "2024-01-17T09:15:00",
    read: false,
  },
  {
    id: "n3",
    type: "message",
    productId: "3",
    productName: "ノートパソコンスタンド",
    message: "商品「ノートパソコンスタンド」に新しいメッセージが届きました。",
    timestamp: "2024-01-16T18:45:00",
    read: true,
  },
  {
    id: "n4",
    type: "sold",
    productId: "4",
    productName: "英語辞書（ジーニアス英和辞典）",
    message: "商品「英語辞書（ジーニアス英和辞典）」が鈴木一郎さんに購入されました。",
    timestamp: "2024-01-15T14:20:00",
    read: true,
  },
]

export const mockLikedItems: LikedItem[] = [
  {
    id: "l1",
    itemId: "2",
    type: "product",
    likedAt: "2024-01-15T10:00:00",
  },
  {
    id: "l2",
    itemId: "5",
    type: "product",
    likedAt: "2024-01-14T15:30:00",
  },
  {
    id: "l3",
    itemId: "a1",
    type: "auction",
    likedAt: "2024-01-16T12:20:00",
  },
  {
    id: "l4",
    itemId: "a5",
    type: "auction",
    likedAt: "2024-01-13T09:45:00",
  },
]

export const mockLikedProducts: string[] = mockLikedItems.map((item) => item.itemId)
