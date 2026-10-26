import type { Metadata } from "next";
import "./globals.css";
import { RootProviders } from "@/components/providers/root-providers";
import { getOrganizationSchema } from "@/lib/seo";
import { inter } from "./fonts";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Ghar Se Daftar — Homemade Office Lunch Subscription",
    template: "%s | Ghar Se Daftar"
  },
  description:
    "Premium homemade Pakistani lunch subscriptions for office professionals and corporate teams. Fresh daily cooked meals delivered to your office. Ghar Ka Khana, Ab Daftar Tak.",
  keywords: [
    "office lunch",
    "meal subscription",
    "Pakistani food",
    "homemade meals",
    "lunch delivery",
    "Lahore",
    "corporate lunch"
  ],
  authors: [{ name: "Ghar Se Daftar" }],
  creator: "Ghar Se Daftar",
  publisher: "Ghar Se Daftar",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false
  },
  openGraph: {
    title: "Ghar Se Daftar — Ghar Ka Khana, Ab Daftar Tak",
    description: "Premium homemade Pakistani office lunch subscriptions. Fresh meals delivered daily.",
    url: appUrl,
    type: "website",
    locale: "en_PK",
    siteName: "Ghar Se Daftar",
    images: [
      {
        url: `${appUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Ghar Se Daftar"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghar Se Daftar",
    description: "Premium homemade Pakistani office lunch subscriptions",
    creator: "@gharsequdaftar",
    images: [`${appUrl}/twitter-image.png`]
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: appUrl,
    languages: {
      "en-PK": appUrl,
      "ur-PK": `${appUrl}/ur`
    }
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getOrganizationSchema())
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <RootProviders>
          {children}
        </RootProviders>
      </body>
    </html>
  );
}
