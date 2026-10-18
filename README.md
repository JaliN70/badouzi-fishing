# 帥帥與阿公 · 基隆夜釣記

基隆 **八斗子突堤** 與 **潮境公園** 的輕量夜釣模擬，主角是 **帥帥** 與 **阿公**。3D 場景以 1 公尺為單位建模，並使用草地、消波塊、磚道、玻璃長廊等**貼圖材質**方便對照實地。魚種參考八斗子、碧砂、潮境近海（圖鑑共 19 種）。

## 玩法

1. **選擇釣點** → 八斗子突堤或潮境公園（主選單可切換）  
2. **開始故事** → 跟阿公一起夜釣  
3. **拋竿**：力道指標在綠色區域時按下  
4. **等浮標**：耐心等魚咬餌  
5. **刺魚**：浮標下沉時快速按「刺魚」  
6. **收線**：連按「收線」拉高進度，注意線張力不要過高  
7. **魚類圖鑑**：主選單或釣魚中開啟圖鑑，成功釣起的魚種會自動登錄；每種魚會記錄**最大釣獲重量**，並顯示全圖鑑最高紀錄  

累計尾數、重量與圖鑑進度會存在本機（`localStorage`）。

## 本地執行

```bash
npm install
npm run dev
```

預設：`http://127.0.0.1:43123`

## 建置

```bash
npm run build
npm run preview
```

## 部署（Git）

程式已推送到 Git 遠端後，可選以下方式發布：

### Vercel（建議）

1. 在 Cursor 對話中按 **Publish**，或到 [vercel.com](https://vercel.com) 匯入此 Git  repository  
2. 建置指令：`npm run build`  
3. 輸出目錄：`dist`  
4. 專案根目錄已含 `vercel.json`，通常無需再改設定  

### GitHub Pages

**已在本機登入 GitHub？** 見 [DEPLOY-LOCAL.md](./DEPLOY-LOCAL.md)（複製貼上即可）。

或手動步驟：

1. 在 Cursor 按 **Create repo**（或到 [cursor.com/codebase](https://cursor.com/codebase) 建立 GitHub repository，建議名稱 `badouzi-fishing`）  
2. 在本機執行（將 `你的帳號/badouzi-fishing` 換成實際 repo）：

```bash
chmod +x scripts/setup-github-pages.sh
./scripts/setup-github-pages.sh 你的帳號/badouzi-fishing
```

3. GitHub → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**  
4. 推送 `main` 後 workflow `.github/workflows/deploy-pages.yml` 會建置並部署  
5. 網址：`https://<使用者>.github.io/<repo名稱>/`

本地若需模擬 Pages 子路徑建置：

```bash
VITE_BASE=/badouzi-fishing/ npm run build
```

## 技術

- Vite + TypeScript + Three.js（俯視 3D 場景）
