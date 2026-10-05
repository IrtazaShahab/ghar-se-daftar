"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitCorporateRequest } from "@/app/actions/corporate";
import { corporateRequestSchema, type CorporateRequestInput } from "@/lib/validations/corporate";

export function CorporateOrderForm() {
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting }
  } = useForm<CorporateRequestInput>({ resolver: zodResolver(corporateRequestSchema) });

  const onSubmit = async (data: CorporateRequestInput) => {
    setError(null);
    try {
      const result = await submitCorporateRequest(data);
      if (result.success) {
        setReference(result.reference);
        return;
      }
      setError(result.error);
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (message) setFieldError(field as keyof CorporateRequestInput, { message });
      }
    } catch {
      setError("We couldn't reach our servers. Check your connection and try again.");
    }
  };

  if (reference) {
    return (
      <div className="glass-card mx-auto max-w-2xl rounded-[32px] p-8 text-center md:p-10" role="status" aria-live="polite">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold tracking-tight md:text-3xl">Thank you!</h2>
        <p className="mx-auto mt-3 max-w-lg leading-7 text-muted">
          Your corporate lunch request has been received. Our team will review your requirements and contact you shortly with a customized plan.
        </p>
        <div className="mx-auto mt-6 w-fit rounded-2xl bg-primary/5 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Request reference</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-primary">{reference}</p>
        </div>
        <ButtonLink href="/menu" variant="secondary" className="mt-8">Browse this week&rsquo;s menu</ButtonLink>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card mx-auto max-w-2xl rounded-[32px] p-6 md:p-8" noValidate>
      <fieldset disabled={isSubmitting} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input label="Company name" autoComplete="organization" {...register("companyName")} error={errors.companyName?.message} required />
        </div>
        <Input label="Contact person" autoComplete="name" {...register("contactPerson")} error={errors.contactPerson?.message} required />
        <Input label="Phone" type="tel" autoComplete="tel" placeholder="0300 1234567" {...register("phone")} error={errors.phone?.message} required />
        <Input label="Work email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} error={errors.email?.message} required />
        <Input label="Employees" type="number" inputMode="numeric" min={5} placeholder="e.g. 25" {...register("employees")} error={errors.employees?.message} required />
        <div className="md:col-span-2">
          <Input label="Office area" placeholder="Gulberg, Lahore" {...register("area")} error={errors.area?.message} required />
        </div>
        <div className="md:col-span-2">
          <Textarea label="Anything we should know? (optional)" placeholder="Preferred days, dietary needs, budget per meal…" {...register("notes")} error={errors.notes?.message} />
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm font-semibold text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <Button type="submit" className="mt-6 w-full gap-2" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isSubmitting ? "Sending request…" : "Request Corporate Package"}
      </Button>
      <p className="mt-3 text-center text-xs text-muted">No payment now. We&rsquo;ll send a tailored quotation first.</p>
    </form>
  );
}
