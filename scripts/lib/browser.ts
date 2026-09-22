import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export interface ChromeShot {
	url: string;
	out: string;
	width: number;
	height: number;
	profile: string;
	transparent?: boolean;
	virtualTimeBudget?: number;
	timeoutMs?: number;
}

let browser: string | undefined;

export function findBrowser(): string {
	if (browser) return browser;
	const candidates = [
		process.env.CHROME_PATH,
		"C:/Program Files/Google/Chrome/Application/chrome.exe",
		"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
		path.join(
			os.homedir(),
			"AppData/Local/Google/Chrome/Application/chrome.exe",
		),
		"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
		"C:/Program Files/Microsoft/Edge/Application/msedge.exe",
	].filter((c): c is string => Boolean(c));
	browser = candidates.find((c) => fs.existsSync(c));
	if (!browser) {
		throw new Error(
			"Chrome/Edge not found - install it or set the CHROME_PATH environment variable",
		);
	}
	return browser;
}

function chromeArgs(shot: ChromeShot): string[] {
	const args = [
		"--headless=new",
		`--user-data-dir=${shot.profile}`,
		`--screenshot=${shot.out}`,
		`--window-size=${shot.width},${shot.height}`,
		"--hide-scrollbars",
	];
	if (shot.transparent) args.push("--default-background-color=00000000");
	if (shot.virtualTimeBudget !== undefined) {
		args.push(`--virtual-time-budget=${shot.virtualTimeBudget}`);
	}
	if (shot.timeoutMs !== undefined) args.push(`--timeout=${shot.timeoutMs}`);
	args.push(shot.url);
	return args;
}

export function screenshotChromeSync(shot: ChromeShot): void {
	const r = spawnSync(findBrowser(), chromeArgs(shot), { stdio: "pipe" });
	if (r.status !== 0 || !fs.existsSync(shot.out)) {
		throw new Error(
			r.error?.message ||
				r.stderr?.toString() ||
				r.stdout?.toString() ||
				`failed to render ${shot.out}`,
		);
	}
}

export function screenshotChrome(shot: ChromeShot): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(findBrowser(), chromeArgs(shot), {
			stdio: "ignore",
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code !== 0 || !fs.existsSync(shot.out)) {
				reject(
					new Error(
						`chrome exited with code ${code}, screenshot was not captured`,
					),
				);
			} else {
				resolve();
			}
		});
	});
}

export interface TempDirs {
	tmp: string;
	profile: string;
	cleanup(): void;
}

export function createTempDirs(prefix: string): TempDirs {
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
	const profile = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-profile-`));
	let cleaned = false;
	const cleanup = () => {
		if (cleaned) return;
		cleaned = true;
		for (const dir of [tmp, profile]) {
			try {
				fs.rmSync(dir, { recursive: true, force: true });
			} catch {
				// профиль может быть ещё занят Chrome — не критично
			}
		}
	};
	process.once("exit", cleanup);
	return { tmp, profile, cleanup };
}
