import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canRoleTransition } from "../src/lib/orders/status";
import { checkoutDetailsSchema, placeDefault } from "../src/lib/validations/checkout";
import { profileSettingsSchema } from "../src/lib/validations/profile";

describe("role transitions", () => {
  it("lets riders only pick up and deliver", () => {
    assert.equal(canRoleTransition("RIDER", "READY", "OUT_FOR_DELIVERY"), true);
    assert.equal(canRoleTransition("RIDER", "OUT_FOR_DELIVERY", "DELIVERED"), true);
    assert.equal(canRoleTransition("RIDER", "PENDING", "CONFIRMED"), false);
    assert.equal(canRoleTransition("RIDER", "PREPARING", "READY"), false);
    assert.equal(canRoleTransition("RIDER", "OUT_FOR_DELIVERY", "CANCELLED"), false);
    assert.equal(canRoleTransition("RIDER", "READY", "DELIVERED"), false, "no skipping out for delivery");
  });

  it("keeps chefs and customers in their lanes", () => {
    assert.equal(canRoleTransition("HOME_CHEF", "READY", "OUT_FOR_DELIVERY"), false);
    assert.equal(canRoleTransition("HOME_CHEF", "PREPARING", "READY"), true);
    assert.equal(canRoleTransition("CUSTOMER", "PENDING", "CANCELLED"), false);
    assert.equal(canRoleTransition("ADMIN", "READY", "OUT_FOR_DELIVERY"), true);
    assert.equal(canRoleTransition("ADMIN", "DELIVERED", "CANCELLED"), false);
  });
});

const valid = {
  fullName: "Ayesha Khan",
  phone: "0300 1234567",
  whatsappNumber: "",
  company: "",
  area: "Gulberg",
  address: "Office 4, Floor 2, Main Boulevard",
  city: "Lahore",
  latitude: null,
  longitude: null,
  deliverySlot: "12:00-13:00",
  instructions: "",
  paymentMethod: "COD" as const
};

describe("checkout validation", () => {
  it("accepts a normal manual address without a pin", () => {
    assert.equal(checkoutDetailsSchema.safeParse(valid).success, true);
  });

  it("rejects an email typed or autofilled into the delivery area", () => {
    const result = checkoutDetailsSchema.safeParse({ ...valid, area: "ayesha@example.com" });
    assert.equal(result.success, false);
    assert.match(result.success ? "" : result.error.issues[0].message, /email/i);
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, address: "ayesha@example.com, Lahore" }).success, false);
  });

  it("requires a complete pin inside Pakistan", () => {
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, latitude: 31.51, longitude: 74.34 }).success, true);
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, latitude: 31.51, longitude: null }).success, false);
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, latitude: 51.5, longitude: -0.12 }).success, false);
  });

  it("only accepts well-formed slots (availability is checked on the server)", () => {
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, deliverySlot: "" }).success, false);
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, deliverySlot: "25:00-26:00" }).success, false);
    assert.equal(checkoutDetailsSchema.safeParse({ ...valid, deliverySlot: "18:00-19:00" }).success, true);
  });

  it("drops bad saved values from form defaults", () => {
    assert.equal(placeDefault("ayesha@example.com"), "");
    assert.equal(placeDefault("  Johar Town "), "Johar Town");
    assert.equal(placeDefault(null), "");
  });

  it("guards the profile form the same way", () => {
    assert.equal(profileSettingsSchema.safeParse({ fullName: "Ayesha Khan", deliveryArea: "a@b.co" }).success, false);
    assert.equal(profileSettingsSchema.safeParse({ fullName: "Ayesha Khan", deliveryArea: "DHA Phase 5" }).success, true);
  });
});
