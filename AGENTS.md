# AGENTS.md — dsh-fullscreen-settings

> 给**接手这个仓库的 Agent** 的交接笔记。面向用户的文档是 [README.md](README.md) / [README.en.md](README.en.md)，
> 本文件是内部笔记，可以写实现细节、踩坑和本机环境。
> 最后核对：2026-10-01，对应 `v0.1.6`。

## 0. 一句话

DSH 的设置默认是屏幕中央的 800×800 弹窗；本插件把它改成 **Codex 风格的整页全屏**，并把退出入口挪到
**左上角的一整行按钮**（箭头 + 「设置」同处一个色块，点哪都能返回）。纯客户端插件，**不修改官方任何文件**。

## 1. 项目坐标

| 项 | 值 |
|---|---|
| 本地开发副本 | `~/Desktop/dsh-fullscreen-settings`（**唯一副本**，别再 clone 第二份） |
| 远端 | https://github.com/functy23/dsh-fullscreen-settings （public） |
| npm | `dsh-fullscreen-settings`，发布账号 **`funlze`**（≠ GitHub 的 functy23） |
| 当前版本 | `0.1.6`（git tag `v0.1.6`） |
| 许可 | MIT © 2026 Functy |

## 2. 本机环境事实（先核实，别照抄）

- **PATH 里没有 node/pnpm**：先 `export PATH=/opt/homebrew/bin:$PATH`。`node` v26、`npm` 11.19 在 `/opt/homebrew/bin`。
- **pnpm 不在 PATH**：需要时一律 `npx --yes pnpm@11.8.0 …`（与 DSH NEXT 内置的 pnpm 同版本，别的版本会因 store 不同报错）。
- `dsh` CLI 在 `~/.local/bin/dsh`（应用生成的 shim，不在默认 PATH）。
- 走代理：`HTTPS_PROXY=http://127.0.0.1:7890`、`NODE_USE_ENV_PROXY=1`；npm / gh / pnpm 都走它。
- `DSH_HOME=~/.dsh`，本机只有 `desktop` 一个 profile；应用是 **DSH NEXT 2.0.16-next**，宿主 DSH **0.2.0-rc.1**。

## 3. 插件是怎么被装载的（改任何东西之前先读懂这节）

宿主半边是空的（`lib/index.js` 只有空 `apply()`），全部逻辑在浏览器半边 `lib/client.js`。

**装得上 = `dsh.bundle.patch`**。安装器（应用内插件页 / `dsh plugin add`）只有看到
`package.json` 里声明了 `dsh.bundle.patch`，才会把这个包当成 **profile 层**：写进 profile 的
`dsh.profile.bundles` 并应用这份补丁。**只声明 `dsh.client` 的包会被当成普通依赖下载下来，但永远不会挂载**
（v0.1.1 及以前就是这样，装完等于没装 —— 这是历史上最大的坑）。

```jsonc
// package.json
"dsh": {
  "bundle": { "patch": "./cordis.patch.yml" },   // ← 必须；决定能不能挂载
  "client": { "platform": "web" }                // ← 浏览器半边
}
```

```yaml
# cordis.patch.yml —— profile 层补丁，把插件本体插进 profile 树
- insert:
    - id: ui-fullscreen-settings
      name: dsh-fullscreen-settings
```

浏览器半边由 `@deepseek-ai/dsh-client-modules` 扫描宿主 Loader 的条目得到，模块 id **必须等于包名**
（`window.__ModuleLoader__.load({ id: 'dsh-fullscreen-settings' })`）。

## 4. 代码地图（`lib/client.js`，约 150 行，无构建步骤）

只做两件事，互不耦合：

1. **注入一段 CSS**（文件里那个 `STYLE` 常量）。选择器全部锚在**产品自带属性**
   `div[data-shortcut-modal="settings"]` 与元素结构（`> nav` / `> div`）上，
   **绝不使用 CSS Modules 的哈希类名**（形如 `I9ZhnW_panel`），产品换构建也不会失效。
   要覆盖的布局点：面板 `100vw×100vh`、遮罩 `display:none`、左栏 248px、内容头收掉官方关闭键、
   内容列 `max-width:880px`、顶部按 `--dsh-frame-top-clearance` 让开 macOS 红绿灯（那条留白兼作拖动条）。
2. **遮蔽 `settings.header` 这个 single 槽的官方占用者**：single 槽「**最低 priority 渲染**」，
   官方占用者是 priority 0，本插件用 `-1000` 顶掉它，改渲染左上角那一个整行 `<button>`。

关闭动作调 `@deepseek-ai/dsh-client-ui-primitives` 的 `closeTopModal(document)` —— 官方设置快捷键用的
同一个函数；失败时退回点击官方关闭按钮。**不要**自己写 Escape/遮罩点击之类的替代逻辑。

