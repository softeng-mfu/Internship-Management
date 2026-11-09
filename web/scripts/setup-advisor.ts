import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { getMigrations } from "better-auth/db/migration";
async function main() {
  process.loadEnvFile(".env.local");
  if (process.env.AUTH_DB_MODE !== "local" || process.env.VERCEL)
    throw new Error("This setup command is local only.");
  const { getAuth, getApplicationDatabase } = await import("../src/lib/auth");
  const { workspaceStore } = await import("../src/lib/workspace");
  const auth = getAuth();
  await (await getMigrations(auth.options)).runMigrations();
  const store = workspaceStore(getApplicationDatabase());
  await store.migrate();
  const context = await auth.$context;
  const email = (process.argv[3] || "advisor@internly.local").trim().toLowerCase();
  let advisor = (await context.internalAdapter.findUserByEmail(email))?.user;
  if (!advisor && process.argv[3]) throw new Error("Create this advisor account in the login page first, then assign students.");
  if (!advisor) {
    if (existsSync(".env.advisor.local"))
      throw new Error(
        "Credentials file already exists; refusing to replace it.",
      );
    const password = randomBytes(24).toString("base64url");
    advisor = await context.internalAdapter.createUser(
      {
        email,
        name: "Internship Advisor",
        emailVerified: false,
        role: "advisor",
        authSource: "local",
      },
      { method: "custom" },
    );
    await context.internalAdapter.createAccount({
      userId: advisor.id,
      providerId: "credential",
      accountId: advisor.id,
      password: await hashPassword(password),
    });
    writeFileSync(
      ".env.advisor.local",
      `# Private local advisor login; do not commit.\nADVISOR_EMAIL=${email}\nADVISOR_PASSWORD=${password}\n`,
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      "Advisor created; credentials saved in ignored .env.advisor.local.",
    );
  } else if ((advisor as { role?: string }).role !== "advisor")
    throw new Error(
      "Existing account has another role; refusing to promote it.",
    );
  const studentNumber = process.argv[2];
  if (studentNumber) {
    if (!/^\d{10}$/.test(studentNumber))
      throw new Error("Supply a ten-digit student ID.");
    const users = await store.query(
      'select id from "user" where "studentId"=? and role=?',
      [studentNumber, "student"],
    );
    if (!users.length)
      throw new Error("Student must first sign in with Student Identity.");
    await store.assign(String(users[0].id), advisor.id);
    console.log("Student assigned to the local advisor.");
  }
  console.log("Workspace schema and advisor account are ready.");
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : "Advisor setup failed");
  process.exitCode = 1;
});
