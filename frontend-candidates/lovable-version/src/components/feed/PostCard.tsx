import { Heart, MessageCircle, Share2, Bookmark, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Post } from "@/data/mockData";
import { formatPrice } from "@/data/mockData";

interface PostCardProps {
  post: Post;
}

function AuthorRow({ author, timestamp }: { author: Post["author"]; timestamp: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <img
        src={author.avatar}
        alt={author.name}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-body text-foreground truncate">{author.name}</span>
          {author.verified && <BadgeCheck className="w-4 h-4 text-success shrink-0" />}
        </div>
        <span className="text-micro text-muted-foreground">{timestamp}</span>
      </div>
    </div>
  );
}

function ActionBar({
  likes,
  comments,
  shares,
  liked: initialLiked,
  saved: initialSaved,
}: {
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [saved, setSaved] = useState(initialSaved);

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setLiked(!liked);
            setLikeCount((c) => (liked ? c - 1 : c + 1));
          }}
          className="flex items-center gap-1.5 touch-target text-caption transition-colors"
        >
          <Heart
            className={cn("w-5 h-5", liked ? "fill-destructive text-destructive" : "text-muted-foreground")}
          />
          <span className={cn(liked ? "text-destructive" : "text-muted-foreground")}>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 touch-target text-caption text-muted-foreground">
          <MessageCircle className="w-5 h-5" />
          <span>{comments}</span>
        </button>
        <button className="flex items-center gap-1.5 touch-target text-caption text-muted-foreground">
          <Share2 className="w-5 h-5" />
          <span>{shares}</span>
        </button>
      </div>
      <button
        onClick={() => setSaved(!saved)}
        className="touch-target"
      >
        <Bookmark
          className={cn("w-5 h-5", saved ? "fill-primary text-primary" : "text-muted-foreground")}
        />
      </button>
    </div>
  );
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-card rounded-card shadow-card p-4">
      <AuthorRow author={post.author} timestamp={post.timestamp} />
      <p className="text-body text-foreground leading-relaxed whitespace-pre-line">{post.content}</p>

      {post.images && post.images.length > 0 && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img
            src={post.images[0]}
            alt=""
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
        </div>
      )}

      {post.listing && (
        <div className="mt-3 border border-border rounded-lg overflow-hidden">
          <img
            src={post.listing.images[0]}
            alt={post.listing.title}
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="p-3">
            <p className="font-mono text-h2 font-bold text-primary">
              {formatPrice(post.listing.price, post.listing.purpose)}
            </p>
            <p className="text-caption text-muted-foreground mt-1">📍 {post.listing.location}</p>
            <div className="flex items-center gap-3 mt-2 text-micro text-muted-foreground">
              <span>🛏️ {post.listing.bedrooms}</span>
              <span>🚿 {post.listing.bathrooms}</span>
              <span>📐 {post.listing.area} م²</span>
            </div>
          </div>
        </div>
      )}

      {post.isVideo && post.videoThumbnail && (
        <div className="mt-3 rounded-lg overflow-hidden relative">
          <img
            src={post.videoThumbnail}
            alt=""
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
            <div className="w-14 h-14 rounded-full bg-background/80 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-s-[16px] border-s-foreground ms-1" />
            </div>
          </div>
        </div>
      )}

      <ActionBar
        likes={post.likes}
        comments={post.comments}
        shares={post.shares}
        liked={post.liked}
        saved={post.saved}
      />
    </article>
  );
}
