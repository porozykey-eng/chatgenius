# Checklist

## 数据准确性
- [x] Dashboard 今日/本周/本月/总收入在有退款订单时不包含退款金额
- [x] `parseFloat(xxx.total || 0)` 防护已应用于所有收入统计
- [x] 渠道统计 `channelStats` 的 total 字段不会产生 NaN
- [x] `todayActivations`/`weekActivations`/`activeLicenses`/`expiringSoon` 结果不为 undefined
- [x] 订单统计接口 `orders/statistics` 的金额不产生 NaN
- [x] 订单列表 summary 金额不受分页影响
- [x] 最近订单的 price 字段不会返回 null/undefined

## UI 配色
- [x] Header 背景为纯蓝色 #1a73e8，无紫色渐变
- [x] CSS 变量 --primary 为 #1a73e8
- [x] 登录页面背景为蓝色系
- [x] 所有按钮、active 状态使用新 primary 色

## Emoji 移除
- [x] 侧边栏 7 个 tab 无 emoji 前缀
- [x] Header 标题无 emoji
- [x] Dashboard 8 个统计卡片无 emoji，使用 CSS 色块 + 文字缩写
- [x] 空状态无 emoji
- [x] 登录页面标题无 emoji

## 文字可读性
- [x] `.stat-label` 文字在白色背景上清晰可读
- [x] `.loading` 和 `.empty` 文字颜色 >= #6b7280
- [x] 表格表头文字清晰可读
- [x] 登录页面副标题文字清晰可读
