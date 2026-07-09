"use client"

import { useEffect, useRef, useState } from "react"
import { Montserrat } from "next/font/google"
import { cn } from "@/lib/utils"

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"] })

type BankAccount = { bank: string; no_rek: string; atas_nama: string }
type HeartParticle = { id: number; left: number; top: number; dx: number; rot: number; glyph: string }

const THANK_MESSAGES = [
    "Terima kasih banyak! Semoga kebaikan Anda dibalas berlipat ganda 🤍",
    "Kami sungguh terharu… terima kasih atas kasih sayang Anda! 💛",
    "Doa dan kemurahan hati Anda sangat berarti bagi kami 🤍",
    "Terima kasih! Sampai jumpa di hari bahagia kami ya 💛",
]

// Palet & sprite pixel-art yang sama dengan game "Petualangan Cinta" di section Cerita Cinta.
const CHIBI_PAL: Record<string, string> = {
    k: "#2b241d", h: "#1d1a17", H: "#3a332e", s: "#f0c29a", S: "#d9a87d", e: "#232220",
    u: "#b06a52", w: "#f7f5ee", W: "#d7d3c8", j: "#3d5fa8", J: "#2e4a86", b: "#3a2a1c",
    q: "#aebfd0", Q: "#8ca1b8", o: "#ffffff",
}

const SPR_GROOM_JUMP = [
    "......kkkkkk......",
    "....kkhhhhhhkk....",
    "...khhhhhhhhhhk...",
    "..khhhhhhhhhhhhk..",
    "..khhhhhhhhhhhhk..",
    "..khhHhhhhhhHhhk..",
    "..khhsssssssshhk..",
    ".kshsssssssssshsk.",
    ".kssseessseesssk..",
    ".ksssssssssssssk..",
    "..ksssuuuusssk....",
    "..kksssssssskk....",
    "ksskwwwwwwwwwwkssk",
    ".kkwwwwwwwwwwwwkk.",
    "..kwwWwwwwwWwwk..",
    "...kwwwwwwwwwwk...",
    "...kkwwwwwwwwkk...",
    "....kjjjjjjjjk....",
    "....kjjjjjjjjk....",
    "....kjjjkkjjjk....",
    "...kjjjk..kjjjk...",
    "...kbbk....kbbk...",
    "...kbbk....kbbk...",
    "..................",
]

const SPR_BRIDE_IDLE = [
    "......kkkkkk......",
    "....kkqqqqqqkk....",
    "...kqqqqqqqqqqk...",
    "..kqqqqqqqqqqqqk..",
    "..kqqkkkkkkkkqqk..",
    "..kqksssssssskqk..",
    "..kqksssssssskqk..",
    "..kqkseesseeskqk..",
    "..kqksssssssskqk..",
    "..kqkssuuuusskqk..",
    "..kqqkkkkkkkkqqk..",
    "..kqQqqqqqqqqQqk..",
    ".kqqwwwwwwwwwwqqk.",
    ".kqwwwwwwwwwwwwqk.",
    ".kQwWwwwwwwwwWwQk.",
    ".kkwwwwwwwwwwwwkk.",
    "..kwwwsskksswwwk..",
    "..kwwwwsssswwwwk..",
    "...kwwwwwwwwwwk...",
    "....kjjjjjjjjk....",
    "....kjjjjjjjjk....",
    "....kjjjkkjjjk....",
    "....kjjk..kjjk....",
    "....kbbk..kbbk....",
]

const SPR_BRIDE_WAVE = [
    "......kkkkkk......",
    "....kkqqqqqqkk.ss.",
    "...kqqqqqqqqqqkss.",
    "..kqqqqqqqqqqqqkw.",
    "..kqqkkkkkkkkqqkw.",
    "..kqksssssssskqkw.",
    "..kqksssssssskqkw.",
    "..kqkseesseeskqkw.",
    "..kqksssssssskqkw.",
    "..kqkssuuuusskqkw.",
    "..kqqkkkkkkkkqqkw.",
    "..kqQqqqqqqqqQqkw.",
    ".kqqwwwwwwwwwwqww.",
    ".kqwwwwwwwwwwwwqk.",
    ".kQwWwwwwwwwwWwQk.",
    ".kkwwwwwwwwwwwwkk.",
    "..kwwsswwwwwwwwk..",
    "..kwwwwwwwwwwwwk..",
    "...kwwwwwwwwwwk...",
    "....kjjjjjjjjk....",
    "....kjjjjjjjjk....",
    "....kjjjkkjjjk....",
    "....kjjk..kjjk....",
    "....kbbk..kbbk....",
]

