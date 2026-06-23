# Admin 后台数据准确性与 UI 优化 Spec

## Why
Admin 后台存在多处数据统计不严谨问题（金额计算可能产生 NaN、退款订单被重复统计等），以及 UI 设计不专业（emoji 图标、配色不统一、文字可读性差）等问题，需要系统性修复。

## What Changes
- **数据准确性**：修复金额统计中 NULL 值导致 NaN、退款金额未从收入中扣除、订单统计缺少边界条件等问题
- **UI 设计**：移除所有 emoji 图标，改用纯文字或 CSS 图标；统一配色为蓝色系；优化字号和排版
- **可读性**：修复浅灰色文字在白色背景上的对比度问题、表格行高和间距优化

## Impact
- Affected specs: admin 面板
- Affected code: `server/admin.js`, `server/admin.html`

## ADDED Requirements
无新增功能，仅修复和优化。

## MODIFIED Requirements

### Requirement: Dashboard 收入统计
Dashboard SHALL 准确统计各时间段收入，排除已退款订单，金额 SHALL 始终为有效数字（不允许 NaN）。

#### Scenario: 存在退款订单
- **WHEN** 某订单状态为 `refunded`
- **THEN** 该订单金额不计入任何收入统计

#### Scenario: 金额字段为 NULL
- **WHEN** orders 表中 price 字段为 NULL
- **THEN** 统计结果为 0，不产生 NaN

### Requirement: 渠道收入统计
渠道收入分布 SHALL 排除退款订单，且各渠道金额之和 SHALL 等于总已完成收入。

#### Scenario: 某渠道无已完成订单
- **WHEN** 某支付渠道没有 completed 状态的订单
- **THEN** 该渠道不出现在统计结果中，不产生 NULL 金额

### Requirement: UI 图标标准化
Admin 面板 SHALL 不使用 emoji 作为功能图标，改用纯文字标签或 CSS 样式。

#### Scenario: 侧边栏导航
- **WHEN** 用户查看侧边栏
- **THEN** 每个 tab 使用纯文字标签（如"概览"、"激活码"），不使用 emoji 前缀

#### Scenario: 统计卡片
- **WHEN** 用户查看 Dashboard 统计卡片
- **THEN** 卡片使用 CSS 色块区分不同类型，不使用 emoji 图标

### Requirement: 文字可读性
所有文字 SHALL 满足 WCAG AA 对比度标准（普通文字 >= 4.5:1，大文字 >= 3:1）。

#### Scenario: 次要文字对比度
- **WHEN** 用户查看统计标签、表格辅助信息
- **THEN** 文字颜色与背景对比度 >= 4.5:1（灰色文字使用 `#6b7280` 或更深）

### Requirement: 配色统一
Header 和全局配色 SHALL 统一为蓝色系（`#1a73e8`），与 options 页面保持一致。

#### Scenario: Header 配色
- **WHEN** 用户打开 Admin 面板
- **THEN** Header 背景为纯蓝色（`#1a73e8`），不使用紫色渐变

## REMOVED Requirements
无。
