async function test() {
  const res = await fetch('https://api.x.ai/v1/models', {
    headers: { 'Authorization': 'Bearer dummy' }
  });
  console.log(res.status, await res.text());
}
test();
