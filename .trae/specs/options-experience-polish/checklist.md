# Options 设置页体验增强 - 验证清单

## 性能优化
- [x] `options.js` 定义了通用 `debounce(fn, delay)` 函数
- [x] FAQ 搜索 input 事件使用 200ms debounce 包装
- [x] 快速输入搜索词时不会每次按键触发 renderFaq
- [x] 添加了 `visibilitychange` 事件监听
- [x] 页面隐藏时 setInterval 被清除
- [x] 页面恢复可见时 setInterval 重新启动
- [x] 预览消息数组超过 20 条时移除最早消息

## 骨架屏
- [x] `options.html` 包含骨架屏 HTML 结构
- [x] 骨架屏有 shimmer 动画样式
- [x] 设置加载完成前显示骨架屏
- [x] 加载完成后骨架屏淡出，真实内容淡入

## Toast 改进
- [x] 错误类 Toast 显示 5 秒
- [x] 成功类 Toast 显示 2.5 秒
- [x] Toast 右上角有 × 关闭按钮
- [x] 点击 × 按钮立即移除 Toast
- [x] × 按钮有 aria-label

## 自定义确认弹窗
- [x] `options.html` 包含通用确认 Modal 结构
- [x] `options.js` 定义了 `showConfirm(title, message)` 返回 Promise
- [x] 角色删除使用 `showConfirm()` 而非原生 `confirm()`
- [x] FAQ 批量删除使用 `showConfirm()` 而非原生 `confirm()`
- [x] 代码中不存在原生 `confirm()` 调用（showConfirm 降级 fallback 除外）

## 角色删除 Undo
- [x] 角色删除后显示 3 秒 Undo Toast
- [x] 点击 Undo 恢复被删除的角色
- [x] Undo 逻辑与 FAQ 删除 Undo 行为一致

## Modal ESC 关闭
- [x] 添加了全局 Escape 键监听器
- [x] 模板库 Modal 支持 ESC 关闭
- [x] 升级 Modal 支持 ESC 关闭
- [x] 确认 Modal 支持 ESC 关闭
- [x] ESC 关闭等同于点击取消/遮罩

## 快捷键 UX 修正
- [x] 移除了快捷键输入框的 keydown 自定义捕获逻辑
- [x] 快捷键输入框为 readonly
- [x] 展示 3 个固定快捷键说明（Alt+2 / Ctrl+Enter / Ctrl+R）
- [x] 不再写入 shortcut 字段到 storage

## 保存失败提示
- [x] `doSave()` 失败时调用 `showToast()` 显示错误
- [x] 错误 Toast 提示文案清晰（如"保存失败，请重试"）
- [x] 不再仅静默 console.error

## 功能验证
- [x] FAQ 搜索、增删改功能正常
- [x] 角色管理功能正常
- [x] API 配置与测试功能正常
- [x] 数据导出/导入功能正常
- [x] 激活码功能正常
- [x] 自动保存功能正常
- [x] 响应式布局正常
