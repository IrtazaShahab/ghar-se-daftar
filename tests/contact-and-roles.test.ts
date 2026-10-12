import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { toWhatsAppNumber, whatsappChatUrl } from "../src/lib/utils";
import { hidesCustomerOrdering, homePathForRole, isOperationalStaff } from "../src/lib/auth/roles";

describe("rider WhatsApp links", () => {
  it("normalizes the ways Pakistani numbers are typed", () => {
    assert.equal(toWhatsAppNumber("03001112222"), "923001112222");
    assert.equal(toWhatsAppNumber("0300 111-2222"), "923001112222");
    assert.equal(toWhatsAppNumber("+92 300 1112222"), "923001112222");
    assert.equal(toWhatsAppNumber("00923001112222"), "923001112222");
    assert.equal(toWhatsAppNumber("3001112222"), "923001112222");
    assert.equal(toWhatsAppNumber("+44 7700 900123"), "447700900123");
  });

  it("rejects things that can't be a phone number", () => {
    assert.equal(toWhatsAppNumber(""), null);
    assert.equal(toWhatsAppNumber("12345"), null);
    assert.equal(toWhatsAppNumber("1234567890123456"), null);
    assert.equal(whatsappChatUrl("n/a", "hi"), null);
  });

  it("builds a wa.me link with the order message", () => {
    assert.equal(
      whatsappChatUrl("0300 1112222", "Hi, I'm contacting you about my Ghar Se Daftar order GSD-1234."),
      "https://wa.me/923001112222?text=Hi%2C%20I'm%20contacting%20you%20about%20my%20Ghar%20Se%20Daftar%20order%20GSD-1234."
    );
  });
});

describe("role portals", () => {
  it("sends each role to its own area", () => {
    assert.equal(homePathForRole("ADMIN"), "/admin");
    assert.equal(homePathForRole("HOME_CHEF"), "/chef");
    assert.equal(homePathForRole("RIDER"), "/rider");
    assert.equal(homePathForRole("CUSTOMER"), "/dashboard/customer");
  });

  it("treats only chefs and riders as operational staff locked out of the customer site", () => {
    assert.equal(isOperationalStaff("HOME_CHEF"), true);
    assert.equal(isOperationalStaff("RIDER"), true);
    assert.equal(isOperationalStaff("ADMIN"), false);
    assert.equal(isOperationalStaff("CUSTOMER"), false);
    assert.equal(isOperationalStaff(null), false);
  });

  it("hides ordering controls from every role that can't place customer orders", () => {
    assert.equal(hidesCustomerOrdering("HOME_CHEF"), true);
    assert.equal(hidesCustomerOrdering("RIDER"), true);
    assert.equal(hidesCustomerOrdering("ADMIN"), true);
    assert.equal(hidesCustomerOrdering("CUSTOMER"), false);
    assert.equal(hidesCustomerOrdering(null), false);
  });
});
