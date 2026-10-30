import { KIND_ESCAPE, KIND_INTERPOLATE, KIND_RAW, LIQUID_OUTPUT_RE, VARIABLE_PATH_RE } from './constants';

export const normalizeVariableKind = kind => (kind === KIND_RAW || kind === KIND_ESCAPE ? KIND_RAW : KIND_INTERPOLATE);

/**
 * 输出 Liquid 变量：{{ name }} / {{ name | raw }}；name 不是合法路径时返回空串
 */
export const wrapVariable = (name, kind) => {
  const trimmed = String(name ?? '').trim();
  if (!VARIABLE_PATH_RE.test(trimmed)) {
    return '';
  }
  return normalizeVariableKind(kind) === KIND_RAW ? `{{ ${trimmed} | raw }}` : `{{ ${trimmed} }}`;
};

/**
 * 按 variables 列表解析展示 label
 */
export const resolveVariableLabel = (name, kind, variables = []) => {
  const trimmed = String(name ?? '').trim();
  const normalized = normalizeVariableKind(kind);
  const found = variables.find(item => item && item.name === trimmed && normalizeVariableKind(item.kind) === normalized);
  if (found?.label) {
    return found.label;
  }
  const byName = variables.find(item => item && item.name === trimmed);
  if (byName?.label) {
    return byName.label;
  }
  return trimmed;
};

/**
 * 在纯文本中找出白名单内的 Liquid 变量输出
 */
export const findTemplateMatches = text => {
  if (!text || !text.includes('{{')) {
    return [];
  }

  const re = new RegExp(LIQUID_OUTPUT_RE.source, 'g');
  const result = [];
  let match;
  while ((match = re.exec(text)) !== null) {
    result.push({
      start: match.index,
      end: match.index + match[0].length,
      name: match[1],
      kind: match[2] ? KIND_RAW : KIND_INTERPOLATE,
      raw: match[0]
    });
  }
  return result;
};
