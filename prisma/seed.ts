import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { weeklyMenu } from "../src/data/menu";

// The seed runs outside Next.js, so load env files the same way the app does
// (.env.local, .env.development, .env, …). Variables already set in the
// environment (CI, Vercel) always win and are never overwritten.
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

const prisma = new PrismaClient();

/**
 * Idempotent seed: safe to run repeatedly. Menu rows use the stable ids from
 * src/data/menu.ts so carts built from the website map to real database prices.
 * Prices edited later in the database are kept (only name/items are refreshed).
 */
const MENU_WEEK_ID = "menu-week-standard";

async function seedMenu() {
  await prisma.menuWeek.upsert({
    where: { id: MENU_WEEK_ID },
    create: {
      id: MENU_WEEK_ID,
      title: "Standard Weekly Menu",
      startsOn: new Date("2026-01-05"),
      endsOn: new Date("2030-12-31"),
      isActive: true
    },
    update: { isActive: true }
  });

  for (const day of weeklyMenu) {
    const menuDayId = `menu-day-${day.day.toLowerCase()}`;
    await prisma.menuDay.upsert({
      where: { id: menuDayId },
      create: { id: menuDayId, menuWeekId: MENU_WEEK_ID, dayName: day.day, isAddon: Boolean(day.isAddon) },
      update: { dayName: day.day, isAddon: Boolean(day.isAddon) }
    });

    for (const option of [day.optionA, day.optionB]) {
      await prisma.menuOption.upsert({
        where: { id: option.id },
        create: {
          id: option.id,
          menuDayId,
          name: option.name,
          items: option.items,
          price: option.price ?? 350,
          isAvailable: true
        },
        update: { name: option.name, items: option.items }
      });
    }
  }

  console.log(`✓ Menu: ${weeklyMenu.length} days, ${weeklyMenu.length * 2} options`);
}

async function seedDeliveryZones() {
  const zones = await prisma.deliveryZone.createMany({
    skipDuplicates: true,
    data: ["Johar Town", "Gulberg", "DHA", "Model Town", "Lahore Cantonment"].map((area) => ({
      city: "Lahore",
      area,
      isActive: true,
      cutoffTime: "10:30"
    }))
  });

  console.log(`✓ Delivery zones: ${zones.count} added`);
}

async function main() {
  console.log("Seeding database...");
  await seedMenu();
  await seedDeliveryZones();
  console.log("\n✅ Seed complete. Chefs are created from /admin/chefs (linked to real accounts).");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
