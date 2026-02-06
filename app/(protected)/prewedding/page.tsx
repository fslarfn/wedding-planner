"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Calendar, MapPin, CheckCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

export default function PreWeddingPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Add Item State
    const [itemName, setItemName] = useState("")
    const [vendorName, setVendorName] = useState("")
    const [cost, setCost] = useState("")
    const [date, setDate] = useState("")

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        try {
            const { data } = await supabase.from('prewedding').select('*').order('date', { ascending: true })
            if (data) setItems(data)
        } finally { setLoading(false) }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        await supabase.from('prewedding').insert([{
            item_name: itemName,
            vendor_name: vendorName,
            cost: parseFloat(cost) || 0,
            date: date || null,
            status: 'Booked'
        }])
        setItemName(""); setVendorName(""); setCost(""); setDate("")
        fetchData()
    }

    async function updateStatus(id: string, current: string) {
        const next = current === 'Booked' ? 'Done' : 'Booked'
        await supabase.from('prewedding').update({ status: next }).eq('id', id)
        fetchData()
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Camera className="w-8 h-8 text-blue-600" />
                Pre-Wedding
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Available Items / Timeline */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="relative flex gap-4">
                            {/* Timeline Line */}
                            <div className="flex flex-col items-center">
                                <div className={cn("w-3 h-3 rounded-full mt-2", item.status === 'Done' ? "bg-emerald-500" : "bg-slate-300")} />
                                <div className="w-0.5 h-full bg-slate-200 flex-1 my-1" />
                            </div>

                            <Card className="flex-1 mb-4 border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-5 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{item.item_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <MapPin className="w-4 h-4" />
                                            {item.vendor_name || "-"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                            <Calendar className="w-4 h-4" />
                                            {item.date ? format(new Date(item.date), "dd MMMM yyyy", { locale: id }) : "Belum ditentukan"}
                                        </div>
                                        <p className="mt-3 font-semibold text-blue-600">{formatRupiah(item.cost)}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={item.status === 'Done' ? "outline" : "default"}
                                        className={cn(item.status === 'Done' ? "text-emerald-600 border-emerald-200" : "bg-slate-800 hover:bg-slate-900")}
                                        onClick={() => updateStatus(item.id, item.status)}
                                    >
                                        {item.status === 'Done' ? "Selesai" : "Mark Done"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>

                {/* Add Form */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6 border-none shadow-lg">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-slate-700">Tambah Agenda</h3>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <Input placeholder="Nama Kegiatan (e.g. Sewa Studio)" value={itemName} onChange={e => setItemName(e.target.value)} required />
                                <Input placeholder="Vendor / Lokasi" value={vendorName} onChange={e => setVendorName(e.target.value)} />
                                <Input type="number" placeholder="Biaya (Rp)" value={cost} onChange={e => setCost(e.target.value)} />
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Simpan</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
