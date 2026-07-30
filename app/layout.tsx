import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "127.0.0.1:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("127.") || host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og-v2.png`;

  return {
    title: "Changyuan Xin — Robotics Research Portfolio",
    description:
      "Academic portfolio exploring robotic manipulation, vision-based control, reinforcement learning, and intelligent manufacturing.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Changyuan Xin — Robotics Research Portfolio",
      description:
        "Research, engineering projects, coursework, and an interactive academic CV.",
      type: "website",
      images: [{ url: socialImage, width: 1672, height: 943 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Changyuan Xin — Robotics Research Portfolio",
      description:
        "Research, engineering projects, coursework, and an interactive academic CV.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
