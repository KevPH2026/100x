
const pg = require("pg");
const client = new pg.Client("postgresql://neondb_owner:npg_PiZXUHAN07Ok@ep-billowing-mountain-aqez9hqj.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require");
client.connect().then(() => client.query({
  text: "SELECT column_name, table_name FROM information_schema.columns WHERE table_name IN ('guest_logs','generation_logs','users') ORDER BY table_name, column_name"
})).then(r => { console.log(JSON.stringify(r.rows)); client.end(); }).catch(e => { console.error(e.message); process.exit(1); });
