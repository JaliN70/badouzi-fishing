# 帥帥與阿公 · 八斗子釣魚記

基隆 **八斗子** 漁港邊的輕量釣魚模擬，主角是 **帥帥** 與 **阿公**。在手機瀏覽器體驗拋竿、等咬、刺魚與收線，魚種參考當地近海常見的魚。

## 玩法

1. **開始故事** → 跟阿公一起來到堤岸  
2. **魚類圖鑑** → 主選單或釣魚中點「圖鑑」，成功釣起的魚種會自動登錄（本機保存）  
2. **拋竿**：力道指標在綠色區域時按下  
3. **等浮標**：耐心等魚咬餌  
4. **刺魚**：浮標下沉時快速按「刺魚」  
5. **收線**：連按「收線」拉高進度，注意線張力不要過高  

累計尾數與重量會存在本機（`localStorage`）。

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
