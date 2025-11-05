const { Client } = require('pg');

async function createSampleClients() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_lzaeXiGZc6R0@ep-falling-block-afb3zmcn-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  });

  try {
    await client.connect();
    console.log('Connected to Neon database');

    // Sample clients data
    const clients = [
      {
        id: 'client-1',
        name: 'Sarah Johnson',
        company: 'Acme Corporation',
        status: 'Active',
        email: 'sarah.johnson@acmecorp.com',
        phone: '+1 (555) 123-4567',
        tags: ['Enterprise', 'Priority'],
        notes: 'Key account with high-value contracts. Quarterly business reviews scheduled.',
        created_by: 1
      },
      {
        id: 'client-2', 
        name: 'Jackson Lee',
        company: 'Aperture Labs',
        status: 'On hold',
        email: 'jackson.lee@aperturelabs.io',
        phone: '+1 (555) 204-1185',
        tags: ['Finance'],
        notes: 'Contract renewal pending. Follow up required.',
        created_by: 1
      },
      {
        id: 'client-3',
        name: 'Mia Thompson',
        company: 'Brightside Studio',
        status: 'Active',
        email: 'mia@brightside.studio',
        phone: '+1 (555) 730-2299',
        tags: ['Design', 'Partner'],
        notes: 'Collaborative design partner with bi-weekly deliverables.',
        created_by: 1
      },
      {
        id: 'client-4',
        name: 'Ava Chen',
        company: 'Orbit Analytics',
        status: 'Active',
        email: 'ava.chen@orbitanalytics.io',
        phone: '+1 (555) 830-5501',
        tags: ['Onboarding'],
        notes: 'New client in onboarding phase. Training sessions scheduled.',
        created_by: 1
      }
    ];

    // Insert clients
    for (const clientData of clients) {
      const insertQuery = `
        INSERT INTO clients (id, name, company, status, email, phone, tags, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          company = EXCLUDED.company,
          status = EXCLUDED.status,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          tags = EXCLUDED.tags,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP;
      `;

      const values = [
        clientData.id,
        clientData.name,
        clientData.company,
        clientData.status,
        clientData.email,
        clientData.phone,
        clientData.tags,
        clientData.notes,
        clientData.created_by
      ];

      await client.query(insertQuery, values);
      console.log(`Client ${clientData.name} inserted/updated successfully`);
    }

    // Verify data
    const countResult = await client.query('SELECT COUNT(*) FROM clients');
    console.log(`Total clients in database: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Error creating sample clients:', error);
  } finally {
    await client.end();
  }
}

createSampleClients();