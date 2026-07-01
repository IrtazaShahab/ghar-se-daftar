/**
 * SEO utilities for structured data and metadata
 */

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Organization structured data (JSON-LD)
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ghar Se Daftar",
    url: getBaseUrl(),
    logo: `${getBaseUrl()}/logo.png`,
    description: "Premium homemade Pakistani lunch subscriptions for office professionals",
    sameAs: [
      "https://www.instagram.com/gharsequdaftar",
      "https://www.facebook.com/gharsequdaftar",
      "https://www.whatsapp.com"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+92 370 4756269",
      contactType: "Customer Support",
      availableLanguage: "en,ur"
    },
    areaServed: {
      "@type": "City",
      name: "Lahore",
      addressCountry: "PK"
    }
  };
}

/**
 * Business schema
 */
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Ghar Se Daftar",
    description: "Ghar Ka Khana, Ab Daftar Tak",
    url: getBaseUrl(),
    telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+92 370 4756269",
    address: {
      "@type": "PostalAddress",
      addressCity: "Lahore",
      addressCountry: "PK",
      addressRegion: "Punjab"
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "14:00"
    }
  };
}

/**
 * Product schema for menu items
 */
export function getProductSchema(name: string, description: string, price: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    offers: {
      "@type": "Offer",
      price: (price / 100).toString(), // Convert to decimal
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock"
    }
  };
}

/**
 * FAQ schema
 */
export function getFAQSchema(questions: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a
      }
    }))
  };
}

/**
 * Breadcrumb schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${getBaseUrl()}${item.url}`
    }))
  };
}
