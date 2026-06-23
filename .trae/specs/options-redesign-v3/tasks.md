# Tasks

- [x] Task 1: 视觉大气化 — 容器与字号系统升级（`options.html`）
  - [x] SubTask 1.1: `.page-container` max-width 从 960px 改为 1180px
  - [x] SubTask 1.2: 字号升级：正文 14→15px、`.panel-title` 15→17px、`.page-title` 20→26px、`.panel-desc` 13→13.5px
  - [x] SubTask 1.3: panel 间距 24px→28px，panel 内 padding 20px→24px
  - [x] SubTask 1.4: 卡片圆角统一 12px，阴影柔和化
  - [x] SubTask 1.5: 输入框 `:focus-visible` 统一蓝色边框

- [x] Task 2: 视觉大气化 — Header 与 Tab 升级（`options.html`）
  - [x] SubTask 2.1: Header 增加品牌渐变背景条、标题加大、增加 slogan 副标题
  - [x] SubTask 2.2: 顶部 Tab 增加图标（角色/知识库/设置/账户）、增大点击区域、选中指示线加粗至 3px
  - [x] SubTask 2.3: Footer 统计区视觉弱化（字号缩小、颜色变浅），突出保存状态

- [x] Task 3: 首次引导 Onboarding（`options.html` + `options.js`）
  - [x] SubTask 3.1: HTML 新增 Onboarding Modal 结构（3 步：选模板 → 配置 API → 完成）
  - [x] SubTask 3.2: JS 实现首次检测逻辑（无 API Key 且 `onboardingCompleted !== true` 时触发）
  - [x] SubTask 3.3: 步骤 1 渲染角色模板列表，点击创建角色并进入步骤 2
  - [x] SubTask 3.4: 步骤 2 嵌入 API 配置（厂商选择 + Key 输入 + 可选测试），下一步进入步骤 3
  - [x] SubTask 3.5: 步骤 3 显示"一切就绪"，点击"开始使用"关闭并标记 `onboardingCompleted: true`
  - [x] SubTask 3.6: 支持"跳过"按钮，跳过也标记完成
  - [x] SubTask 3.7: 新增 i18n 键（onboarding 标题/步骤说明/按钮文案）

- [x] Task 4: 智能 API 引导条（`options.html` + `options.js`）
  - [x] SubTask 4.1: HTML 新增顶部引导条结构（默认隐藏）
  - [x] SubTask 4.2: JS 加载时检测 local 中无 apiKey 则显示引导条
  - [x] SubTask 4.3: "去配置"按钮点击切换到设置 Tab 并滚动到 API 面板
  - [x] SubTask 4.4: API Key 配置后自动隐藏引导条

- [x] Task 5: API Provider 动态加载（`options.js` + 读取 `models-config.json`）
  - [x] SubTask 5.1: 读取 `models-config.json`，解析厂商列表，按国际/国内分组
  - [x] SubTask 5.2: 动态渲染 `<optgroup>` + `<option>` 到 API Provider 下拉框
  - [x] SubTask 5.3: 切换厂商时更新 Key 输入框 placeholder 提示
  - [x] SubTask 5.4: 测试连接使用选中厂商的端点，失败时显示具体错误类型

- [x] Task 6: API Key 存储迁移（`options.js`）
  - [x] SubTask 6.1: `doSave()` 中 apiKey/apiProvider 写入 `chrome.storage.local`
  - [x] SubTask 6.2: `loadSettings()` 中从 local 读取 apiKey/apiProvider
  - [x] SubTask 6.3: 迁移逻辑：检测 sync 中有 apiKey 且 local 无，则复制到 local 并删除 sync 中的 apiKey
  - [x] SubTask 6.4: 确保实时预览、background 调用均从 local 读取 apiKey

- [x] Task 7: 空状态 CTA 与角色创建简化（`options.js`）
  - [x] SubTask 7.1: 角色空状态增加"从模板创建"和"手动添加"两个 CTA 按钮
  - [x] SubTask 7.2: FAQ 空状态增加"添加第一条"CTA 按钮
  - [x] SubTask 7.3: 角色创建后新卡片自动展开 prompt 并聚焦名称输入框
  - [x] SubTask 7.4: 空状态样式从内联 style 抽象为 CSS 类

- [x] Task 8: 修复死按钮与快捷键展示优化（`options.html` + `options.js`）
  - [x] SubTask 8.1: 升级 Modal"我有激活码"按钮绑定事件：关闭升级 Modal → 切换账户 Tab → 聚焦激活码输入
  - [x] SubTask 8.2: 快捷键只读 input 改为说明卡片（图标 + 快捷键徽章 + 说明文字）
  - [x] SubTask 8.3: 连接测试失败时显示具体错误类型（网络/认证/额度）

- [x] Task 9: 响应式与体验细节（`options.html`）
  - [x] SubTask 9.1: 新增平板断点 @media (max-width: 768px)，优化中等屏幕布局
  - [x] SubTask 9.2: Toast 最大宽度 360px，长文案自动换行
  - [x] SubTask 9.3: Tab 在窄屏支持横向滚动（overflow-x: auto）

- [x] Task 10: 提交、推送并验证
  - [x] SubTask 10.1: git add + commit + push gitee
  - [ ] SubTask 10.2: Chrome 扩展重新加载，验证所有功能

# Task Dependencies
- Task 1, 2 可并行（纯 CSS 视觉调整）
- Task 3 依赖 Task 5（Onboarding 步骤 2 需要 API Provider 列表）
- Task 4 依赖 Task 6（引导条检测依赖 API Key 存储迁移）
- Task 5, 6 可并行（Provider 加载与存储迁移独立）
- Task 7, 8, 9 可并行（独立功能点）
- Task 10 依赖 Task 1-9 全部完成
