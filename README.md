# ChatGenius AI - 智能回复助手

ChatGenius AI 是一款支持多平台的浏览器插件，旨在利用各大 AI 模型的 API，为您在各大聊天平台上自动生成友好、专业的智能回复。

## 🌟 核心特性
- **跨平台支持**: 完美支持 Web WhatsApp, Messenger, Facebook, Telegram, Slack 和 Discord。
- **多模型无缝切换**: 内置了数十种主流大语言模型配置（包括 DeepSeek, 豆包, OpenAI, Gemini, Claude 等）。
- **智能Fallback机制**: 当主模型 API 遇到异常时，自动回退到备用模型，确保回复顺畅。
- **预设角色与快捷菜单**: 长按悬浮按钮即可唤出快捷菜单，一键生成不同语气的回复（专业、幽默、简短等）。
- **完全本地隐私保护**: 所有 API 密钥和聊天记录均仅保存在浏览器的本地存储（Sync Storage）中，不经过任何第三方服务器。

## 📦 安装说明

1. 下载本项目的代码或压缩包（`.zip`）并解压。
2. 打开 Google Chrome 或基于 Chromium 的浏览器，访问扩展程序页面：`chrome://extensions/`。
3. 在右上角开启 **“开发者模式” (Developer mode)**。
4. 点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**。
5. 选择解压后的 `airepeat` 项目文件夹（即包含 `manifest.json` 的目录）。
6. 安装完成后，插件图标会出现在浏览器右上角。首次安装会自动弹出设置页面。

## ⚙️ 如何配置与使用

1. **获取 API Key**: 在相应的 AI 平台（如 DeepSeek 开放平台 或 豆包大模型控制台）注册并获取您的 API Key。
2. **配置插件**: 点击插件图标，点击“⚙️ 去配置 API”，选择您的模型服务商并填入 API Key。
3. **测试连接**: 点击“测试连接”按钮以确保 API 通信正常，最后保存设置。
4. **开始聊天**: 打开 WhatsApp / Messenger / Telegram 等受支持的平台，聊天窗口旁会自动出现 **AI 悬浮按钮**。
5. **一键回复**:
   - **单击按钮**: 自动读取当前对话上下文，并由 AI 帮您输入草稿。
   - **长按按钮**: 拖拽可以改变按钮位置；或唤出快捷语气的选项菜单。

## 🛠️ 项目结构

- `manifest.json`: 插件的核心清单文件 (Manifest V3)
- `background.js`: 处理后台 LLM 请求逻辑与 Fallback 机制
- `content.js`: 核心 UI 注入与各大平台的聊天内容提取
- `popup.html/js`: 浏览器右上角点击展示的快捷操作面板
- `settings.html/js`: 初次与基础 API 配置向导
- `options.html/js`: 高级控制台与自定义 Prompt 管理

## 📜 开发者指南
如果您想对此项目进行二次开发：
- 核心聊天抓取逻辑位于 `content.js` 中的 `getChatContext()`。
- 如果需要增加新的模型平台，可在 `models-config.json` 或 `background.js` 和 `settings.html` 的预设里进行添加。
- 根目录下有多个以 `.py` 结尾的 Python 辅助脚本，可用于一键打包或生成不同尺寸的图标。正式发布前，请忽略或移除这些无关脚本。

---
*Made with care by You.*
