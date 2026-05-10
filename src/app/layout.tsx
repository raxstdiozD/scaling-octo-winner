// Build Trigger: 2026-04-30T21:27
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Search, Bell, Sparkles } from "lucide-react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

import { SessionProvider } from "@/components/providers/SessionProvider";
import { UserMenu } from "@/components/layout/UserMenu";
import { SearchBar } from "@/components/layout/SearchBar";
import { AppLoader } from "@/components/providers/AppLoader";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { Footer } from "@/components/layout/Footer";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { CreditBadge } from "@/components/ui/CreditBadge";

import { JsonLd, defaultSchemaData } from "@/components/seo/JsonLd";

import { constructMetadata } from "@/lib/seo";

export const metadata: Metadata = constructMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased text-white bg-[#030303]`} suppressHydrationWarning>
        <JsonLd type="Organization" data={defaultSchemaData.organization} />
        <JsonLd type="WebSite" data={defaultSchemaData.website} />
        <Suspense fallback={null}>
          <AppLoader>
            <SessionProvider>
              <I18nProvider>
                <div className="flex min-h-screen" suppressHydrationWarning>
                  {session && <Sidebar />}
                  <main suppressHydrationWarning className="flex-1 flex flex-col min-w-0 bg-[#030303]">
                    {session && (
                      <header suppressHydrationWarning className="h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 bg-[#030303]/60 backdrop-blur-2xl z-[100]">
                        <SearchBar />
                        <div className="flex items-center gap-2 sm:gap-6 ml-2 sm:ml-8">
                          <div className="flex items-center gap-6">
                            <UserMenu />
                          </div>
                        </div>
                      </header>
                    )}
                    <div suppressHydrationWarning className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col">
                      <div className="flex-1">{children}</div>
                      <Footer />
                      <div suppressHydrationWarning className="fixed inset-0 grain pointer-events-none z-50 opacity-[0.02]" />
                    </div>
                  </main>
                </div>
              </I18nProvider>
            </SessionProvider>
          </AppLoader>
        </Suspense>
      </body>
    </html>
  );
}
