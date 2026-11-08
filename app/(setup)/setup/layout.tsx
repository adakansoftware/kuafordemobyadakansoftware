import "../../globals.css"

export const metadata = {
  title: "Salon Kurulum Sihirbazi",
}

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="font-sans antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
