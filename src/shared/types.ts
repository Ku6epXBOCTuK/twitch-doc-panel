export const DEFAULT_DOC_ORDER = 1000;

export interface DocFrontMatter {
	title: string;
	order?: number;
	hidden?: boolean;
}

export interface DocEntry {
	id: string;
	title: string;
	order: number;
	hidden: boolean;
	banner: string | null;
	url: string;
}

export interface DocsIndex {
	docs: DocEntry[];
}

// A row of the config-view list: a doc + the "hidden" flag from the channel config.
export interface ConfigRow {
	id: string;
	title: string;
	hidden: boolean;
}

export interface BroadcasterConfig {
	v: 1;
	indexUrl: string;
	hidden: string[];
	order: string[];
}

export const THEME_VARIANT = {
	DARK: "dark",
	LIGHT: "light",
};
export type Theme = (typeof THEME_VARIANT)[keyof typeof THEME_VARIANT];

export interface ResolveIndexResult {
	url: string | null;
	error: "bad-url" | "need-config" | null;
	detail: string;
}
