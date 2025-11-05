const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createAdminUser() {
  // Database connection
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_lzaeXiGZc6R0@ep-falling-block-afb3zmcn-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('Connected to Neon database');

    // Hash the password
    const password = 'NoamSadi1!';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the admin user
    const insertQuery = `
      INSERT INTO users (name, email, password_hash, role, company)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, uuid, name, email, role;
    `;

    const values = [
      'Noam Sadi',
      'noam@nsmprime.com',
      passwordHash,
      'admin',
      'NSMPrime'
    ];

    const result = await client.query(insertQuery, values);
    console.log('Admin user created/updated successfully:');
    console.log(result.rows[0]);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdminUser();