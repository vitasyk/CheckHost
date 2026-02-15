import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
    title: "CheckHost.net - Website Monitoring & Uptime Checker",
    description: "Check your website uptime from 20+ locations worldwide. Fast, free, and reliable ping, HTTP, DNS, and TCP monitoring.",
    keywords: ["uptime monitoring", "website checker", "ping test", "http check", "dns lookup"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uk" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
