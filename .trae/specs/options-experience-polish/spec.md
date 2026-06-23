# Options 设置页体验增强 Spec

## Why
当前 options 页面已完成基础重构（4 Tab + 蓝色配色 + XSS 防护），但从产品经理视角看，仍有几处明显影响用户习惯和性能的短板：FAQ 搜索卡顿、无加载状态、快捷键提示与实际不符、原生 confirm 破坏视觉一致性、Toast 错误信息一闪而过。本次聚焦"小而精"的体验增强，不新增大功能模块，避免过度复杂。

## What Changes
- **FAQ 搜索防抖**：搜索输入加 200ms debounce，避免每次按键全量重渲染
- **初始加载骨架屏**：设置加载期间显示 skeleton，消除白屏
- **Toast 改进**：错误类 Toast 延长显示时间 + 支持手动关闭
- **自定义 Modal 确认框**：用现有 Modal 组件替代原生 `confirm()`，统一视觉
- **快捷键 UX 修正**：移除易混淆的自定义捕获，改为清晰的预设说明
- **角色删除 Undo**：与 FAQ 删除一致，角色删除也提供 3 秒撤销
- **Modal ESC 关闭**：所有 Modal 支持 Escape 键关闭
- **后台标签页暂停轮询**：监听 `visibilitychange`，页面隐藏时暂停 setInterval
- **预览消息上限**：限制预览历史最多 20 条，避免无限累积
- **保存失败提示**：保存失败时 Toast 提示用户，而非静默 console.error

## Impact
- Affected code: `options.html`, `options.js`
- Affected specs: `options-ui-security-v2`（在其基础上增强体验）
- Breaking: 无（纯体验优化，数据结构不变）

## ADDED Requirements

### Requirement: FAQ 搜索防抖
系统 SHALL 对 FAQ 搜索输入添加 200ms debounce，避免每次按键触发全量重渲染。

#### Scenario: 用户快速输入搜索词
- WHEN 用户在 FAQ 搜索框快速输入"价格"
- THEN 200ms 后才触发一次渲染，而非每次按键都渲染

### Requirement: 初始加载骨架屏
系统 SHALL 在设置数据加载完成前显示骨架屏（skeleton），避免白屏。

#### Scenario: 用户打开设置页
- WHEN 用户打开 options.html 且数据尚未加载完成
- THEN 显示骨架屏占位，加载完成后淡入真实内容

### Requirement: Toast 错误信息持久化
系统 SHALL 对错误类 Toast 延长显示时间至 5 秒，并支持手动关闭按钮。
系统 SHALL 对成功类 Toast 保持 2.5 秒自动消失。

#### Scenario: API 测试连接失败
- WHEN API 连接测试失败显示错误 Toast
- THEN Toast 显示 5 秒，右上角有 × 关闭按钮，用户可手动关闭

### Requirement: 自定义确认弹窗
系统 SHALL 使用现有 Modal 组件替代原生 `confirm()`，用于角色删除和 FAQ 批量删除确认。

#### Scenario: 用户删除角色
- WHEN 用户点击角色删除按钮
- THEN 弹出自定义 Modal 确认框（非浏览器原生），样式与页面一致

### Requirement: 角色删除撤销
系统 SHALL 在角色删除后提供 3 秒 Undo 窗口，与 FAQ 删除行为一致。

#### Scenario: 用户误删角色
- WHEN 用户删除一个角色
- THEN 显示 3 秒 Undo Toast，点击可恢复该角色

### Requirement: Modal ESC 关闭
系统 SHALL 支持按 Escape 键关闭所有打开的 Modal。

#### Scenario: 用户在 Modal 打开时按 ESC
- WHEN Modal 打开且用户按下 Escape
- THEN Modal 关闭

### Requirement: 后台标签页暂停轮询
系统 SHALL 在页面不可见时暂停统计轮询，恢复可见时继续。

#### Scenario: 用户切换到其他标签页
- WHEN options 页面进入后台（document.hidden = true）
- THEN 暂停 setInterval 轮询，回到前台时恢复

### Requirement: 预览消息上限
系统 SHALL 限制实时预览的历史消息最多 20 条，超出时移除最早的消息。

#### Scenario: 用户连续发送 25 条预览消息
- WHEN 预览历史达到 20 条
- THEN 最早的消息被移除，保持最多 20 条

### Requirement: 保存失败提示
系统 SHALL 在自动保存失败时显示错误 Toast，而非仅 console.error。

#### Scenario: chrome.storage 写入失败
- WHEN doSave() 写入 storage 失败
- THEN 显示"保存失败，请重试"Toast

## MODIFIED Requirements

### Requirement: 快捷键设置 UX
**Reason**: 当前快捷键输入框可捕获自定义组合键，但提示文本显示的 Alt+2 / Ctrl+Enter / Ctrl+R 并非可配置项，用户困惑。
**Migration**:
- 移除自定义组合键捕获逻辑
- 改为只读展示 3 个固定快捷键说明（Alt+2 / Ctrl+Enter / Ctrl+R）
- 移除 storage 中的 `shortcut` 字段读取（保留兼容性，不再写入）

## REMOVED Requirements
无
