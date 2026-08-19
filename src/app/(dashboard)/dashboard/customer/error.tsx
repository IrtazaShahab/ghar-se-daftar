"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
export default function CustomerError({ reset }: { error: Error; reset: () => void }) { return <div className="mx-auto max-w-xl rounded-[26px] border border-danger/20 bg-white p-8 text-center"><AlertTriangle className="mx-auto size-10 text-danger" /><h1 className="mt-4 text-2xl font-bold">We couldn’t load this page</h1><p className="mt-2 text-sm text-muted">Please try again. If the problem continues, contact Ghar Se Daftar support.</p><Button onClick={reset} className="mt-6">Try again</Button></div>; }
