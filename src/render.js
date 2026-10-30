import { Liquid } from 'liquidjs';
import { parseDocument } from 'htmlparser2';

let htmlLiquid = null;
let textLiquid = null;

const getEngine = type => {
  if (type === 'text') {
    return textLiquid || (textLiquid = new Liquid({ strictFilters: true }));
  }
  return htmlLiquid || (htmlLiquid = new Liquid({ outputEscape: 'escape', strictFilters: true }));
};

/**
 * 用数据渲染模版；type 为 html 时变量输出做 HTML 转义（{{ name | raw }} 除外），text 时原样输出
 */
export const renderTemplate = (template, data = {}, { type = 'html' } = {}) => getEngine(type).parseAndRenderSync(String(template ?? ''), data);

const escapeHtml = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 纯文本 → 编辑器 HTML：每行一个段落，空行用 &nbsp; 占位
 */
export const textToHtml = text => {
  const source = String(text ?? '');
  if (!source) {
    return '';
  }
  return source
    .split('\n')
    .map(line => `<p>${line ? escapeHtml(line) : '&nbsp;'}</p>`)
    .join('');
};

const readInlineText = node => {
  if (node.type === 'text') {
    return node.data;
  }
  if (node.name === 'br') {
    return '\n';
  }
  return (node.children || []).map(readInlineText).join('');
};

/**
 * 编辑器 HTML → 纯文本：顶层每个块一行，<br> 换行，实体解码
 */
export const htmlToText = html => {
  const source = String(html ?? '');
  if (!source) {
    return '';
  }
  const doc = parseDocument(source, { decodeEntities: true });
  return doc.children
    .filter(node => node.type === 'text' || node.type === 'tag')
    .filter(node => !(node.type === 'text' && /^\s*\n\s*$/.test(node.data)))
    .map(node => {
      const line = readInlineText(node).replace(/\u00a0/g, ' ');
      return line.trim() ? line : '';
    })
    .join('\n');
};
