ALTER TABLE "Budget" ADD COLUMN "incomePercent" INTEGER;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_incomePercent_check"
  CHECK ("incomePercent" IS NULL OR "incomePercent" BETWEEN 1 AND 100);
