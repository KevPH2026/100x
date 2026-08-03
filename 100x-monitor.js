const pg = require('pg');

async function main() {
  const client = new pg.Client({
    connectionString: process.argv[2] || process.env.DATABASE_URL
  });
  await client.connect();

  const v = await client.query("SELECT COUNT(*)::int as today_visitors FROM guest_logs WHERE \"createdAt\" >= CURRENT_DATE AT TIME ZONE 'Asia/Shanghai'");
  const g = await client.query("SELECT COUNT(*)::int as today_generations FROM generation_logs WHERE \"createdAt\" >= CURRENT_DATE AT TIME ZONE 'Asia/Shanghai'");
  const a = await client.query("SELECT COUNT(DISTINCT \"userId\")::int as today_active FROM generation_logs WHERE \"createdAt\" >= CURRENT_DATE AT TIME ZONE 'Asia/Shanghai'");
  const t = await client.query("SELECT COUNT(*)::int as total_users FROM users");
  const r = await client.query("SELECT \"createdAt\", \"brandName\", platform FROM generation_logs ORDER BY \"createdAt\" DESC LIMIT 5");

  const data = {
    todayVisitors: v.rows[0].today_visitors,
    todayGenerations: g.rows[0].today_generations,
    todayActive: a.rows[0].today_active,
    totalUsers: t.rows[0].total_users,
    recentGenerations: r.rows.map(row => ({
      createdAt: row.createdAt,
      brand: row.brandName,
      platform: row.platform
    }))
  };

  console.log(JSON.stringify(data));
  await client.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
