const fetch = require('node-fetch');

async function testSendOtp() {
  const url = 'http://localhost:3000/api/auth/send-otp';
  const body = {
    name: 'Test User',
    email: 'dev30073@gmail.com'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testSendOtp();
