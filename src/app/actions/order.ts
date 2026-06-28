"use server";

import { CartItem } from "@/store/cart";
import { CheckoutFormData } from "@/lib/order";

interface OrderPayload {
  customer: CheckoutFormData;
  items: CartItem[];
  plan: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Submit order from checkout
 *
 * TODO: When Prisma is fully connected:
 * - Create Order in database with status PENDING_CONFIRMATION
 * - Create OrderItems for each cart item
 * - Create Payment record with status PENDING
 * - Send order confirmation via WhatsApp/email
 * - Log to AuditLog
 *
 * For now: Generate order reference and return success
 */
export async function submitOrder(payload: OrderPayload) {
  try {
    // Validate input
    if (!payload.customer || !payload.items || payload.items.length === 0) {
      return {
        success: false,
        error: "Invalid order data"
      };
    }

    // Generate order reference
    const orderId = `GSD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // TODO: Save to database
    // const order = await prisma.order.create({
    //   data: {
    //     status: "PENDING_CONFIRMATION",
    //     deliveryDate: new Date(),
    //     totalAmount: payload.total,
    //     items: {
    //       create: payload.items.map(item => ({
    //         menuOptionId: item.menuOptionId,
    //         quantity: item.quantity,
    //         unitPrice: item.price
    //       }))
    //     }
    //   }
    // });

    // TODO: Send WhatsApp notification to business number
    // await sendWhatsAppNotification(orderId, payload);

    // TODO: Log to AuditLog
    // await prisma.auditLog.create({
    //   data: {
    //     action: "ORDER_CREATED",
    //     entity: "Order",
    //     entityId: orderId,
    //     metadata: { customer: payload.customer.email }
    //   }
    // });

    return {
      success: true,
      orderId: orderId,
      message: "Order submitted successfully. Our team will contact you on WhatsApp within 30 minutes."
    };
  } catch (error) {
    console.error("Order submission error:", error);
    return {
      success: false,
      error: "Failed to submit order. Please try again or contact us on WhatsApp."
    };
  }
}

/**
 * Placeholder for WhatsApp Business API integration
 * TODO: Implement when ready
 */
async function sendWhatsAppNotification(orderId: string, payload: OrderPayload) {
  // const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  // const whatsappToken = process.env.WHATSAPP_API_TOKEN;
  // const businessPhoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID;

  // if (!whatsappApiUrl || !whatsappToken || !businessPhoneId) {
  //   console.warn("WhatsApp API credentials not configured");
  //   return;
  // }

  // try {
  //   await fetch(`${whatsappApiUrl}/messages`, {
  //     method: "POST",
  //     headers: {
  //       "Authorization": `Bearer ${whatsappToken}`,
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: payload.customer.whatsappNumber,
  //       type: "template",
  //       template: {
  //         name: "order_confirmation",
  //         language: { code: "en_US" }
  //       }
  //     })
  //   });
  // } catch (error) {
  //   console.error("Failed to send WhatsApp notification:", error);
  // }
}
