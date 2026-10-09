import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/**
 * Full-screen image viewer. `index` is the open image (null = closed);
 * arrow keys and the side buttons move through `images` ({ src, caption }).
 */
export const Lightbox = ({ images, index, onIndexChange, title = "Image" }) => {
  const open = index != null && images[index] != null;
  const image = open ? images[index] : null;
  const many = images.length > 1;
  const go = (step) => onIndexChange((index + step + images.length) % images.length);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className="fixed inset-0 z-[81] flex flex-col items-center justify-center p-4 outline-none transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 md:p-10"
          onKeyDown={(e) => {
            if (!many) return;
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <Dialog.Title className="sr-only">
            {title}
            {many && `, image ${index + 1} of ${images.length}`}
          </Dialog.Title>
          {image && (
            <figure className="flex max-h-full min-h-0 w-full max-w-6xl flex-col items-center">
              <img src={image.src} alt={image.caption || ""} className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain" />
              <figcaption className="mt-4 flex items-center gap-4 text-sm text-white/80">
                {many && <span className="font-mono text-xs text-white/60">{index + 1} / {images.length}</span>}
                {image.caption}
              </figcaption>
            </figure>
          )}
          <Dialog.Close aria-label="Close" className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
            <X className="size-5" />
          </Dialog.Close>
          {many && (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-6">
                <ChevronLeft className="size-5" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next image" className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-6">
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
