const { renderTemplate, validateTemplateHtml } = _MessageTemplate;
const { Alert, Card, Flex, Input, Segmented, Typography } = antd;
const { useMemo, useState } = React;

const templates = {
  html: `<p>{{ candidate.name }} 您好：</p>
<p>感谢您投递 <strong>{{ job.title }}</strong> 岗位，邀请您参加 AI 面试。</p>
{% if isVip %}<p>您已进入优先通道，面试结果将在 24 小时内通知。</p>{% else %}<p>面试结果将在 3 个工作日内通知。</p>{% endif %}
<p>{{ signature | raw }}</p>`,
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
