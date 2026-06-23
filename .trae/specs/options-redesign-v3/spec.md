# 插件设置页完美优化（Options Redesign v3）Spec

## Why
当前 options 设置页虽已完成配色统一、XSS 防护、自动保存、骨架屏等基础优化，但用户始终不满意：视觉上不够大气（容器窄、字号小、间距紧），上手不简单（无引导、默认入口错误、API 厂商严重缺失、存在死按钮）。本次目标是做一次"完美"的视觉与体验升级，让设置页成为产品的功能核心展示窗口，新用户打开即知如何操作，整体观感大气专业。

## What Changes

### 视觉大气化
- 页面容器 max-width 从 960px 提升至 **1180px**，大屏不再空旷
- 字号系统全面升级：正文 14→**15px**、面板标题 15→**17px**、页面标题 20→**26px**、副文本 13→**13.5px**
- panel 间距从 24px 提升至 **28px**，panel 内 padding 从 20px 提升至 **24px**
- Header 升级：品牌区增加渐变背景条、标题加大、增加产品 slogan
- 顶部 Tab 样式升级：增大点击区域、选中指示线加粗、增加图标
- 卡片阴影柔和化、圆角统一为 12px
- 品牌色保留 #1a73e8，增加辅助色（成功绿、警告橙）的规范使用

### 简单上手
- **首次引导 Onboarding**：首次打开（无 API Key 且未完成引导）显示 3 步弹窗（选角色模板 → 配置 API → 开始使用），完成后标记 `onboardingCompleted: true`
- **智能默认入口**：未配置 API Key 时，顶部显示蓝色引导条"建议先配置 API 以启用 AI 回复"，带"去配置"按钮
- **空状态 CTA**：角色列表为空时显示"从模板创建"按钮；FAQ 为空时显示"添加第一条"按钮
- **修复死按钮**：升级 Modal 的"我有激活码"按钮绑定事件，跳转到账户 Tab 的激活码输入
- **角色创建简化**：点"添加角色"后新卡片自动展开 prompt 并聚焦，无需再手动展开

### 功能完善
- **API Provider 补齐**：从 `models-config.json` 动态加载所有支持的厂商（当前 UI 仅 3 个，实际支持 20+），按"国际/国内"分组显示
- **API Key 存储迁移**：从 `chrome.storage.sync` 迁移到 `chrome.storage.local`（避免跨设备同步敏感数据、突破 sync 100KB 限制），迁移时自动兼容旧数据
- **快捷键展示优化**：将只读 input 改为说明卡片样式（图标 + 快捷键 + 说明文字），不再占用 form-group
- **连接测试增强**：测试失败时显示具体错误类型（网络/认证/额度），而非笼统"错误"

### 体验细节
- 响应式增加平板断点（768px），中等屏幕优化布局
- Toast 位置优化：长文案自动换行，最大宽度 360px
- 输入框 `:focus-visible` 统一蓝色边框
- Footer 统计区视觉弱化（次要信息），突出保存状态

## Impact
- Affected specs: `options-ui-security-v2`（已完成，本次在其基础上继续）、`options-overhaul`（未实施，本次取代其部分目标）
- Affected code:
  - `options.html` — 容器宽度、字号、间距、Header、Tab、Onboarding Modal、空状态、快捷键卡片
  - `options.js` — Onboarding 逻辑、API Provider 动态加载、API Key 存储迁移、死按钮修复、空状态 CTA、角色创建简化
  - `models-config.json` — 作为 API Provider 数据源（只读）
  - `_locales/*/messages.json` — 新增 Onboarding 相关 i18n 键

## ADDED Requirements

### Requirement: 首次引导 Onboarding
系统 SHALL 在用户首次打开设置页（无 API Key 且 `onboardingCompleted !== true`）时显示 3 步引导弹窗。

#### Scenario: 首次打开
- **WHEN** 用户首次打开设置页且未配置 API Key
- **THEN** 显示步骤 1：选择角色模板（销售/客服/技术/产品/客户成功），点击任一模板即创建角色并进入步骤 2
- **AND** 步骤 2：配置 API（选择厂商 + 输入 Key + 可选测试），点击"下一步"进入步骤 3
- **AND** 步骤 3：完成提示"一切就绪"，点击"开始使用"关闭弹窗并标记 `onboardingCompleted: true`