function drawChibi(canvas: HTMLCanvasElement | null, rows: string[], scale: number) {
    if (!canvas) return
    canvas.width = rows[0].length * scale
    canvas.height = rows.length * scale
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < rows[0].length; x++) {
            const ch = rows[y][x]
            if (ch === ".") continue
            ctx.fillStyle = CHIBI_PAL[ch] || "#ff00ff"
            ctx.fillRect(x * scale, y * scale, scale, scale)
        }
    }
}

export default function AmplopDigital({
    accounts, brideNick, groomNick,
}: {
    accounts: BankAccount[]
    brideNick: string
    groomNick: string
}) {
    const [opened, setOpened] = useState(false)
    const [showCards, setShowCards] = useState(false)
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
    const [thanksVisible, setThanksVisible] = useState(false)
    const [thanksMsg, setThanksMsg] = useState(THANK_MESSAGES[0])
    const [particles, setParticles] = useState<HeartParticle[]>([])

    const sceneRef = useRef<HTMLDivElement>(null)
    const brideCanvasRef = useRef<HTMLCanvasElement>(null)
    const groomCanvasRef = useRef<HTMLCanvasElement>(null)
    const msgIdxRef = useRef(0)
    const particleIdRef = useRef(0)
    const waveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const thanksTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (waveIntervalRef.current) clearInterval(waveIntervalRef.current)
        if (thanksTimeoutRef.current) clearTimeout(thanksTimeoutRef.current)
    }, [])

    function burstAt(rect: DOMRect, n: number) {
        const glyphs = ["🤍", "💛", "♥"]
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2
        const newOnes: HeartParticle[] = []
        for (let i = 0; i < n; i++) {
            newOnes.push({
                id: particleIdRef.current++,
                left: cx + (Math.random() - 0.5) * 40,
                top: cy + (Math.random() - 0.5) * 10,
                dx: (Math.random() - 0.5) * 60,
                rot: (Math.random() - 0.5) * 50,
                glyph: glyphs[i % glyphs.length],
            })
        }
        setParticles(prev => [...prev, ...newOnes])
        newOnes.forEach(p => setTimeout(() => setParticles(prev => prev.filter(x => x.id !== p.id)), 1200))
    }

    function openEnvelope() {
        if (opened) return
        setOpened(true)
        if (sceneRef.current) burstAt(sceneRef.current.getBoundingClientRect(), 10)
        setTimeout(() => setShowCards(true), 650)
    }

    function showThanksPopup() {
        setThanksMsg(THANK_MESSAGES[msgIdxRef.current++ % THANK_MESSAGES.length])
        setThanksVisible(true)
        drawChibi(groomCanvasRef.current, SPR_GROOM_JUMP, 4)
        drawChibi(brideCanvasRef.current, SPR_BRIDE_WAVE, 4)

        if (waveIntervalRef.current) clearInterval(waveIntervalRef.current)
        let frame = 0
        waveIntervalRef.current = setInterval(() => {
            frame ^= 1
            drawChibi(brideCanvasRef.current, frame ? SPR_BRIDE_IDLE : SPR_BRIDE_WAVE, 4)
        }, 420)

        if (thanksTimeoutRef.current) clearTimeout(thanksTimeoutRef.current)
        thanksTimeoutRef.current = setTimeout(() => {
            setThanksVisible(false)
            if (waveIntervalRef.current) clearInterval(waveIntervalRef.current)
        }, 4200)
    }

    async function handleCopy(e: React.MouseEvent<HTMLButtonElement>, idx: number, value: string) {
        const rect = e.currentTarget.getBoundingClientRect()
        try {
            await navigator.clipboard.writeText(value)
        } catch {
            // Clipboard API tidak tersedia (jarang terjadi di browser modern) — abaikan, tombol tetap kasih feedback visual.
        }
        setCopiedIdx(idx)
        burstAt(rect, 6)
        showThanksPopup()
        setTimeout(() => setCopiedIdx(prev => (prev === idx ? null : prev)), 1800)
    }

    if (!accounts || accounts.length === 0) return null

    return (
        <div className="amplop-digital-root">
            <style>{`
                .amplop-digital-root .envelope-scene{perspective:900px;margin:0 auto 8px;width:100%;max-width:300px;height:200px;position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent}
                .amplop-digital-root .envelope{position:absolute;inset:0;transition:transform .8s cubic-bezier(.4,0,.2,1),opacity .6s ease .55s}
                .amplop-digital-root .env-back{position:absolute;inset:0;border-radius:8px;background:#F3EDDF;box-shadow:0 18px 45px rgba(46,36,22,.22)}
                .amplop-digital-root .letter{position:absolute;left:14px;right:14px;top:12px;bottom:22px;border-radius:6px;background:#FFFDF7;border:1px solid #D8C79A;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:transform .8s cubic-bezier(.3,.9,.4,1) .45s;padding:12px}
                .amplop-digital-root .letter .mini-eyebrow{font-size:7px;letter-spacing:.4em;color:#B08D42;text-transform:uppercase}
                .amplop-digital-root .letter .names{font-size:22px;font-weight:500;font-family:Georgia,serif}
                .amplop-digital-root .letter .thanks{font-size:12.5px;font-style:italic;color:#6B5D48;line-height:1.4;font-family:Georgia,serif}
                .amplop-digital-root .env-pocket{position:absolute;inset:0;border-radius:8px;background:linear-gradient(155deg,#FAF7EF 0%,#F3EDDF 100%);clip-path:polygon(0 22%,50% 62%,100% 22%,100% 100%,0 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.6)}
                .amplop-digital-root .env-pocket::before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 49.6%,rgba(176,141,66,.28) 50%,transparent 50.4%),linear-gradient(-115deg,transparent 49.6%,rgba(176,141,66,.28) 50%,transparent 50.4%)}
                .amplop-digital-root .env-flap{position:absolute;left:0;right:0;top:0;height:62%;transform-origin:top center;transform:rotateX(0deg);transition:transform .7s cubic-bezier(.55,0,.35,1);z-index:3}
                .amplop-digital-root .env-flap .flap-shape{position:absolute;inset:0;background:linear-gradient(180deg,#F0E9D8,#E7DEC8);clip-path:polygon(0 0,100% 0,50% 100%);border-radius:8px 8px 0 0;box-shadow:0 2px 4px rgba(46,36,22,.12);backface-visibility:hidden}
                .amplop-digital-root .env-flap .flap-inner{position:absolute;inset:0;background:linear-gradient(0deg,#EFE7D4,#E3D9C0);clip-path:polygon(0 0,100% 0,50% 100%);border-radius:8px 8px 0 0;transform:rotateX(180deg);backface-visibility:hidden}
                .amplop-digital-root .seal{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#B65C5C,#9D4A4A 55%,#7C3838);box-shadow:0 4px 10px rgba(124,56,56,.45),inset 0 0 0 4px rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:#F6E7DB;font-size:17px;font-weight:600;letter-spacing:.02em;z-index:4;transition:transform .45s ease,opacity .35s ease;font-family:Georgia,serif}
                .amplop-digital-root .seal::before{content:"";position:absolute;inset:6px;border-radius:50%;border:1px dashed rgba(246,231,219,.5)}
                .amplop-digital-root .tap-hint{font-size:9.5px;letter-spacing:.28em;text-transform:uppercase;color:#6B5D48;margin-top:16px;animation:amplopBounce 2s ease-in-out infinite}
                @keyframes amplopBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
                .amplop-digital-root .envelope-scene.open .env-flap{transform:rotateX(180deg)}
                .amplop-digital-root .envelope-scene.open .seal{transform:translate(-50%,-50%) scale(.4) rotate(-18deg);opacity:0}
                .amplop-digital-root .envelope-scene.open .letter{transform:translateY(-58px)}
                .amplop-digital-root .envelope-scene.open{cursor:default}
                .amplop-digital-root .scene-wrap.done .envelope-scene{height:150px;transition:height .6s ease .8s}
                .amplop-digital-root .scene-wrap.done .envelope{transform:translateY(26px) scale(.86);opacity:.9}
                .amplop-digital-root .scene-wrap.done .tap-hint{opacity:0;transition:opacity .3s}
                .amplop-digital-root .cards{display:flex;flex-direction:column;gap:14px;margin-top:26px;max-height:0;overflow:hidden;opacity:0;transition:max-height 1s ease .75s,opacity .8s ease .85s}
                .amplop-digital-root .scene-wrap.done .cards{max-height:1400px;opacity:1}
                .amplop-digital-root .bank-card{position:relative;border-radius:16px;padding:20px 20px 16px;text-align:left;color:#F3EFE4;overflow:hidden;background:linear-gradient(135deg,#24463A 0%,#1c372e 60%,#12241d 100%);box-shadow:0 12px 28px rgba(36,48,41,.35);opacity:0;transform:translateY(26px)}
                .amplop-digital-root .bank-card.alt{background:linear-gradient(135deg,#F6F0E1 0%,#EFE6D0 100%);color:#2E2416;box-shadow:0 12px 28px rgba(176,141,66,.28)}
                .amplop-digital-root .scene-wrap.done .bank-card{animation:amplopRise .7s cubic-bezier(.2,.9,.3,1.2) forwards}
                .amplop-digital-root .scene-wrap.done .bank-card:nth-child(1){animation-delay:1.0s}
                .amplop-digital-root .scene-wrap.done .bank-card:nth-child(2){animation-delay:1.2s}
                .amplop-digital-root .scene-wrap.done .bank-card:nth-child(3){animation-delay:1.4s}
                .amplop-digital-root .scene-wrap.done .bank-card:nth-child(4){animation-delay:1.6s}
                @keyframes amplopRise{to{opacity:1;transform:translateY(0)}}
                .amplop-digital-root .bank-card::before{content:"";position:absolute;right:-30px;top:-30px;width:150px;height:150px;border:1px solid rgba(216,199,154,.25);border-radius:50%}
                .amplop-digital-root .bank-card::after{content:"";position:absolute;right:-10px;top:-52px;width:150px;height:150px;border:1px solid rgba(216,199,154,.18);border-radius:50%}
                .amplop-digital-root .card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
                .amplop-digital-root .bank-name{font-weight:600;font-size:13px;letter-spacing:.14em}
                .amplop-digital-root .chip{width:34px;height:25px;border-radius:5px;background:linear-gradient(135deg,#E5C878,#B08D42 55%,#8F7132);position:relative;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
                .amplop-digital-root .chip::before{content:"";position:absolute;left:0;right:0;top:11px;height:1px;background:rgba(0,0,0,.25)}
                .amplop-digital-root .chip::after{content:"";position:absolute;top:0;bottom:0;left:15px;width:1px;background:rgba(0,0,0,.25)}
                .amplop-digital-root .acc-number{font-size:19px;font-weight:500;letter-spacing:.12em;margin-bottom:14px;word-spacing:.2em}
                .amplop-digital-root .card-bottom{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
                .amplop-digital-root .holder .label{font-size:7.5px;letter-spacing:.3em;opacity:.65;text-transform:uppercase;margin-bottom:3px}
                .amplop-digital-root .holder .name{font-size:15px;letter-spacing:.02em;font-family:Georgia,serif}
                .amplop-digital-root .copy-btn{font-size:9.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;border:none;border-radius:999px;padding:9px 16px;cursor:pointer;background:#B08D42;color:#fff;transition:transform .12s ease,background .2s;flex-shrink:0}
                .amplop-digital-root .bank-card.alt .copy-btn{background:#2E2416;color:#FAF7EF}
                .amplop-digital-root .copy-btn:active{transform:scale(.94)}
                .amplop-digital-root .copy-btn.copied{background:#5F8F6A}
                .amplop-digital-root .thanks-pop{position:fixed;left:50%;bottom:-240px;transform:translateX(-50%);z-index:98;display:flex;flex-direction:column;align-items:center;transition:bottom .55s cubic-bezier(.2,1.1,.3,1);pointer-events:none}
                .amplop-digital-root .thanks-pop.show{bottom:18px}
                .amplop-digital-root .bubble{background:#FFFDF7;border:1px solid #D8C79A;border-radius:14px;padding:12px 18px;max-width:290px;text-align:center;font-size:14px;font-style:italic;line-height:1.5;color:#2E2416;box-shadow:0 10px 28px rgba(46,36,22,.22);position:relative;margin-bottom:12px;font-family:Georgia,serif}
                .amplop-digital-root .bubble::after{content:"";position:absolute;left:50%;bottom:-7px;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:#FFFDF7;border-right:1px solid #D8C79A;border-bottom:1px solid #D8C79A}
                .amplop-digital-root .bubble .sign{display:block;margin-top:5px;font-style:normal;font-size:8.5px;letter-spacing:.3em;color:#B08D42;text-transform:uppercase}
                .amplop-digital-root .chibi-row{display:flex;align-items:flex-end;gap:10px}
                .amplop-digital-root .chibi-row canvas{image-rendering:pixelated;filter:drop-shadow(0 6px 8px rgba(46,36,22,.3))}
                .amplop-digital-root .chibi-jump{animation:amplopChibiHop .9s ease-in-out infinite}
                @keyframes amplopChibiHop{0%,100%{transform:translateY(0)}45%,55%{transform:translateY(-14px)}}
                .amplop-digital-root .heart-p{position:fixed;pointer-events:none;font-size:14px;z-index:99;animation:amplopFloatUp 1.1s ease-out forwards}
                @keyframes amplopFloatUp{0%{opacity:1;transform:translate(0,0) scale(.6) rotate(0deg)}100%{opacity:0;transform:translate(var(--dx),-70px) scale(1.15) rotate(var(--rot))}}
                @media (prefers-reduced-motion:reduce){.amplop-digital-root *,.amplop-digital-root *::before,.amplop-digital-root *::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
            `}</style>

            <div className={cn("scene-wrap", showCards && "done")}>
                <div
                    ref={sceneRef}
                    className={cn("envelope-scene", opened && "open")}
                    role="button"
                    aria-label="Buka amplop digital"
                    tabIndex={0}
                    onClick={openEnvelope}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openEnvelope() }}
                >
                    <div className="envelope">
                        <div className="env-back" />
                        <div className="letter">
                            <div className={cn("mini-eyebrow", montserrat.className)}>With Love</div>
                            <div className="names">{brideNick} &amp; {groomNick}</div>
                            <div className="thanks">Terima kasih atas kasih<br />&amp; kemurahan hati Anda</div>
                        </div>
                        <div className="env-pocket" />
                        <div className="env-flap">
                            <div className="flap-shape" />
                            <div className="flap-inner" />
                        </div>
                        <div className="seal">{brideNick[0]}&hearts;{groomNick[0]}</div>
                    </div>
                </div>
                <div className={cn("tap-hint", montserrat.className)}>&mdash; Ketuk segel untuk membuka &mdash;</div>

                <div className="cards">
                    {accounts.map((acc, idx) => {
                        const spaced = acc.no_rek.replace(/(\d{4})(?=\d)/g, "$1 ")
                        const alt = idx % 2 === 1
                        return (
                            <div key={idx} className={cn("bank-card", alt && "alt")}>
                                <div className="card-top">
                                    <span className={cn("bank-name", montserrat.className)}>{acc.bank}</span>
                                    <span className="chip" />
                                </div>
                                <div className={cn("acc-number", montserrat.className)}>{spaced}</div>
                                <div className="card-bottom">
                                    <div className="holder">
                                        <div className={cn("label", montserrat.className)}>Atas Nama</div>
                                        <div className="name">{acc.atas_nama}</div>
                                    </div>
                                    <button
                                        className={cn("copy-btn", montserrat.className, copiedIdx === idx && "copied")}
                                        onClick={(e) => handleCopy(e, idx, acc.no_rek)}
                                    >
                                        {copiedIdx === idx ? "Tersalin ✓" : "Salin"}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className={cn("thanks-pop", thanksVisible && "show")}>
                <div className="bubble">
                    <span>{thanksMsg}</span>
                    <span className={cn("sign", montserrat.className)}>&mdash; {brideNick} &amp; {groomNick} &mdash;</span>
                </div>
                <div className="chibi-row">
                    <canvas ref={brideCanvasRef} />
                    <canvas ref={groomCanvasRef} className="chibi-jump" />
                </div>
            </div>

            {particles.map(p => (
                <span
                    key={p.id}
                    className="heart-p"
                    style={{ left: p.left, top: p.top, ["--dx" as unknown as string]: `${p.dx}px`, ["--rot" as unknown as string]: `${p.rot}deg` }}
                >
                    {p.glyph}
                </span>
            ))}
        </div>
    )
}
