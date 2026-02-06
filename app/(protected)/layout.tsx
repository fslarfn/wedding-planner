"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"
import { Menu, X } from "lucide-react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const user = localStorage.getItem("wedding_user")
        if (!user) {
            router.push("/")
        } else {
            setIsAuthorized(true)
        }
    }, [router])

    if (!isAuthorized) {
        return null
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 h-full">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="relative w-64 h-full bg-slate-900">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 text-white p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 bg-white border-b shadow-sm">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-gray-700">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-3 font-semibold text-lg">Wedding Planner</span>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
