import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";

// Property image gallery with fixed-size tiles + a full-screen lightbox
// that supports next/prev (buttons + keyboard) and a counter.
export function PropertyGallery({ images, alt = "" }: { images: string[]; alt?: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const has = images.length > 0;

  const open = (i: number) => setOpenAt(i);
  const close = useCallback(() => setOpenAt(null), []);
  const go = useCallback(
    (dir: 1 | -1) =>
      setOpenAt((cur) => {
        if (cur === null) return cur;
        return (cur + dir + images.length) % images.length;
      }),
    [images.length],
  );

  // Keyboard nav while the lightbox is open.
  useEffect(() => {
    if (openAt === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(1); // RTL: left = next
      else if (e.key === "ArrowRight") go(-1); // RTL: right = prev
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Remember what had focus so we can restore it on close (a11y).
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previouslyFocused?.focus?.();
    };
  }, [openAt, close, go]);

  if (!has) {
    return (
      <div className="mt-5 flex aspect-[16/9] items-center justify-center rounded-3xl border border-dashed border-border bg-surface text-sm text-muted-foreground">
        مفيش صور للمكان ده
      </div>
    );
  }

  const main = images[0];
  const thumbs = images.slice(1, 5);
  const extra = images.length - 5;
  const hasThumbs = thumbs.length > 0;

  return (
    <>
      {/* Fixed-height grid with explicit rows so every tile aligns perfectly and
          gaps stay uniform — no aspect-ratio mismatch between main & thumbs. */}
      <div className="mt-5 grid h-64 grid-cols-2 grid-rows-2 gap-2 overflow-hidden rounded-3xl sm:h-[26rem] sm:grid-cols-4">
        <button
          type="button"
          onClick={() => open(0)}
          className={`group relative row-span-2 overflow-hidden bg-muted ${
            hasThumbs ? "col-span-2" : "col-span-2 sm:col-span-4"
          }`}
        >
          <OptimizedImage
            src={main}
            alt={alt}
            eager
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </button>

        {thumbs.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(i + 1)}
            className="group relative hidden overflow-hidden bg-muted sm:block"
          >
            <OptimizedImage
              src={img}
              alt={alt}
              sizes="25vw"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            {/* "+N more" overlay on the last visible thumb */}
            {i === thumbs.length - 1 && extra > 0 && (
              <span className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 text-sm font-semibold text-white">
                <Images className="h-4 w-4" />+{extra.toLocaleString("ar-EG-u-nu-latn")}
              </span>
            )}
          </button>
        ))}
      </div>

      {openAt !== null && (
        <Lightbox
          images={images}
          index={openAt}
          alt={alt}
          onClose={close}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          onSelect={(i) => setOpenAt(i)}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  index,
  alt,
  onClose,
  onPrev,
  onNext,
  onSelect,
}: {
  images: string[];
  index: number;
  alt: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the dialog on open, and trap Tab within it (a11y).
  useEffect(() => {
    closeRef.current?.focus();
    const node = dialogRef.current;
    if (!node) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = node.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={dialogRef}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="معرض صور المكان"
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 text-white">
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">
          {(index + 1).toLocaleString("ar-EG-u-nu-latn")} / {images.length.toLocaleString("ar-EG-u-nu-latn")}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="إغلاق المعرض"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
        {/* Prev — on the right in RTL */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute start-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="الصورة السابقة"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        <span onClick={(e) => e.stopPropagation()} className="contents">
          <OptimizedImage
            src={images[index]}
            alt={alt}
            eager
            sizes="100vw"
            className="max-h-[80vh] max-w-full select-none rounded-lg object-contain"
          />
        </span>

        {/* Next — on the left in RTL */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute end-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="الصورة التالية"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-2 overflow-x-auto p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`صورة ${(i + 1).toLocaleString("ar-EG-u-nu-latn")}`}
              aria-current={i === index}
              className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                i === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