依赖全部 try/catch 兜底：primitives 缺失、locale 不可用时插件仍能工作。

## 5. 常用命令

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/Desktop/dsh-fullscreen-settings

node --check lib/client.js      # 语法
node --test tests/              # 4 个用例：注册 / 样式 / 整行按钮 / 兜底（零依赖，秒级）
```

改完生效方式见下节。

## 6. 本机怎么让它生效（两种挂载，只能选一种）

| | 开发挂载（改完刷新即生效） | 安装版（现在用的） |
|---|---|---|
| 做法 | `~/.dsh/profiles/desktop/cordis.patch.yml` 末尾 `- insert:` 指向 `~/Desktop/…/lib/index.js` | profile `package.json` 的 `dependencies` + `dsh.profile.bundles` 里有 `dsh-fullscreen-settings` |
| 生效 | 改文件 → 刷新页面 | 推 GitHub → 更新安装副本 → 刷新页面 |

**当前本机用的是安装版**：`"dsh-fullscreen-settings": "github:functy23/dsh-fullscreen-settings"`，
副本在 `~/.dsh/profiles/desktop/node_modules/dsh-fullscreen-settings`。

⚠️ **两者不能同时存在**：同一个包名会被挂载两次（同 entry id / 同一包多个 Loader 来源），
会让客户端模块解析冲突。切换前先把另一种撤掉。

⚠️ **desktop profile 由 Electron 应用独占管理**：`dsh plugin --profile desktop …` 会被拒绝
（`profile desktop is managed exclusively by the Electron application`）。desktop 只能用
应用内插件页安装，或用上面的 `cordis.patch.yml` 写法。`web` / `dsh-tui` profile 才能用 CLI。

刷新页面：应用菜单「DSH NEXT → 重新加载界面」或 `Cmd+R`。profile 补丁是热重组的，
但**客户端模块图在页面加载时取得**，所以永远要刷新。

## 7. 发版规矩（用户明确要求，务必遵守）

- **有新改动**（改到包内容）：`package.json` 升版本（新增/行为变化 → minor；修复 → patch）→
  **同一个 commit** 补 `CHANGELOG.md` → `git push` → `gh release create vX.Y.Z --latest` → `npm publish`。
  **不用再问用户**。
- **纯文档改动**（README / AGENTS.md / CHANGELOG 这类不改包内容的）：**只 commit + push**，
  不升版本、不发 Release、不发 npm。
- 已发布的 tag **不回头挪**，改动进下一个版本。
- 版本号即 git tag，**npm 上有的版本 git 必须有对应 tag，反之亦然**。
- `npm publish` 必须在仓库目录里跑；`package.json` 的 `prepublishOnly` 会先跑单元测试。

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/Desktop/dsh-fullscreen-settings
git add -A && git commit -m "chore(release): vX.Y.Z — …" && git push origin main
gh release create vX.Y.Z --title "vX.Y.Z" --latest --notes-file /tmp/notes.md
npm publish                     # 输出结尾应有 "+ dsh-fullscreen-settings@X.Y.Z"
```

### npm 的两个坑

1. **staging 延迟**：发布成功后会有一小段时间，registry 的元数据已经可见、但 **tarball 裸链接 404**
   （CDN 对新包的负缓存）。`curl "…tgz?cb=$RANDOM"` 能拿到 200，说明包是好的，**别当成发布失败**。
2. **别重发同一个版本**：重发会得到
   `E409 Cannot publish over previously staged version "X.Y.Z"`，即使 `npm stage list` 看不到它。
   遇到这种情况**发下一个 patch 版本**，别折腾 registry。判例：0.1.5 就是先超时、随后自己落库的。

## 8. 商店 / 注册表投稿状态

