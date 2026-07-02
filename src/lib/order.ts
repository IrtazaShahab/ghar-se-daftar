import { CartItem } from "@/store/cart";
import { formatCurrencyPKR } from "@/lib/utils";

export interface CheckoutFormData {
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  company: string;
  area: string;
  address: string;
  deliveryTime: string;
  instructions?: string;
  plan: string;
}

export interface OrderSummary {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  plan: string;
  customer: CheckoutFormData;
}

const planLabel: Record<string, string> = {
  single: "Single Meals",
  weekly: "Weekly Office Plan (Mon-Fri)",
  monthly: "Monthly Subscription",
  corporate: "Corporate Request"
};

function formatPKR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function compactLines(lines: Array<string | false | null | undefined>): string {
  return lines.filter((line): line is string => line !== false && line !== null && line !== undefined).join("\n");
}

function formatOrderItems(cartItems: CartItem[]): string {
  if (cartItems.length === 0) return "Menu selection pending";

  return cartItems
    .map((item, index) => {
      const lineTotal = item.price * item.quantity;
      return `${index + 1}. ${item.name} (${item.day}) x${item.quantity} - ${formatPKR(lineTotal)}`;
    })
    .join("\n");
}

/**
 * Calculate cart subtotal from items
 */
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculate delivery fee based on area
 * TODO: Connect to actual delivery zone prices
 */
export function getDeliveryFee(area: string, plan: string): number {
  // For now, free delivery for weekly and monthly plans
  if (plan === "weekly" || plan === "monthly") return 0;
  return 0; // Free delivery for now
}

/**
 * Calculate total amount
 */
export function getTotal(subtotal: number, deliveryFee: number, plan: string): number {
  const planPrices: Record<string, number> = {
    single: subtotal,
    weekly: 1750,
    monthly: 6500,
    corporate: 0
  };
  return planPrices[plan] || subtotal;
}

/**
 * Validate Pakistani phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation: starts with 0 or +92, 10-15 digits
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Generate WhatsApp order message
 */
export function generateWhatsAppOrderMessage(
  cartItems: CartItem[],
  customer: CheckoutFormData,
  subtotal: number,
  deliveryFee: number,
  total: number
): string {
  return compactLines([
    "🍽️ *Ghar Se Daftar Order Request*",
    "",
    `Hi, my name is *${customer.fullName || "Customer"}*. I would like to confirm my office lunch order.`,
    "",
    "🧾 *Order Details*",
    `*Plan:* ${planLabel[customer.plan] ?? customer.plan}`,
    `*Meals:*\n${formatOrderItems(cartItems)}`,
    "",
    "👤 *Customer Details*",
    `*Phone:* ${customer.phone || "Not provided"}`,
    customer.whatsappNumber ? `*WhatsApp:* ${customer.whatsappNumber}` : null,
    customer.company ? `*Office:* ${customer.company}` : null,
    customer.area ? `*Area:* ${customer.area}` : null,
    customer.address ? `*Address:* ${customer.address}` : null,
    customer.deliveryTime ? `*Delivery Time:* ${customer.deliveryTime}` : null,
    customer.instructions ? `*Instructions:* ${customer.instructions}` : null,
    "",
    "💰 *Payment Summary*",
    `*Subtotal:* ${formatPKR(subtotal)}`,
    deliveryFee > 0 ? `*Delivery:* ${formatPKR(deliveryFee)}` : "*Delivery:* Free",
    `*Total:* ${formatPKR(total)}`,
    "",
    "👩‍🍳 Please confirm chef/kitchen availability and the next delivery step.",
    "",
    "Thank you for choosing *Ghar Se Daftar* 💚"
  ]);
}

export function generateCartInquiryMessage(
  cartItems: CartItem[],
  plan: string,
  subtotal: number,
  total: number
): string {
  return compactLines([
    "🍱 *Ghar Se Daftar Lunch Inquiry*",
    "",
    "Hi, I selected these meals and would like to continue my order.",
    "",
    `*Plan:* ${planLabel[plan] ?? plan}`,
    `*Meals:*\n${formatOrderItems(cartItems)}`,
    `*Estimated Total:* ${formatPKR(total || subtotal)}`,
    "",
    "Please share the next step for delivery details and confirmation.",
    "",
    "*Ghar Ka Khana, Ab Daftar Tak* 💚"
  ]);
}

export function generateSubscriptionInquiryMessage(): string {
  return compactLines([
    "🍽️ *Ghar Se Daftar Subscription Inquiry*",
    "",
    "Hi, I’m interested in a homemade office lunch plan.",
    "",
    "Please share:",
    "• This week’s menu",
    "• Delivery availability for my office area",
    "• Weekly/monthly plan details",
    "",
    "I’d like to start with fresh ghar ka khana at work. Thank you 💚"
  ]);
}

export function generateOrderConfirmationMessage(orderId: string): string {
  return compactLines([
    "✅ *Ghar Se Daftar Order Follow-up*",
    "",
    "Hi, I just placed an order on Ghar Se Daftar.",
    "",
    `*Order Reference:* ${orderId}`,
    "*Status:* Submitted successfully",
    "",
    "Please confirm availability, chef/kitchen assignment, and expected delivery update.",
    "",
    "Thank you 💚"
  ]);
}

/**
 * Generate corporate order message
 */
export function generateCorporateOrderMessage(
  companyName: string,
  contactPerson: string,
  phone: string,
  teamSize: number,
  area: string,
  notes?: string
): string {
  return compactLines([
    "🏢 *Ghar Se Daftar Corporate Lunch Request*",
    "",
    "Hi, we’re interested in homemade lunch plans for our team.",
    "",
    "👤 *Contact Details*",
    `*Company:* ${companyName}`,
    `*Contact Person:* ${contactPerson}`,
    `*Phone:* ${phone}`,
    `*Team Size:* ${teamSize} employees`,
    `*Delivery Area:* ${area}`,
    notes ? `*Notes:* ${notes}` : null,
    "",
    "Please share suitable packages, tasting options, and monthly billing details.",
    "",
    "Thank you from *Ghar Se Daftar* 💚"
  ]);
}

/**
 * Format order summary for display
 */
export function formatOrderSummary(order: OrderSummary): string {
  const items = order.items
    .map((item) => `• ${item.name} (${item.day}) x${item.quantity}`)
    .join("\n");

  return `Order Summary

Plan: ${order.plan}
Items:
${items}

Subtotal: Rs.${order.subtotal}
${order.deliveryFee > 0 ? `Delivery: Rs.${order.deliveryFee}` : "Delivery: FREE"}
Total: Rs.${order.total}

Customer: ${order.customer.fullName}
Address: ${order.customer.address}, ${order.customer.area}
Delivery Time: ${order.customer.deliveryTime}`;
}

/**
 * Format currency for Ghar Se Daftar
 */
export function formatPrice(amount: number): string {
  return `Rs.${amount.toLocaleString("en-PK")}`;
}
