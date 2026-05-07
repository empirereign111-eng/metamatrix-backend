async function test() {
  const apiKey = 'xai-8zO0fmQO33pXqlOCLjrfMk6iiQBXu0uzEy60nwFfx4F0ied5jdJmnoh9F9fNklgLlumotQSoW5dnft8T';
  const models = ['grok-4.1-fast-reasoning', 'grok-4.1-vision', 'grok-4.1-latest'];
  
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
