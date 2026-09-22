// Overlay scrollbar state: a translucent thumb on top of the content,
// visible only while scrolling. The component binds elements and calls
// update()/onScroll().
export class ScrollThumbState {
	visible = $state(false);
	top = $state(0);
	height = $state(0);

	private mainEl: HTMLElement | null = null;
	private hideTimer: ReturnType<typeof setTimeout> | undefined;

	bind(el: HTMLElement | null): void {
		this.mainEl = el;
	}

	private update(): void {
		const el = this.mainEl;
		if (!el) return;
		if (el.scrollHeight <= el.clientHeight + 1) {
			this.visible = false;
			this.height = 0;
			return;
		}
		this.height = Math.max(
			28,
			(el.clientHeight / el.scrollHeight) * el.clientHeight,
		);
		this.top =
			(el.scrollTop / (el.scrollHeight - el.clientHeight)) *
			(el.clientHeight - this.height);
	}

	onScroll(): void {
		this.update();
		this.visible = true;
		clearTimeout(this.hideTimer);
		this.hideTimer = setTimeout(() => {
			this.visible = false;
		}, 700);
	}
}
