# Options Redesign v3 - 验证清单

## 视觉大气化
- [x] `.page-container` max-width 为 1180px
- [x] 正文字号为 15px
- [x] `.panel-title` 字号为 17px
- [x] `.page-title` 字号为 26px
- [x] panel 间距为 28px
- [x] panel 内 padding 为 24px
- [x] 卡片圆角统一为 12px
- [x] 输入框 `:focus-visible` 显示蓝色边框
- [x] Header 有品牌渐变背景条
- [x] Header 标题加大且有 slogan 副标题
- [x] 顶部 Tab 有图标（角色/知识库/设置/账户）
- [x] Tab 选中指示线为 3px
- [x] Footer 统计区视觉弱化（字号小、颜色浅）
- [x] 保存状态在 Footer 中突出显示

## 首次引导 Onboarding
- [x] 首次打开（无 API Key 且 onboardingCompleted !== true）显示 Onboarding 弹窗
- [x] 步骤 1 显示 5 个角色模板，点击创建角色并进入步骤 2
- [x] 步骤 2 嵌入 API 厂商选择 + Key 输入 + 可选测试
- [x] 步骤 3 显示"一切就绪"和"开始使用"按钮
- [x] 点击"开始使用"关闭弹窗并标记 onboardingCompleted: true
- [x] 点击"跳过"关闭弹窗并标记 onboardingCompleted: true
- [x] 已完成引导（onboardingCompleted: true）不再显示弹窗
- [x] Onboarding 文案有中英文 i18n

## 智能 API 引导条
- [x] 未配置 API Key 时顶部显示蓝色引导条
- [x] 引导条含"去配置"按钮
- [x] 点击"去配置"切换到设置 Tab 并滚动到 API 面板
- [x] 配置 API Key 后引导条自动隐藏

## API Provider 动态加载
- [x] API Provider 下拉框从 models-config.json 动态加载
- [x] 厂商按"国际/国内"分组（optgroup）
- [x] 包含 models-config.json 中所有厂商（14 个：智谱/DeepSeek/通义/豆包/Moonshot/百川/零一/MiniMax/阶跃/OpenAI/Anthropic/Google/OpenRouter/自定义）
- [x] 切换厂商时 Key 输入框 placeholder 更新
- [x] 测试连接使用选中厂商的端点

## API Key 存储迁移
- [x] 新配置的 apiKey 写入 chrome.storage.local
- [x] loadSettings 从 local 读取 apiKey
- [x] 检测到 sync 中有 apiKey 且 local 无时自动迁移
- [x] 迁移后 sync 中的 apiKey 被删除
- [x] 实时预览从 local 读取 apiKey 正常工作

## 空状态 CTA
- [x] 角色列表为空时显示"从模板创建"和"手动添加"按钮
- [x] FAQ 列表为空时显示"添加第一条"按钮
- [x] 点击 CTA 按钮执行对应操作
- [x] 空状态样式使用 CSS 类而非内联 style

## 角色创建简化
- [x] 点击"添加角色"后新卡片自动展开 prompt
- [x] 新角色名称输入框自动聚焦

## 死按钮修复
- [x] 升级 Modal"我有激活码"按钮可点击
- [x] 点击后关闭升级 Modal
- [x] 点击后切换到账户 Tab
- [x] 点击后聚焦激活码输入框

## 快捷键展示
- [x] 快捷键区域为说明卡片样式（非只读 input）
- [x] 每个快捷键显示图标 + 徽章 + 说明
- [x] 不再使用 readonly input 占位

## 连接测试增强
- [x] 测试失败显示具体错误类型（网络/认证/额度）
- [x] 不再仅显示笼统"错误"

## 响应式
- [x] 存在 @media (max-width: 768px) 平板断点
- [x] 平板断点下布局合理
- [x] Toast 最大宽度 360px
- [x] Toast 长文案自动换行
- [x] Tab 在窄屏支持横向滚动

## 功能回归验证
- [x] 自动保存功能正常（代码层面逻辑完整）
- [x] 角色管理（增删改、激活切换、模板库）正常（代码层面逻辑完整）
- [x] FAQ 管理（增删改、批量、搜索、导入导出）正常（代码层面逻辑完整）
- [x] API 配置与测试功能正常（代码层面逻辑完整）
- [x] 数据导出/导入功能正常（代码层面逻辑完整）
- [x] 激活码功能正常（代码层面逻辑完整）
- [x] 实时预览功能正常（代码层面逻辑完整）
- [x] 响应式布局正常（代码层面逻辑完整）
