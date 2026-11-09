import { PGlite } from "@electric-sql/pglite";
import { mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// This command only targets the local embedded database. It never reads DATABASE_URL.
async function main() {
  const directory = join(process.cwd(), ".data", "placements");
  await mkdir(directory, { recursive: true });
  const db = new PGlite(directory);
  try {
    const exists = await db.query<{ exists: boolean }>(
      "select to_regclass('public.placements') is not null as exists",
    );
    if (!exists.rows[0].exists) {
      await db.exec(
        await readFile(
          join(
            process.cwd(),
            "..",
            "supabase",
            "migrations",
            "202611070001_public_placements.sql",
          ),
          "utf8",
        ),
      );
    }
    const entries = [
      [
        "10000000-0000-4000-8000-000000000001",
        "Product Design Intern",
        "Sample Studio",
        "Bangkok, Thailand",
        "Design",
        "hybrid",
        ["Figma", "UI/UX", "Prototyping"],
        12000,
        "Practice user research and turn ideas into thoughtful, accessible prototypes with a design mentor.",
      ],
      [
        "10000000-0000-4000-8000-000000000002",
        "Frontend Developer Intern",
        "Sample Web Lab",
        "Remote",
        "Engineering",
        "remote",
        ["React", "Next.js", "TypeScript"],
        15000,
        "Learn to build accessible web interfaces, review code, and develop a mentored frontend project.",
      ],
      [
        "10000000-0000-4000-8000-000000000003",
        "Marketing and Growth Intern",
        "Sample Creative Co",
        "Bangkok, Thailand",
        "Marketing",
        "on-site",
        ["Content", "Strategy", "Analytics"],
        10000,
        "Explore audience research, create sample campaign content, and learn to interpret marketing results.",
      ],
      [
        "10000000-0000-4000-8000-000000000004",
        "Software Engineering Intern",
        "Sample Systems",
        "Bangkok, Thailand",
        "Engineering",
        "hybrid",
        ["JavaScript", "SQL", "APIs"],
        18000,
        "Practice API design, database queries, and testing through a small, supported engineering project.",
      ],
      [
        "10000000-0000-4000-8000-000000000005",
        "Data Analyst Intern",
        "Sample Insights",
        "Chiang Mai, Thailand",
        "Data",
        "hybrid",
        ["Python", "SQL", "Visualization"],
        12000,
        "Explore practice datasets, build useful visualizations, and explain findings to a friendly analytics team.",
      ],
      [
        "10000000-0000-4000-8000-000000000006",
        "Brand Design Intern",
        "Sample Design House",
        "Remote",
        "Design",
        "remote",
        ["Branding", "Illustration", "Figma"],
        14000,
        "Explore visual storytelling, create brand concepts, and develop your process through feedback.",
      ],
    ];
    await db.transaction(async (tx) => {
      for (const [
        id,
        title,
        company,
        location,
        category,
        mode,
        skills,
        allowance,
        description,
      ] of entries) {
        await tx.query(
          `insert into public.placements
        (id,title,company,location,category,work_mode,skills,allowance_thb,description,
         application_deadline,publication_status,published_at,is_demo)
        values($1,$2,$3,$4,$5,$6,$7,$8,$9,((now() at time zone 'Asia/Bangkok')::date + 90),'published',now(),true)
        on conflict(id) do nothing`,
          [
            id,
            title,
            company,
            location,
            category,
            mode,
            skills,
            allowance,
            description,
          ],
        );
      }
    });
    const count = await db.query<{ count: number }>(
      "select count(*)::int as count from public.placements",
    );
    console.log(
      `Local PostgreSQL catalogue ready: ${count.rows[0].count} records. Demonstration listings only; hosted databases were not changed.`,
    );
  } finally {
    await db.close();
  }
}
main().catch(() => {
  console.error(
    "Local catalogue setup failed. Stop the dev server and check local database files before retrying.",
  );
  process.exitCode = 1;
});
