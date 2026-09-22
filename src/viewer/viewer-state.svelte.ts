import { resolveIndexUrl } from "../shared/content.ts";
import { applyConfig, fetchDocsIndex } from "../shared/docs.ts";
import { absolutizeUrls, mdToBlocks, type MdBlock } from "../shared/md.ts";
import { onBroadcasterConfig } from "../shared/twitch.ts";
import type { BroadcasterConfig, DocEntry } from "../shared/types.ts";

// Viewer state and loading logic. The component only renders it.

export const VIEWER_STATUS = {
	LOADING: "loading",
	READY: "ready",
	EMPTY: "empty",
	ERROR: "error",
	NEED_CONFIG: "need-config",
	BAD_URL: "bad-url",
} as const;
export type ViewerStatus = (typeof VIEWER_STATUS)[keyof typeof VIEWER_STATUS];

export interface LoadedDoc {
	title: string;
	blocks: MdBlock[];
}

export class ViewerState {
	docs = $state<DocEntry[]>([]);
	current = $state(0);
	status = $state<ViewerStatus>(VIEWER_STATUS.LOADING);
	loadError = $state("");
	doc = $state<LoadedDoc | null>(null);
	docError = $state("");

	// Channel config: {v:1, indexUrl, hidden:[], order:[]} — arrives
	// asynchronously and changes when saved in the config view; the
	// subscription catches both cases.
	private cfg: BroadcasterConfig | null = null;
	private lastCfgJson = "";
	private lastIndexUrl = "";
	// ?doc=<id> — open a document by id (screenshots/audit): shows the pager.
	private qpDoc: string | null;

	// ?index=<url> — manual override (tests, screenshots): load right away,
	// without waiting for the config segment. Host filtering is done by the
	// version CSP.
	// ?doc=<id> — open a document by id (screenshots/audit): shows the pager.
	constructor() {
		const search = globalThis.location?.search ?? "";
		const qpIndex = new URLSearchParams(search).get("index");
		this.qpDoc = new URLSearchParams(search).get("doc");
		if (qpIndex) {
			this.loadIndex(qpIndex);
		} else {
			onBroadcasterConfig((c) => {
				const json = JSON.stringify(c ?? null);
				if (json === this.lastCfgJson) return;
				this.lastCfgJson = json;
				this.cfg = c;
				const r = resolveIndexUrl(c);
				if (r.error) {
					this.status = r.error; // 'bad-url' | 'need-config' — viewer statuses
					this.loadError = r.detail;
				}
				if (r.url) this.loadIndex(r.url);
			});
		}
	}

	get currentDoc(): DocEntry | undefined {
		return this.docs[this.current];
	}

	async loadIndex(indexUrl: string): Promise<void> {
		this.lastIndexUrl = indexUrl;
		this.status = VIEWER_STATUS.LOADING;
		this.loadError = "";
		const r = await fetchDocsIndex(indexUrl);
		if (!r.ok) {
			this.loadError = r.message;
			this.status = VIEWER_STATUS.ERROR;
			return;
		}
		let list: DocEntry[] = r.entries;
		if (this.cfg) list = applyConfig(list, this.cfg);
		this.docs = list;
		if (!list.length) {
			this.status = VIEWER_STATUS.EMPTY;
			return;
		}
		this.status = VIEWER_STATUS.READY;
		const idx = this.qpDoc ? list.findIndex((d) => d.id === this.qpDoc) : 0;
		await this.loadDoc(idx >= 0 ? idx : 0);
	}

	async loadDoc(i: number): Promise<void> {
		this.current = i;
		this.doc = null;
		this.docError = "";
		try {
			const res = await fetch(this.docs[i].url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			// Relative paths inside .md resolve against the address of the .md
			// file itself (res.url accounts for redirects).
			const docBase = new URL(".", res.url).href;
			const blocks = mdToBlocks(await res.text()).map(
				(b) => absolutizeUrls(b, docBase) as MdBlock,
			);
			this.doc = { title: this.docs[i].title, blocks };
		} catch (e) {
			console.error(e);
			this.docError = String((e as Error).message ?? e);
		}
	}

	retry = (): void => {
		this.loadIndex(this.lastIndexUrl);
	};

	prev = (): void => {
		if (this.current > 0) this.loadDoc(this.current - 1);
	};

	next = (): void => {
		if (this.current < this.docs.length - 1) this.loadDoc(this.current + 1);
	};
}
