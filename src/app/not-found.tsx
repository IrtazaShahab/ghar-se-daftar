import { ButtonLink } from "@/components/ui/button";
import { LogoFull } from "@/components/brand/logo";
import { SearchX } from "lucide-react";

export const metadata = { title: "Not found", robots: { index: false } };

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-md text-center">
        <LogoFull size="lg" className="mb-8 justify-center" />
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <SearchX className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-serif text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">This page or record doesn&rsquo;t exist, or you don&rsquo;t have access to it.</p>
        <ButtonLink href="/" className="mt-6">Back to home</ButtonLink>
      </div>
    </div>
  );
}
