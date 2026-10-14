"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSettingsSchema, type ProfileSettingsInput } from "@/lib/validations/profile";
import { updateCustomerProfile } from "@/app/actions/profile";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ProfileSettingsForm({ defaults }: { defaults: ProfileSettingsInput }) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileSettingsInput>({ resolver: zodResolver(profileSettingsSchema), defaultValues: defaults });
  const submit = async (data: ProfileSettingsInput) => {
    setMessage(null);
    const result = await updateCustomerProfile(data);
    setMessage(result.success ? { type: "success", text: "Your profile and delivery details were updated." } : { type: "error", text: result.error || "Unable to save changes." });
  };
  return <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-5">
    {message && <div role="status" className={`rounded-2xl border p-4 text-sm font-semibold ${message.type === "success" ? "border-success/20 bg-success/10 text-success" : "border-danger/20 bg-danger/10 text-danger"}`}>{message.text}</div>}
    <Input label="Full name" {...register("fullName")} error={errors.fullName?.message} />
    <Input label="Office / company" {...register("companyName")} error={errors.companyName?.message} />
    <Input label="Delivery area" autoComplete="address-level3" placeholder="e.g. Gulberg, Johar Town" {...register("deliveryArea")} error={errors.deliveryArea?.message} />
    <Textarea label="Office delivery address" autoComplete="street-address" rows={3} {...register("officeAddress")} error={errors.officeAddress?.message} />
    <Textarea label="Delivery instructions" rows={3} {...register("deliveryInstructions")} error={errors.deliveryInstructions?.message} />
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save changes"}</Button>
  </form>;
}
