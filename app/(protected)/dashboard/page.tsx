"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Calendar, Users, Wallet, CheckSquare, ArrowUpRight, Plus, Trash2, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

// Mock data incase DB is empty
const MOCK_SUMMARY = {
    budget: { planned: 150000000, actual: 45000000 },
    guests: { total: 500, distributed: 320 },
    tasks: { total: 20, completed: 12 }
}

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(MOCK_SUMMARY)
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    // Add Event State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: "", date: "", location: "" })

    useEffect(() => {
        const userData = localStorage.getItem("wedding_user")
        if (userData) setUser(JSON.parse(userData))

        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        try {
            setLoading(true)

            // 1. Budget Summary
            const { data: budgets } = await supabase.from('budgets').select('planned_amount, actual_amount')

            // 2. Guests Summary
            const { count: totalGuests } = await supabase.from('wedding_guests').select('id', { count: 'exact' })
            const { count: distributedGuests } = await supabase.from('wedding_guests').select('id', { count: 'exact' }).eq('is_invited', true)

            // 3. Tasks Summary
            const { count: totalTasks } = await supabase.from('tasks').select('id', { count: 'exact' })
            const { count: completedTasks } = await supabase.from('tasks').select('id', { count: 'exact' }).eq('is_completed', true)

            // 4. Events
            const { data: eventData } = await supabase.from('events').select('*').order('date', { ascending: true })
            if (eventData) setEvents(eventData)

            // 5. Target Date (Countdown)
            const { data: goalData } = await supabase.from('savings_goal').select('target_date').single()
            let daysLeft = 0
            if (goalData && goalData.target_date) {
                const target = new Date(goalData.target_date)
                const today = new Date()
                const diffTime = target.getTime() - today.getTime()
                daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }

            if (budgets && budgets.length > 0) {
                const planned = budgets.reduce((sum: number, item: any) => sum + (item.planned_amount || 0), 0)
                const actual = budgets.reduce((sum: number, item: any) => sum + (item.actual_amount || 0), 0)

                setStats({
                    budget: { planned, actual },
                    guests: { total: totalGuests || 0, distributed: distributedGuests || 0 },
                    tasks: { total: totalTasks || 0, completed: completedTasks || 0 },
                    daysLeft: daysLeft > 0 ? daysLeft : 0
                })
            }
        } catch (error) {
            console.error("Error fetching data, using mock", error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddEvent() {
        if (!newEvent.title || !newEvent.date) return
        await supabase.from('events').insert([newEvent])
        setIsAddOpen(false)
        setNewEvent({ title: "", date: "", location: "" })
        fetchDashboardData()
    }

    async function handleDeleteEvent(id: string) {
        if (confirm("Hapus acara ini?")) {
            await supabase.from('events').delete().eq('id', id)
            fetchDashboardData()
        }
    }

    async function handleToggleEvent(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'done' ? 'upcoming' : 'done'
        await supabase.from('events').update({ status: newStatus }).eq('id', id)
        fetchDashboardData()
    }

    const budgetProgress = stats.budget.planned > 0
        ? Math.round((stats.budget.actual / stats.budget.planned) * 100)
        : 0

    const guestProgress = stats.guests.total > 0
        ? Math.round((stats.guests.distributed / stats.guests.total) * 100)
        : 0

    const taskProgress = stats.tasks.total > 0
        ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
        : 0

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Selamat datang kembali, <span className="font-semibold text-blue-600">{user?.name || 'Planner'}</span>!
                    </p>
                </div>
                <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 rounded-2xl shadow-lg border-none text-white w-full md:w-auto transform transition-all hover:scale-105 active:scale-95 duration-300">
                    <p className="text-xs font-medium uppercase tracking-wider opacity-70 text-blue-200">Menuju Hari Bahagia</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold">{stats.daysLeft !== undefined ? stats.daysLeft : '-'}</span>
                        <span className="text-sm font-medium text-blue-200">Hari Lagi</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Budget Card */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative group bg-white ring-1 ring-slate-200/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Budget</CardTitle>
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{formatRupiah(stats.budget.actual)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            dari <span className="font-medium text-slate-700">{formatRupiah(stats.budget.planned)}</span> terencana
                        </p>
                        <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full bg-blue-600 transition-all duration-1000 ease-out")}
                                style={{ width: `${budgetProgress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-slate-400">{budgetProgress}% Terpakai</p>
                            {budgetProgress > 80 && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Hampir Limit</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Guest Card */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative group bg-white ring-1 ring-slate-200/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-slate-500">Tamu Undangan</CardTitle>
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.guests.distributed} <span className="text-slate-300 text-lg">/</span> {stats.guests.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Undangan telah disebar
                        </p>
                        <div className="mt-4 h-2 w-full bg-indigo-50 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full bg-indigo-500 transition-all duration-1000 ease-out")}
                                style={{ width: `${guestProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right mt-2 text-slate-400">{guestProgress}% Tersebar</p>
                    </CardContent>
                </Card>

                {/* Tasks Card */}
                <Card className="border-none shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden relative group bg-white ring-1 ring-slate-200/50">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                        <CardTitle className="text-sm font-medium text-slate-500">Tugas & KUA</CardTitle>
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <CheckSquare className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-2xl font-bold text-slate-900">{stats.tasks.completed} <span className="text-slate-300 text-lg">/</span> {stats.tasks.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tugas terselesaikan
                        </p>
                        <div className="mt-4 h-2 w-full bg-emerald-50 rounded-full overflow-hidden">
                            <div
                                className={cn("h-full bg-emerald-500 transition-all duration-1000 ease-out")}
                                style={{ width: `${taskProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-right mt-2 text-slate-400">{taskProgress}% Selesai</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity / Next Events */}
            <div className="grid grid-cols-1 gap-6">
                <Card className="border-none shadow-md bg-white ring-1 ring-slate-200/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl text-slate-800">Acara Mendatang</CardTitle>
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                                    <Plus className="w-4 h-4 mr-2" /> Tambah Acara
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Tambah Jadwal Acara</DialogTitle></DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">Nama Acara</label>
                                        <Input placeholder="Contoh: Photoshoot" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">Tanggal</label>
                                        <Input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold">Lokasi</label>
                                        <Input placeholder="Contoh: Studio Alam" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddEvent} className="bg-blue-600 hover:bg-blue-700">Simpan</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {events.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Belum ada acara mendatang.</p>
                            ) : (
                                events.map((event) => (
                                    <div key={event.id} className={cn(
                                        "group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all border border-transparent hover:border-slate-100",
                                        event.status === 'done' ? "bg-slate-50 opacity-60" : "bg-slate-50 hover:bg-white hover:shadow-md"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn("p-3 rounded-lg", event.status === 'done' ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-600")}>
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={cn("font-semibold text-slate-900", event.status === 'done' && "line-through text-slate-400")}>
                                                    {event.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                                    <span>{new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span>•</span>
                                                    <span>{event.location || "-"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 md:mt-0 flex items-center gap-2">
                                            {event.status === 'done' ? (
                                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium mr-2">Selesai</span>
                                            ) : (
                                                <span className="bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full font-medium mr-2">Coming Soon</span>
                                            )}

                                            <button
                                                onClick={() => handleToggleEvent(event.id, event.status)}
                                                className={cn("p-2 rounded-full hover:bg-slate-200 transition-colors", event.status === 'done' ? "text-green-600" : "text-slate-400")}
                                                title={event.status === 'done' ? "Tandai Belum Selesai" : "Tandai Selesai"}
                                            >
                                                {event.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                            </button>

                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Hapus Acara"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
