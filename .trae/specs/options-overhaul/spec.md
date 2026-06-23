# Options 页面整体重构 Spec

## Why
当前 options.html 存在信息架构混乱、交互体验差、功能缺失等问题。需要一次性交付级重构，全面提升用户体验。

## What Changes
- **信息架构**：4 Tab（角色 / 知识库 / 设置 / 账户），升级激活统一移至账户 Tab
- **自动保存**：所有修改 debounce 500ms 自动保存，底部显示保存状态
- **角色卡片**：点击任意位置展开编辑，prompt 始终可见（限高滚动），左侧色条标识激活状态
- **FAQ 编辑**：点击进入编辑模式，删除后 3 秒 undo toast
- **页面宽度**：max-width 960px，大屏不再浪费空间
- **状态栏**：移至底部 footer，紧凑一行
- **免费版横幅**：仅在配额 ≤5 时显示，改为细条通知样式
- **删除重复主题预览**：保留上方实时预览按钮
- **数据导出/备份**：全部设置 JSON 导出导入
- **API 配置**：设置 Tab 新增 API 配置区域 + 连接测试
- **首次引导**：首次打开显示 3 步 onboarding
- **快捷键 UX**：添加 placeholder 提示 + 预设选项

## Impact
- Affected code: `options.html`, `options.js`, `options.css`（内联样式迁移）
- Breaking: Tab 结构变化，用户需要重新适应布局

## ADDED Requirements

### Requirement: 自动保存
系统 SHALL 在所有输入变更时 debounce 500ms 自动保存到 chrome.storage.sync。
底部状态栏 SHALL 显示"已保存 ✓"或"保存中..."状态。

#### Scenario: 用户修改角色名称
- WHEN 用户修改角色名称输入框
- THEN 500ms 后自动保存，底部显示"已保存 ✓"

### Requirement: 4 Tab 结构
系统 SHALL 提供 4 个 Tab：AI 角色 / 知识库 / 设置 / 账户。
- AI 角色：角色管理 + 实时预览
- 知识库：FAQ 管理
- 设置：回复偏好 + UI 交互 + API 配置
- 账户：许可证状态 + 激活/升级

### Requirement: 角色卡片简化交互
系统 SHALL 让角色卡片点击任意位置展开/收起 prompt。
激活状态 SHALL 用左侧 3px 色条 + 勾选图标标识。
prompt 输入框 SHALL 始终可见（非激活角色限高 60px 可滚动）。

### Requirement: API 配置入口
系统 SHALL 在设置 Tab 提供 API Provider 选择、API Key 输入、连接测试按钮。
系统 SHALL 显示当前 API 连接状态（绿色/红色指示器）。

### Requirement: 数据导出/备份
系统 SHALL 提供"导出全部设置"按钮，导出包含角色、FAQ、偏好、API 配置的 JSON 文件。
系统 SHALL 提供"导入设置"按钮，支持从 JSON 文件恢复全部设置。

### Requirement: 首次引导
系统 SHALL 在首次打开时（无角色数据）显示 3 步 onboarding 弹窗：选角色模板 → 配置 API → 开始使用。

## MODIFIED Requirements

### Requirement: 升级激活统一入口
**Reason**: 当前激活入口分散在偏好设置和弹窗两处，用户困惑。
**Migration**: 偏好设置中移除激活面板，统一在"账户"Tab 管理。

### Requirement: 状态栏位置
**Reason**: 顶部状态栏占用空间大但信息价值低。
**Migration**: 移至页面底部 footer，紧凑一行显示。

### Requirement: 免费版横幅
**Reason**: 紫色渐变横幅太突兀像广告。
**Migration**: 仅在每日配额 ≤5 时显示，改为细条通知样式。

## REMOVED Requirements

### Requirement: 重复主题预览区域
**Reason**: 与上方悬浮按钮预览功能重复。
**Migration**: 删除 `themePreviewMock` 区域。

### Requirement: 手动保存按钮
**Reason**: 自动保存替代。
**Migration**: 底部保存栏改为保存状态指示器。
