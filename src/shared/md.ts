import { marked, type Token, type Tokens } from "marked";

// Конвертация Markdown → мини-AST для DocRenderer, в рантайме (расширение
// грузит сырые .md). Неподдерживаемые конструкции (html, таблицы, блоки кода)
// пропускаются через onSkip — загрузка документа не ломается.

export type MdInline =
	| string
	| ["br"]
	| ["em", ...MdInline[]]
	| ["strong", ...MdInline[]]
	| ["del", ...MdInline[]]
	| ["code", string]
	| ["a", string, ...MdInline[]]
	| ["img", string, string];

export type MdHeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export type MdHeading = [MdHeadingTag, ...MdInline[]];

export type MdListItem = ["li", ...(MdInline | MdList)[]];

export type MdList = ["ul" | "ol", MdListItem[]];

export type MdBlock =
	| ["p", ...MdInline[]]
	| MdHeading
	| MdList
	| ["blockquote", ...MdBlock[]]
	| ["hr"]
	| ["img", string, string];

export type MdNode = MdBlock | MdInline;

// «Сырой» узел для рекурсивной обработки (рендер, абсолютизация URL): любой
// элемент — строка или массив (узел [tag, ...rest] или список items у ul/ol).
// Форма проверяется в рантайме, типом её не вывести.
export type MdAst = string | MdAst[];

export type SkipFn = (type: string) => void;

export function stripFrontMatter(md: string): string {
	const m = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(md);
	return m ? md.slice(m[0].length) : md;
}

export function mdToBlocks(
	md: string,
	{ onSkip }: { onSkip?: SkipFn } = {},
): MdBlock[] {
	return blocks(marked.lexer(stripFrontMatter(md)), onSkip);
}

function blocks(tokens: Token[] | undefined, onSkip?: SkipFn): MdBlock[] {
	const out: MdBlock[] = [];
	for (const t of tokens ?? []) {
		switch (t.type) {
			case "heading":
				out.push([
					`h${Math.min(t.depth, 6)}` as MdHeadingTag,
					...inline(t.tokens, onSkip),
				]);
				break;
			case "paragraph": {
				if (t.tokens?.length === 1 && t.tokens[0].type === "image") {
					const img = t.tokens[0] as Tokens.Image;
					out.push(["img", img.href, img.text ?? ""]);
					break;
				}
				out.push(["p", ...inline(t.tokens, onSkip)]);
				break;
			}
			case "list":
				out.push(listNode(t as Tokens.List, onSkip));
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

function listNode(t: Tokens.List, onSkip?: SkipFn): MdList {
	const items: MdListItem[] = (t.items ?? []).map((item) => {
		const inner: (MdInline | MdList)[] = [];
		for (const tok of item.tokens ?? []) {
			if (tok.type === "text" || tok.type === "paragraph") {
				const tk = tok as Tokens.Text | Tokens.Paragraph;
				inner.push(
					...(tk.tokens?.length ? inline(tk.tokens, onSkip) : [norm(tk.text)]),
				);
			} else if (tok.type === "list") {
				inner.push(listNode(tok as Tokens.List, onSkip));
			}
		}
		const prefix = item.task ? (item.checked ? "☑ " : "☐ ") : "";
		return prefix
			? (["li", prefix, ...inner] as const)
			: (["li", ...inner] as const);
	});
	return [t.ordered ? "ol" : "ul", items];
}

function inline(tokens: Token[] | undefined, onSkip?: SkipFn): MdInline[] {
	const out: MdInline[] = [];
	for (const t of tokens ?? []) {
		switch (t.type) {
			case "text": {
				const tk = t as Tokens.Text;
				if (tk.tokens?.length) out.push(...inline(tk.tokens, onSkip));
				else if (tk.text) out.push(norm(tk.text));
				break;
			}
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

const norm = (s: string): string => s.replace(/\s+/g, " ");
