# Options 页面 UI 优化与安全加固 - 验证清单

## 夜间模式移除
- [x] options.html 中不存在 `data-theme="dark"` 的 CSS 变量块
- [x] options.html 中不存在主题切换按钮（`#themeToggleBtn`）
- [x] options.html 中不存在 `.theme-toggle-btn` CSS 样式
- [x] options.js 中不存在 `currentTheme` 变量
- [x] options.js 中不存在 `updateThemeIcons()` 函数
- [x] options.js 中不存在主题切换事件监听
- [x] options.js 的 `doSave()` 中不存在 `theme` 字段
- [x] options.js 加载设置时不读取 `theme` 字段
- [x] I18N 中不存在主题相关的翻译键

## UI 配色重构
- [x] `--accent` 值为 `#1a73e8`（蓝色）
- [x] `--accent-hover` 值为 `#1557b0`
- [x] `--accent-light` 值为 `#e8f0fe`
- [x] `--accent-glow` 值为 `rgba(26, 115, 232, 0.15)`
- [x] `--accent-text` 值为 `#1a73e8`
- [x] `--border-focus` 值为 `#1a73e8`
- [x] 代码中不存在硬编码的紫色值（`#4f46e5`、`#818cf8`、`#4338ca`、`#6366f1` 等）
- [x] 品牌图标背景使用新的蓝色

## UI 布局与交互
- [x] Header 布局紧凑，无多余空间
- [x] Tab 导航选中状态有底部指示线
- [x] 角色卡片激活状态显示右上角勾选图标
- [x] 角色卡片点击展开/收起正常，textarea 内点击不触发折叠
- [x] FAQ 复选框在 header 内，布局不错位
- [x] 按钮样式统一（圆角、间距、hover）
- [x] 输入框 focus 状态边框为蓝色
- [x] 卡片阴影柔和
- [x] 空状态有图标和文案引导

## XSS 防护
- [x] `options.js` 顶部定义了 `escapeHtml(str)` 函数
- [x] `escapeHtml` 转义 `& < > " '` 五个字符
- [x] `thinkingBubble.innerHTML` 的动态数据使用 `escapeHtml()` 包裹
- [x] `status.innerHTML` 的角色名使用 `escapeHtml()` 包裹
- [x] 所有 `innerHTML` 不直接拼接用户/API 数据
- [x] API Key 输入框有 `autocomplete="off"`、`spellcheck="false"`、`autocapitalize="off"`
- [x] API Key 输入框有显示/隐藏密码切换
- [x] 激活码输入框有 `autocomplete="off"`、`spellcheck="false"`

## 数据导入校验
- [x] 导入时校验文件大小 ≤1MB
- [x] 导入时验证 personas 为数组且每项有 id/name/prompt
- [x] 导入时验证 faqData 为数组且每项有 q/a
- [x] 导入时验证 tone/replyLength/btnTheme/apiProvider 为字符串
- [x] 验证失败时显示错误提示且不修改设置
- [x] 只保存白名单内的字段

## Bug 修复与代码完整性
- [x] 角色卡片点击展开/收起与 textarea 点击无冲突
- [x] 激活角色显示勾选图标
- [x] FAQ 复选框布局正确
- [x] 所有 `getElementById` 有 null 检查
- [x] 所有事件监听器在元素存在时才绑定
- [x] I18N 键完整（中英文都有）— 补充 pageTitle 和 templateHelp 两个缺失键
- [x] `chrome.storage` 调用有错误处理

## 功能验证
- [x] 自动保存功能正常
- [x] 角色管理（增删改、激活切换）正常
- [x] FAQ 管理（增删改、批量操作）正常
- [x] API 配置与测试功能正常
- [x] 数据导出/导入功能正常
- [x] 激活码功能正常
- [x] 响应式布局正常
- [x] XSS 防护有效（API 返回含脚本时不执行）
