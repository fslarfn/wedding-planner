"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, Check, X, Plus, Trash2, Edit2 } from "lucide-react"

export default function SeserahanPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [isAdding, setIsAdding] = useState(false)
    const [newItem, setNewItem] = useState({
        item_name: "",
        estimated_price: "",
        notes: ""
    })

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            const { data } = await supabase.from('seserahan').select('*').order('created_at', { ascending: true })
            if (data) setItems(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAddItem() {
        if (!newItem.item_name) return

        await supabase.from('seserahan').insert([{
            item_name: newItem.item_name,
            estimated_price: parseFloat(newItem.estimated_price) || 0,
            notes: newItem.notes,
            status: 'Belum Beli'
        }])

        setNewItem({ item_name: "", estimated_price: "", notes: "" })
        setIsAdding(false)
        fetchData()
    }

    async function toggleStatus(id: string, currentStatus: string) {
        const newStatus = currentStatus === 'Sudah Beli' ? 'Belum Beli' : 'Sudah Beli'
        await supabase.from('seserahan').update({ status: newStatus }).eq('id', id)
        fetchData()
    }

    async function handleDelete(id: string) {
        if (confirm("Hapus item ini?")) {
            await supabase.from('seserahan').delete().eq('id', id)
            fetchData()
        }
    }

    // Stats
    const totalEst = items.reduce((acc, item) => acc + (item.estimated_price || 0), 0)
    const totalActual = items.reduce((acc, item) => acc + (item.actual_price || 0), 0) // If we add actual price input later
    const boughtCount = items.filter(i => i.status === 'Sudah Beli').length

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Daftar Seserahan</h1>
                <Button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-700">
                    {isAdding ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isAdding ? "Batal" : "Tambah Item"}
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-blue-50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full text-blue-500">
                            <Gift className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Estimasi</p>
                            <p className="text-xl font-bold text-slate-800">{formatRupiah(totalEst)}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-emerald-50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full text-emerald-500">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Sudah Dibeli</p>
                            <p className="text-xl font-bold text-slate-800">{boughtCount} <span className="text-sm font-normal text-slate-500">/ {items.length} Item</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add Form */}
            {isAdding && (
                <Card className="mb-6 border-dashed border-2 border-blue-200 bg-slate-50">
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold text-slate-700">Tambah Item Baru</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                placeholder="Nama Barang (contoh: Tas, Sepatu)"
                                value={newItem.item_name}
                                onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                            />
                            <Input
                                type="number"
                                placeholder="Estimasi Harga"
                                value={newItem.estimated_price}
                                onChange={e => setNewItem({ ...newItem, estimated_price: e.target.value })}
                            />
                            <Input
                                placeholder="Catatan / Merk"
                                value={newItem.notes}
                                onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleAddItem} className="bg-blue-600 hover:bg-blue-700">Simpan Item</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <Card key={item.id} className={cn("transition-all duration-300", item.status === 'Sudah Beli' ? "bg-slate-50 border-emerald-200" : "hover:shadow-md border-slate-200")}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={cn("font-bold text-lg", item.status === 'Sudah Beli' ? "text-slate-400 line-through" : "text-slate-800")}>
                                    {item.item_name}
                                </h3>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="text-slate-300 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="text-blue-600 font-bold mb-1">{formatRupiah(item.estimated_price)}</p>
                            {item.notes && <p className="text-xs text-slate-500 mb-4 italic">{item.notes}</p>}

                            <div className="border-t border-slate-100 pt-3 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStatus(item.id, item.status)}
                                    className={cn("w-full transition-colors", item.status === 'Sudah Beli' ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" : "text-slate-600 hover:text-blue-600 hover:border-blue-200")}
                                >
                                    {item.status === 'Sudah Beli' ? (
                                        <><Check className="w-4 h-4 mr-2" /> Sudah Dibeli</>
                                    ) : "Tandai Sudah Beli"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
