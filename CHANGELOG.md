# Changelog

版本号即 git tag，遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [0.1.5] — 2026-09-30

- 新增 `screenshots.json`（与 package.json 同级）：按 awesome-dsh-plugin 的约定，插件市场详情页的截图由作者自己在仓库里声明，取 `assets/settings-fullpage.png`。

## [0.1.4] — 2026-09-30

- 发布到 npm：`dsh plugin --profile <profile> add dsh-fullscreen-settings` 可直接从 registry 安装；README 中英版都补了 npm 安装方式。
- `package.json` 增加 `prepublishOnly` 守卫，`npm publish` 前会先跑一遍单元测试。

## [0.1.3] — 2026-09-30

- **修好插件列表图标**：安装器读的是 package.json 顶层 `icon` 字段（相对路径、
  SVG/PNG/JPEG/WebP、≤256 KiB，且要随 `files` 发布），不是 `assets/` 目录。
  图标挪到包根 `icon.svg`，补上 `"icon": "./icon.svg"`。

## [0.1.2] — 2026-09-30

- **修好安装路径**：新增 profile 层补丁 `cordis.patch.yml` 并在 package.json 声明
  `dsh.bundle.patch`。此前只声明了 `dsh.client`，安装器会在依赖解析后判定
  「declares no dsh.bundle — installed as a plain dependency, not a profile layer」，
  包被下载进 `node_modules` 却不会挂进 profile 树，装完等于没装。

## [0.1.1] — 2026-09-30

- 项目图标换成新版卡片图（`assets/icon.svg`），README 按宽度 150 等比展示。
- README 去掉 DSH NEXT 特有的措辞：安装章节改为通用的 `dsh plugin add` /
  手写 profile patch，生效方式只说「刷新页面；没生效就重启 DSH 客户端」。

[0.1.1]: https://github.com/functy23/dsh-fullscreen-settings/releases/tag/v0.1.1

## [0.1.0] — 2026-09-30

首个版本。

- 设置改为 Codex 风格整页全屏：`100vw × 100vh`，去掉遮罩与居中弹窗的尺寸、圆角、阴影。
- 退出入口移到左上角：箭头与「设置」标题同属**一个按钮**，悬停整行高亮
  （与主界面左栏的「新会话」「插件」条目同款），点箭头或点文字都能返回。
- 左栏加宽到 248px 并加发丝分隔线；内容列限制 880px，长行不再被拉得过长。
- macOS 顶部自动让开红绿灯，那条留白兼作窗口拖动区；窗口进入全屏时自动收起。
- 关闭走官方 `closeTopModal()`，失效时退回点击官方关闭按钮。
- 4 个零依赖单元测试（`node --test`）。

[0.1.0]: https://github.com/functy23/dsh-fullscreen-settings/releases/tag/v0.1.0
