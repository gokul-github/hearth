import { cn } from "@/lib/utils";

export function HearthMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 text-primary", className)}
      aria-hidden="true"
    >
      <path
        d="M6 14.5 16 6l10 8.5V26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14.5Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M5 15.2 16 5.5l11 9.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 26V16.5h12V26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 26v-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
