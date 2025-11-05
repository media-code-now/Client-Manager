// Test the login API endpoint
async function testLoginAPI() {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'noam@nsmprime.com',
        password: 'NoamSadi1!'
      })
    });

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token received:', !!data.tokens);
    } else {
      console.log('❌ Login failed:', data.error);
    }
  } catch (error) {
    console.error('❌ API Error:', error);
  }
}

// Run test (paste this in browser console when on localhost:3000)
testLoginAPI();