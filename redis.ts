import { Redis } from "ioredis";

let connection: Redis | null = null;
export async function getRedisConnection() {
	if (process.env.REDIS_URL && !connection) {
		connection = new Redis(process.env.REDIS_URL, {
			maxRetriesPerRequest: null,
			lazyConnect: true,
		});
		connection.on("error", function (err) {
			connection = null;
		});
	}
	return connection;
}