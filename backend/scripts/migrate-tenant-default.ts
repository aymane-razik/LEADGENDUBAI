import { connectDatabase, disconnectDatabase } from '../src/config';
import { Activity, Campaign, Lead, Property, Scraper, User } from '../src/models';

const run = async (): Promise<void> => {
  await connectDatabase();
  const models = [Activity, Campaign, Lead, Property, Scraper, User];
  let updated = 0;

  try {
    for (const model of models) {
      const result = await model.collection.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: 'default' } },
      );
      updated += result.modifiedCount;
    }
    process.stdout.write(`Tenant backfill complete. Updated ${updated} legacy records.\n`);
  } finally {
    await disconnectDatabase();
  }
};

run().catch((error: unknown) => {
  process.stderr.write(`Tenant backfill failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
