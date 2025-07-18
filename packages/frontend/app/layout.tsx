import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ThemeRegistry from "@/components/providers/theme-registry"
import { APP_NAME, APP_LOGO } from "@/lib/config"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: `${APP_NAME} - Ameritas`,
  description: "An intelligent assistant for technology insights, powered by Ameritas.",
  icons: {
    icon: APP_LOGO,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
