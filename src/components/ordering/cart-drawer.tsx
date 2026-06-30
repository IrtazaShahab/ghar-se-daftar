"use client";

import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { formatCurrencyPKR } from "@/lib/utils";
import { FoodImage } from "@/components/ui/food-image";
import Link from "next/link";
import { useState } from "react";

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, dispatch } = useCart();
  const [selectedPlan, setSelectedPlan] = useState<string>("single");

  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 0; // TODO: Calculate based on area
  const total = subtotal + deliveryFee;

  const planPrices = {
    single: subtotal,
    weekly: 1750,
    monthly: 6500,
    corporate: 0
  };

  const selectedPlanLabel = {
    single: "Single Meals",
    weekly: "Weekly Office Plan",
    monthly: "Monthly Subscription",
    corporate: "Corporate Request"
  };

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

  const handleSelectPlan = (plan: string) => {
    setSelectedPlan(plan);
    dispatch({ type: "SET_PLAN", payload: plan as any });
  };

  const isEmpty = state.items.length === 0;

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={onClose}
            className={`fixed inset-0 z-40 bg-black/30 lg:hidden transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Drawer Container */}
          <div
            className={`fixed right-0 top-0 z-50 h-screen w-full overflow-y-auto bg-background md:max-w-md lg:fixed lg:right-4 lg:top-20 lg:h-auto lg:w-96 lg:rounded-[28px] lg:border lg:border-border lg:shadow-xl transition-transform duration-300 transform ${
              isOpen ? "translate-x-0" : "translate-x-full"
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
                  <h3 className="font-serif text-2xl font-semibold text-center">Cart is empty</h3>
                  <p className="mt-2 text-center text-muted max-w-xs">
                    Browse our weekly menu and add your favorite meals.
                  </p>
                  <Button onClick={onClose} variant="primary" className="mt-6">
                    Continue Shopping
                  </Button>
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

                  {/* Plan Selection */}
                  <div className="border-t border-border px-6 py-6">
                    <h3 className="text-sm font-semibold mb-3">Select Plan</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "single", label: "Single", hint: "Trial" },
                        { value: "weekly", label: "Weekly", hint: "Popular" },
                        { value: "monthly", label: "Monthly", hint: "Best value" },
                        { value: "corporate", label: "Corporate", hint: "Teams" }
                      ].map((plan) => (
                        <button
                          key={plan.value}
                          onClick={() => handleSelectPlan(plan.value)}
                          className={`rounded-[16px] p-3 text-xs font-semibold transition text-center ${
                            selectedPlan === plan.value
                              ? "bg-primary text-white"
                              : "bg-card border border-border hover:bg-white/80"
                          }`}
                        >
                          <div>{plan.label}</div>
                          <div className={selectedPlan === plan.value ? "text-white/75 text-xs mt-1" : "text-muted text-xs mt-1"}>
                            {plan.hint}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="border-t border-border px-6 py-6 space-y-3 bg-white/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Subtotal</span>
                      <span className="font-semibold">{formatCurrencyPKR(subtotal).replace("PKR", "Rs.")}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Delivery</span>
                        <span className="font-semibold">{formatCurrencyPKR(deliveryFee).replace("PKR", "Rs.")}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-serif text-lg font-semibold text-primary">
                        {formatCurrencyPKR(planPrices[selectedPlan as keyof typeof planPrices]).replace("PKR", "Rs.")}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Buttons */}
                  <div className="border-t border-border px-6 py-4 space-y-3">
                    <Link href={`/checkout?plan=${selectedPlan}`} className="w-full block">
                      <Button className="w-full" variant="primary">
                        Proceed to Checkout
                      </Button>
                    </Link>
                    <WhatsAppButton
                      variant="inline"
                      message={`Hi, I want to place an order from Ghar Se Daftar. Plan: ${selectedPlanLabel[selectedPlan as keyof typeof selectedPlanLabel]}. Please share the order form.`}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
