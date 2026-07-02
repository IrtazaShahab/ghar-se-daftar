import { Badge } from "./badge";
import { Button } from "./button";
import { formatCurrencyPKR } from "@/lib/utils";
import { FoodImage } from "./food-image";
import { memo } from "react";
import { Plus, Star } from "lucide-react";

export interface FoodCardProps {
  name: string;
  items: string;
  tags: string[];
  price?: number;
  imageSrc?: string;
  onSelect?: () => void;
  selectLabel?: string;
}

function FoodCardComponent({
  name,
  items,
  tags,
  price,
  imageSrc,
  onSelect,
  selectLabel = "Add to Cart"
}: FoodCardProps) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-border bg-card shadow-lg shadow-primary/5 premium-lift">
      {/* Image Container */}
      <div className="relative h-56 w-full overflow-hidden bg-[linear-gradient(135deg,#fffaf1,#efe1cb)] sm:h-60">
        <FoodImage
          src={imageSrc}
          alt={`${name} homemade lunch`}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-primary shadow-lg">
          <Star className="size-3.5 fill-current text-accent" />
          Fresh today
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-grow flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-extrabold tracking-[-0.025em] text-foreground">{name}</h3>
            <p className="mt-1 text-sm font-medium text-muted">{items}</p>
          </div>
          {price ? (
            <span className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-sm font-extrabold text-white">
              {formatCurrencyPKR(price).replace("PKR", "Rs.")}
            </span>
          ) : null}
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        {/* Price and Button */}
        <div className="mt-auto flex items-center justify-end gap-3 pt-6">
          {onSelect ? (
            <Button
              onClick={onSelect}
              variant="primary"
              className="h-11 gap-2 px-5 text-xs"
            >
              <Plus className="size-4" />
              {selectLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const FoodCard = memo(FoodCardComponent);
