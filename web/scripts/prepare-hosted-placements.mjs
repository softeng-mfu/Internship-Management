// Explicit deployment operation: additive schema and demo catalogue only.
// Run from web. Credentials remain in ignored environment files, never output.
import postgres from "postgres";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
process.loadEnvFile(".env.local");
const ssl={ca:readFileSync("certs/supabase-ca.crt","utf8"),rejectUnauthorized:true};
const original=new URL(process.env.DATABASE_URL);
const role="team17_placements_reader";
const admin=postgres(original.href,{ssl,max:1,prepare:false,connect_timeout:8,connection:{statement_timeout:10000}});
let reader;
try {
  const local=await fetch("http://127.0.0.1:3001/api/placements?limit=50",{signal:AbortSignal.timeout(15000)});
  if(!local.ok)throw new Error("Local catalogue unavailable");
  const {data}=await local.json();
  if(!data.length||data.some(p=>!p.is_demo))throw new Error("Expected only labeled demo source records");
  const [schema]=await admin`select to_regclass('public.placements') is not null as present`;
  if(!schema.present)await admin.unsafe(readFileSync("../supabase/migrations/202611070001_public_placements.sql","utf8"));
  const [existing]=await admin`select exists(select 1 from pg_roles where rolname=${role}) as present`;
  let runtimeUrl;
  if(existing.present){
    if(!existsSync('.env.deploy.local'))throw new Error("Reader role already exists; supply its existing private deployment environment");
    runtimeUrl=readFileSync('.env.deploy.local','utf8').match(/^PLACEMENTS_DATABASE_URL=(.+)$/m)?.[1];
    if(!runtimeUrl||decodeURIComponent(new URL(runtimeUrl).username)!==role+'.'+original.hostname.split('.')[1])throw new Error("Existing reader configuration does not match");
  }else{
    const password=randomBytes(32).toString('hex');
    const pooler=new URL(original);
    // Verified for this project's Mumbai region before this script was prepared.
    pooler.hostname='aws-0-ap-south-1.pooler.supabase.com';pooler.port='6543';
    pooler.username=role+'.'+original.hostname.split('.')[1];pooler.password=password;
    runtimeUrl=pooler.href;
    await admin.unsafe(`create role ${role} login password '${password}' nosuperuser nocreatedb nocreaterole noinherit nobypassrls`);
    // Persist immediately so retry never requires rotating an existing role.
    writeFileSync('.env.deploy.local',`PLACEMENTS_DB_MODE=postgres\nPLACEMENTS_DATABASE_URL=${runtimeUrl}\nPUBLIC_SITE_URL=https://team17-internship.vercel.app\n`,{mode:0o600});
  }
  await admin.begin(async tx=>{
    await tx.unsafe(`grant usage on schema public to ${role}`);
    await tx.unsafe(`grant select on public.placements to ${role}`);
    const policies=await tx`select 1 from pg_policies where schemaname='public' and tablename='placements' and policyname='placements_reader_open'`;
    if(!policies.length)await tx.unsafe(`create policy placements_reader_open on public.placements for select to ${role} using (publication_status='published' and published_at is not null and published_at<=now() and status='open' and application_deadline >= (now() at time zone 'Asia/Bangkok')::date)`);
    for(const p of data){
      await tx`insert into public.placements(id,title,company,description,location,category,work_mode,skills,allowance_thb,duration_weeks,application_deadline,status,publication_status,is_demo,published_at,updated_at)
        values(${p.id},${p.title},${p.company},${p.description},${p.location},${p.category},${p.work_mode},${p.skills},${p.allowance_thb},${p.duration_weeks},${p.application_deadline},'open','published',true,${p.published_at},${p.updated_at}) on conflict(id) do nothing`;
    }
  });
  reader=postgres(runtimeUrl,{ssl,max:1,prepare:false,connect_timeout:8,connection:{default_transaction_read_only:true,statement_timeout:8000}});
  const [count]=await reader`select count(*)::int as count from public.placements`;
  let isolated=false;
  try { await reader`select count(*) from public.a5_status_events`; } catch(error){isolated=error.code==='42501';}
  if(!isolated)throw new Error("Reader must not access A5 records");
  console.log(JSON.stringify({hosted_catalogue_ready:true,visible_records:count.count,reader_isolated_from_a5:true,credentials_saved_to_ignored_file:true}));
} catch(error) {
  console.error(JSON.stringify({hosted_setup_failed:true,code:error.code||error.name}));process.exitCode=1;
} finally { if(reader)await reader.end({timeout:1});await admin.end({timeout:1}); }
