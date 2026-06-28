import { Badge } from "./badge";
import { Button } from "./button";
import { formatCurrencyPKR } from "@/lib/utils";
import { FoodImage } from "./food-image";

export interface FoodCardProps {
  name: string;
  items: string;
  tags: string[];
  price?: number;
  imageSrc?: string;
  onSelect?: () => void;
  selectLabel?: string;
}

export function FoodCard({
  name,
  items,
  tags,
  price,
  imageSrc,
  onSelect,
  selectLabel = "Add to Cart"
}: FoodCardProps) {
  return (
    <div className="glass-card rounded-[28px] overflow-hidden transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative w-full aspect-square bg-[linear-gradient(135deg,#fffaf2,#f2e4d0)] overflow-hidden">
        <FoodImage src={imageSrc} alt={name} />
      </div>

      {/* Content Container */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-serif text-2xl font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted">{items}</p>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        {/* Price and Button */}
        <div className="mt-auto pt-6 flex items-center justify-between gap-3">
          {price ? (
            <span className="font-serif text-2xl font-semibold text-primary">
              {formatCurrencyPKR(price).replace("PKR", "Rs.")}
            </span>
          ) : null}
          {onSelect ? (
            <Button
              onClick={onSelect}
              variant="primary"
              className="text-xs px-4 h-10"
            >
              {selectLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
