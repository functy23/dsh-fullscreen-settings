/**
 * 宿主半边：本插件只贡献浏览器表现。
 *
 * 宿主侧没有服务或插槽要注册，但这一行不能省 —— Loader 会为每个启用条目在宿主侧
 * 建立一个 fiber，条目必须导出一个合法的 Cordis 插件（apply 可以为空）。
 */
export function apply() {}
