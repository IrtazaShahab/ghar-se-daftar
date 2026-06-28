import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create a menu week
  const menuWeek = await prisma.menuWeek.create({
    data: {
      title: "Launch Week Menu",
      startsOn: new Date("2026-06-23"),
      endsOn: new Date("2026-06-27"),
      isActive: true,
      days: {
        create: [
          {
            dayName: "Monday",
            options: {
              create: [
                { name: "Chicken Achari", items: "2 Roti + Salad", price: 350, isAvailable: true },
                { name: "Daal Chawal", items: "Kachumber Salad", price: 350, isAvailable: true }
              ]
            }
          },
          {
            dayName: "Tuesday",
            options: {
              create: [
                { name: "Daal Mash", items: "2 Roti + Mint Raita", price: 350, isAvailable: true },
                { name: "Kabab Pulao", items: "Mint Raita + Salad", price: 350, isAvailable: true }
              ]
            }
          },
          {
            dayName: "Wednesday",
            options: {
              create: [
                { name: "Seasonal Sabzi", items: "2 Roti + Salad", price: 350, isAvailable: true },
                { name: "Haleem", items: "Naan/Roti + Salad", price: 350, isAvailable: true }
              ]
            }
          },
          {
            dayName: "Thursday",
            options: {
              create: [
                { name: "Kadhi Chawal", items: "Fresh Salad", price: 350, isAvailable: true },
                { name: "Aloo Qeema", items: "2 Roti + Salad", price: 350, isAvailable: true }
              ]
            }
          },
          {
            dayName: "Friday",
            options: {
              create: [
                { name: "Chicken Biryani", items: "Mint Raita + Salad", price: 350, isAvailable: true },
                { name: "Chicken Pulao", items: "Raita + Salad", price: 350, isAvailable: true }
              ]
            }
          },
          {
            dayName: "Saturday",
            isAddon: true,
            options: {
              create: [
                { name: "Chicken White Karahi", items: "2 Roti + Salad", price: 350, isAvailable: true },
                { name: "Chana Pulao", items: "Raita + Salad", price: 350, isAvailable: true }
              ]
            }
          }
        ]
      }
    }
  });

  console.log(`✓ Created menu week: ${menuWeek.title}`);

  // Create home chefs
  const chefs = await prisma.homeChef.createMany({
    data: [
      {
        displayName: "Chef Shazia",
        area: "Johar Town",
        city: "Lahore",
        specialty: "Daal, Sabzi, Chicken Salan",
        verified: true
      },
      {
        displayName: "Chef Noreen",
        area: "Gulberg",
        city: "Lahore",
        specialty: "Biryani, Pulao, Raita",
        verified: true
      },
      {
        displayName: "Chef Farah",
        area: "DHA",
        city: "Lahore",
        specialty: "Healthy roti meals",
        verified: true
      }
    ]
  });

  console.log(`✓ Created ${chefs.count} home chefs`);

  // Create delivery zones
  const zones = await prisma.deliveryZone.createMany({
    skipDuplicates: true,
    data: [
      { city: "Lahore", area: "Johar Town", isActive: true, cutoffTime: "10:30" },
      { city: "Lahore", area: "Gulberg", isActive: true, cutoffTime: "10:30" },
      { city: "Lahore", area: "DHA", isActive: true, cutoffTime: "10:30" },
      { city: "Lahore", area: "Clifton", isActive: true, cutoffTime: "10:30" },
      { city: "Lahore", area: "Lahore Cantonment", isActive: true, cutoffTime: "10:30" }
    ]
  });

  console.log(`✓ Created ${zones.count} delivery zones`);

  console.log("\n✅ Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
