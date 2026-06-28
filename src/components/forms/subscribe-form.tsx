"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  officeAddress: z.string().min(10),
  plan: z.enum(["single", "weekly", "monthly"])
});

export function SubscribeForm() {
  const [status, setStatus] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    const result = schema.safeParse({
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      officeAddress: formData.get("officeAddress"),
      plan: formData.get("plan")
    });

    if (!result.success) {
      setStatus("Please complete all required fields correctly.");
      return;
    }

    setStatus("Subscription request captured. Connect this to a Server Action/API route next.");
  }

  return (
    <form action={onSubmit} className="glass-card mx-auto max-w-2xl rounded-[32px] p-6 md:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-semibold">
          Full name
          <input name="fullName" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" placeholder="Muhammad Ali" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Phone number
          <input name="phone" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" placeholder="03XX XXXXXXX" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Office address
          <textarea name="officeAddress" className="focus-ring min-h-28 rounded-2xl border border-border bg-white p-4" placeholder="Office name, floor, building, area, city" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Plan
          <select name="plan" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4">
            <option value="single">Single Meal — Rs.350</option>
            <option value="weekly">Weekly Office Plan — Rs.1,750</option>
            <option value="monthly">Monthly Subscription — Rs.6,500</option>
          </select>
        </label>
        <Button type="submit" className="w-full">Submit Subscription Request</Button>
        {status ? <p className="rounded-2xl bg-primary/10 p-4 text-sm font-semibold text-primary">{status}</p> : null}
      </div>
    </form>
  );
}
