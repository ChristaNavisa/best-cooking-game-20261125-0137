# 🍳 Ember & Thyme — Dapur Pasar Malam

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ChristaNavisa/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ChristaNavisa/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

Game masak 2D original yang jalan offline di desktop Chrome dari static files —
tanpa network request. Kamu koki di warung pasar malam: ambil bahan dari pantry,
iris di talenan, panggang patty di panggangan, rakit hidangan di meja rakit, lalu
sajikan di jendela saji sebelum pesanan di papan pesanan hangus.

## Cara main

- **WASD / panah** — gerakkan koki (atau klik lantai / stasiun untuk jalan ke sana)
- **E / klik stasiun** — pakai stasiun: ambil bahan, iris, panggang, rakit, sajikan
- **Q** — buang item di tangan, **M** — bisu, **R** — main lagi setelah shift selesai

## Resep

| Hidangan | Bahan |
| --- | --- |
| Sunset Burger | roti + patty panggang + tomat iris + selada iris |
| Ember Melt | roti + patty panggang + keju |
| Garden Stack | roti + selada iris + tomat iris + keju |
| Crisp Salad | selada iris + tomat iris + keju |

Shift 3 menit. Sajikan cepat untuk bonus sempurna dan kombo; pesanan yang
hangus mengurangi koin.

## Jalankan lokal

```sh
python3 -m http.server 8080 --directory game
# buka http://localhost:8080 di Chrome
```

Semua art digambar dengan Canvas 2D dan semua suara disintesis WebAudio —
tidak ada aset eksternal. Screenshot di `screenshots/` adalah render asli game
ini (`?shot=cover|chop|grill|serve` mengatur staging-nya).

## Entri

Kompetisi make.fun: **Make the best cooking game** (`best-cooking-game-20261125-0137`).
`main.ts` di root menyalin `game/` + `screenshots/` ke `/output` dan menulis
`/output/dossier.json` via `vendor/makefun-game.ts`.

Lisensi: MIT.
