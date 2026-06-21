# Checklist

## URL 安全
- [x] `/admin` 路径返回 404
- [x] 新随机路径正常返回 admin 页面
- [x] 路径配置在 `.env` 的 `ADMIN_ROUTE` 变量中

## JWT 与认证
- [x] JWT_SECRET 不再有硬编码回退值
- [x] JWT_SECRET 长度 >= 32 字符
- [x] 服务器启动时 JWT_SECRET 缺失会报错
- [x] `requireAdmin` 中间件检查会话 revoked 状态
- [x] `/refresh-token` 检查会话 revoked 状态
- [x] 明文密码比较路径已移除

## XSS 防护
- [x] `escapeHtml()` 函数已添加到 admin.html
- [x] 所有 innerHTML 动态数据已转义（plan, orderNo, note, userAgent, email, details, refundReason 等）
- [x] Chart.js CDN 有 SRI integrity 属性

## 密码安全
- [x] 密码修改不再返回哈希值到客户端
- [x] 密码修改后提示重启服务生效

## CSV 导出
- [x] 激活码 CSV 导出使用 fetch + Blob 下载
- [x] 订单 CSV 导出按钮已绑定事件且功能正常
- [x] 审计日志 CSV 导出使用 fetch + Blob 下载

## 数据准确性
- [x] 周日查看 Dashboard，周收入/周激活数不为 0
- [x] 趋势图日期标签与本地日期一致（无偏移）
- [x] 趋势接口单次请求只执行 1 条 SQL（非 N+1）
- [x] 订单搜索框输入关键词能正确过滤结果
- [x] 订单汇总金额反映全部查询结果，非仅当前页
- [x] IP 白名单保存后重新加载不报错
- [x] `limit` 参数有 200 上限
- [x] 订单统计周/月边界与 Dashboard 一致
