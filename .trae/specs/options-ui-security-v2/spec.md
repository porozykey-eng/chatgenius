# Options 页面 UI 优化与安全加固 Spec

## Why
当前 options 页面使用紫色主色调（#4f46e5），缺乏成熟产品的专业感。夜间模式增加了维护成本但用户不需要。多处 `innerHTML` 使用存在 XSS 风险，导入设置缺乏数据校验。需要一次性完成 UI 优化、夜间模式移除、安全加固，达到交付级质量。

## What Changes
- **移除夜间模式**：删除 dark theme CSS 变量、主题切换按钮、主题相关 JS 逻辑和存储字段
- **UI 配色重构**：紫色系（#4f46e5）→ 专业蓝色系（#1a73e8 / Google Blue 风格），更符合成熟产品定位
- **UI 布局优化**：从产品经理和用户习惯角度优化间距、层级、视觉引导
- **XSS 防护**：所有动态内容使用 `escapeHtml()` 或 `textContent`，禁止直接 `innerHTML` 拼接用户/API 数据
- **数据导入校验**：导入设置 JSON 时验证字段类型和格式，拒绝非法数据
- **API Key 安全**：输入框添加 `autocomplete="off"` 和 `spellcheck="false"`
- **Bug 修复**：修复角色卡片点击冲突、FAQ 复选框布局错位、激活角色缺少勾选图标等问题

## Impact
- Affected code: `options.html`, `options.js`
- Affected specs: `options-overhaul`（基于其重构成果进行优化）
- Breaking: 无（用户数据结构不变，仅 UI 和逻辑优化）

## ADDED Requirements

### Requirement: 专业蓝色配色方案
系统 SHALL 使用蓝色系作为主色调（primary: #1a73e8, hover: #1557b0），替代当前的紫色系。
配色 SHALL 遵循 Google Material Design / Linear 等成熟产品的视觉规范。

#### Scenario: 用户打开设置页面
- WHEN 用户打开 options.html
- THEN 看到专业蓝色主题的界面，无紫色元素

### Requirement: XSS 防护
系统 SHALL 对所有来自用户输入、API 响应、存储数据的动态内容进行 HTML 转义。
系统 SHALL 提供全局 `escapeHtml(str)` 函数，转义 `& < > " '` 五个字符。
所有使用 `innerHTML` 的地方 SHALL 使用 `escapeHtml()` 包裹动态数据，或改用 `textContent`。

#### Scenario: API 返回包含恶意脚本
- WHEN API 响应中包含 `<script>alert('xss')</script>`
- THEN 页面显示转义后的文本，不执行脚本

### Requirement: 数据导入校验
系统 SHALL 在导入设置 JSON 时验证每个字段的数据类型。
系统 SHALL 拒绝包含非法字段类型的数据并显示错误提示。
系统 SHALL 限制导入文件大小为 1MB 以内。

#### Scenario: 导入包含非法数据的文件
- WHEN 用户导入 personas 字段为字符串（非数组）的 JSON
- THEN 显示"数据格式错误"提示，不修改任何设置

### Requirement: API Key 输入安全
系统 SHALL 为 API Key 输入框添加 `autocomplete="off"`、`spellcheck="false"`、` autocapitalize="off"` 属性。
系统 SHALL 使用 `type="password"` 隐藏 API Key 内容，并提供显示/隐藏切换。

#### Scenario: 用户输入 API Key
- WHEN 用户在 API Key 输入框输入内容
- THEN 内容以密码形式隐藏，可通过切换按钮显示明文

## MODIFIED Requirements

### Requirement: 移除夜间模式
**Reason**: 用户明确不需要夜间模式，增加维护复杂度。
**Migration**: 
- 删除 `:root[data-theme="dark"]` CSS 变量块
- 删除主题切换按钮 HTML
- 删除 `currentTheme`、`updateThemeIcons()`、主题切换事件监听
- 删除 `theme` 存储字段（读取时忽略）
- 固定使用 light 主题

### Requirement: 角色卡片交互优化
**Reason**: 当前 textarea 的 stopPropagation 导致点击冲突，激活状态缺少勾选图标。
**Migration**:
- 修复点击展开/收起逻辑，textarea 点击不触发卡片折叠
- 激活角色卡片显示勾选图标（右上角）

### Requirement: FAQ 复选框布局
**Reason**: checkbox 是 `.faq-item` 直接子元素，不在 header 内，导致布局错位。
**Migration**: 将 checkbox 移入 header 内，调整 CSS 布局。

## REMOVED Requirements

### Requirement: 主题切换功能
**Reason**: 用户不需要夜间模式。
**Migration**: 删除主题切换按钮、相关 CSS 和 JS 逻辑。
