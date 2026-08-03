
const pg = require("pg");
const client = new pg.Client("postgresql://neondb_owner:npg_PiZXUHAN07Ok@ep-billowing-mountain-aqez9hqj.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require");
client.connect().then(async () => {
  // Main stats
  const stats = await client.query({
    text: `SELECT 
      (SELECT COUNT(*) FROM guest_logs WHERE "createdAt" >= CURRENT_DATE) as today_guests,
      (SELECT COUNT(*) FROM generation_logs WHERE "createdAt" >= CURRENT_DATE) as today_gen_logs,
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(DISTINCT "userId") FROM generation_logs WHERE "createdAt" >= CURRENT_DATE) as active_users`
  });
  
  // Recent generations (last 5)
  const recent = await client.query({
    text: `SELECT "id", "createdAt", "brandName", "platform" FROM generation_logs ORDER BY "createdAt" DESC LIMIT 5`
  });
  
  console.log(JSON.stringify({stats: stats.rows[0], recent: recent.rows}));
  client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
