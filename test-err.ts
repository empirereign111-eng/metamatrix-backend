const errText = '{"code":"Client specified an invalid argument","error":"Incorrect API key provided: du***my. You can obtain an API key from https://console.x.ai."}';
let errMsg = 'Grok API Error (Text Fallback)';
try {
  const err = JSON.parse(errText);
  errMsg = err.error?.message || err.message || (typeof err.error === 'string' ? err.error : errMsg);
} catch (e) {}
console.log(errMsg);
