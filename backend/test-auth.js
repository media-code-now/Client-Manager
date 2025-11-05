#!/usr/bin/env node
const http = require('http');

// Test health endpoint
const testHealth = () => {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Health Check Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Health Response:', data);
      testRegister();
    });
  });

  req.on('error', (error) => {
    console.error('Health Check Error:', error.message);
  });

  req.end();
};

// Test registration endpoint
const testRegister = () => {
  const postData = JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nRegister Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Register Response:', data);
      testLogin();
    });
  });

  req.on('error', (error) => {
    console.error('Register Error:', error.message);
  });

  req.write(postData);
  req.end();
};

// Test login endpoint
const testLogin = () => {
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  });

  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`\nLogin Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Login Response:', data);
      console.log('\n✅ All tests completed!');
    });
  });

  req.on('error', (error) => {
    console.error('Login Error:', error.message);
  });

  req.write(postData);
  req.end();
};

console.log('🧪 Testing CRM Auth Backend...\n');
testHealth();