const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function testLogin() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_lzaeXiGZc6R0@ep-falling-block-afb3zmcn-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get user
    const userQuery = 'SELECT id, name, email, password_hash FROM users WHERE email = $1';
    const result = await client.query(userQuery, ['noam@nsmprime.com']);
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.name, user.email);

    // Test password
    const testPassword = 'NoamSadi1!';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('Password hash:', user.password_hash.substring(0, 20) + '...');
    console.log('Test password:', testPassword);
    console.log('Password valid:', isValid ? '✅ YES' : '❌ NO');

    // Test wrong password
    const wrongPassword = 'wrongpassword';
    const isWrong = await bcrypt.compare(wrongPassword, user.password_hash);
    console.log('Wrong password test:', isWrong ? '❌ SHOULD BE FALSE' : '✅ Correctly rejected');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testLogin();