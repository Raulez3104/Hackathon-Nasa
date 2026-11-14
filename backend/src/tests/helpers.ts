import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { createApp } from "../app.js";

export interface TestServer {
  server: Server;
  baseUrl: string;
}

export async function startTestServer(): Promise<TestServer> {
  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", () => resolve());
    server.once("error", reject);
  });
  const address = server.address() as AddressInfo;
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

export async function closeTestServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function getJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

export async function postJson<T>(
  baseUrl: string,
  path: string,
  payload: unknown,
): Promise<{ status: number; body: T }> {
  return getJson<T>(baseUrl, path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
