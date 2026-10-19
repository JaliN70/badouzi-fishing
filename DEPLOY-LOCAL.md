# 本機說明（Mac / Windows）

## 放到 `AJ-LIFE` 資料夾

```bash
mkdir -p ~/AJ-LIFE
git clone https://github.com/JaliN70/badouzi-fishing.git ~/AJ-LIFE/badouzi-fishing
cd ~/AJ-LIFE/badouzi-fishing
npm install
npm run dev
```

瀏覽器開啟：`http://127.0.0.1:43123`

Windows PowerShell 範例：

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\AJ-LIFE"
git clone https://github.com/JaliN70/badouzi-fishing.git "$env:USERPROFILE\AJ-LIFE\badouzi-fishing"
cd "$env:USERPROFILE\AJ-LIFE\badouzi-fishing"
npm install
npm run dev
```

---

# 本機部署到 GitHub Pages（你已登入 GitHub 時）

在 **Mac / Windows 本機 Terminal** 執行（需已安裝 [Git](https://git-scm.com/) 與 [Node.js](https://nodejs.org/)，GitHub 部署另需 [GitHub CLI](https://cli.github.com/) 且 `gh auth status` 已登入）。

## 一次完成

```bash
cd ~/AJ-LIFE/badouzi-fishing   # 或你的專案路徑
gh repo create badouzi-fishing --public --source=. --remote=github --push
```

若 GitHub 上已有同名 repo，改為只推送：

```bash
git remote add github https://github.com/你的帳號/badouzi-fishing.git
git push -u github main
```

## 開啟 GitHub Pages

1. 打開 `https://github.com/你的帳號/badouzi-fishing`
2. **Settings → Pages → Build and deployment**
3. **Source** 選 **GitHub Actions**
4. 到 **Actions** 分頁，等 **Deploy GitHub Pages** 跑完（約 1–2 分鐘）

## 遊戲網址

`https://你的帳號.github.io/badouzi-fishing/`

之後在本機改程式並推送：

```bash
git add -A && git commit -m "更新" && git push github main
```

Actions 會自動重新部署。
