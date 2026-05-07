async function test() {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer dummy', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'grok-2-vision-1212',
      messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/' } }] }]
    })
  });
  console.log(res.status, await res.text());
}
test();
