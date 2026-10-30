### 概述

`@kne/message-template` 是邮件、短信等消息模板的公共语法与渲染包，前端和 Node 端都能直接调用。模板语法基于 [Liquid](https://liquidjs.com/)，并收窄为一个白名单子集：只允许变量输出和扁平的 if / else 条件。这样编辑器（如 `components-thirdparty` 的 CKEditor、TemplateEditor）产出的模板，与后端发送时的渲染结果保持一致。

### 主要特性

- **统一的模板语法定义**：变量 `{{ name }}` / `{{ name | raw }}`，条件 `{% if %}…{% else %}…{% endif %}`，算子与连接符白名单
- **条件表达式双向转换**：结构化 clauses 与 Liquid 表达式互相转换，生成中文展示文案
- **保存前校验**：`validateTemplateHtml` 检查标签配对、语法白名单并用 liquidjs 解析
- **HTML / 纯文本两种渲染**：HTML 模式自动转义变量，`| raw` 原样输出；文本模式（短信）不转义
- **HTML 与纯文本互转**：`htmlToText` / `textToHtml` 不依赖 DOM，Node 端也可使用
- **同构**：发布 CommonJS 与 ES Module 两种产物，附带 TypeScript 类型声明

### 使用场景

- 运营后台编辑邮件 / 短信模板，前端预览与后端发送共用同一套渲染
- 服务端批量发送前对模板做合法性校验
- 把编辑器产出的 HTML 转成短信纯文本，或把纯文本模板回填到编辑器
