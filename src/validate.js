import { Liquid, Tokenizer, TokenKind } from 'liquidjs';
import { VARIABLE_PATH_SOURCE } from './constants';
import { parseConditionExpression } from './condition';

const TAG_PAIRS = [
  ['{{', '}}'],
  ['{%', '%}']
];

/**
 * 扫描 {{ }} / {% %} 是否配对
 * @returns {string|null} 错误信息；合法则 null
 */
export const findUnbalancedTemplateTags = text => {
  const source = String(text ?? '');
  let open = null;
  let index = 0;

  while (index < source.length) {
    const opening = TAG_PAIRS.find(([start]) => source.startsWith(start, index));
    if (opening) {
      if (open) {
        return `unclosed ${open[0]}`;
      }
      open = opening;
      index += 2;
      continue;
    }
    const closing = TAG_PAIRS.find(([, end]) => source.startsWith(end, index));
    if (closing) {
      if (!open) {
        return `unmatched ${closing[1]}`;
      }
      if (open !== closing) {
        return `unclosed ${open[0]}`;
      }
      open = null;
      index += 2;
      continue;
    }
    index += 1;
  }

  if (open) {
    return `unclosed ${open[0]}`;
  }
  return null;
};

const OUTPUT_CONTENT_RE = new RegExp(`^\\s*${VARIABLE_PATH_SOURCE}\\s*(?:\\|\\s*raw\\s*)?$`);

const isBlockMarkerToken = token => token.kind === TokenKind.Tag && token.name === '#' && String(token.args).trim() === 'ck-layout:block';

/** 按白名单逐个检查顶层 token；返回错误信息或 null */
const findDisallowedToken = source => {
  const tokens = new Tokenizer(source).readTopLevelTokens();

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.kind === TokenKind.HTML) {
      continue;
    }
    const text = token.getText();
    if (token.trimLeft || token.trimRight) {
      return `whitespace control is not allowed: ${text}`;
    }
    if (token.kind === TokenKind.Output) {
      if (!OUTPUT_CONTENT_RE.test(token.content)) {
        return `output not allowed: ${text}`;
      }
      continue;
    }
    if (token.kind !== TokenKind.Tag) {
      return `syntax not allowed: ${text}`;
    }
    if (isBlockMarkerToken(token)) {
      const next = tokens[i + 1];
      if (!next || next.kind !== TokenKind.Tag || next.name !== 'if') {
        return `${text} must be followed by {% if %}`;
      }
      continue;
    }
    if (token.name === 'if') {
      if (!parseConditionExpression(token.args)) {
        return `condition not allowed: ${text}`;
      }
      continue;
    }
    if ((token.name === 'else' || token.name === 'endif') && !String(token.args).trim()) {
      continue;
    }
    return `tag not allowed: ${text}`;
  }
  return null;
};

let liquidEngine = null;
const getLiquidEngine = () => {
  if (!liquidEngine) {
    liquidEngine = new Liquid({ outputEscape: 'escape', strictFilters: true });
  }
  return liquidEngine;
};

/**
 * 校验模版：标签配对 + 语法白名单（{{ path }} / {{ path | raw }} / {% if %} / {% else %} / {% endif %}）+ liquidjs 解析
 * @returns {{ ok: boolean, error?: string }}
 */
export const validateTemplateHtml = html => {
  const source = String(html ?? '');
  const unbalanced = findUnbalancedTemplateTags(source);
  if (unbalanced) {
    return { ok: false, error: unbalanced };
  }

  try {
    const disallowed = findDisallowedToken(source);
    if (disallowed) {
      return { ok: false, error: disallowed };
    }
    getLiquidEngine().parse(source);
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }

  return { ok: true };
};
