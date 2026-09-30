<div align="center">

<img src="assets/icon.svg" width="150" alt="dsh-fullscreen-settings"/>

# dsh-fullscreen-settings

**把 DSH 的设置弹窗，变成 Codex 那样的整页全屏设置页。**

![Project](https://img.shields.io/badge/project-dsh--fullscreen--settings-4F46E5)
![Language](https://img.shields.io/badge/language-JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Top Language](https://img.shields.io/github/languages/top/functy23/dsh-fullscreen-settings)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)

![License](https://img.shields.io/github/license/functy23/dsh-fullscreen-settings)

![Downloads](https://img.shields.io/github/downloads/functy23/dsh-fullscreen-settings/total)
![Stars](https://img.shields.io/github/stars/functy23/dsh-fullscreen-settings)
![Repo Size](https://img.shields.io/github/repo-size/functy23/dsh-fullscreen-settings)
![Contributors](https://img.shields.io/github/contributors/functy23/dsh-fullscreen-settings)

[Issues](https://github.com/functy23/dsh-fullscreen-settings/issues) • [Changelog](CHANGELOG.md) • [中文](README.md) / [English](README.en.md)

</div>

---

## 效果

| | 改动前 | 改动后 |
|---|---|---|
| 形态 | 屏幕中央 800×800 的弹出式 modal，背后有遮罩 | 铺满整个窗口的整页设置，没有遮罩 |
| 退出 | 右上角一个小叉号 | 左上角一整行「← 设置」 |
| 左栏 | 188px 分类栏 | 248px 分类栏，带发丝分隔线 |
| 内容 | 800px 宽，行拉满 | 单列最大 880px，长行不再被拉得过长 |

左上角的「← 设置」是**一个按钮**：箭头和标题同处一个色块，鼠标悬停时整行高亮，
和主界面左栏的「新会话」「插件」条目同款；点箭头或点文字都返回上一页。

macOS 上顶部会自动让开红绿灯，那条留白同时是窗口拖动区；窗口进入全屏时留白自动收起。

## 安装

```bash
dsh plugin --profile <profile> add github:functy23/dsh-fullscreen-settings
```

把 `<profile>` 换成要装的那个（例如 `web`）。

如果该 profile 由宿主客户端托管、CLI 拒绝安装，就在客户端的插件页里用仓库地址
`github.com/functy23/dsh-fullscreen-settings` 安装；或者直接改 profile ——
在 `~/.dsh/profiles/<profile>/cordis.patch.yml` 末尾追加：

```yaml
- insert:
    - id: ui-fullscreen-settings
      name: /绝对路径/dsh-fullscreen-settings/lib/index.js
```

装完**刷新页面**即可；如果没生效，**重启 DSH 客户端**。

（profile patch 会让宿主热重组，但客户端模块图是在页面加载时取得的，所以总是需要刷新页面。）

## 原理

宿主半边是空的（`lib/index.js` 只有空 `apply()`），全部效果在浏览器半边完成，
只做两件事：

1. **一段 CSS**，锚在运行版产品自带的属性 `div[data-shortcut-modal="settings"]` 上，
   结构用元素选择器（`> nav` / `> div`），**不依赖 CSS Modules 的哈希类名**，
   产品换构建也不会失效。
2. **遮蔽 `settings.header` 这个 single 槽的官方占用者**：single 槽的规则是
   「最低 priority 渲染」，官方占用者是 priority 0，本插件用 `-1000` 顶掉它，
   改渲染左上角那一个整行按钮。

关闭动作直接调 `@deepseek-ai/dsh-client-ui-primitives` 的 `closeTopModal()`
—— 这正是官方设置快捷键关闭弹窗时用的同一个函数；失败时退回点击官方关闭按钮。

不修改、不打包官方任何文件，DSH 升级后即使某个细节变了，最坏情况也只是样式回退。

## 目录结构

```
dsh-fullscreen-settings/
├─ lib/
│  ├─ index.js        宿主半边：空 apply()
│  └─ client.js       浏览器半边：样式 + 「← 设置」按钮
├─ tests/
│  └─ client.test.mjs 零依赖单元测试（node --test）
├─ assets/icon.svg
├─ cordis.patch.yml   profile 层补丁：安装器靠它把插件挂进 profile 树
├─ package.json       dsh.bundle / dsh.client 声明 + test 脚本
└─ README.md / README.en.md / CHANGELOG.md / LICENSE
```

`lib/` 就是源码，没有构建步骤；改完刷新页面即可。

## 开发

```bash
cd dsh-fullscreen-settings
node --test tests/            # 4 个用例：注册 / 样式 / 整行按钮 / 兜底
node --check lib/client.js
```

## 兼容性

按 DSH `0.2.0-rc.1` 实测。用到的都是产品自有属性、插槽契约与主题变量
（`--dsw-alias-*` / `--dsh-frame-*`），不依赖某个具体的桌面外壳。

## 回滚

删掉 `cordis.patch.yml` 里那段 `- insert:`（或在该 profile 的插件页里卸载），
刷新页面即可；设置会回到原来的居中弹窗。

## License

[MIT](LICENSE) © 2026 Functy
