import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing database URL. Set SUPABASE_DB_URL or DATABASE_URL.');
  process.exit(1);
}

const shouldUseSsl = (url) => url.includes('supabase.co') || url.includes('sslmode=require');

const client = new Client({
  connectionString: dbUrl,
  ssl: shouldUseSsl(dbUrl) ? { rejectUnauthorized: false } : undefined,
});

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');

const steps = [
  {
    name: '001_initial.sql',
    shouldRun: async () => {
      const res = await client.query("select to_regclass('public.assets') as reg");
      return !res.rows[0]?.reg;
    },
  },
  {
    name: '002_labels.sql',
    shouldRun: async () => {
      const labels = await client.query("select to_regclass('public.labels') as reg");
      const assetLabels = await client.query("select to_regclass('public.asset_labels') as reg");
      return !labels.rows[0]?.reg || !assetLabels.rows[0]?.reg;
    },
  },
  {
    name: '003_cost_basis.sql',
    shouldRun: async () => {
      const res = await client.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='assets' and column_name='cost_basis' limit 1"
      );
      return res.rowCount === 0;
    },
  },
  {
    name: '004_mortgage_terms.sql',
    shouldRun: async () => {
      const rate = await client.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='assets' and column_name='mortgage_rate' limit 1"
      );
      const payment = await client.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='assets' and column_name='monthly_payment' limit 1"
      );
      return rate.rowCount === 0 || payment.rowCount === 0;
    },
  },
  {
    name: '005_real_estate_ownership.sql',
    shouldRun: async () => {
      const res = await client.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='assets' and column_name='ownership_percent' limit 1"
      );
      return res.rowCount === 0;
    },
  },
  {
    name: '006_tax_advantaged.sql',
    shouldRun: async () => {
      const accountType = await client.query(
        "select 1 from information_schema.columns where table_schema='public' and table_name='assets' and column_name='account_type' limit 1"
      );
      const enumRes = await client.query("select 1 from pg_type t join pg_enum e on t.oid = e.enumtypid where t.typname = 'asset_type' and e.enumlabel = 'tax_advantaged' limit 1");
      return accountType.rowCount === 0 || enumRes.rowCount === 0;
    },
  },
];

const runMigration = async (fileName) => {
  const filePath = path.join(migrationsDir, fileName);
  const sql = await fs.readFile(filePath, 'utf8');
  console.log(`Applying ${fileName}...`);
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query('commit');
    console.log(`Applied ${fileName}`);
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
};

const main = async () => {
  await client.connect();
  try {
    for (const step of steps) {
      const needsRun = await step.shouldRun();
      if (needsRun) {
        await runMigration(step.name);
      } else {
        console.log(`Skipping ${step.name} (already applied)`);
      }
    }
    console.log('Migrations complete.');
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
