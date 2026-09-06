const { execSync } = require("child_process");

// When deploying on Vercel or when production database is provided, run prisma migrate deploy
if (
  process.env.VERCEL ||
  process.env.RUN_MIGRATIONS === "true" ||
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost"))
) {
  console.log("Applying production database migrations (prisma migrate deploy)...");
  try {
    execSync("npx prisma migrate deploy", { stdio: "inherit" });
    console.log("Database migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

console.log("Building Next.js application...");
execSync("next build", { stdio: "inherit" });
