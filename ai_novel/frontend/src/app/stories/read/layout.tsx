"use client";

import React from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";

export default function StoryReadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="container mx-auto py-4 px-4 md:px-6">
        {children}
      </div>
    </ThemeProvider>
  );
}
