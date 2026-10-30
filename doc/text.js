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
      <Card size="small" title={`htmlToText（往返${back === text ? '一致' : '不一致'}）+ 渲染短信，共 ${sms.length} 字`}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{sms}</pre>
      </Card>
    </Flex>
  );
};

render(<TextExample />);
