import { Hono } from 'hono'
import cache from "memory-cache";

const app = new Hono();

app.use(async (c, next) => {
	const key = cache.get("server:APIKey");
	if (key && c.req.header("x-api-key") !== key) {
		c.res = undefined
		c.res = c.json({ error: "Invalid API key" }, 401);
	}
	await next();
})

app.get('/ping', (c) => c.text('pong'))

export default app;