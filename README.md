# message-template

### 描述

邮件 / 短信等消息模板工具：基于 Liquid 的变量与条件语法定义、渲染、HTML 与纯文本互转，前端与 Node 端通用

### 关键词

message-template, email-template, sms-template, liquid, liquidjs, template-variable, template-condition, html-to-text, isomorphic, nodejs

### 安装

```shell
npm i --save @kne/message-template
```

### 概述

#### 概述

`@kne/message-template` 是邮件、短信等消息模板的公共语法与渲染包，前端和 Node 端都能直接调用。模板语法基于 [Liquid](https://liquidjs.com/)，并收窄为一个白名单子集：只允许变量输出和扁平的 if / else 条件。这样编辑器（如 `components-thirdparty` 的 CKEditor、TemplateEditor）产出的模板，与后端发送时的渲染结果保持一致。

#### 主要特性

- **统一的模板语法定义**：变量 `{{ name }}` / `{{ name | raw }}`，条件 `{% if %}…{% else %}…{% endif %}`，算子与连接符白名单
- **条件表达式双向转换**：结构化 clauses 与 Liquid 表达式互相转换，生成中文展示文案
- **保存前校验**：`validateTemplateHtml` 检查标签配对、语法白名单并用 liquidjs 解析
- **HTML / 纯文本两种渲染**：HTML 模式自动转义变量，`| raw` 原样输出；文本模式（短信）不转义
- **HTML 与纯文本互转**：`htmlToText` / `textToHtml` 不依赖 DOM，Node 端也可使用
- **同构**：发布 CommonJS 与 ES Module 两种产物，附带 TypeScript 类型声明

#### 使用场景

- 运营后台编辑邮件 / 短信模板，前端预览与后端发送共用同一套渲染
- 服务端批量发送前对模板做合法性校验
- 把编辑器产出的 HTML 转成短信纯文本，或把纯文本模板回填到编辑器


### 示例

#### 示例代码

- 渲染模板
- renderTemplate 渲染面试邀请邮件与短信：HTML 模式转义变量、raw 原样输出，文本模式不转义；先用 validateTemplateHtml 校验
- _MessageTemplate(@kne/current-lib_message-template)[import * as _MessageTemplate from "@kne/message-template"],antd(antd)

```jsx
const { renderTemplate, validateTemplateHtml } = _MessageTemplate;
const { Alert, Card, Flex, Input, Segmented, Typography } = antd;
const { useMemo, useState } = React;

const templates = {
  html: &#96;<p>{{ candidate.name }} 您好：</p>
<p>感谢您投递 <strong>{{ job.title }}</strong> 岗位，邀请您参加 AI 面试。</p>
{% if isVip %}<p>您已进入优先通道，面试结果将在 24 小时内通知。</p>{% else %}<p>面试结果将在 3 个工作日内通知。</p>{% endif %}
<p>{{ signature | raw }}</p>&#96;,
  text: '【{{ company }}】{{ candidate.name }}您好，邀请您参加{{ job.title }}岗位AI面试，链接：{{ link }}{% if deadline != blank %}，请于{{ deadline }}前完成{% endif %}。'
};

const data = {
  company: '领英智聘',
  candidate: { name: '张<三>' },
  job: { title: '高级前端工程师' },
  isVip: true,
  signature: '<em>招聘团队</em>',
  link: 'https://t.cn/ai-iv',
  deadline: '11月5日'
};

const BaseExample = () => {
  const [type, setType] = useState('html');
  const [source, setSource] = useState(templates);
  const template = source[type];

  const result = useMemo(() => {
    const validation = validateTemplateHtml(template);
    if (!validation.ok) {
      return validation;
    }
    return { ok: true, output: renderTemplate(template, data, { type }) };
  }, [template, type]);

  return (
    <Flex vertical gap={12}>
      <Segmented
        value={type}
        onChange={setType}
        options={[
          { label: '邮件（html）', value: 'html' },
          { label: '短信（text）', value: 'text' }
        ]}
      />
      <Input.TextArea autoSize={{ minRows: 4 }} value={template} onChange={e => setSource({ ...source, [type]: e.target.value })} />
      <Typography.Text type="secondary">数据：{JSON.stringify(data)}</Typography.Text>
      {result.ok ? (
        <Card size="small" title="渲染结果">
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{result.output}</pre>
        </Card>
      ) : (
        <Alert type="error" showIcon message="模板不合法" description={result.error} />
      )}
    </Flex>
  );
};

render(<BaseExample />);

```

- 条件表达式
- 在结构化条件和 Liquid 表达式之间双向转换，并生成展示文案
- _MessageTemplate(@kne/current-lib_message-template)[import * as _MessageTemplate from "@kne/message-template"],antd(antd)

```jsx
const { buildConditionExpression, parseConditionExpression, formatConditionBadge, wrapConditionEvaluate, DEFAULT_OPERATORS } = _MessageTemplate;
const { Button, Card, Flex, Input, Segmented, Select, Typography } = antd;
const { useState } = React;

const variables = [
  { name: 'candidate.phone', label: '手机号' },
  { name: 'isVip', label: 'VIP' },
  { name: 'job.level', label: '职级' }
];

const operatorLabels = { truthy: '为真', falsy: '为假', filled: '有值', empty: '空值', eq: '等于', neq: '不等于' };

const ConditionExample = () => {
  const [joiner, setJoiner] = useState('and');
  const [clauses, setClauses] = useState([
    { subject: 'candidate.phone', operator: 'filled', value: '' },
    { subject: 'job.level', operator: 'eq', value: 'P7' }
  ]);
  const [expr, setExpr] = useState("isVip or job.level != 'P5'");

  const updateClause = (index, patch) => setClauses(clauses.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const condition = { clauses, joiner };
  const parsed = parseConditionExpression(expr);

  return (
    <Flex vertical gap={12}>
      <Card size="small" title="结构化条件 → Liquid">
        <Flex vertical gap={8}>
          <Segmented
            value={joiner}
            onChange={setJoiner}
            options={[
              { label: '且（and）', value: 'and' },
              { label: '或（or）', value: 'or' }
            ]}
          />
          {clauses.map((clause, index) => (
            <Flex key={index} gap={8}>
              <Select style={{ width: 140 }} value={clause.subject} onChange={subject => updateClause(index, { subject })} options={variables.map(item => ({ label: item.label, value: item.name }))} />
              <Select style={{ width: 100 }} value={clause.operator} onChange={operator => updateClause(index, { operator })} options={DEFAULT_OPERATORS.map(value => ({ label: operatorLabels[value], value }))} />
              {['eq', 'neq'].includes(clause.operator) && <Input style={{ width: 120 }} value={clause.value} onChange={e => updateClause(index, { value: e.target.value })} />}
            </Flex>
          ))}
          <Button size="small" style={{ alignSelf: 'flex-start' }} onClick={() => setClauses([...clauses, { subject: 'isVip', operator: 'truthy', value: '' }])}>
            添加条件
          </Button>
          <Typography.Text>展示文案：{formatConditionBadge(condition, variables)}</Typography.Text>
          <Typography.Text code>{buildConditionExpression(condition)}</Typography.Text>
          <Typography.Text code>{wrapConditionEvaluate({ ...condition, hasElse: true, thenHtml: '优先处理', elseHtml: '常规处理' })}</Typography.Text>
        </Flex>
      </Card>
      <Card size="small" title="Liquid → 结构化条件">
        <Flex vertical gap={8}>
          <Input value={expr} onChange={e => setExpr(e.target.value)} />
          {parsed ? (
            <>
              <Typography.Text>展示文案：{formatConditionBadge(parsed, variables)}</Typography.Text>
              <pre style={{ margin: 0 }}>{JSON.stringify({ joiner: parsed.joiner, clauses: parsed.clauses }, null, 2)}</pre>
            </>
          ) : (
            <Typography.Text type="danger">不是规范形态的条件（如混用 and / or、使用 &gt; 等白名单外算子）</Typography.Text>
          )}
        </Flex>
      </Card>
    </Flex>
  );
};

render(<ConditionExample />);

```

- HTML 与纯文本互转
- htmlToText / textToHtml 在编辑器 HTML 与短信纯文本之间转换，不依赖 DOM，Node 端同样可用
- _MessageTemplate(@kne/current-lib_message-template)[import * as _MessageTemplate from "@kne/message-template"],antd(antd)

```jsx
const { htmlToText, textToHtml, renderTemplate } = _MessageTemplate;
const { Card, Flex, Input, Typography } = antd;
const { useState } = React;

const TextExample = () => {
  const [text, setText] = useState('【领英智聘】{{ name }}您好：\n\n您的面试已安排在{{ time }}，请准时参加。\n回复 T 退订');
  const html = textToHtml(text);
  const back = htmlToText(html);
  const sms = renderTemplate(back, { name: '李雷', time: '11月3日 14:00' }, { type: 'text' });

  return (
    <Flex vertical gap={12}>
      <Input.TextArea autoSize={{ minRows: 4 }} value={text} onChange={e => setText(e.target.value)} />
      <Card size="small" title="textToHtml（回填编辑器）">
        <Typography.Text code style={{ wordBreak: 'break-all' }}>
          {html}
        </Typography.Text>
      </Card>
      <Card size="small" title={&#96;htmlToText（往返${back === text ? '一致' : '不一致'}）+ 渲染短信，共 ${sms.length} 字&#96;}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sms}</pre>
      </Card>
    </Flex>
  );
};

render(<TextExample />);

```

### API

#### 渲染与转换

| 方法 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| renderTemplate | `(template: string, data?: object, options?: { type?: 'html' \| 'text' })` | string | 用数据渲染模板。`type` 默认 `html`：`{{ name }}` 做 HTML 转义、`{{ name \| raw }}` 原样输出；`text` 时不转义，用于短信等纯文本 |
| textToHtml | `(text: string)` | string | 纯文本转编辑器 HTML：每行一个 `<p>`，空行用 `&nbsp;` 占位，`< > &` 转义 |
| htmlToText | `(html: string)` | string | 编辑器 HTML 转纯文本：顶层每个块一行，`<br>` 换行，实体解码，空段落输出空行；不依赖 DOM |

#### 校验

| 方法 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| validateTemplateHtml | `(html: string)` | `{ ok: boolean, error?: string }` | 标签配对 + 语法白名单（`{{ path }}`、`{{ path \| raw }}`、规范形态的 `{% if %}`、`{% else %}`、`{% endif %}`、块级标记注释）+ liquidjs 解析 |
| findUnbalancedTemplateTags | `(text: string)` | string \| null | 只检查 `{{ }}` / `{% %}` 是否配对，合法返回 `null` |

#### 变量语法

| 方法 / 常量 | 参数 | 返回值 | 说明 |
|----|----|-----|----|
| wrapVariable | `(name: string, kind?: 'interpolate' \| 'raw')` | string | 生成 `{{ name }}` 或 `{{ name \| raw }}`；name 不是合法路径时返回空串 |
| findTemplateMatches | `(text: string)` | `Array<{ start, end, name, kind, raw }>` | 找出文本中白名单内的变量输出 |
| resolveVariableLabel | `(name, kind?, variables?)` | string | 按变量列表取展示名，找不到时返回 name |
| normalizeVariableKind | `(kind?: string)` | `'interpolate' \| 'raw'` | 旧值 `escape` 归一为 `raw` |
| VARIABLE_PATH_SOURCE / VARIABLE_PATH_RE | - | string / RegExp | 变量路径：标识符，可用 `.` 访问属性 |
| LIQUID_OUTPUT_RE | - | RegExp | 匹配白名单变量输出（全局） |
| KIND_INTERPOLATE / KIND_RAW / KIND_ESCAPE | - | string | 变量输出方式 |

#### 条件语法

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
