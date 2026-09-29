# Changelog

版本号即 git tag，遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

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
