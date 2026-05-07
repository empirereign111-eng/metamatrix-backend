async function test() {
  const apiKey = 'xai-8zO0fmQO33pXqlOCLjrfMk6iiQBXu0uzEy60nwFfx4F0ied5jdJmnoh9F9fNklgLlumotQSoW5dnft8T';
  const res = await fetch('https://api.x.ai/v1/models', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const data = await res.json();
  console.log(data);
}
test();
