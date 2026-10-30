import {
  DEFAULT_JOINER,
  DEFAULT_OPERATORS,
  JOINER_AND,
  JOINER_OR,
  LAYOUT_BLOCK,
  LAYOUT_INLINE,
  OPERATOR_EMPTY,
  OPERATOR_EQ,
  OPERATOR_FALSY,
  OPERATOR_FILLED,
  OPERATOR_NEQ,
  OPERATOR_TRUTHY,
  TEMPLATE_CONDITION_CLAUSES_ATTR,
  TEMPLATE_CONDITION_JOINER_ATTR,
  TEMPLATE_CONDITION_OPERATOR_ATTR,
  TEMPLATE_CONDITION_SUBJECT_ATTR,
  TEMPLATE_CONDITION_VALUE_ATTR,
  VARIABLE_PATH_RE,
  VARIABLE_PATH_SOURCE
} from './constants';

const PATH = VARIABLE_PATH_SOURCE;
const LITERAL = `(?:-?\\d+(?:\\.\\d+)?|'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*")`;

/** {% if %} 开始标签（可带块级注释前缀）；只用于定位，表达式是否合规由 parseConditionExpression 判断 */
export const LIQUID_IF_OPEN_RE = /(?:\{%\s*#\s*ck-layout:block\s*%\}\s*)?\{%\s*if\s+[\s\S]*?%\}/;

export const normalizeOperator = (operator, allowed = DEFAULT_OPERATORS) => {
  const next = String(operator || OPERATOR_FILLED);
  return allowed.includes(next) ? next : OPERATOR_FILLED;
};

export const normalizeJoiner = joiner => (joiner === JOINER_OR ? JOINER_OR : JOINER_AND);

export const resolveSubjectLabel = (subject, variables = []) => {
  const trimmed = String(subject ?? '').trim();
  const found = variables.find(item => item && item.name === trimmed);
  return found?.label || trimmed;
};

const normalizeClause = (clause = {}, operators = DEFAULT_OPERATORS) => ({
  subject: String(clause.subject ?? '').trim(),
  operator: normalizeOperator(clause.operator, operators),
  value: clause.value == null ? '' : String(clause.value)
});

/** 从表单 / 存储数据 / 旧三属性归一成 { clauses, joiner } */
export const normalizeConditionClauses = (input = {}, operators = DEFAULT_OPERATORS) => {
  const joiner = normalizeJoiner(input.joiner);
  let clauses = [];

  if (Array.isArray(input.clauses) && input.clauses.length) {
    clauses = input.clauses.map(item => normalizeClause(item, operators)).filter(item => item.subject);
  } else if (input.subject) {
    clauses = [normalizeClause(input, operators)];
  }

  if (!clauses.length) {
    clauses = [normalizeClause({ subject: '', operator: OPERATOR_FILLED, value: '' }, operators)];
  }

  return { clauses, joiner };
};

/** 单条谓词展示文案 */
export const formatClauseBadge = ({ subject, operator, value }, variables = []) => {
  const label = resolveSubjectLabel(subject, variables);
  const op = normalizeOperator(operator);

  if (op === OPERATOR_TRUTHY) {
    return `${label}为真`;
  }
  if (op === OPERATOR_FALSY) {
    return `${label}为假`;
  }
  if (op === OPERATOR_FILLED) {
    return `${label}有值`;
  }
  if (op === OPERATOR_EMPTY) {
    return `${label}空值`;
  }
  if (op === OPERATOR_EQ) {
    return `${label}=${value ?? ''}`;
  }
  if (op === OPERATOR_NEQ) {
    return `${label}≠${value ?? ''}`;
  }
  return label;
};

/** 连接符展示文案 */
export const formatJoinerLabel = joiner => (normalizeJoiner(joiner) === JOINER_OR ? '或' : '且');

/** 条件展示文案；多条完整拼接 */
export const formatConditionBadge = (input, variables = []) => {
  const { clauses, joiner } = normalizeConditionClauses(input);
  const joinerLabel = formatJoinerLabel(joiner);

  if (clauses.length <= 1) {
    return formatClauseBadge(clauses[0] || {}, variables);
  }

  return clauses.map(clause => formatClauseBadge(clause, variables)).join(` ${joinerLabel} `);
};

const quoteLiteral = value => {
  if (value === null || value === undefined) {
    return "''";
  }
  const raw = String(value);
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return raw;
  }
  return `'${raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

const unquoteLiteral = raw => {
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
    return raw.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return raw;
};

/** 单条谓词 → Liquid 条件片段 */
export const buildClauseExpression = ({ subject, operator, value }) => {
  const name = String(subject ?? '').trim();
  if (!name || !VARIABLE_PATH_RE.test(name)) {
    return 'false';
  }
  const op = normalizeOperator(operator);

  if (op === OPERATOR_TRUTHY) {
    return name;
  }
  if (op === OPERATOR_FALSY) {
    return `${name} == false`;
  }
  if (op === OPERATOR_FILLED) {
    return `${name} != blank`;
  }
  if (op === OPERATOR_EMPTY) {
    return `${name} == blank`;
  }
  if (op === OPERATOR_EQ) {
    return `${name} == ${quoteLiteral(value)}`;
  }
  if (op === OPERATOR_NEQ) {
    return `${name} != ${quoteLiteral(value)}`;
  }
  return name;
};

/** 导出到 {% if %} 的条件表达式；Liquid 不支持括号，多条款只用同一种 and / or 扁平连接 */
export const buildConditionExpression = input => {
  const { clauses, joiner } = normalizeConditionClauses(input);
  const token = joiner === JOINER_OR ? 'or' : 'and';
  return clauses.map(clause => buildClauseExpression(clause)).join(` ${token} `);
};

const CLAUSE_PATTERNS = [
  [new RegExp(`^(${PATH})\\s*==\\s*false$`), OPERATOR_FALSY],
  [new RegExp(`^(${PATH})\\s*!=\\s*blank$`), OPERATOR_FILLED],
  [new RegExp(`^(${PATH})\\s*==\\s*blank$`), OPERATOR_EMPTY],
  [new RegExp(`^(${PATH})\\s*==\\s*(${LITERAL})$`), OPERATOR_EQ],
  [new RegExp(`^(${PATH})\\s*!=\\s*(${LITERAL})$`), OPERATOR_NEQ],
  [new RegExp(`^(${PATH})$`), OPERATOR_TRUTHY]
];

/** 解析单条规范谓词 → { subject, operator, value } | null */
export const parseSingleClauseExpression = expr => {
  const text = String(expr ?? '').trim();
  if (!text) {
    return null;
  }

  for (const [re, operator] of CLAUSE_PATTERNS) {
    const match = text.match(re);
    if (match) {
      const value = operator === OPERATOR_EQ || operator === OPERATOR_NEQ ? unquoteLiteral(match[2]) : '';
      return { subject: match[1], operator, value };
    }
  }

  return null;
};

/** 按引号外的 and / or 切开；同一表达式混用 and / or 返回 null */
const splitTopLevelJoin = text => {
  const parts = [];
  let buf = '';
  let joiner = null;
  let quote = null;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      buf += ch;
      if (ch === '\\' && i + 1 < text.length) {
        buf += text[i + 1];
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = null;
      }
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      buf += ch;
      i += 1;
      continue;
    }
    const word = text.slice(i).match(/^\s+(and|or)\s+/);
    if (word) {
      const next = word[1] === 'or' ? JOINER_OR : JOINER_AND;
      if (joiner && joiner !== next) {
        return null;
      }
      joiner = next;
      parts.push(buf.trim());
      buf = '';
      i += word[0].length;
      continue;
    }
    buf += ch;
    i += 1;
  }

  parts.push(buf.trim());
  return { parts: parts.filter(Boolean), joiner: joiner || DEFAULT_JOINER };
};

/**
 * 解析规范形态的条件表达式
 * → { clauses, joiner, subject, operator, value } | null
 * 兼容字段 subject/operator/value = 首条
 */
export const parseConditionExpression = expr => {
  const text = String(expr ?? '').trim();
  if (!text) {
    return null;
  }

  const single = parseSingleClauseExpression(text);
  if (single) {
    return {
      clauses: [single],
      joiner: DEFAULT_JOINER,
      subject: single.subject,
      operator: single.operator,
      value: single.value
    };
  }

  const split = splitTopLevelJoin(text);
  if (!split || split.parts.length < 2) {
    return null;
  }

  const clauses = [];
  for (const part of split.parts) {
    const parsed = parseSingleClauseExpression(part);
    if (!parsed) {
      return null;
    }
    clauses.push(parsed);
  }

  return {
    clauses,
    joiner: split.joiner,
    subject: clauses[0].subject,
    operator: clauses[0].operator,
    value: clauses[0].value
  };
};

/** 从数据态元素属性读取 clauses；getAttr(name) 返回属性值 */
export const readClausesFromAttributes = getAttr => {
  const read = name => (typeof getAttr === 'function' ? getAttr(name) : '');
  const rawClauses = read(TEMPLATE_CONDITION_CLAUSES_ATTR);
  const joiner = normalizeJoiner(read(TEMPLATE_CONDITION_JOINER_ATTR));

  if (rawClauses) {
    try {
      const parsed = JSON.parse(rawClauses);
      if (Array.isArray(parsed) && parsed.length) {
        return normalizeConditionClauses({ clauses: parsed, joiner });
      }
    } catch (e) {
      // fall through
    }
  }

  return normalizeConditionClauses({
    subject: read(TEMPLATE_CONDITION_SUBJECT_ATTR),
    operator: typeof getAttr === 'function' ? getAttr(TEMPLATE_CONDITION_OPERATOR_ATTR) : OPERATOR_FILLED,
    value: read(TEMPLATE_CONDITION_VALUE_ATTR),
    joiner
  });
};

/**
 * 用 then/else 内容拼 Liquid if 片段
 */
export const wrapConditionEvaluate = ({ subject, operator, value, clauses, joiner, hasElse, thenHtml, elseHtml }) => {
  const expr = buildConditionExpression({ subject, operator, value, clauses, joiner });
  const thenPart = thenHtml ?? '';
  if (hasElse) {
    return `{% if ${expr} %}${thenPart}{% else %}${elseHtml ?? ''}{% endif %}`;
  }
  return `{% if ${expr} %}${thenPart}{% endif %}`;
};

/**
 * 在文本中找出规范形态的 if/else（白名单外的写法不识别）
 */
export const findConditionMatches = text => {
  if (!text || !/\{%\s*if\s/.test(text)) {
    return [];
  }

  const results = [];
  const openRe = /(?:\{%\s*#\s*ck-layout:block\s*%\}\s*)?\{%\s*if\s+([\s\S]*?)\s*%\}/g;
  let openMatch;

  while ((openMatch = openRe.exec(text)) !== null) {
    const parsed = parseConditionExpression(openMatch[1]);
    if (!parsed) {
      continue;
    }

    const start = openMatch.index;
    const afterOpen = openMatch.index + openMatch[0].length;
    const elseToken = '{% else %}';
    const closeToken = '{% endif %}';
    const elseIndex = text.indexOf(elseToken, afterOpen);
    const closeIndex = text.indexOf(closeToken, afterOpen);

    if (closeIndex === -1) {
      continue;
    }

    let hasElse = false;
    let thenHtml = '';
    let elseHtml = '';
    let end = closeIndex + closeToken.length;

    if (elseIndex !== -1 && elseIndex < closeIndex) {
      const afterElse = elseIndex + elseToken.length;
      const finalClose = text.indexOf(closeToken, afterElse);
      if (finalClose === -1) {
        continue;
      }
      hasElse = true;
      thenHtml = text.slice(afterOpen, elseIndex);
      elseHtml = text.slice(afterElse, finalClose);
      end = finalClose + closeToken.length;
    } else {
      thenHtml = text.slice(afterOpen, closeIndex);
    }

    results.push({
      start,
      end,
      raw: text.slice(start, end),
      ...parsed,
      hasElse,
      layout: /^\{%\s*#/.test(openMatch[0]) ? LAYOUT_BLOCK : LAYOUT_INLINE,
      thenHtml,
      elseHtml
    });

    openRe.lastIndex = end;
  }

  return results;
};
