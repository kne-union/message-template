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
