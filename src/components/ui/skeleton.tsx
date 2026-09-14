import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-muted", className)}
      {...props}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-card/80 to-transparent [animation:shimmer-line_1.4s_linear_infinite]"
      />
    </div>
  );
}

export { Skeleton };
