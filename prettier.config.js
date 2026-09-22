/**
 * @see https://prettier.io
 * @type {import("prettier").Config}
 */
const config = {
	useTabs: true,
	singleQuote: false,
	trailingComma: "all",
	printWidth: 80,
	proseWrap: "always",
	endOfLine: "lf",
	plugins: ["prettier-plugin-svelte"],
	overrides: [
		{
			files: "*.svelte",
			options: {
				parser: "svelte",
			},
		},
		{
			files: "*.md",
			options: {
				useTabs: false,
			},
		},
	],
};

export default config;
