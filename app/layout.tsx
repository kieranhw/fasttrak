import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'FastTrak | Vehicle Routing',
  description: 'Parcel logistics and tracking made simple.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        <main className="min-h-screen bg-background flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}
