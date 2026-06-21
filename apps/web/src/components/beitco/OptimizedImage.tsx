import { useState } from "react";

// Image hosts whose URLs we can rewrite for responsive sizing.
const isUnsplash = (src: string) => /(?:^|\.)images\.unsplash\.com\//.test(src);

// Build an Unsplash URL at a given width (keeps crop/quality sane).
function unsplashAt(src: string, w: number): string {
  try {
    const u = new URL(src);
    u.searchParams.set("w", String(w));
    u.searchParams.set("q", "75");
    u.searchParams.set("auto", "format");
    u.searchParams.set("fit", "crop");
    return u.toString();
  } catch {
    return src;
  }
}

const WIDTHS = [400, 800, 1200, 1600];

/**
 * A drop-in <img> that serves responsive sizes from Unsplash (via `srcset`),
 * lazy-loads, async-decodes, and fades in once loaded to mask layout jank.
 * Non-Unsplash sources (data URLs, local assets) pass straight through.
 */
export function OptimizedImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  eager = false,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  width?: number;
  height?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const responsive = isUnsplash(src);

  return (
    <img
      src={responsive ? unsplashAt(src, 800) : src}
      srcSet={responsive ? WIDTHS.map((w) => `${unsplashAt(src, w)} ${w}w`).join(", ") : undefined}
      sizes={responsive ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
    />
  );
}
