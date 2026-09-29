/**
 * dsh-fullscreen-settings 客户端半边的单元测试（零依赖，node --test 直接跑）。
 *
 * 用 node:vm 模拟浏览器模块加载器：捕获 __ModuleLoader__.load 的定义，
 * 注入的最小 require 只提供 react/jsx-runtime 与 primitives 的替身，
 * 以此验证「注入全屏样式 + 遮蔽 settings.header + 左上角关闭」三件事。
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'

const SOURCE = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

/** 造一个只实现本插件用到的最小 DOM。 */
function fakeDocument() {
  const head = { children: [] }
  const doc = {
    head,
    querySelector(selector) {
      if (selector === 'style[data-plugin="dsh-fullscreen-settings"]') {
        return head.children.find((node) => node.dataset.plugin === 'dsh-fullscreen-settings') ?? null
      }
      return null
    },
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        dataset: {},
        textContent: '',
        isConnected: false,
        removed: false,
        remove() {
          this.removed = true
          this.isConnected = false
          const index = head.children.indexOf(this)
          if (index >= 0) head.children.splice(index, 1)
        },
      }
    },
  }
  const originalAppend = Array.prototype.push
  head.appendChild = (node) => {
    originalAppend.call(head.children, node)
    node.isConnected = true
    return node
  }
  return doc
}

/** 加载 lib/client.js 并返回捕获到的模块定义。 */
function loadModule(document, primitives, requireOverrides = {}) {
  let captured = null
  const window = { __ModuleLoader__: { load: (definition) => { captured = definition } } }
  const context = vm.createContext({ window, document, console })
  vm.runInContext(SOURCE, context, { filename: 'lib/client.js' })
  const cache = new Map()
  const requireStub = (name) => {
    if (name in requireOverrides) return requireOverrides[name]
    if (cache.has(name)) return cache.get(name)
    if (name === 'react/jsx-runtime') {
      const value = { jsx: (type, props) => ({ type, props: props ?? {} }) }
      cache.set(name, value)
      return value
    }
    if (name === '@deepseek-ai/dsh-client-ui-primitives') {
      cache.set(name, primitives)
      return primitives
    }
    throw new Error('unexpected require: ' + name)
  }
  return { captured, requireStub }
}

/** 收集 apply() 期间的注册动作。 */
function fakeContext(document) {
  const state = { injections: [], registrations: [], dictionary: null, effects: [], disposed: false }
  const ctx = {
    locale: {
      register(namespace, dictionary) {
        state.namespace = namespace
        state.dictionary = dictionary
      },
    },
    slots: {
      inject(name, register) {
        state.injections.push({ name, register })
      },
      register(options, component) {
        state.registrations.push({ options, component })
      },
    },
    effect(callback) {
      // 与 cordis 一致：effect 立刻执行一次，返回值才是卸载函数。
      const dispose = callback()
      if (typeof dispose === 'function') state.effects.push(dispose)
    },
  }
  return { ctx, state }
}

test('客户端模块以本包名注册，并声明 slots / locale 依赖', () => {
  const { captured, requireStub } = loadModule(fakeDocument(), {})
  assert.equal(captured.id, 'dsh-fullscreen-settings')
  const mod = captured.factory(requireStub)
  assert.deepEqual(Array.from(mod.inject), ['slots', 'locale'])
  assert.equal(typeof mod.apply, 'function')
})

test('apply() 注入全屏样式并遮蔽 settings.header', () => {
  const document = fakeDocument()
  const { captured, requireStub } = loadModule(document, { closeTopModal() {} })
  const mod = captured.factory(requireStub)
  const { ctx, state } = fakeContext(document)
  mod.apply(ctx)

  assert.equal(document.head.children.length, 1)
  const style = document.head.children[0]
  assert.equal(style.dataset.plugin, 'dsh-fullscreen-settings')
  for (const fragment of ['width: 100vw', 'height: 100vh', '_mask', 'dsh-fss-back', '--dsh-fss-top-pad']) {
    assert.ok(style.textContent.includes(fragment), '样式应包含 ' + fragment)
  }

  assert.deepEqual(state.namespace, 'dsh-fullscreen-settings')
  assert.equal(state.dictionary.zh.title, '设置')
  assert.equal(state.dictionary.en.title, 'Settings')

  assert.deepEqual(state.injections.map((entry) => entry.name), ['settings.header'])
  state.injections[0].register()
  const registration = state.registrations[0]
  assert.equal(registration.options.name, 'settings.header')
  assert.equal(registration.options.priority, -1000)
  assert.equal(registration.options.locale, 'dsh-fullscreen-settings')
  assert.equal(typeof registration.component, 'function')

  // 卸载时只摘掉自己那一个 <style>。
  state.effects[0]()
  assert.equal(style.removed, true)
  assert.equal(document.head.children.length, 0)
})

test('标题席渲染「← + 设置」，点击走 closeTopModal', () => {
  const document = fakeDocument()
  let closed = 0
  const primitives = { closeTopModal: () => { closed += 1 } }
  const { captured, requireStub } = loadModule(document, primitives)
  const mod = captured.factory(requireStub)
  const { ctx, state } = fakeContext(document)
  mod.apply(ctx)
  const Header = state.registrations.length === 0
    ? (state.injections[0].register(), state.registrations[0].component)
    : state.registrations[0].component

  const tree = Header({ t: (key) => ({ title: '设置', close: '返回上一页' })[key] })
  // 箭头与标题同属一个整行按钮：悬停一个色块，点哪都能返回。
  assert.equal(tree.type, 'button')
  assert.equal(tree.props.className, 'dsh-fss-back')
  assert.equal(tree.props['aria-label'], '返回上一页')
  const [icon, title] = tree.props.children
  const iconNode = typeof icon.type === 'function' ? icon.type(icon.props) : icon
  assert.equal(iconNode.type, 'svg')
  assert.equal(iconNode.props.children.type, 'path')
  assert.equal(title.props.children, '设置')

  tree.props.onClick()
  assert.equal(closed, 1)
})

test('primitives 缺失时退回点击官方关闭按钮，t 缺失时退回内置文案', () => {
  const document = fakeDocument()
  let clicked = 0
  const closeButton = { click: () => { clicked += 1 } }
  document.querySelector = (selector) =>
    selector === 'div[data-shortcut-modal="settings"] > div > div:first-child > button' ? closeButton : null
  const { captured, requireStub } = loadModule(document, null, {
    '@deepseek-ai/dsh-client-ui-primitives': null,
  })
  const mod = captured.factory(requireStub)
  const { ctx, state } = fakeContext(document)
  mod.apply(ctx)
  state.injections[0].register()
  const Header = state.registrations[0].component

  const tree = Header({})
  assert.equal(tree.props.children[1].props.children, '设置')
  tree.props.onClick()
  assert.equal(clicked, 1)
})
