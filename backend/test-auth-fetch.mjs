import fetch from 'node-fetch';

const testEndpoints = async () => {
  try {
    console.log('🧪 Testing CRM Auth Backend...\n');

    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5001/health');
    const healthData = await healthResponse.text();
    console.log(`Health Status: ${healthResponse.status}`);
    console.log(`Health Response: ${healthData}\n`);

    // Test registration
    console.log('Testing registration endpoint...');
    const registerResponse = await fetch('http://localhost:5001/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const registerData = await registerResponse.text();
    console.log(`Register Status: ${registerResponse.status}`);
    console.log(`Register Response: ${registerData}\n`);

    // Test login
    console.log('Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:5001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.text();
    console.log(`Login Status: ${loginResponse.status}`);
    console.log(`Login Response: ${loginData}\n`);

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testEndpoints();