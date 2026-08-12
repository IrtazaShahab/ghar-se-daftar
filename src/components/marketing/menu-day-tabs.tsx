"use client";

import { useState, useCallback, memo, useRef, type KeyboardEvent } from "react";
import { FoodCard } from "@/components/ui/food-card";
import { weeklyMenu } from "@/data/menu";
import { useCart } from "@/store/cart";
import { useCartDrawer } from "@/components/providers/root-providers";

function MenuDayTabsComponent() {
  const [selectedDay, setSelectedDay] = useState(0);
  const { dispatch } = useCart();
  const { openCart } = useCartDrawer();
  const day = weeklyMenu[selectedDay];
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectDay = useCallback((index: number) => {
    setSelectedDay(index);
    tabRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, []);

  const handleTabKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % weeklyMenu.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + weeklyMenu.length) % weeklyMenu.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = weeklyMenu.length - 1;
    else return;

    event.preventDefault();
    selectDay(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }, [selectDay]);

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
      <div className="menu-tabs-scroll mb-8 overflow-x-auto pb-1 md:mb-10">
        <div
          role="tablist"
          aria-label="Choose a menu day"
          className="flex min-w-max items-center gap-2 rounded-[28px] border border-border/80 bg-white/55 p-2 shadow-[0_12px_30px_rgba(42,37,27,0.06)] backdrop-blur-sm md:w-full md:justify-between md:gap-3"
        >
          {weeklyMenu.map((menu, index) => {
            const isSelected = selectedDay === index;

            return (
              <button
                ref={(element) => { tabRefs.current[index] = element; }}
                key={menu.day}
                id={`menu-tab-${index}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls={`menu-panel-${index}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectDay(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`menu-tab-button relative flex min-h-12 flex-none items-center justify-center rounded-full px-4 py-3 text-center text-sm font-extrabold leading-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:text-base ${
                  isSelected
                    ? "is-active bg-primary text-white shadow-lg shadow-primary/15"
                    : "text-primary/70 hover:bg-white/80 hover:text-primary"
                }`}
              >
                <span>{menu.day}</span>
                {menu.isAddon ? (
                  <span className="ml-1.5 rounded-full bg-current/10 px-1.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] opacity-75 md:text-[10px]">
                    Add-on
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Food Options */}
      <div
        key={selectedDay}
        id={`menu-panel-${selectedDay}`}
        role="tabpanel"
        aria-labelledby={`menu-tab-${selectedDay}`}
        className="menu-panel-enter grid gap-5 md:grid-cols-2"
      >
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
