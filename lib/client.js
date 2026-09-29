/**
 * dsh-fullscreen-settings —— 客户端半边。
 *
 * 目标：把 DSH 的「设置」弹窗（居中 800×800 的 modal）改成 Codex 风格整页全屏
 * 设置页，并把退出入口挪到左上角：箭头与标题同属一个按钮、同一个悬停色块。
 *
 * 只做两件事，互不耦合，全部按运行版产品 DOM 核实：
 *
 *   1) 注入一段 CSS，覆盖布局。选择器锚在 div[data-shortcut-modal="settings"]
 *      这个产品自带属性上，并对结构用元素选择器（> nav / > div），不依赖
 *      CSS Modules 的哈希类名，产品换构建也不会失效。
 *   2) 用 priority -1000 遮蔽 settings.header 这个 single 槽的官方占用者
 *      （官方 priority 0；single 槽“最低优先级渲染”，同优先级才冲突），
 *      改渲染左上角的「← 设置」行。关闭动作直接调
 *      @deepseek-ai/dsh-client-ui-primitives 的 closeTopModal —— 这正是官方
 *      设置快捷键关闭弹窗时用的同一个函数。
 */
window.__ModuleLoader__.load({
  id: 'dsh-fullscreen-settings',
  factory: (require) => {
    // ---- 依赖全部兜底：任一模块缺失也不该让渲染树炸掉 ----
    let jsx
    try {
      jsx = require('react/jsx-runtime').jsx
    } catch {
      const React = require('react')
      jsx = (type, props) => React.createElement(type, props)
    }

    let primitives = null
    try {
      primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    } catch (error) {
      console.warn('[dsh-fullscreen-settings] primitives 不可用，退回 DOM 关闭', error)
    }

    /** 本插件字典命名空间，同时用作槽位 t 的绑定。 */
    const NS = 'dsh-fullscreen-settings'
    /** 设置面板的稳定锚点：产品自带的 data-shortcut-modal 属性。 */
    const PANEL = 'div[data-shortcut-modal="settings"]'
    /** 官方关闭按钮（被 CSS 隐藏，仅作 closeTopModal 失效时的兜底）。 */
    const CLOSE_BUTTON = PANEL + ' > div > div:first-child > button'

    /** 内置兜底文案（locale 服务不可用时使用）。 */
    const FALLBACK = { title: '设置', close: '返回上一页' }

    /** 全屏覆盖样式，由下面的 injectStyle() 挂到 <head>。 */
    const STYLE = "/* ==========================================================================\n   dsh-fullscreen-settings —— Codex 风格整页设置\n   锚点（运行版产品 DOM，与 CSS Modules 哈希无关）：\n     div[data-shortcut-modal=\"settings\"]   设置面板 role=dialog\n     > nav                                 左侧分类栏\n     > div                                 右侧内容列\n       > div:first-child                   内容头（操作区 + 官方关闭键）\n       > div:last-child                    设置内容（options）\n   ========================================================================== */\n\n/* 1. 面板铺满窗口：去掉居中弹窗的尺寸、圆角、阴影 */\ndiv[data-shortcut-modal=\"settings\"] {\n  --dsh-fss-top-pad: max(var(--dsh-frame-chrome-top, 0px), var(--dsh-frame-top-clearance, 0px));\n  box-sizing: border-box !important;\n  width: 100vw !important;\n  height: 100vh !important;\n  max-width: none !important;\n  max-height: none !important;\n  padding-top: var(--dsh-fss-top-pad) !important;\n  border-radius: 0 !important;\n  box-shadow: none !important;\n  background: var(--dsw-alias-bg-base) !important;\n}\n\n/* 窗口全屏时没有红绿灯 / 标题栏，顶部不再留白 */\nhtml[data-fullscreen] div[data-shortcut-modal=\"settings\"] {\n  --dsh-fss-top-pad: 0px;\n}\n\n/* macOS：顶部留白兼作窗口拖动条 */\nhtml[data-platform=\"darwin\"] div[data-shortcut-modal=\"settings\"]::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 0 auto 0;\n  height: var(--dsh-fss-top-pad);\n  -webkit-app-region: drag;\n}\n\n/* 2. 整页即设置页，遮罩没有“外面”可点，收掉 */\n[class*=\"_overlay\"]:has(> div[data-shortcut-modal=\"settings\"]) > [class*=\"_mask\"] {\n  display: none !important;\n}\n\n/* 3. 左栏：加宽、发丝分隔线 */\ndiv[data-shortcut-modal=\"settings\"] > nav {\n  flex: none !important;\n  width: 248px !important;\n  gap: 14px !important;\n  padding: 14px 12px 12px !important;\n  border-right: .5px solid var(--dsw-alias-border-l3);\n}\n\n/* 4. 内容头：退出已移到左上角，收掉右上角官方关闭键 */\ndiv[data-shortcut-modal=\"settings\"] > div > div:first-child {\n  height: auto !important;\n  min-height: 52px;\n  padding: 16px 24px 12px 32px !important;\n}\ndiv[data-shortcut-modal=\"settings\"] > div > div:first-child > button {\n  display: none !important;\n}\n\n/* 5. 内容区：整页留白 + 单列最大宽度，避免整行被拉得过长 */\ndiv[data-shortcut-modal=\"settings\"] > div > div:last-child {\n  padding: 0 40px 40px !important;\n}\ndiv[data-shortcut-modal=\"settings\"] > div > div:last-child [data-slot=\"settings.section\"] > * {\n  max-width: 880px;\n}\n\n/* 6. 左上角「← 设置」：图标与标题同处一个色块里 —— 整行就是一个按钮，\n   悬停 / 聚焦时整行高亮，与主界面左栏的「新会话」「插件」行同款。 */\ndiv[data-shortcut-modal=\"settings\"] > nav > div:first-child {\n  padding: 0 !important;\n}\n.dsh-fss-back {\n  box-sizing: border-box;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  width: 100%;\n  min-height: 36px;\n  margin: 0;\n  padding: 7px 12px;\n  border: none;\n  border-radius: var(--dsw-radius-md);\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font-family: inherit;\n  font-size: 16px;\n  font-weight: 500;\n  line-height: 22px;\n  text-align: left;\n  cursor: pointer;\n}\n.dsh-fss-back:hover {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n.dsh-fss-back:active {\n  background: var(--dsw-alias-interactive-bg-hover);\n}\n.dsh-fss-back:focus-visible {\n  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));\n  outline-offset: -2px;\n}\n.dsh-fss-back svg {\n  flex: none;\n  display: block;\n}\n.dsh-fss-title {\n  min-width: 0;\n  overflow: hidden;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n"

    /**
     * 注入样式。热重载安全：先摘掉本插件上一次留下的 <style>，再挂新的。
     * @returns 本次创建的 <style> 节点。
     */
    function injectStyle() {
      const previous = document.querySelector('style[data-plugin="dsh-fullscreen-settings"]')
      if (previous !== null) previous.remove()
      const style = document.createElement('style')
      style.dataset.plugin = 'dsh-fullscreen-settings'
      style.textContent = STYLE
      document.head.appendChild(style)
      return style
    }

    /** 返回箭头图标（16px 线性风格，与 primitives 图标同套）。 */
    function BackIcon() {
      return jsx('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
        children: jsx('path', {
          key: 'arrow',
          d: 'M9.75 3.5 5.25 8l4.5 4.5',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
      })
    }

    /**
     * 关闭设置（返回上一页）。优先走官方 primitives 的 closeTopModal
     * （设置快捷键同款路径），失败时退回点击官方关闭按钮。
     */
    function closeSettings() {
      try {
        if (primitives !== null && typeof primitives.closeTopModal === 'function') {
          primitives.closeTopModal(document)
          return
        }
      } catch (error) {
        console.warn('[dsh-fullscreen-settings] closeTopModal 失败，退回按钮点击', error)
      }
      const button = document.querySelector(CLOSE_BUTTON)
      if (button !== null && typeof button.click === 'function') button.click()
    }

    /**
     * 左上角标题席的占用者：一个整行按钮，里面是「← + 设置」。
     * 箭头与标题同属一个按钮 —— 悬停整行高亮，点哪都能返回，和侧栏条目一致。
     * @param props - 槽位合成 props，t 绑定到本插件命名空间。
     * @returns 标题行按钮。
     */
    function SettingsHeader({ t }) {
      const tt = typeof t === 'function' ? t : (key) => (FALLBACK[key] ?? key)
      return jsx('button', {
        type: 'button',
        className: 'dsh-fss-back',
        onClick: closeSettings,
        'aria-label': tt('close'),
        children: [
          jsx(BackIcon, { key: 'icon' }),
          jsx('span', {
            key: 'title',
            className: 'dsh-fss-title',
            children: tt('title'),
          }),
        ],
      })
    }

    /**
     * 插件入口。
     * @param ctx - 客户端插件上下文；slots / locale 通过 inject 声明为硬依赖。
     */
    function apply(ctx) {
      const styleNode = injectStyle()

      try {
        ctx.locale.register(NS, {
          zh: { title: '设置', close: '返回上一页' },
          en: { title: 'Settings', close: 'Go back' },
        })
      } catch (error) {
        console.warn('[dsh-fullscreen-settings] 字典注册失败，使用内置文案', error)
      }

      // single 槽规则：最低 priority 渲染；官方占用者 priority 0 → 用 -1000 遮蔽。
      ctx.slots.inject('settings.header', () =>
        ctx.slots.register(
          { name: 'settings.header', priority: -1000, locale: NS },
          SettingsHeader,
        ))

      ctx.effect(() => () => {
        if (styleNode.isConnected) styleNode.remove()
      })
    }

    return { apply, inject: ['slots', 'locale'] }
  },
})
