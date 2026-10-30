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

const SKIP_TAGS = new Set(['head', 'title', 'style', 'script', 'meta', 'link', 'noscript', 'template']);

const BLOCK_TAGS = new Set([
  'html',
  'body',
  'address',
  'article',
  'aside',
  'blockquote',
  'center',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul'
]);

const LINE_BREAK = '\u0000';

// 源码排版产生的换行缩进按空白处理，<br> 用占位符保留为真实换行
const normalizeLine = line =>
  line
    .replace(/^\s*\n\s*/, '')
    .replace(/\s*\n\s*$/, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(new RegExp(LINE_BREAK, 'g'), '\n')
    .replace(/\u00a0/g, ' ');

const collectLines = (nodes, lines) => {
  let buffer = null;
  const flush = () => {
    if (buffer !== null && !/^\s*$/.test(buffer.replace(/\u00a0/g, 'x'))) {
      const line = normalizeLine(buffer);
      lines.push(line.trim() ? line : '');
    }
    buffer = null;
  };
  const appendInline = node => {
    if (node.type === 'text') {
      buffer = (buffer ?? '') + node.data;
      return;
    }
    if (node.type !== 'tag' || SKIP_TAGS.has(node.name)) {
      return;
    }
    if (node.name === 'br') {
      buffer = (buffer ?? '') + LINE_BREAK;
      return;
    }
    if (BLOCK_TAGS.has(node.name)) {
      flush();
      const before = lines.length;
      collectLines(node.children || [], lines);
      if (lines.length === before && node.name === 'p') {
        lines.push('');
      }
      return;
    }
    (node.children || []).forEach(appendInline);
  };
  nodes.forEach(appendInline);
  flush();
  return lines;
};

/**
 * HTML → 纯文本：块级元素各占一行，<br> 换行，实体解码；
 * 完整邮件文档中的 head / style / script 及注释会被忽略
 */
export const htmlToText = html => {
  const source = String(html ?? '');
  if (!source) {
    return '';
  }
  const doc = parseDocument(source, { decodeEntities: true });
  return collectLines(doc.children, []).join('\n');
};
