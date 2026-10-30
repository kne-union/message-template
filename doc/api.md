### 渲染与转换

| 方法 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| renderTemplate | `(template: string, data?: object, options?: { type?: 'html' \| 'text' })` | string | 用数据渲染模板。`type` 默认 `html`：`{{ name }}` 做 HTML 转义、`{{ name \| raw }}` 原样输出；`text` 时不转义，用于短信等纯文本 |
| textToHtml | `(text: string)` | string | 纯文本转编辑器 HTML：每行一个 `<p>`，空行用 `&nbsp;` 占位，`< > &` 转义 |
| htmlToText | `(html: string)` | string | HTML 转纯文本：块级元素各占一行，`<br>` 换行，实体解码，空段落输出空行；完整邮件文档中的 `head` / `style` / `script` 与注释会被忽略，源码排版的换行缩进按空格处理；不依赖 DOM |

### 校验

| 方法 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| validateTemplateHtml | `(html: string)` | `{ ok: boolean, error?: string }` | 标签配对 + 语法白名单（`{{ path }}`、`{{ path \| raw }}`、规范形态的 `{% if %}`、`{% else %}`、`{% endif %}`、块级标记注释）+ liquidjs 解析 |
| findUnbalancedTemplateTags | `(text: string)` | string \| null | 只检查 `{{ }}` / `{% %}` 是否配对，合法返回 `null` |

### 变量语法

| 方法 / 常量 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| wrapVariable | `(name: string, kind?: 'interpolate' \| 'raw')` | string | 生成 `{{ name }}` 或 `{{ name \| raw }}`；name 不是合法路径时返回空串 |
| findTemplateMatches | `(text: string)` | `Array<{ start, end, name, kind, raw }>` | 找出文本中白名单内的变量输出 |
| resolveVariableLabel | `(name, kind?, variables?)` | string | 按变量列表取展示名，找不到时返回 name |
| normalizeVariableKind | `(kind?: string)` | `'interpolate' \| 'raw'` | 旧值 `escape` 归一为 `raw` |
| VARIABLE_PATH_SOURCE / VARIABLE_PATH_RE | - | string / RegExp | 变量路径：标识符，可用 `.` 访问属性 |
| LIQUID_OUTPUT_RE | - | RegExp | 匹配白名单变量输出（全局） |
| KIND_INTERPOLATE / KIND_RAW / KIND_ESCAPE | - | string | 变量输出方式 |

### 条件语法

条件由若干 clause 组成，每条 `{ subject, operator, value }`，多条之间用同一种连接符 `and` / `or` 扁平连接（Liquid 不支持括号）。

| 算子 | 常量 | Liquid 表达式 | 展示文案 |
|----|----|-----|----|
| truthy | OPERATOR_TRUTHY | `name` | name为真 |
| falsy | OPERATOR_FALSY | `name == false` | name为假 |
| filled | OPERATOR_FILLED | `name != blank` | name有值 |
| empty | OPERATOR_EMPTY | `name == blank` | name空值 |
| eq | OPERATOR_EQ | `name == 'value'` | name=value |
| neq | OPERATOR_NEQ | `name != 'value'` | name≠value |

| 方法 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| buildConditionExpression | `(input: { clauses?, joiner?, subject?, operator?, value? })` | string | 生成 `{% if %}` 内的表达式；数字值不加引号 |
| buildClauseExpression | `(clause)` | string | 单条 clause 的表达式；subject 非法时返回 `false` |
| parseConditionExpression | `(expr: string)` | `{ clauses, joiner, subject, operator, value } \| null` | 解析规范形态表达式；混用 and / or 或白名单外写法返回 `null` |
| parseSingleClauseExpression | `(expr: string)` | `{ subject, operator, value } \| null` | 解析单条 |
| normalizeConditionClauses | `(input, operators?)` | `{ clauses, joiner }` | 归一表单 / 存储数据 / 旧三属性写法 |
| normalizeOperator / normalizeJoiner | `(value)` | string | 非白名单值回落为 `filled` / `and` |
| formatConditionBadge | `(input, variables?)` | string | 条件展示文案，如 `手机有值 且 VIP为真` |
| formatClauseBadge / formatJoinerLabel / resolveSubjectLabel | - | string | 单条文案、连接符文案（且 / 或）、字段展示名 |
| wrapConditionEvaluate | `({ ...condition, hasElse, thenHtml, elseHtml })` | string | 拼出完整 `{% if %}…{% else %}…{% endif %}` |
| findConditionMatches | `(text: string)` | `Array<{ start, end, raw, clauses, joiner, hasElse, layout, thenHtml, elseHtml, ... }>` | 找出文本中规范形态的条件块，`layout` 为 `inline` / `block` |
| readClausesFromAttributes | `(getAttr: (name) => string)` | `{ clauses, joiner }` | 从数据态元素的 `data-template-condition-*` 属性读取条件 |

| 常量 | 说明 |
|----|----|
| DEFAULT_OPERATORS | 全部算子 |
| JOINER_AND / JOINER_OR / DEFAULT_JOINER | 连接符 |
| DEFAULT_MAX_CLAUSES | 默认最多条件数（5） |
| LAYOUT_INLINE / LAYOUT_BLOCK | 条件布局 |
| CONDITION_LAYOUT_BLOCK_MARKER | 块级条件前的 Liquid 注释标记 `{% # ck-layout:block %}`，渲染时忽略 |
| LIQUID_IF_OPEN_RE | 匹配 `{% if %}` 开始标签（可带块级标记） |
| TEMPLATE_CONDITION_CLASS | 数据态条件元素 class |
| TEMPLATE_CONDITION_*_ATTR | 数据态条件元素属性名：SUBJECT / OPERATOR / VALUE / CLAUSES / JOINER / HAS_ELSE / LAYOUT |
