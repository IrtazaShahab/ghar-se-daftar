import { CartItem, CartState } from "@/store/cart";
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
  const planLabel: Record<string, string> = {
    single: "Single Meals",
    weekly: "Weekly Office Plan (Mon-Fri)",
    monthly: "Monthly Subscription",
    corporate: "Corporate Request"
  };

  const itemsList = cartItems
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.day}) — Qty: ${item.quantity} — Rs.${item.price * item.quantity}`
    )
    .join("\n");

  const message = `Salam! I want to place an order from Ghar Se Daftar.

*Customer Details:*
Name: ${customer.fullName}
Phone: ${customer.phone}
WhatsApp: ${customer.whatsappNumber}
Company/Office: ${customer.company}
Delivery Area: ${customer.area}
Address: ${customer.address}
Delivery Time: ${customer.deliveryTime}
${customer.instructions ? `Instructions: ${customer.instructions}` : ""}

*Order Details:*
Plan: ${planLabel[customer.plan]}

*Meals:*
${itemsList}

*Summary:*
Subtotal: Rs.${subtotal}
${deliveryFee > 0 ? `Delivery Fee: Rs.${deliveryFee}` : "Delivery: FREE"}
*Total: Rs.${total}*

Please confirm my order and delivery availability. Thank you!`;

  return message;
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
  const message = `Salam! I'm interested in Ghar Se Daftar's corporate lunch packages.

*Company Details:*
Company: ${companyName}
Contact Person: ${contactPerson}
Phone: ${phone}
Team Size: ${teamSize} employees
Delivery Area: ${area}
${notes ? `Requirements: ${notes}` : ""}

Please share available plans and pricing. Thank you!`;

  return message;
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
