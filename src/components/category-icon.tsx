import {
  Brush,
  Circle,
  Dumbbell,
  Droplets,
  ChefHat,
  Shirt,
  UtensilsCrossed,
} from "lucide-react";
import type { CategoryId } from "@/lib/categories";
import { cn } from "@/lib/utils";

const ICONS: Record<CategoryId, typeof Dumbbell> = {
  gym: Dumbbell,
  care: Droplets,
  cleaning: Brush,
  cooking: ChefHat,
  laundry: Shirt,
  kitchen: UtensilsCrossed,
  other: Circle,
};

export function CategoryIcon({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Icon = ICONS[(category as CategoryId)] ?? Circle;
  return <Icon className={cn("size-4", className)} strokeWidth={1.75} />;
}
