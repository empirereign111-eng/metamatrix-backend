async function test() {
  const apiKey = 'Grok_API_KEY_Here';
  const res = await fetch('https://api.x.ai/v1/models', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log(data);
}
test();
