/**
 * End-to-end delivery flow against a real PostgreSQL database built from
 * supabase/migrations. Runs only when TEST_DATABASE_URL is set, and refuses
 * anything that is not a local database, so it can never touch production:
 *
 *   TEST_DATABASE_URL=postgresql://postgres@localhost:<port>/<throwaway_db> npm test
 *
 * Build that database from zero first (Supabase role/auth stubs, a baseline of
 * the pre-order-platform schema, then every file in supabase/migrations).
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

const url = process.env.TEST_DATABASE_URL;
const isLocal = Boolean(url && /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url));
if (url && !isLocal) throw new Error("TEST_DATABASE_URL must point at a local database");
if (url) process.env.DATABASE_URL = url;

const skip = !isLocal ? "set TEST_DATABASE_URL to a local test database" : false;

describe("delivery flow", { skip }, () => {
  // Loaded lazily so DATABASE_URL is set first.
  let prisma: typeof import("../../src/lib/db/prisma").prisma;
  let ops: typeof import("../../src/lib/orders/operations");
  let delivery: typeof import("../../src/lib/delivery/operations");
  let queries: typeof import("../../src/lib/delivery/queries");

  const tag = `t${Date.now().toString(36)}`;
  const ids = {
    admin: `${tag}-admin`,
    customer: `${tag}-cust`,
    otherCustomer: `${tag}-cust2`,
    chefUser: `${tag}-chefu`,
    riderUser: `${tag}-rideru`,
    otherRiderUser: `${tag}-rideru2`,
    chef: `${tag}-chef`,
    kitchen: `${tag}-kitchen`,
    rider: `${tag}-rider`,
    otherRider: `${tag}-rider2`,
    order: `${tag}-order`,
    menuWeek: `${tag}-week`,
    menuDay: `${tag}-day`,
    menuOption: `${tag}-opt`
  };
  const admin = { userId: ids.admin, role: "ADMIN" as const };
  const chefActor = { userId: ids.chefUser, role: "HOME_CHEF" as const };
  const riderActor = { userId: ids.riderUser, role: "RIDER" as const };
  const otherRiderActor = { userId: ids.otherRiderUser, role: "RIDER" as const };
  const orderNumber = `GSD-${tag.toUpperCase().slice(-6)}`;

  before(async () => {
    ({ prisma } = await import("../../src/lib/db/prisma"));
    ops = await import("../../src/lib/orders/operations");
    delivery = await import("../../src/lib/delivery/operations");
    queries = await import("../../src/lib/delivery/queries");

    const user = (id: string, role: "ADMIN" | "CUSTOMER" | "HOME_CHEF" | "RIDER", name: string) =>
      prisma.user.create({ data: { id, email: `${id}@example.test`, fullName: name, role } });
    await user(ids.admin, "ADMIN", "Admin");
    await user(ids.customer, "CUSTOMER", "Ayesha Khan");
    await user(ids.otherCustomer, "CUSTOMER", "Bilal Ahmed");
    await user(ids.chefUser, "HOME_CHEF", "Chef Shazia");
    await user(ids.riderUser, "RIDER", "Ali Raza");
    await user(ids.otherRiderUser, "RIDER", "Usman Tariq");
    await prisma.homeChef.create({ data: { id: ids.chef, userId: ids.chefUser, displayName: "Chef Shazia", area: "Johar Town", city: "Lahore", specialty: "Daal" } });
    await prisma.kitchen.create({ data: { id: ids.kitchen, homeChefId: ids.chef, name: "Johar kitchen", area: "Johar Town", address: "House 12, Block J" } });
    await prisma.rider.create({ data: { id: ids.rider, userId: ids.riderUser, displayName: "Ali", phone: "03001112222" } });
    await prisma.rider.create({ data: { id: ids.otherRider, userId: ids.otherRiderUser, displayName: "Usman", phone: "03003334444" } });
    await prisma.menuWeek.create({ data: { id: ids.menuWeek, startsOn: new Date(), endsOn: new Date(), title: "Test" } });
    await prisma.menuDay.create({ data: { id: ids.menuDay, menuWeekId: ids.menuWeek, dayName: "Monday" } });
    await prisma.menuOption.create({ data: { id: ids.menuOption, menuDayId: ids.menuDay, name: "Daal Chawal", items: "Daal, rice", price: 400 } });
    await prisma.order.create({
      data: {
        id: ids.order,
        orderNumber,
        userId: ids.customer,
        customerName: "Ayesha Khan",
        customerEmail: "ayesha@example.test",
        customerPhone: "03009998888",
        deliveryAddress: "Office 4, Main Boulevard",
        deliveryArea: "Gulberg",
        deliveryLatitude: 31.5102,
        deliveryLongitude: 74.3441,
        deliveryDate: new Date(),
        deliverySlot: "12:00-13:00",
        subtotal: 400,
        deliveryFee: 100,
        totalAmount: 500,
        paymentMethod: "COD",
        items: { create: { menuOptionId: ids.menuOption, itemName: "Daal Chawal", quantity: 1, unitPrice: 400, lineTotal: 400 } },
        payments: { create: { provider: "cod", method: "COD", amount: 500, userId: ids.customer } }
      }
    });
  });

  after(async () => {
    if (!prisma) return;
    // Let detached audit/notification writes finish, then clean up.
    await new Promise((resolve) => setTimeout(resolve, 300));
    const users = [ids.admin, ids.customer, ids.otherCustomer, ids.chefUser, ids.riderUser, ids.otherRiderUser];
    await prisma.notification.deleteMany({ where: { OR: [{ orderId: ids.order }, { userId: { in: users } }] } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: users } } });
    await prisma.order.deleteMany({ where: { id: ids.order } });
    await prisma.menuWeek.deleteMany({ where: { id: ids.menuWeek } });
    await prisma.rider.deleteMany({ where: { id: { in: [ids.rider, ids.otherRider] } } });
    await prisma.homeChef.deleteMany({ where: { id: ids.chef } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await prisma.$disconnect();
  });

  it("runs admin → chef → rider → delivered, enforcing every rule", async () => {
    // Admin confirms and assigns the chef; chef accepts and prepares.
    assert.deepEqual(await ops.transitionOrder({ orderId: ids.order, to: "CONFIRMED", actor: admin }), { ok: true });
    assert.deepEqual(await ops.assignChef({ orderId: ids.order, homeChefId: ids.chef, kitchenId: ids.kitchen, actor: admin }), { ok: true });

    // A rider can be assigned before the meal is ready; customers see no rider details yet.
    assert.deepEqual(await delivery.assignRider({ orderId: ids.order, riderId: ids.rider, actor: admin }), { ok: true });
    let tracking = await queries.getCustomerTracking(orderNumber, ids.customer);
    assert.equal(tracking?.delivery?.riderName, null);
    assert.equal(tracking?.delivery?.riderPhone, null);

    // Only the assigned rider can accept.
    assert.equal((await delivery.acceptDelivery({ orderId: ids.order, riderId: ids.otherRider, actor: otherRiderActor })).ok, false);
    assert.deepEqual(await delivery.acceptDelivery({ orderId: ids.order, riderId: ids.rider, actor: riderActor }), { ok: true });

    // Rider sees pickup details but not the customer's phone before pickup; another rider sees nothing.
    let riderView = await queries.getRiderDelivery(ids.rider, ids.order);
    assert.equal(riderView?.customerPhone, null);
    assert.equal(riderView?.pickup?.address, "House 12, Block J");
    assert.equal(riderView?.codToCollect, 500);
    assert.equal(await queries.getRiderDelivery(ids.otherRider, ids.order), null);

    // Pickup is impossible until the kitchen marks it ready.
    const early = await ops.transitionOrder({ orderId: ids.order, to: "OUT_FOR_DELIVERY", actor: riderActor, riderId: ids.rider });
    assert.equal(early.ok, false);

    assert.deepEqual(await ops.acceptAssignment({ orderId: ids.order, chefId: ids.chef, actor: chefActor }), { ok: true });
    assert.deepEqual(await ops.transitionOrder({ orderId: ids.order, to: "PREPARING", actor: chefActor, chefId: ids.chef }), { ok: true });
    assert.deepEqual(await ops.transitionOrder({ orderId: ids.order, to: "READY", actor: chefActor, chefId: ids.chef }), { ok: true });

    // Another rider can't pick it up, and nobody can skip straight to delivered.
    assert.equal((await ops.transitionOrder({ orderId: ids.order, to: "OUT_FOR_DELIVERY", actor: otherRiderActor, riderId: ids.otherRider })).ok, false);
    assert.equal((await ops.transitionOrder({ orderId: ids.order, to: "DELIVERED", actor: riderActor, riderId: ids.rider })).ok, false);

    // Location before consent/pickup is refused and tells the app to stop.
    const tooSoon = await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.rider, latitude: 31.5, longitude: 74.33, accuracy: 10 });
    assert.deepEqual(tooSoon, { ok: false, error: "Location sharing has ended for this delivery.", stop: true });

    // Pickup → Out for delivery; reassigning is no longer possible.
    assert.deepEqual(await ops.transitionOrder({ orderId: ids.order, to: "OUT_FOR_DELIVERY", actor: riderActor, riderId: ids.rider }), { ok: true });
    assert.equal((await delivery.assignRider({ orderId: ids.order, riderId: ids.otherRider, actor: admin })).ok, false);

    // The customer now sees the rider, but no map until the rider shares a fresh location.
    tracking = await queries.getCustomerTracking(orderNumber, ids.customer);
    assert.equal(tracking?.delivery?.riderName, "Ali");
    assert.equal(tracking?.delivery?.riderPhone, "03001112222");
    assert.equal(tracking?.delivery?.live, null);
    riderView = await queries.getRiderDelivery(ids.rider, ids.order);
    assert.equal(riderView?.customerPhone, "03009998888", "phone appears once the rider is carrying the order");

    // Consent, then a point: the customer sees a live position and an ETA.
    assert.equal((await delivery.startLocationSharing({ orderId: ids.order, riderId: ids.otherRider, actor: otherRiderActor })).ok, false);
    assert.deepEqual(await delivery.startLocationSharing({ orderId: ids.order, riderId: ids.rider, actor: riderActor }), { ok: true });
    assert.deepEqual(await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.rider, latitude: 31.4697, longitude: 74.2728, accuracy: 12 }), { ok: true, stored: true });
    // Too soon after the last point: skipped, not an error.
    assert.deepEqual(await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.rider, latitude: 31.47, longitude: 74.273, accuracy: 12 }), { ok: true, stored: false });
    // Invalid coordinates and another rider's updates are rejected.
    assert.equal((await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.rider, latitude: 0, longitude: 0, accuracy: 5 })).ok, false);
    assert.equal((await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.otherRider, latitude: 31.47, longitude: 74.27, accuracy: 5 })).ok, false);

    tracking = await queries.getCustomerTracking(orderNumber, ids.customer);
    assert.ok(tracking?.delivery?.live, "fresh location is shown");
    assert.ok(tracking?.delivery?.eta && !tracking.delivery.eta.arriving);
    assert.equal(await queries.getCustomerTracking(orderNumber, ids.otherCustomer), null, "another customer gets nothing");

    // A stale point is not shown as live (admins still see it, flagged).
    await prisma.delivery.update({ where: { orderId: ids.order }, data: { lastLocationAt: new Date(Date.now() - 10 * 60_000) } });
    tracking = await queries.getCustomerTracking(orderNumber, ids.customer);
    assert.equal(tracking?.delivery?.live, null);
    assert.ok(tracking?.delivery?.lastLocationAt);
    const adminView = await queries.getAdminTracking(ids.order);
    assert.equal(adminView?.delivery?.lastKnown?.fresh, false);

    // Delivered with cash: payment recorded, sharing stopped, location deleted, rider phone hidden.
    assert.deepEqual(await ops.transitionOrder({ orderId: ids.order, to: "DELIVERED", actor: riderActor, riderId: ids.rider, codCollected: true }), { ok: true });
    const done = await prisma.order.findUnique({
      where: { id: ids.order },
      select: { status: true, paymentStatus: true, delivery: { select: { status: true, lastLatitude: true, sharingStartedAt: true } }, payments: { select: { status: true, recordedById: true } } }
    });
    assert.equal(done?.status, "DELIVERED");
    assert.equal(done?.paymentStatus, "PAID");
    assert.equal(done?.payments[0].status, "PAID");
    assert.equal(done?.payments[0].recordedById, ids.riderUser);
    assert.equal(done?.delivery?.status, "DELIVERED");
    assert.equal(done?.delivery?.lastLatitude, null);
    assert.equal(done?.delivery?.sharingStartedAt, null);

    tracking = await queries.getCustomerTracking(orderNumber, ids.customer);
    assert.equal(tracking?.delivery?.riderPhone, null);
    assert.equal(tracking?.delivery?.live, null);
    riderView = await queries.getRiderDelivery(ids.rider, ids.order);
    assert.equal(riderView?.active, false);
    assert.equal(riderView?.customerPhone, null, "no customer phone after delivery");
    assert.equal(riderView?.deliveryAddress, null, "only the area after delivery");

    // Updates after delivery are refused.
    const late = await delivery.recordRiderLocation({ orderId: ids.order, riderId: ids.rider, latitude: 31.5, longitude: 74.33, accuracy: 10 });
    assert.equal(late.ok, false);
  });

  it("rejects bad coordinates at the database level too", async () => {
    await assert.rejects(prisma.delivery.update({ where: { orderId: ids.order }, data: { lastLatitude: 120 } }));
  });
});
