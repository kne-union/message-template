const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  wrapVariable,
  findTemplateMatches,
  resolveVariableLabel,
  buildConditionExpression,
  parseConditionExpression,
  formatConditionBadge,
  findConditionMatches,
  wrapConditionEvaluate,
  readClausesFromAttributes,
  validateTemplateHtml,
  findUnbalancedTemplateTags,
  renderTemplate,
  htmlToText,
  textToHtml,
  TEMPLATE_CONDITION_CLAUSES_ATTR,
  TEMPLATE_CONDITION_JOINER_ATTR
} = require('../dist/index.js');

test('wrapVariable 输出 Liquid 变量，非法路径返回空串', () => {
  assert.equal(wrapVariable('user.name'), '{{ user.name }}');
  assert.equal(wrapVariable('content', 'raw'), '{{ content | raw }}');
  assert.equal(wrapVariable('content', 'escape'), '{{ content | raw }}');
  assert.equal(wrapVariable('1abc'), '');
});

test('findTemplateMatches 只识别白名单输出', () => {
  const matches = findTemplateMatches('你好 {{ name }}，{{ html | raw }}，{{ name | upcase }}');
  assert.deepEqual(
    matches.map(({ name, kind }) => ({ name, kind })),
    [
      { name: 'name', kind: 'interpolate' },
      { name: 'html', kind: 'raw' }
    ]
  );
});

test('resolveVariableLabel 按 variables 取 label', () => {
  assert.equal(resolveVariableLabel('name', 'interpolate', [{ name: 'name', label: '姓名' }]), '姓名');
  assert.equal(resolveVariableLabel('other'), 'other');
});

test('条件表达式构建与解析互逆', () => {
  const input = {
    joiner: 'or',
    clauses: [
      { subject: 'isVip', operator: 'truthy' },
      { subject: 'level', operator: 'eq', value: "gold's" },
      { subject: 'score', operator: 'neq', value: 10 }
    ]
  };
  const expr = buildConditionExpression(input);
  assert.equal(expr, "isVip or level == 'gold\\'s' or score != 10");
  const parsed = parseConditionExpression(expr);
  assert.equal(parsed.joiner, 'or');
  assert.deepEqual(parsed.clauses, [
    { subject: 'isVip', operator: 'truthy', value: '' },
    { subject: 'level', operator: 'eq', value: "gold's" },
    { subject: 'score', operator: 'neq', value: '10' }
  ]);
  assert.equal(parseConditionExpression('a and b or c'), null);
  assert.equal(parseConditionExpression('a > 1'), null);
});

test('formatConditionBadge 生成展示文案', () => {
  assert.equal(
    formatConditionBadge(
      {
        clauses: [
          { subject: 'phone', operator: 'filled' },
          { subject: 'isVip', operator: 'truthy' }
        ]
      },
      [{ name: 'phone', label: '手机' }]
    ),
    '手机有值 且 isVip为真'
  );
});

test('findConditionMatches 识别 if/else 与块级标记', () => {
  const text = '前 {% if isVip %}尊贵{% else %}普通{% endif %} 后 {% # ck-layout:block %}{% if name != blank %}<p>x</p>{% endif %}';
  const [inline, block] = findConditionMatches(text);
  assert.equal(inline.hasElse, true);
  assert.equal(inline.thenHtml, '尊贵');
  assert.equal(inline.elseHtml, '普通');
  assert.equal(inline.layout, 'inline');
  assert.equal(block.layout, 'block');
  assert.equal(block.operator, 'filled');
});

test('wrapConditionEvaluate 与 readClausesFromAttributes', () => {
  assert.equal(wrapConditionEvaluate({ subject: 'a', operator: 'empty', hasElse: true, thenHtml: 'x', elseHtml: 'y' }), '{% if a == blank %}x{% else %}y{% endif %}');
  const attrs = {
    [TEMPLATE_CONDITION_CLAUSES_ATTR]: JSON.stringify([{ subject: 'a', operator: 'eq', value: '1' }]),
    [TEMPLATE_CONDITION_JOINER_ATTR]: 'or'
  };
  assert.deepEqual(
    readClausesFromAttributes(name => attrs[name]),
    { clauses: [{ subject: 'a', operator: 'eq', value: '1' }], joiner: 'or' }
  );
});

test('validateTemplateHtml 白名单校验', () => {
  assert.deepEqual(validateTemplateHtml('<p>{{ name }}{% if a %}x{% else %}y{% endif %}</p>'), { ok: true });
  assert.equal(validateTemplateHtml('{{ name | upcase }}').ok, false);
  assert.equal(validateTemplateHtml('{% for i in list %}{% endfor %}').ok, false);
  assert.equal(validateTemplateHtml('{{- name }}').ok, false);
  assert.equal(validateTemplateHtml('{% if a %}x').ok, false);
  assert.equal(findUnbalancedTemplateTags('{{ name }'), 'unclosed {{');
});

test('renderTemplate html 转义、raw 原样、text 不转义', () => {
  const data = { name: '<b>Tom</b>', html: '<i>hi</i>', isVip: true };
  assert.equal(renderTemplate('{{ name }}|{{ html | raw }}', data), '&lt;b&gt;Tom&lt;/b&gt;|<i>hi</i>');
  assert.equal(renderTemplate('{{ name }}{% if isVip %} VIP{% endif %}', data, { type: 'text' }), '<b>Tom</b> VIP');
});

test('textToHtml / htmlToText 往返', () => {
  const text = '您好 {{ name }}：\n\n面试时间 {% if time != blank %}{{ time }}{% else %}待定{% endif %}\na < b & c';
  const html = textToHtml(text);
  assert.equal(html, '<p>您好 {{ name }}：</p><p>&nbsp;</p><p>面试时间 {% if time != blank %}{{ time }}{% else %}待定{% endif %}</p><p>a &lt; b &amp; c</p>');
  assert.equal(htmlToText(html), text);
  assert.equal(htmlToText('<p>a<br>b</p>\n<p>c</p>'), 'a\nb\nc');
  assert.equal(textToHtml(''), '');
  assert.equal(htmlToText(''), '');
});

test('htmlToText 处理完整 HTML 邮件文档', () => {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>欢迎</title>
    <style>p { color: red; }</style>
  </head>
  <body>
    <!-- 页头 -->
    <div class="wrap">
      <h1>你好，Alice</h1>
      <p>
        欢迎加入 <strong>Leapin</strong>，
        请查收。
      </p>
      <table><tr><td>账号</td></tr><tr><td>alice@example.com</td></tr></table>
    </div>
    <script>alert(1)</script>
  </body>
</html>`;
  assert.equal(htmlToText(html), '你好，Alice\n欢迎加入 Leapin， 请查收。\n账号\nalice@example.com');
  assert.equal(htmlToText('<div><p>a</p><p>&nbsp;</p><p>b<br>c</p></div>'), 'a\n\nb\nc');
  assert.equal(htmlToText('a<strong>b</strong>'), 'ab');
});
