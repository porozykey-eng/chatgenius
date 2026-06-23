# Options 设置页体验增强 - 任务列表

## Task 1: FAQ 搜索防抖 + 后台轮询优化（性能）
- [x] 1.1 在 `options.js` 添加通用 `debounce(fn, delay)` 工具函数
- [x] 1.2 FAQ 搜索 input 事件包装 200ms debounce
- [x] 1.3 添加 `visibilitychange` 监听器，页面隐藏时 clearInterval，可见时恢复
- [x] 1.4 预览消息上限：发送前检查消息数组长度，超过 20 条移除最早消息

## Task 2: 初始加载骨架屏
- [x] 2.1 在 `options.html` 的 tab-content 容器内添加骨架屏 HTML（灰色占位块）
- [x] 2.2 添加骨架屏 CSS 样式（shimmer 动画）
- [x] 2.3 在 `options.js` 加载设置完成后移除骨架屏，淡入真实内容

## Task 3: Toast 改进（错误持久化 + 手动关闭）
- [x] 3.1 修改 `showToast(msg, isError)` 函数：error 类显示 5 秒，success 类 2.5 秒
- [x] 3.2 Toast 添加 × 关闭按钮 HTML
- [x] 3.3 点击 × 按钮立即移除 Toast

## Task 4: 自定义 Modal 确认框替代 confirm()
- [x] 4.1 在 `options.html` 添加通用确认 Modal（标题 + 描述 + 确认/取消按钮）
- [x] 4.2 在 `options.js` 添加 `showConfirm(title, message)` 返回 Promise
- [x] 4.3 角色删除改用 `showConfirm()` 替代 `confirm()`
- [x] 4.4 FAQ 批量删除改用 `showConfirm()` 替代 `confirm()`

## Task 5: 角色删除 Undo + Modal ESC 关闭
- [x] 5.1 角色删除添加 3 秒 Undo 逻辑（复用 FAQ Undo 模式）
- [x] 5.2 添加全局 `keydown` Escape 监听器，关闭当前打开的 Modal
- [x] 5.3 模板库 Modal 和升级 Modal 支持 ESC 关闭

## Task 6: 快捷键 UX 修正 + 保存失败提示
- [x] 6.1 移除快捷键输入框的 `keydown` 自定义捕获逻辑
- [x] 6.2 快捷键输入框改为 readonly，展示 3 个固定快捷键说明
- [x] 6.3 更新 I18N 键（如需要）
- [x] 6.4 `doSave()` 失败时调用 `showToast()` 提示用户

## Task 7: 验证与测试
- [x] 7.1 验证 FAQ 搜索防抖生效（快速输入不卡顿）
- [x] 7.2 验证骨架屏显示和淡出
- [x] 7.3 验证错误 Toast 5 秒 + 手动关闭
- [x] 7.4 验证自定义 Modal 确认框（角色删除、FAQ 批量删除）
- [x] 7.5 验证角色删除 Undo
- [x] 7.6 验证 ESC 关闭所有 Modal
- [x] 7.7 验证后台标签页暂停轮询
- [x] 7.8 验证预览消息 20 条上限
- [x] 7.9 验证快捷键只读展示
- [x] 7.10 验证保存失败 Toast 提示

# Task Dependencies
- Task 1、2、3 可并行（互不依赖）
- Task 4 独立（添加 Modal 组件）
- Task 5 依赖 Task 4（复用 Modal 机制）
- Task 6 独立
- Task 7 依赖 Task 1-6 全部完成
