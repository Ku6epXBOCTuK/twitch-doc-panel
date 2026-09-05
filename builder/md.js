import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseDoc(md) {
  return parser.parse(md);
}

// Белый список узлов mdast — всё прочее = ошибка сборки.
const ALLOWED = new Set([
  'root',
  'heading',
  'paragraph',
  'text',
  'emphasis',
  'strong',
  'delete',
  'inlineCode',
  'break',
  'link',
  'image',
  'list',
  'listItem',
  'blockquote',
  'thematicBreak',
]);

const HINTS = {
  html: 'сырой HTML в markdown запрещён',
  code: 'блоки кода запрещены (подсветка не поддерживается)',
  table: 'таблицы не поддерживаются',
  footnoteDefinition: 'сноски не поддерживаются',
  linkReference: 'используйте обычные ссылки [текст](https://…)',
  imageReference: 'используйте обычные картинки ![](путь)',
  definition: 'ссылки-определения не поддерживаются',
  yaml: 'yaml-блок внутри документа запрещён',
};

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export function validateDoc(root, fileName) {
  const errors = [];
  const walk = (node) => {
    for (const child of node.children ?? []) {
      const pos = child.position?.start ?? {};
      if (!ALLOWED.has(child.type)) {
        errors.push({
          file: fileName,
          line: pos.line ?? 0,
          column: pos.column ?? 0,
          type: child.type,
          hint: HINTS[child.type] ?? 'не поддерживается белым списком',
        });
        continue;
      }
      if (child.type === 'link' && !/^https?:\/\//i.test(child.url)) {
        errors.push({
          file: fileName,
          line: pos.line ?? 0,
          column: pos.column ?? 0,
          type: 'link',
          hint: `ссылка должна быть http(s): ${child.url}`,
        });
        continue;
      }
      if (
        child.type === 'image' &&
        SCHEME_RE.test(child.url) &&
        !/^https?:\/\//i.test(child.url)
      ) {
        errors.push({
          file: fileName,
          line: pos.line ?? 0,
          column: pos.column ?? 0,
          type: 'image',
          hint: `картинка должна быть http(s) или относительным путём: ${child.url}`,
        });
        continue;
      }
      walk(child);
    }
  };
  walk(root);
  return errors;
}

// --- Сериализация в мини-AST для DocRenderer.svelte ---
// Блоки: ["p", ...inline] | ["h1".."h6", ...inline] | ["ul"|"ol", [items]]
//        | ["blockquote", ...blocks] | ["hr"]
// Инлайн: строка | ["em"|"strong"|"del", ...inline] | ["code", text]
//         | ["br"] | ["a", href, ...inline] | ["img", url, alt]

const norm = (s) => s.replace(/\s+/g, ' ');

export async function serializeDoc(root, ctx) {
  const blocks = [];
  for (const child of root.children) {
    blocks.push(...(await serBlock(child, ctx)));
  }
  return blocks;
}

async function serBlock(node, ctx) {
  switch (node.type) {
    case 'heading':
      return [['h' + Math.min(node.depth, 6), ...(await inline(node.children, ctx))]];
    case 'paragraph': {
      if (node.children.length === 1 && node.children[0].type === 'image') {
        const img = await serImage(node.children[0], ctx);
        return img ? [img] : [];
      }
      return [['p', ...(await inline(node.children, ctx))]];
    }
    case 'list': {
      const items = [];
      for (const item of node.children) items.push(await serItem(item, ctx));
      return [[node.ordered ? 'ol' : 'ul', items]];
    }
    case 'blockquote': {
      const blocks = [];
      for (const child of node.children) blocks.push(...(await serBlock(child, ctx)));
      return [['blockquote', ...blocks]];
    }
    case 'thematicBreak':
      return [['hr']];
    default:
      return [];
  }
}

async function serItem(item, ctx) {
  const prefix = item.checked === true ? '☑ ' : item.checked === false ? '☐ ' : '';
  const single =
    item.children.length === 1 && item.children[0].type === 'paragraph';
  const inner = single
    ? await inline(item.children[0].children, ctx)
    : (await Promise.all(item.children.map((c) => serBlock(c, ctx)))).flat();
  return prefix ? ['li', prefix, ...inner] : ['li', ...inner];
}

async function inline(nodes, ctx) {
  const out = [];
  for (const node of nodes) {
    const serialized = await serInline(node, ctx);
    if (serialized !== null && serialized !== '') out.push(serialized);
  }
  return out;
}

async function serInline(node, ctx) {
  switch (node.type) {
    case 'text':
      return norm(node.value);
    case 'emphasis':
      return ['em', ...(await inline(node.children, ctx))];
    case 'strong':
      return ['strong', ...(await inline(node.children, ctx))];
    case 'delete':
      return ['del', ...(await inline(node.children, ctx))];
    case 'inlineCode':
      return ['code', node.value];
    case 'break':
      return ['br'];
    case 'link':
      return ['a', node.url, ...(await inline(node.children, ctx))];
    case 'image':
      return serImage(node, ctx);
    default:
      return null;
  }
}

async function serImage(node, ctx) {
  const url = await ctx.resolveImage(node.url, node.position?.start);
  return url ? ['img', url, node.alt ?? ''] : null;
}
