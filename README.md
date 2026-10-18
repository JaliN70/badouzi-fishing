# 極光衝刺

適合手機瀏覽器的觸控閃避小遊戲。用手指在畫面上左右拖曳，控制飛船避開從上方落下的隕石；時間越久分數越高，難度也會逐漸提升。

## 功能

- 全螢幕 Canvas 遊戲，針對觸控與安全區域（瀏海、Home 指示條）優化
- 三條命、受傷短暫無敵、本地最高紀錄（`localStorage`）
- 開始畫面、遊戲中 HUD、結束畫面

## 本地執行

需要 [Node.js](https://nodejs.org/) 18 或以上。

```bash
npm install
npm run dev
```

在瀏覽器開啟終端機顯示的網址（預設 `http://127.0.0.1:43123`）。用手機測試時，請在同一 Wi‑Fi 下以電腦 IP 連線，或使用隧道工具轉發該 port。

## 建置

```bash
npm run build
npm run preview
```

## 技術

- [Vite](https://vite.dev/) + TypeScript
- 原生 Canvas 2D，無額外遊戲引擎
