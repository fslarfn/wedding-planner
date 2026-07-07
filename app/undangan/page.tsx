import { Suspense } from "react"
import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import InvitationView from "@/components/InvitationView"

export async function generateMetadata(): Promise<Metadata> {
    const { data } = await supabase.from('invitation_settings').select('*').order('updated_at', { ascending: true }).limit(1).maybeSingle()

    const groom = data?.groom_nickname || data?.groom_name || "Mempelai Pria"
    const bride = data?.bride_nickname || data?.bride_name || "Mempelai Wanita"
    const title = `Undangan Pernikahan ${groom} & ${bride}`
    const description = "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari bahagia kami."
    const image = data?.cover_photo_url || undefined

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: image ? [image] : undefined,
        },
    }
}

export default function UndanganPage() {
    return (
        <Suspense fallback={<div className="h-dvh w-full flex items-center justify-center text-slate-400">Memuat undangan...</div>}>
            <InvitationView />
        </Suspense>
    )
}
