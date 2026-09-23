import { initialIndexUrl, isContentUrl } from "../shared/content.ts";
import {
	buildConfigRows,
	fetchDocsIndex,
	moveRow,
	toBroadcasterConfig,
} from "../shared/docs.ts";
import {
	onBroadcasterConfig,
	saveBroadcasterConfig,
} from "../shared/twitch.ts";
import type { BroadcasterConfig, ConfigRow } from "../shared/types.ts";

// Config-view state and logic. The component only renders it.

export const STATUS = {
	IDLE: "idle",
	LOADING: "loading",
	READY: "ready",
	ERROR: "error",
} as const;
export type Status = (typeof STATUS)[keyof typeof STATUS];

export class ConfigState {
	// The config arrives asynchronously — fill the field when it does.
	#savedCfg: Partial<BroadcasterConfig> = {};

	indexUrl = $state("");
	list = $state<ConfigRow[]>([]);
	status = $state<Status>(STATUS.IDLE);
	error = $state("");
	savedOk = $state(false);
	duration = $state(10);

	constructor() {
		onBroadcasterConfig((c) => {
			this.#savedCfg = c ?? {};
			if (!this.indexUrl) {
				const url = initialIndexUrl(c);
				if (url) {
					this.indexUrl = url;
					this.load();
				}
			}
		});
	}

	async load(): Promise<void> {
		this.savedOk = false;
		this.error = "";
		const url = this.indexUrl.trim();
		if (!url) {
			this.error = "Set the index.json URL";
			return;
		}
		if (!isContentUrl(url)) {
			this.error = "The URL must be an http(s) URL or a relative path";
			return;
		}
		this.status = STATUS.LOADING;
		const r = await fetchDocsIndex(url);
		if (!r.ok) {
			this.error = r.message;
			this.status = STATUS.ERROR;
			return;
		}
		this.list = buildConfigRows(r.entries, this.#savedCfg);
		this.duration = this.#savedCfg.duration ?? 10;
		this.status = STATUS.READY;
	}

	move(i: number, dir: number): void {
		this.list = moveRow(this.list, i, dir);
	}

	moveUp(idx: number): void {
		this.list = moveRow(this.list, idx, -1);
	}

	moveDown(idx: number): void {
		this.list = moveRow(this.list, idx, 1);
	}

	save(): void {
		this.savedOk = saveBroadcasterConfig(
			toBroadcasterConfig(this.indexUrl.trim(), this.list, this.duration),
		);
	}
}
