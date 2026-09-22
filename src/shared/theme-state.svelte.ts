import { onContext } from "./twitch.ts";
import { THEME_VARIANT, type Theme } from "./types.ts";

// Reactive theme. ?theme=light|dark — manual override (theme audit in the dev
// wrapper); without the parameter the theme comes from Twitch (locally — a
// dark stub).
export class ThemeState {
	theme = $state<Theme>(THEME_VARIANT.DARK);

	constructor() {
		const qpTheme = new URLSearchParams(globalThis.location?.search ?? "").get(
			"theme",
		);
		if (qpTheme === THEME_VARIANT.LIGHT || qpTheme === THEME_VARIANT.DARK) {
			this.theme = qpTheme;
		}
		onContext((ctx) => {
			if (!qpTheme && ctx.theme) this.theme = ctx.theme;
		});
	}
}
