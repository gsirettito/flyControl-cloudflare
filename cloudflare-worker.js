import handler from './.open-next/worker.js';
export * from './.open-next/worker.js';
export default {
  fetch: handler.fetch.bind(handler),
  async scheduled(_event, env, ctx) {
    if (!env.CRON_SECRET_TOKEN || !env.NEXTAUTH_URL) throw new Error('Cron no configurado');
    ctx.waitUntil((async () => {
      const res = await handler.fetch(new Request(new URL('/api/cron-job-execute', env.NEXTAUTH_URL), {method:'POST', headers:{Authorization:`Bearer ${env.CRON_SECRET_TOKEN}`,'Content-Type':'application/json'},body:'{}'}),env,ctx);
      if (!res.ok) throw new Error(`Cron HTTP ${res.status}`);
    })());
  }
};