#### Scenario: 跳过引导
- **WHEN** 用户点击"跳过"
- **THEN** 关闭弹窗，标记 `onboardingCompleted: true`，不再显示

#### Scenario: 已完成引导
- **WHEN** `onboardingCompleted === true`
- **THEN** 不显示引导弹窗

### Requirement: API Provider 动态加载
系统 SHALL 从 `models-config.json` 动态加载所有支持的 API 厂商，按"国际厂商/国内厂商"分组显示在下拉选择中。

#### Scenario: 加载厂商列表
- **WHEN** 设置页加载 API 配置面板
- **THEN** 读取 `models-config.json`，按分组渲染 `<optgroup>`（国际：OpenAI/Anthropic/Google/x.ai/Mistral/Cohere/OpenRouter；国内：DeepSeek/通义/智谱/文心/火山/月之暗面/讯飞/MiniMax/StepFun/零一/百川/SiliconFlow）
- **AND** 每个 option 显示厂商名称，value 为 provider id

#### Scenario: 切换厂商
- **WHEN** 用户选择某厂商
- **THEN** API Key 输入框 placeholder 显示该厂商的 Key 格式提示
- **AND** 测试连接按钮使用该厂商的端点

### Requirement: API Key 本地存储
系统 SHALL 将 API Key 存储在 `chrome.storage.local` 而非 `sync`，并自动迁移旧数据。

#### Scenario: 新用户
- **WHEN** 新用户首次配置 API Key
- **THEN** Key 存入 `chrome.storage.local`，不进入 sync

#### Scenario: 老用户迁移
- **WHEN** 加载设置时检测到 sync 中存在 `apiKey` 且 local 中不存在
- **THEN** 自动将 sync 中的 `apiKey`/`apiProvider` 复制到 local，并从 sync 中删除 `apiKey`

### Requirement: 智能 API 引导条
系统 SHALL 在未配置 API Key 时于顶部显示引导条。

#### Scenario: 未配置 API
- **WHEN** 加载设置时检测到 local 中无 `apiKey` 或 `apiKey` 为空
- **THEN** 顶部显示蓝色引导条"建议先配置 API 以启用 AI 回复"，含"去配置"按钮
- **AND** 点击"去配置"切换到设置 Tab 并滚动到 API 配置面板

#### Scenario: 已配置 API
- **WHEN** local 中存在非空 `apiKey`
- **THEN** 不显示引导条

## MODIFIED Requirements

### Requirement: 角色创建流程
用户点击"添加角色"后，新角色卡片 SHALL 自动展开 prompt 输入区并聚焦名称输入框，无需用户再手动点击展开。

### Requirement: 空状态展示
角色列表和 FAQ 列表为空时 SHALL 显示带 CTA 按钮的空状态，而非仅文案。

#### Scenario: 角色空状态
- **WHEN** 角色列表为空
- **THEN** 显示角色图标 + "还没有自定义角色" + "从模板创建"按钮 + "手动添加"按钮

#### Scenario: FAQ 空状态
- **WHEN** FAQ 列表为空
- **THEN** 显示 FAQ 图标 + "还没有知识库条目" + "添加第一条"按钮

### Requirement: 升级 Modal 交互
升级 Modal 中的"我有激活码"按钮 SHALL 绑定点击事件，点击后关闭升级 Modal 并切换到账户 Tab 聚焦激活码输入框。

### Requirement: 快捷键展示
快捷键区域 SHALL 以说明卡片形式展示（图标 + 快捷键徽章 + 说明文字），不再使用只读 input 占位。

## REMOVED Requirements

### Requirement: 快捷键只读 Input
**Reason**: 只读 input 占用 form-group 空间但无交互价值，改为说明卡片更清晰
**Migration**: 原快捷键 input 的值（Alt+2 / Ctrl+Enter / Ctrl+R）以徽章形式展示在说明卡片中
