const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting compensation: Giving 50 credits to all users...');
  
  // We increment the credits by 50 for everyone
  const result = await prisma.user.updateMany({
    data: {
      dailyCredits: {
        increment: 50
      }
    }
  });
  
  console.log(`Success! Updated ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error('Error during compensation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
