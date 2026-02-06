"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email)
        .single()

      if (error || !data) {
        // BYPASS KHUSUS DEVELOPER (Agar bisa login tanpa setup DB)
        if (email === "admin@demo.com") {
          const devUser = { id: "dev-001", email: "admin@demo.com", name: "Developer", role: "Planner" }
          localStorage.setItem("wedding_user", JSON.stringify(devUser))
          setMessage({ text: "Login Mode Developer...", type: "success" })
          setTimeout(() => router.push("/dashboard"), 1000)
          return
        }

        setMessage({ text: "Email tidak terdaftar. Hubungi admin.", type: "error" })
        return
      }

      localStorage.setItem("wedding_user", JSON.stringify(data))
      setMessage({ text: "Login berhasil! Mengalihkan...", type: "success" })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)

    } catch (err: any) {
      setMessage({ text: "Terjadi kesalahan sistem.", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-bold text-slate-900">Wedding Planner</CardTitle>
          <p className="text-xl text-slate-600 mt-2">
            Isal <span className="text-blue-600">❤️</span> Ditta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-center text-gray-500">
                Masukkan email yang terdaftar untuk melanjutkan.
              </p>
              <Input
                type="email"
                placeholder="Masukkan email terdaftar Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="py-6 text-lg"
              />
            </div>

            <Button
              type="submit"
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? "Memverifikasi..." : "Masuk"}
            </Button>

            {message && (
              <p className={`text-center text-sm font-medium ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {message.text}
              </p>
            )}

            <p className="text-xs text-center text-gray-400 mt-4">
              Email yang boleh login diatur di database sistem.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
