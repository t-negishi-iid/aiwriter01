"use client";

import React from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import styles from "./layout.module.css";

export default function ReaderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // リーダーページ専用レイアウト - ナビゲーションとフッターを表示しない
  return (
    <div className={styles.readerLayout}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className={styles.readerContent}>
          {children}
        </div>
      </ThemeProvider>
    </div>
  );
}
