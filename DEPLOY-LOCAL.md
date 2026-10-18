# 本機部署到 GitHub Pages（你已登入 GitHub 時）

在 **Mac / Windows 本機 Terminal** 執行（需已安裝 [Git](https://git-scm.com/) 與 [GitHub CLI](https://cli.github.com/)，且 `gh auth status` 顯示已登入）。

## 一次完成

```bash
git clone https://origin.cursor.com/jalin-you/tmp-83577919acd41ed6.git badouzi-fishing
cd badouzi-fishing
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
