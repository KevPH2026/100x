
const pg = require("pg");
const client = new pg.Client("postgresql://neondb_owner:npg_PiZXUHAN07Ok@ep-billowing-mountain-aqez9hqj.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require");
client.connect().then(() => client.query({
  text: "SELECT (SELECT COUNT(*) FROM guest_logs WHERE created_at >= CURRENT_DATE) as today_guests, (SELECT COUNT(*) FROM generation_logs WHERE created_at >= CURRENT_DATE) as today_gen_logs, (SELECT COUNT(*) FROM users) as total_users, (SELECT COUNT(DISTINCT user_id) FROM generation_logs WHERE created_at >= CURRENT_DATE) as active_users"
})).then(r => { console.log(JSON.stringify(r.rows[0])); client.end(); }).catch(e => { console.error(e.message); process.exit(1); });
