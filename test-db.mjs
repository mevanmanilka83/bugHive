import { Client } from 'pg'

const connStr = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!connStr) {
  console.error('Set DATABASE_URL or SUPABASE_DB_URL in .env')
  process.exit(1)
}

const client = new Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
  keepAlives: true
})

console.log('Attempting connection...')
client.connect()
  .then(() => {
    console.log('✅ Connected!')
    return client.query("SELECT version();")
  })
  .then(res => {
    console.log('DB Version:', res.rows[0].version)
    return client.end()
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message)
  })
