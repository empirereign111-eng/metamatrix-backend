async function test() {
  const apiKey = 'Grok_API_KEY_Here';
  const models = ['grok-4.20', 'grok-4.20-beta', 'grok-4.20-latest', 'grok-4.5'];
  
  for (const model of models) {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'hello' }]
      })
    });
    console.log(model, res.status, await res.text());
  }
}
test();
