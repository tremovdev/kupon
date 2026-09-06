# Kupon — Logo & Brand Asset Prompts

> Brand direction: **"Sovereign Certificate"** — Indonesian retail government bond heritage
> (guilloche engravings, certificate seals, serial numbers) rendered crypto-native.
> Palette lock: emerald `#0E5E4A` · gold `#C9A227` · ivory `#FAF6EC` · ink `#14201C`.
> Type pairing: high-contrast serif (Fraunces-class) for display · Inter for body ·
> tabular mono (IBM Plex Mono-class) for amounts/serials.
>
> Prompts follow the GPT Image 2 formula (TASK→SCENE→SUBJECT→COMPOSITION→STYLE→
> LIGHTING→TEXT→CONSTRAINTS). Any engine works — keep the CONSTRAINTS line.

---

## 1. Primary seal mark (logo utama)

```
Model:    gpt-image-2
Quality:  medium
Size:     1024x1024
n:        4

Prompt:
Flat vector logo mark for "Kupon", an Indonesian retail government bond token.
SUBJECT: a circular certificate seal built from fine engraved guilloche rosette
lines (banknote-style interlaced curves), with a bold high-contrast serif letter
"K" monogram centered inside, and a thin gold outer ring with small notches like
a mint mark.
COMPOSITION: perfectly centered, generous negative space, mark fills ~60% of
the frame, view straight-on.
STYLE: clean vector-like shapes, crisp uniform line weights, heritage security-
printing engraving feel, flat colors only — deep emerald #0E5E4A and metallic
gold #C9A227 on solid ivory #FAF6EC background.
LIGHTING: none — flat print colors, no shadows, no glow.
TEXT: no text, no letters other than the single "K" monogram.
CONSTRAINTS: no gradients, no 3D render, no glow, no coin imagery, no Bitcoin
references, no blockchain-hexagon clichés, no watermark, no drop shadow, no
photorealism, no texture noise. Balanced negative space.
```

## 2. Wordmark lockup (untuk header landing / OG)

```
Model:    gpt-image-2
Quality:  high
Size:     1536x1024
n:        4

Prompt:
Elegant horizontal logo lockup on solid ivory #FAF6EC background for "Kupon",
an Indonesian retail government bond tokenized onchain.
SUBJECT: the word "KUPON" set in a high-contrast modern serif (Fraunces-class,
sharp wedge serifs), ink #14201C letters, with a small deep-emerald #0E5E4A
circular guilloche seal containing a gold "K" positioned left of the wordmark.
Below the wordmark, one thin gold rule line, then small letter-spaced caps
subtitle: "SBN RITEL 2027 · ONCHAIN".
COMPOSITION: horizontal lockup centered, generous margins, straight-on view.
STYLE: flat vector, premium security-certificate aesthetic, crisp lines, two
ink colors only (emerald and gold) on ivory.
TEXT: exactly "KUPON" and exactly "SBN RITEL 2027 · ONCHAIN" — spell both
letter by letter, no other text anywhere.
CONSTRAINTS: no gradients, no 3D, no shadows, no watermark, no photorealism,
no extra decorative text, no taglines, balanced negative space.
```

## 3. Favicon / app-icon monogram (harus terbaca di 16px)

```
Model:    gpt-image-2
Quality:  medium
Size:     1024x1024
n:        4

Prompt:
Ultra-minimal flat app icon. SUBJECT: a bold serif letter "K" in gold #C9A227
centered on a deep emerald #0E5E4A rounded-square tile, with one thin ivory
inner border inset like a certificate frame.
COMPOSITION: "K" fills ~55% of the tile, perfectly centered.
STYLE: flat vector, zero fine detail — must stay legible when scaled to 16px.
TEXT: only the letter "K".
CONSTRAINTS: no gradients, no guilloche fine lines, no shadows, no gloss, no
3D, no watermark, no other elements. High contrast.
```

## 4. Hero / OG background texture (1536×630 crop source)

```
Model:    gpt-image-2
Quality:  medium
Size:     1536x1024
n:        4

Prompt:
Seamless elegant background pattern for a bond-certificate themed website hero.
SUBJECT: intricate engraved guilloche rosettes and interlaced banknote line
patterns, very low contrast, in pale emerald #0E5E4A at ~8% opacity on ivory
#FAF6EC, with a few faint gold #C9A227 hairline concentric arcs.
COMPOSITION: pattern fills the entire frame evenly, no focal object, large
quiet area in the middle for text overlay.
STYLE: security-printing engraving, flat print, vector-like precision.
LIGHTING: none — flat print colors.
TEXT: no text, no numbers, no seals with letters.
CONSTRAINTS: no gradients, no 3D, no photorealism, no dark backgrounds, no
watermark, must remain light enough for dark ink text to sit on top.
```

---

## Setelah generate — checklist integrasi (dikerjakan di T13e)

- [ ] Pilih 1 seal + 1 favicon (konsisten satu keluarga bentuk)
- [ ] Rapikan/crop → ekspor: `logo-mark.svg` (trace manual jika perlu), `favicon.ico` (16/32/48), `apple-icon.png` 180px, `icon-192.png`/`512.png`
- [ ] OG image 1200×630: komposisikan wordmark + tagline di atas texture #4 (boleh manual di Figma)
- [ ] Simpan asli hasil generate di `branding/raw/` (jangan di-commit jika >1MB — kompres dulu)
- [ ] Metadata: `getMetadata.ts` title/description + `scaffold.config.ts` app name → "Kupon"
```
