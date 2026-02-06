"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { formatRupiah, cn } from "@/lib/utils"
import { Plus, Trash2, Edit2, Calculator, Wallet } from "lucide-react"
import { differenceInCalendarDays, format } from "date-fns"
import { id } from "date-fns/locale"

export default function SavingsPage() {
    const [goal, setGoal] = useState<any>(null)
    const [savings, setSavings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditingGoal, setIsEditingGoal] = useState(false)

    // Form States
    const [targetAmount, setTargetAmount] = useState("")
    const [targetDate, setTargetDate] = useState("")
    const [newSavingAmount, setNewSavingAmount] = useState("")
    const [newSavingNote, setNewSavingNote] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            const { data: goalData } = await supabase.from('savings_goal').select('*').single()
            const { data: savingsData } = await supabase.from('savings').select('*').order('date', { ascending: false })

            if (goalData) {
                setGoal(goalData)
                setTargetAmount(goalData.target_amount)
                setTargetDate(goalData.target_date)
            }
            if (savingsData) setSavings(savingsData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateGoal() {
        const payload = { target_amount: parseFloat(targetAmount), target_date: targetDate }

        if (goal) {
            await supabase.from('savings_goal').update(payload).eq('id', goal.id)
        } else {
            await supabase.from('savings_goal').insert([payload])
        }
        setIsEditingGoal(false)
        fetchData()
    }

    async function handleAddSaving() {
        if (!newSavingAmount) return
        await supabase.from('savings').insert([{
            amount: parseFloat(newSavingAmount),
            note: newSavingNote || 'Tabungan Rutin',
            date: new Date().toISOString()
        }])
        setNewSavingAmount("")
        setNewSavingNote("")
        fetchData()
    }

    async function handleDelete(id: string) {
        if (confirm("Hapus data ini?")) {
            await supabase.from('savings').delete().eq('id', id)
            fetchData()
        }
    }

    // Calculations
    const totalSaved = savings.reduce((acc, curr) => acc + (curr.amount || 0), 0)
    const remaining = goal ? Math.max(0, goal.target_amount - totalSaved) : 0
    const daysLeft = goal ? differenceInCalendarDays(new Date(goal.target_date), new Date()) : 0
    const dailySavingNeeded = daysLeft > 0 ? remaining / daysLeft : 0
    const monthlySavingNeeded = daysLeft > 0 ? remaining / (daysLeft / 30) : 0

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Tabungan & Simulasi</h1>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white shadow border-none">
                    <CardContent className="p-6 text-center">
                        <p className="text-gray-500 text-sm font-medium">Target Total</p>
                        {isEditingGoal ? (
                            <div className="mt-2 space-y-2">
                                <Input
                                    type="number"
                                    value={targetAmount}
                                    onChange={e => setTargetAmount(e.target.value)}
                                    placeholder="Nominal"
                                />
                                <Input
                                    type="date"
                                    value={targetDate}
                                    onChange={e => setTargetDate(e.target.value)}
                                />
                                <Button size="sm" onClick={handleUpdateGoal} className="w-full bg-blue-600 hover:bg-blue-700">Simpan</Button>
                            </div>
                        ) : (
                            <div onClick={() => setIsEditingGoal(true)} className="cursor-pointer hover:opacity-70 group">
                                <h2 className="text-2xl font-bold text-slate-800 mt-1">{goal ? formatRupiah(goal.target_amount) : "Atur Target"}</h2>
                                <Edit2 className="w-4 h-4 mx-auto mt-2 text-slate-300 group-hover:text-blue-500" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-white shadow border-none">
                    <CardContent className="p-6 text-center">
                        <p className="text-slate-500 text-sm font-medium">Sudah Terkumpul</p>
                        <h2 className="text-2xl font-bold text-blue-600 mt-1">{formatRupiah(totalSaved)}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow border-none">
                    <CardContent className="p-6 text-center">
                        <p className="text-slate-500 text-sm font-medium">Sisa Kekurangan</p>
                        <h2 className="text-2xl font-bold text-slate-400 mt-1">{formatRupiah(remaining)}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow border-none">
                    <CardContent className="p-6 text-center">
                        <p className="text-slate-500 text-sm font-medium">Target Tanggal H</p>
                        <h2 className="text-2xl font-bold text-slate-800 mt-1">
                            {goal ? format(new Date(goal.target_date), "dd MMM yyyy", { locale: id }) : "-"}
                        </h2>
                        {goal && <p className="text-xs text-slate-400 mt-1">{daysLeft} Hari Lagi</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Simulation */}
            <Card className="border-none shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Calculator className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Simulasi Menabung</h3>
                    </div>

                    {goal ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                <p className="text-sm text-slate-500 mb-1">Rekomendasi Setoran Harian</p>
                                <p className="text-xl font-bold text-slate-800">{formatRupiah(dailySavingNeeded)} <span className="text-sm font-normal text-slate-500">/ hari</span></p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                                <p className="text-sm text-slate-500 mb-1">Rekomendasi Setoran Bulanan</p>
                                <p className="text-xl font-bold text-slate-800">{formatRupiah(monthlySavingNeeded)} <span className="text-sm font-normal text-slate-500">/ bulan</span></p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 italic">Silakan atur target total dan tanggal terlebih dahulu untuk melihat simulasi.</p>
                    )}
                </CardContent>
            </Card>

            {/* History Table */}
            <Card className="border-none shadow-md">
                <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-slate-400" />
                            Riwayat Tabungan
                        </h3>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Ket: Tabungan Gaji"
                                value={newSavingNote}
                                onChange={e => setNewSavingNote(e.target.value)}
                                className="w-48"
                            />
                            <Input
                                type="number"
                                placeholder="Jumlah (Rp)"
                                value={newSavingAmount}
                                onChange={e => setNewSavingAmount(e.target.value)}
                                className="w-32"
                            />
                            <Button onClick={handleAddSaving} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-slate-50">
                                    <th className="py-3 px-4 text-left font-medium text-slate-600">Tanggal</th>
                                    <th className="py-3 px-4 text-left font-medium text-slate-600">Catatan</th>
                                    <th className="py-3 px-4 text-right font-medium text-slate-600">Nominal</th>
                                    <th className="py-3 px-4 text-center font-medium text-slate-600">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {savings.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400">Belum ada data tabungan.</td>
                                    </tr>
                                ) : (
                                    savings.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="py-3 px-4 text-slate-600">
                                                {format(new Date(item.date), "dd MMM yyyy", { locale: id })}
                                            </td>
                                            <td className="py-3 px-4 text-slate-800 font-medium">{item.note}</td>
                                            <td className="py-3 px-4 text-right text-blue-600 font-bold">
                                                +{formatRupiah(item.amount)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
