import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Lazy image in a fixed-ratio box, so layout never jumps. Missing or broken
 * images show `fallback` (or a quiet placeholder) instead.
 */
export const Img = ({ src, alt = "", ratio, className, imgClassName, fallback, eager = false, ...props }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)} style={ratio ? { aspectRatio: ratio } : undefined}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn("size-full object-cover", imgClassName)}
          {...props}
        />
      ) : (
        (fallback ?? (
          <div className="flex size-full items-center justify-center text-muted-foreground/60" aria-hidden>
            <ImageOff className="size-6" />
          </div>
        ))
      )}
    </div>
  );
};
