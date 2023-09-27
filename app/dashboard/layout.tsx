import Sidebar from "@/components/Sidebar"

export const metadata = {
    title: 'FastTrak | Dashboard',
    description: 'Parcel logistics and tracking made simple.',
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="h-screen w-full flex flex-col overflow-hidden">
            <header className="h-16 w-full text-white flex items-center px-4 border-b">
                <p className="text-primary text-xl font-bold">FastTrak</p>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <Sidebar />
                <div className="flex-grow p-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
