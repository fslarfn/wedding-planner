"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Wallet, Users, Heart, BookOpen, LogOut, Gift, FileText, Camera } from "lucide-react"

export function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname()

    const links = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/budget", label: "Budget & Progress", icon: Wallet },
        { href: "/savings", label: "Tabungan & Simulasi", icon: Wallet }, // Re-using Wallet icon or find better
        { href: "/guests", label: "Tamu Undangan", icon: Users },
        { href: "/engagement", label: "Acara Lamaran", icon: Heart },
        { href: "/seserahan", label: "Seserahan", icon: Gift },
        { href: "/kua", label: "Berkas KUA", icon: FileText },
        { href: "/prewedding", label: "Pre-Wedding", icon: Camera },
        { href: "/references", label: "Referensi", icon: BookOpen },
    ]

    const handleLogout = () => {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            localStorage.removeItem("wedding_user")
            window.location.href = "/"
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-xl font-bold text-blue-500 tracking-wider">Planner Faisal & Ditta</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center px-4 py-3 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/20"
                                    : "text-slate-400 hover:bg-slate-900 hover:text-blue-400"
                            )}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {link.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </button>
            </div>
        </div>
    )
}
