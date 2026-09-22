import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import sirv from "sirv";

export interface StaticServer {
	port: number;
	close(): Promise<void>;
}

export async function startStaticServer(root: string): Promise<StaticServer> {
	const handler = sirv(path.resolve(root), { dev: true });
	const server = http.createServer(handler);
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	const port = (server.address() as AddressInfo).port;
	return {
		port,
		close: () =>
			new Promise<void>((resolve) => {
				server.close(() => resolve());
				server.closeAllConnections();
			}),
	};
}