| 商店 | 规则要点 | 我们的状态 |
|---|---|---|
| **npm** | `npm publish`，账号 `funlze` | **`dsh-fullscreen-settings@0.1.6` 已发布 ✅**（tarball 200，`dist-tags.latest=0.1.6`） |
| [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) | PR 加**一个**文件 `data/plugins/<owner>__<repo>.yml`；要 `dsh.bundle`、真实代码、仓库满 **1 天**、`dsh-plugin` topic；描述不许带营销词 | **PR [#6247](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/6247)** OPEN、`MERGEABLE`；`check` + `Submission gate` **均已 SUCCESS**（仓库年龄闸门已过）。无 push 权，等维护者合并；已留言催合。合并后 dshmarket 白名单随之生效 |
| [DSH 1024Store](https://github.com/imsai-sh/awesome-deepseek-harness-plugins)（DSH Desktop 内置社区市场的目录源） | PR 加 `catalog/plugins/<owner>--<repo>.json`；闸门读仓库确认 `dsh.bundle.patch` 与补丁文件存在 | **PR [#550](https://github.com/imsai-sh/awesome-deepseek-harness-plugins/pull/550) 已合并 ✅** |
| [deepseek-plugin-store](https://github.com/Ericwong5021/deepseek-plugin-store) | 走插件收录 Issue 表单 → bot 开 PR | **Issue [#293](https://github.com/Ericwong5021/deepseek-plugin-store/issues/293)** OPEN（`gov:approved` + `gov:pr-open`）；bot **PR [#294](https://github.com/Ericwong5021/deepseek-plugin-store/pull/294)** OPEN（`mergeStateStatus: BLOCKED`，等维护者）。已留言催合 |
| [dsh-plugin-shop](https://github.com/LivXue/dsh-plugin-shop)（LivXue） | **不用投稿**：keywords 含 `dsh-plugin`/`deepseek-harness` + npm 发布 → 每日收割。查拒绝：`curl -s https://LivXue.github.io/dsh-plugin-shop/v1/report.md \| grep 包名` | keywords + npm 已齐；公开 catalog 快照仍是 `2026-09-29`（我们 09-30 才发 npm），**等下一次 daily build** 自动进架。报告里尚无本包名 |
| [YELEBAI/dsh-plugin-marketplace](https://github.com/YELEBAI/dsh-plugin-marketplace) | 每 2h 扫 `topic:dsh-plugin`，写入中心 Registry | **`registry/plugins.json` 已有 `functy23/dsh-fullscreen-settings` ✅**（自动） |
| [dshfind](https://dshfind.com) | 加 `dsh-plugin` topic，每日 02:17 UTC 自动同步 | topic 已有 → 无需操作 |
| [dsh-plugin-radar](https://github.com/AdamPlatin123/dsh-plugin-radar) | 加 topic 后约 8 小时自动收录 | topic 已有 → 无需操作（code search 可能延迟） |
| [dshmarket](https://github.com/dsh-market/dsh-market)（应用内市场） | 只允许安装 awesome-dsh-plugin 白名单内的来源 | **卡在 #6247 合并** |

投稿素材：`data/plugins/functy23__dsh-fullscreen-settings.yml`（awesome）与
`catalog/plugins/functy23--dsh-fullscreen-settings.json`（1024Store）两份文件的内容都在对应 PR 里，
仓库本身**不放**这两份文件。

其它「市场」客户端（`bradeGithub/DSH-Plugins-Marketplace`、`AwesomeHou/dsh-plugin-marketplace` 等）多数是扫 GitHub topic / 转发 awesome 目录，**不需要单独投稿**。

## 9. 硬性不变量（改代码别破）

- `package.json` 的 `files` 决定 npm tar 包内容：**`lib/`、`cordis.patch.yml`、`icon.svg` 必须在**；
  `assets/`、`screenshots.json` 属于仓库元数据，**故意不打包**。
- `icon` 字段（`"./icon.svg"`，包根）决定**插件列表里的图标**；`assets/settings-fullpage.png` 是**截图**。
  两者是不同机制，别混。
- `screenshots.json`（与 `package.json` 同级，1–8 条、相对路径且不出仓库）决定**市场详情页截图** ——
  换图推自己的仓库即可，**不要**去 awesome-dsh-plugin 提 PR。
- **不声明 `peerDependencies`** 是刻意的：DSH 的兼容性门禁只检查 `@deepseek-ai/dsh*` peers，
  不声明就不会被任何宿主的版本范围挡住（代价是不能声明"支持的 DSH 版本"）。
- 客户端 require 的 `@deepseek-ai/*` 包由宿主在运行时提供，**不要**写进 `dependencies`。
- CSS 只用主题变量（`--dsw-alias-*` / `--dsh-frame-*`），不写死颜色，保证换主题安全。

## 10. 卸载 / 回滚

- 应用内插件页卸载，或从 `~/.dsh/profiles/desktop/package.json` 的 `dependencies` 与
  `dsh.profile.bundles` 里删掉，再刷新。
- 只是不想看效果：在应用里关掉插件的开关即可（写进 `cordis.patch.yml` 的 `disabled: true`）。
- 插件本身对系统没有任何持久化副作用：一个 `<style>` 节点 + 一个槽位注册，卸载即恢复原样。

## 11. 提交前自检

```bash
export PATH=/opt/homebrew/bin:$PATH
cd ~/Desktop/dsh-fullscreen-settings
node --check lib/client.js && node --test tests/     # 语法 + 4 个用例
node -e "const p=require('./package.json'); console.log(p.version, p.icon, p.dsh.bundle.patch, p.files)"
git status --short --branch                          # 干净且与 origin/main 同 commit
```

发版后额外确认：`gh release list` 里最新版本是 Latest、`npm view dsh-fullscreen-settings dist-tags`
的 `latest` 与之一致、`git ls-remote --tags origin` 有对应 tag。
