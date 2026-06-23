# Options 页面 UI 优化与安全加固 - 任务列表

## Task 1: 移除夜间模式
- [x] 1.1 删除 `options.html` 中 `:root[data-theme="dark"]` CSS 变量块
- [x] 1.2 删除 `options.html` 中 `:root[data-theme="dark"] body` 背景渐变样式
- [x] 1.3 删除 `options.html` 中主题切换按钮 HTML（`#themeToggleBtn` 及两个 SVG 图标）
- [x] 1.4 删除 `options.html` 中 `.theme-toggle-btn` CSS 样式
- [x] 1.5 删除 `options.js` 中 `currentTheme` 变量声明
- [x] 1.6 删除 `options.js` 中 `themeToggleBtn`、`themeIconLight`、`themeIconDark` 元素获取
- [x] 1.7 删除 `options.js` 中 `updateThemeIcons()` 函数及其调用
- [x] 1.8 删除 `options.js` 中主题切换事件监听
- [x] 1.9 删除 `options.js` 中 `doSave()` 的 `theme: currentTheme` 字段
- [x] 1.10 删除 `options.js` 中加载设置时的 `theme` 读取和 `data-theme` 设置
- [x] 1.11 删除 I18N 中主题相关的翻译键（如有）

## Task 2: UI 配色重构 — 紫色 → 专业蓝色
- [x] 2.1 修改 `options.html` 中 light theme 的 `--accent` 为 `#1a73e8`
- [x] 2.2 修改 `--accent-hover` 为 `#1557b0`
- [x] 2.3 修改 `--accent-light` 为 `#e8f0fe`
- [x] 2.4 修改 `--accent-glow` 为 `rgba(26, 115, 232, 0.15)`
- [x] 2.5 修改 `--accent-text` 为 `#1a73e8`
- [x] 2.6 修改 `--border-focus` 为 `#1a73e8`
- [x] 2.7 检查所有硬编码的紫色值（如 `#4f46e5`、`#818cf8`、`#4338ca`）并替换为蓝色系
- [x] 2.8 优化品牌图标背景色为新的蓝色

## Task 3: UI 布局与交互优化
- [x] 3.1 优化 Header 布局：品牌区域更紧凑，移除主题切换按钮后的空间调整
- [x] 3.2 优化 Tab 导航：增加选中状态的底部指示线，提升视觉反馈
- [x] 3.3 优化角色卡片：激活状态添加右上角勾选图标，修复点击展开/收起冲突
- [x] 3.4 修复角色卡片 textarea 点击 stopPropagation 逻辑，确保 textarea 内点击不触发卡片折叠
- [x] 3.5 优化 FAQ 复选框布局：将 checkbox 移入 header 内，调整 CSS
- [x] 3.6 优化按钮样式：统一圆角、间距、hover 效果
- [x] 3.7 优化输入框样式：统一 focus 状态边框色
- [x] 3.8 优化卡片阴影：使用更柔和的阴影层次
- [x] 3.9 优化空状态样式：图标 + 文案居中，增加视觉引导

## Task 4: XSS 防护与安全加固
- [x] 4.1 在 `options.js` 顶部添加全局 `escapeHtml(str)` 函数
- [x] 4.2 修复 `thinkingBubble.innerHTML`（line 704, 728, 731）使用 `escapeHtml()` 包裹动态数据
- [x] 4.3 修复 `status.innerHTML`（line 524）使用 `escapeHtml()` 包裹角色名
- [x] 4.4 修复 `statusEl.innerHTML`（line 400, 402）改用 `textContent` 或 `escapeHtml()`
- [x] 4.5 审查所有 `innerHTML` 使用，确保无用户/API 数据直接拼接
- [x] 4.6 为 API Key 输入框添加 `autocomplete="off"`、`spellcheck="false"`、`autocapitalize="off"`
- [x] 4.7 为 API Key 输入框添加显示/隐藏密码切换按钮
- [x] 4.8 为激活码输入框添加 `autocomplete="off"`、`spellcheck="false"`

## Task 5: 数据导入校验
- [x] 5.1 在导入设置函数中添加文件大小校验（≤1MB）
- [x] 5.2 添加字段类型验证函数 `validateSettings(obj)`
- [x] 5.3 验证 personas 为数组且每项包含 id/name/prompt 字符串
- [x] 5.4 验证 faqData 为数组且每项包含 q/a 字符串
- [x] 5.5 验证 tone/replyLength/btnTheme/apiProvider 为字符串
- [x] 5.6 验证失败时显示错误提示且不修改任何设置
- [x] 5.7 验证成功后限制只保存白名单内的字段

## Task 6: Bug 修复与代码完整性检查
- [x] 6.1 修复角色卡片点击展开/收起与 textarea 点击的冲突
- [x] 6.2 修复激活角色缺少勾选图标
- [x] 6.3 修复 FAQ 复选框布局错位
- [x] 6.4 检查所有 `getElementById` 是否有 null 检查
- [x] 6.5 检查所有事件监听器是否正确绑定（元素存在时才绑定）
- [x] 6.6 检查 I18N 键是否完整（中英文都有）— 补充 pageTitle 和 templateHelp 两个缺失键
- [x] 6.7 检查所有 `chrome.storage` 调用是否有错误处理
- [x] 6.8 补充缺失的 I18N 键：pageTitle（en/zh）、templateHelp（en/zh）

## Task 7: 验证与测试
- [x] 7.1 验证夜间模式已完全移除（无残留 CSS/JS/HTML）
- [x] 7.2 验证配色全部为蓝色系（无紫色残留）
- [x] 7.3 验证角色卡片交互正常（点击展开/收起、激活状态显示勾选）
- [x] 7.4 验证 FAQ 管理功能正常（增删改查、批量操作）
- [x] 7.5 验证 API 配置与测试功能正常
- [x] 7.6 验证数据导出/导入功能正常（含非法数据校验）
- [x] 7.7 验证激活码功能正常
- [x] 7.8 验证 XSS 防护（API 返回含脚本时不执行）
- [x] 7.9 验证自动保存功能正常
- [x] 7.10 验证响应式布局正常

# Task Dependencies
- Task 2 可与 Task 1 并行（都是修改 options.html 和 options.js）
- Task 3 依赖 Task 1 和 Task 2 完成
- Task 4 可与 Task 3 并行
- Task 5 可与 Task 4 并行
- Task 6 依赖 Task 1-5 完成
- Task 7 依赖 Task 1-6 全部完成
