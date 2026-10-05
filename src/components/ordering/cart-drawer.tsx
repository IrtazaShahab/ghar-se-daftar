"use client";

import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrencyPKR } from "@/lib/utils";
import { generateCartInquiryMessage } from "@/lib/order";
import { FREE_DELIVERY_MESSAGE, amountToFreeDelivery, calculateOrderTotals } from "@/lib/orders/pricing";
import { FoodImage } from "@/components/ui/food-image";
import Link from "next/link";
import { useEffect } from "react";

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, dispatch } = useCart();

  // Estimate only; checkout shows the server-calculated total from menu prices.
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { deliveryFee, total } = calculateOrderTotals(subtotal);
  const toFreeDelivery = amountToFreeDelivery(subtotal);

  const handleRemoveItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity > 0) {
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
    } else {
      handleRemoveItem(id);
    }
  };

  const isEmpty = state.items.length === 0;

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  return (
    <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            aria-hidden="true"
            className={`fixed inset-0 z-40 bg-foreground/20 transition-opacity duration-200 motion-reduce:transition-none ${
              isOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          />

          {/* Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            aria-hidden={!isOpen}
            className={`fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto bg-background md:max-w-md lg:right-4 lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-96 lg:rounded-[28px] lg:border lg:border-border lg:shadow-xl transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
              isOpen ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0"
            }`}
          >
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background/95 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <ShoppingBag className="size-5 text-primary" />
                <h2 className="font-serif text-xl font-semibold">Your Cart</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-card transition"
                aria-label="Close cart"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col h-full">
              {isEmpty ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-16 px-6 flex-1">
                  <div className="mb-4 rounded-full bg-primary/10 p-4">
                    <ShoppingBag className="size-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-center">Your cart is empty</h3>
                  <p className="mt-2 text-center text-muted max-w-xs">
                    Looks like you haven&rsquo;t added anything yet.
                  </p>
                  <Link href="/menu" onClick={onClose} className="focus-ring mt-6 inline-flex h-[52px] items-center justify-center rounded-full bg-primary px-6 text-sm font-extrabold text-white shadow-lg shadow-primary/15 hover:bg-[#183f28]">Explore Meals</Link>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                    {state.items.map((item) => (
                      <div
                        key={item.id}
                        className="glass-card rounded-[20px] p-4 flex gap-4"
                      >
                        {/* Image */}
                        <div className="relative w-16 h-16 rounded-[16px] overflow-hidden flex-shrink-0">
                          <FoodImage src={item.imageSrc} alt={item.name} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-muted">{item.day}</p>
                          <p className="text-xs text-muted mt-1">{item.items}</p>
                          <div className="mt-2 font-semibold text-primary">
                            {formatCurrencyPKR(item.price).replace("PKR", "Rs.")}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 bg-card rounded-full p-1">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="rounded-full p-1 hover:bg-border transition"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="rounded-full p-1 hover:bg-border transition"
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded-full p-2 hover:bg-danger/10 transition text-danger"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-border px-6 py-6 space-y-3 bg-white/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Subtotal</span>
                      <span className="font-semibold">{formatCurrencyPKR(subtotal).replace("PKR", "Rs.")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Delivery</span>
                      <span className="font-semibold">{deliveryFee === 0 ? "FREE" : formatCurrencyPKR(deliveryFee).replace("PKR", "Rs.")}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold">Estimated total</span>
                      <span className="font-serif text-lg font-semibold text-primary">
                        {formatCurrencyPKR(total).replace("PKR", "Rs.")}
                      </span>
                    </div>
                    <p className="rounded-2xl bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
                      {toFreeDelivery > 0
                        ? `${FREE_DELIVERY_MESSAGE} Add Rs. ${toFreeDelivery} more to qualify.`
                        : "You've unlocked free delivery."}
                    </p>
                  </div>

                  {/* Checkout Buttons */}
                  <div className="border-t border-border px-6 py-4 space-y-3">
                    <Link href="/checkout" onClick={onClose} className="w-full block">
                      <Button className="w-full" variant="primary">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    <WhatsAppButton
                      variant="inline"
                      message={generateCartInquiryMessage(state.items, subtotal, total)}
                      className="w-full"
                    />
                    <p className="text-center text-xs text-muted">
                      Want a regular plan? <Link href="/subscribe" onClick={onClose} className="font-bold text-primary hover:underline">Weekly &amp; monthly plans</Link>
                      {" · "}
                      <Link href="/corporate-order" onClick={onClose} className="font-bold text-primary hover:underline">Corporate lunch</Link>
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
    </>
  );
}
