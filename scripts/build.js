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
    console.error("Database migration warning / error:", error.message || error);
    // If strict migration enforcement is requested, halt; otherwise allow build to proceed
    if (process.env.RUN_MIGRATIONS === "strict") {
      process.exit(1);
    }
  }
}

console.log("Building Next.js application...");
execSync("npx next build", { stdio: "inherit" });

