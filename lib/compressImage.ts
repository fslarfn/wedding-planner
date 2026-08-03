// Kompresi foto di browser sebelum diupload ke Supabase Storage.
//
// Foto dari kamera/HP bisa 4000x6000 dan 24MB, padahal undangan tidak pernah
// menampilkannya lebih dari ~2000px. next/image sudah mengecilkan saat penyajian,
// tapi file raksasanya tetap memakan kuota storage — jadi dipangkas sejak upload.

// Cukup untuk layar retina full-screen sekaligus lightbox.
const MAX_DIM = 2000
// Di bawah ini dianggap sudah ringan; encode ulang cuma menurunkan kualitas tanpa guna.
const SKIP_BELOW_BYTES = 400 * 1024
const QUALITY = 0.82

export async function compressImage(file: File, maxDim: number = MAX_DIM): Promise<File> {
    if (!file.type.startsWith("image/")) return file
    // GIF animasi jadi satu frame kalau lewat canvas, SVG jadi raster. Biarkan apa adanya.
    if (file.type === "image/gif" || file.type === "image/svg+xml") return file

    let bitmap: ImageBitmap
    try {
        // "from-image" memastikan rotasi EXIF ikut diterapkan, kalau tidak foto
        // potrait dari HP bisa terupload dalam posisi miring.
        bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    } catch {
        return file // browser lawas atau format tak terbaca — upload aslinya saja
    }

    try {
        const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
        if (scale === 1 && file.size <= SKIP_BELOW_BYTES) return file

        const w = Math.round(bitmap.width * scale)
        const h = Math.round(bitmap.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (!ctx) return file
        ctx.drawImage(bitmap, 0, 0, w, h)

        // WebP dipilih daripada JPEG supaya PNG bertransparansi tidak jadi latar hitam.
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/webp", QUALITY))

        // Kalau encoder gagal, atau hasilnya justru lebih besar (foto kecil yang
        // sudah teroptimasi), pakai file asli.
        if (!blob || blob.size >= file.size) return file

        const name = file.name.replace(/\.[^.]+$/, "") + ".webp"
        return new File([blob], name, { type: "image/webp", lastModified: Date.now() })
    } finally {
        bitmap.close()
    }
}
