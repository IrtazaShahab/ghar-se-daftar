"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const schema = z.object({
  companyName: z.string().min(2),
  contactPerson: z.string().min(2),
  phone: z.string().min(10),
  employees: z.coerce.number().min(5),
  area: z.string().min(2)
});

export function CorporateOrderForm() {
  const [status, setStatus] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      setStatus("Please complete the corporate request details correctly.");
      return;
    }
    setStatus("Corporate request captured. Next step: connect this form to database + admin notification.");
  }

  return (
    <form action={onSubmit} className="glass-card mx-auto max-w-2xl rounded-[32px] p-6 md:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">Company name<input name="companyName" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" /></label>
        <label className="grid gap-2 text-sm font-semibold">Contact person<input name="contactPerson" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" /></label>
        <label className="grid gap-2 text-sm font-semibold">Phone<input name="phone" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" /></label>
        <label className="grid gap-2 text-sm font-semibold">Employees<input name="employees" type="number" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" /></label>
        <label className="grid gap-2 text-sm font-semibold">Area<input name="area" className="focus-ring h-12 rounded-2xl border border-border bg-white px-4" placeholder="Gulberg, Lahore" /></label>
        <Button type="submit" className="md:col-span-2">Request Corporate Package</Button>
        {status ? <p className="rounded-2xl bg-primary/10 p-4 text-sm font-semibold text-primary md:col-span-2">{status}</p> : null}
      </div>
    </form>
  );
}
