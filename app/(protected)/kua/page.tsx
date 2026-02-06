"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Check, Plus, AlertCircle } from "lucide-react"

export default function KuaPage() {
    const [tasks, setTasks] = useState<any[]>([])
    const [newTask, setNewTask] = useState("")

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        const { data } = await supabase
            .from('tasks')
            .select('*')
            .eq('category', 'KUA')
            .order('created_at', { ascending: true })

        if (data) setTasks(data)
    }

    async function addTask(e: React.FormEvent) {
        e.preventDefault()
        if (!newTask) return
        await supabase.from('tasks').insert([{ title: newTask, category: 'KUA', is_completed: false }])
        setNewTask("")
        fetchTasks()
    }

    async function toggleTask(id: string, current: boolean) {
        await supabase.from('tasks').update({ is_completed: !current }).eq('id', id)
        fetchTasks()
    }

    const progress = tasks.length > 0
        ? Math.round((tasks.filter(t => t.is_completed).length / tasks.length) * 100)
        : 0

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    Berkas KUA & Administrasi
                </h1>
                <p className="text-slate-500">Checklist kelengkapan dokumen pernikahan</p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700">Kelengkapan Dokumen</span>
                    <span className="font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* List */}
                <div className="md:col-span-3 space-y-3">
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => toggleTask(task.id, task.is_completed)}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border",
                                task.is_completed
                                    ? "bg-green-50 border-green-200 text-gray-500"
                                    : "bg-white border-transparent shadow hover:shadow-md"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded border flex items-center justify-center transition-colors",
                                task.is_completed ? "bg-green-500 border-green-500 text-white" : "border-gray-300"
                            )}>
                                {task.is_completed && <Check className="w-4 h-4" />}
                            </div>
                            <span className={cn("font-medium", task.is_completed && "line-through")}>
                                {task.title}
                            </span>
                        </div>
                    ))}

                    <form onSubmit={addTask} className="flex gap-2 mt-4">
                        <Input
                            placeholder="Tambah dokumen baru..."
                            value={newTask}
                            onChange={e => setNewTask(e.target.value)}
                            className="bg-white"
                        />
                        <Button type="submit" className="bg-gray-800"><Plus className="w-4 h-4" /></Button>
                    </form>
                </div>

                {/* Info Card */}
                <div className="md:col-span-2">
                    <Card className="bg-blue-50 border-none shadow-none text-blue-800">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 mt-0.5" />
                                <div>
                                    <h4 className="font-bold">Info Penting</h4>
                                    <p className="text-sm mt-1 opacity-90 leading-relaxed">
                                        Pastikan dokumen N1, N2, dan N4 sudah ditandatangani kelurahan setempat minimal 10 hari kerja sebelum tanggal akad nikah.
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm bg-white/50 p-3 rounded-lg">
                                <strong>Dokumen Wajib:</strong>
                                <ul className="list-disc ml-4 mt-1 space-y-1">
                                    <li>Fotokopi KTP & KK (CPW & CPP)</li>
                                    <li>Fotokopi Ijazah Terakhir</li>
                                    <li>Pas Foto 2x3 & 4x6 (Latar Biru)</li>
                                    <li>Surat Sehat Puskesmas</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
