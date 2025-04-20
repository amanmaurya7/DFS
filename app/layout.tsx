import type React from "react"
import "@/app/globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AccountProvider } from "@/hooks/use-account"
import { ContractProvider } from "@/hooks/use-contract"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Decentralized File Storage",
  description: "Store files securely using IPFS and Polygon Amoy Testnet",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AccountProvider>
            <ContractProvider>{children}</ContractProvider>
          </AccountProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
