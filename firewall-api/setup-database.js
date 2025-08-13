const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function setupDatabase() {
  console.log('🚀 Setting up database...');
  
  try {
    if (!process.env.DATABASE_URL) {
      console.log('⚠️ No DATABASE_URL found, skipping database setup');
      return;
    }

    console.log('📊 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');

    console.log('🔄 Pushing schema to database...');
    await execAsync('npx prisma db push --force-reset');
    console.log('✅ Database schema updated');

    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('⚠️ Server will run in DEMO MODE');
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };