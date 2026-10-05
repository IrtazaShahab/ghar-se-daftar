import { prisma } from "@/lib/db/prisma";
import type { CartLineInput } from "@/lib/validations/checkout";
import { calculateOrderTotals, type OrderTotals } from "./pricing";

export type PricedLine = {
  menuOptionId: string;
  name: string;
  details: string;
  day: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type PricedCart = {
  lines: PricedLine[];
  /** Cart ids that no longer exist or are switched off in the menu. */
  unavailableIds: string[];
  totals: OrderTotals;
};

/**
 * Prices a cart from the database. Only ids and quantities come from the
 * browser; names, days and prices are read from MenuOption.
 */
export async function priceCart(input: CartLineInput[]): Promise<PricedCart> {
  // Merge duplicate lines so a crafted payload can't bypass per-item limits.
  const quantities = new Map<string, number>();
  for (const line of input) {
    quantities.set(line.menuOptionId, (quantities.get(line.menuOptionId) ?? 0) + line.quantity);
  }

  const options = await prisma.menuOption.findMany({
    where: { id: { in: [...quantities.keys()] }, isAvailable: true },
    select: { id: true, name: true, items: true, price: true, menuDay: { select: { dayName: true } } }
  });
  const byId = new Map(options.map((option) => [option.id, option]));

  const lines: PricedLine[] = [];
  const unavailableIds: string[] = [];

  for (const [menuOptionId, quantity] of quantities) {
    const option = byId.get(menuOptionId);
    if (!option) {
      unavailableIds.push(menuOptionId);
      continue;
    }
    lines.push({
      menuOptionId,
      name: option.name,
      details: option.items,
      day: option.menuDay.dayName,
      quantity: Math.min(quantity, 50),
      unitPrice: option.price,
      lineTotal: option.price * Math.min(quantity, 50)
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  return { lines, unavailableIds, totals: calculateOrderTotals(subtotal) };
}
