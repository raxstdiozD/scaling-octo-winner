const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting daily refill: Resetting credits to 50 for free users and 5000 for pro users...');
  
  // Update free users
  const freeResult = await prisma.user.updateMany({
    where: {
      plan: 'free'
    },
    data: {
      dailyCredits: 50
    }
  });
  
  // Update pro users (Assuming 5000 as per PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS mentioned in hooks)
  const proResult = await prisma.user.updateMany({
    where: {
      plan: 'pro'
    },
    data: {
      dailyCredits: 5000 
    }
  });
  
  console.log(`Success! Refilled ${freeResult.count} free users and ${proResult.count} pro users.`);
}

main()
  .catch((e) => {
    console.error('Error during refill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
