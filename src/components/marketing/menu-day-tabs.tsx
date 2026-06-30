"use client";

import { useState, useCallback, memo } from "react";
import { FoodCard } from "@/components/ui/food-card";
import { weeklyMenu } from "@/data/menu";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";
import { Badge } from "@/components/ui/badge";

function MenuDayTabsComponent() {
  const [selectedDay, setSelectedDay] = useState(0);
  const { dispatch } = useCart();
  const { openCart } = useCartDrawer();
  const day = weeklyMenu[selectedDay];

  const handleAddToCart = useCallback((optionIndex: number) => {
    const option = optionIndex === 0 ? day.optionA : day.optionB;
    dispatch({
      type: "ADD_ITEM",
      payload: {
        menuOptionId: `${day.day}-${optionIndex === 0 ? "A" : "B"}`,
        day: day.day,
        name: option.name,
        items: option.items,
        price: option.price || 350,
        quantity: 1,
        imageSrc: option.imageSrc,
      },
    });
    // Open cart drawer after adding item
    openCart();
  }, [day, dispatch, openCart]);

  return (
    <div className="w-full">
      {/* Day Tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 md:gap-3 md:overflow-visible">
        {weeklyMenu.map((menu, index) => (
          <button
            key={menu.day}
            onClick={() => setSelectedDay(index)}
            className={`flex-shrink-0 px-4 py-3 rounded-full font-semibold transition text-sm md:text-base ${
              selectedDay === index
                ? "bg-primary text-white"
                : "border border-border bg-white/50 text-foreground hover:bg-white/80"
            }`}
          >
            <div>{menu.day}</div>
            {menu.isAddon && (
              <div className="text-xs mt-1 opacity-75">Add-on</div>
            )}
          </button>
        ))}
      </div>

      {/* Food Options */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Option A */}
        <FoodCard
          name={day.optionA.name}
          items={day.optionA.items}
          tags={day.optionA.tags}
          price={day.optionA.price || 350}
          imageSrc={day.optionA.imageSrc}
          onSelect={() => handleAddToCart(0)}
          selectLabel="Add to Cart"
        />

        {/* Option B */}
        <FoodCard
          name={day.optionB.name}
          items={day.optionB.items}
          tags={day.optionB.tags}
          price={day.optionB.price || 350}
          imageSrc={day.optionB.imageSrc}
          onSelect={() => handleAddToCart(1)}
          selectLabel="Add to Cart"
        />
      </div>
    </div>
  );
}

export const MenuDayTabs = memo(MenuDayTabsComponent);
