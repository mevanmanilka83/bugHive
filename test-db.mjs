import { Client } from 'pg'

const connStr = 'postgresql://postgres.cfgsnahszucjhtwsfqwy:%3FVBbv4JGBtLC%24ez@aws-1-us-east-1.pooler.supabase.com:6543/postgres'

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
