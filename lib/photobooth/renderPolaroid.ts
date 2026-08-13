// Menggabungkan jepretan tamu dengan bingkai polaroid menjadi satu gambar siap unduh.
//
// Sengaja tanpa React supaya gampang diuji dan dipanggil dari mana saja, mengikuti
// gaya lib/compressImage.ts.

import type { Frame } from "./frames"

export type PolaroidCaption = { names: string; date: string }

// JPEG dipilih daripada PNG/WebP: ukurannya jauh lebih kecil untuk foto, dan paling
// aman diterima Instagram Story maupun galeri bawaan HP.
const MIME = "image/jpeg"
const QUALITY = 0.92

const INK = "#2B2B26"
const INK_SOFT = "#B08D57"

// letterSpacing belum ada di definisi tipe DOM bawaan TypeScript dan belum ada di
// browser lawas. Kalau tidak didukung, propertinya diabaikan dan teks tetap tampil,
// hanya tanpa jarak huruf.
function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value
}

/** Menggambar sumber ke kotak tujuan dengan perilaku `object-fit: cover`. */
function drawCover(
    ctx: CanvasRenderingContext2D,
    src: CanvasImageSource,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
) {
    const scale = Math.max(dw / sw, dh / sh)
    const cropW = dw / scale
    const cropH = dh / scale
    ctx.drawImage(src, (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, dx, dy, dw, dh)
}

async function loadFrameImage(src: string): Promise<HTMLImageElement> {
    const img = new Image()
    // Aset bingkai satu origin dengan aplikasi, jadi kanvas tidak ikut ter-taint.
    img.src = src
    await img.decode()
    return img
}

/**
 * Memasang font sambil mengecilkannya sampai teks muat. Nama mempelai panjang
 * ("Muhammad Faisal & Ditta Anggraini") kalau tidak dikecilkan akan terpotong tepi.
 */
function fitFont(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    font: (size: number) => string,
    startSize: number,
) {
    let size = startSize
    ctx.font = font(size)
    while (ctx.measureText(text).width > maxWidth && size > startSize * 0.4) {
        size -= 2
        ctx.font = font(size)
    }
}

function drawCaption(ctx: CanvasRenderingContext2D, frame: Frame, caption: PolaroidCaption) {
    if (!frame.caption) return

    const { width: w, height: h } = frame
    const top = frame.caption.y * h
    const boxH = frame.caption.h * h
    const center = w / 2

    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    setLetterSpacing(ctx, `${Math.round(w * 0.012)}px`)
    ctx.fillStyle = INK_SOFT
    ctx.font = `${Math.round(w * 0.026)}px Georgia, "Times New Roman", serif`
    ctx.fillText("THE WEDDING OF", center, top + boxH * 0.24)

    setLetterSpacing(ctx, "0px")
    ctx.fillStyle = INK
    fitFont(
        ctx,
        caption.names,
        w * 0.86,
        size => `italic ${size}px Georgia, "Times New Roman", serif`,
        Math.round(w * 0.082),
    )
    ctx.fillText(caption.names, center, top + boxH * 0.55)

    setLetterSpacing(ctx, `${Math.round(w * 0.008)}px`)
    ctx.fillStyle = INK_SOFT
    ctx.font = `${Math.round(w * 0.024)}px Georgia, "Times New Roman", serif`
    ctx.fillText(caption.date.toUpperCase(), center, top + boxH * 0.82)
    setLetterSpacing(ctx, "0px")
}

/**
 * @param photos Jepretan tamu, urut sesuai slot. Kelebihan foto diabaikan,
 *               slot yang tak kebagian foto dibiarkan putih.
 */
export async function renderPolaroid(
    frame: Frame,
    photos: ImageBitmap[],
    caption: PolaroidCaption,
): Promise<Blob> {
    const canvas = document.createElement("canvas")
    canvas.width = frame.width
    canvas.height = frame.height

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Kanvas tidak didukung di browser ini.")

    // JPEG tidak punya alpha; tanpa dasar putih, area transparan jadi hitam.
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, frame.width, frame.height)

    frame.slots.forEach((slot, i) => {
        const photo = photos[i]
        if (!photo) return
        drawCover(
            ctx,
            photo,
            photo.width,
            photo.height,
            slot.x * frame.width,
            slot.y * frame.height,
            slot.w * frame.width,
            slot.h * frame.height,
        )
    })

    const frameImg = await loadFrameImage(frame.src)
    ctx.drawImage(frameImg, 0, 0, frame.width, frame.height)

    drawCaption(ctx, frame, caption)

    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, MIME, QUALITY))
    if (!blob) throw new Error("Gagal membuat gambar polaroid.")
    return blob
}
