import { marked } from "marked";

// Конвертация Markdown → мини-AST для DocRenderer, в рантайме (расширение
// грузит сырые .md). Неподдерживаемые конструкции (html, таблицы, блоки кода)
// пропускаются через onSkip — загрузка документа не ломается.

export function stripFrontMatter(md) {
	const m = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(md);
	return m ? md.slice(m[0].length) : md;
}

export function mdToBlocks(md, { onSkip } = {}) {
	return blocks(marked.lexer(stripFrontMatter(md)), onSkip);
}

function blocks(tokens, onSkip) {
	const out = [];
	for (const t of tokens ?? []) {
		switch (t.type) {
			case "heading":
				out.push([`h${Math.min(t.depth, 6)}`, ...inline(t.tokens, onSkip)]);
				break;
			case "paragraph": {
				if (t.tokens?.length === 1 && t.tokens[0].type === "image") {
					out.push(...inline(t.tokens, onSkip));
					break;
				}
				out.push(["p", ...inline(t.tokens, onSkip)]);
				break;
			}
			case "list":
				out.push(listNode(t, onSkip));
				break;
			case "blockquote":
				out.push(["blockquote", ...blocks(t.tokens, onSkip)]);
				break;
			case "hr":
				out.push(["hr"]);
				break;
			case "space":
				break;
			default:
				onSkip?.(t.type);
		}
	}
	return out;
}

function listNode(t, onSkip) {
	const items = (t.items ?? []).map((item) => {
		const inner = [];
		for (const tok of item.tokens ?? []) {
			if (tok.type === "text" || tok.type === "paragraph") {
				inner.push(
					...(tok.tokens?.length
						? inline(tok.tokens, onSkip)
						: [norm(tok.text)]),
				);
			} else if (tok.type === "list") {
				inner.push(listNode(tok, onSkip));
			}
		}
		const prefix = item.task ? (item.checked ? "☑ " : "☐ ") : "";
		return prefix ? ["li", prefix, ...inner] : ["li", ...inner];
	});
	return [t.ordered ? "ol" : "ul", items];
}

function inline(tokens, onSkip) {
	const out = [];
	for (const t of tokens ?? []) {
		switch (t.type) {
			case "text":
				if (t.tokens?.length) out.push(...inline(t.tokens, onSkip));
				else if (t.text) out.push(norm(t.text));
				break;
			case "escape":
				out.push(t.text);
				break;
			case "em":
				out.push(["em", ...inline(t.tokens, onSkip)]);
				break;
			case "strong":
				out.push(["strong", ...inline(t.tokens, onSkip)]);
				break;
			case "del":
				out.push(["del", ...inline(t.tokens, onSkip)]);
				break;
			case "codespan":
				out.push(["code", t.text]);
				break;
			case "br":
				out.push(["br"]);
				break;
			case "link":
				out.push(["a", t.href, ...inline(t.tokens, onSkip)]);
				break;
			case "image":
				out.push(["img", t.href, t.text ?? ""]);
				break;
			default:
				onSkip?.(t.type);
		}
	}
	return out.filter((x) => x !== null && x !== "");
}

const norm = (s) => String(s).replace(/\s+/g, " ");
