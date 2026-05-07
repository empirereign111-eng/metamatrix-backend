const errText1 = '{"code":"Client specified an invalid argument","error":"Incorrect API key provided: du***my. You can obtain an API key from https://console.x.ai."}';
const errText2 = '{"error":{"message":"Invalid model"}}';
const errText3 = '{"message":"Rate limit exceeded"}';

function extract(errText) {
  let errMsg = 'Fallback';
  try {
    const err = JSON.parse(errText);
    errMsg = err.error?.message || (typeof err.error === 'string' ? err.error : null) || err.message || errMsg;
  } catch (e) {}
  return errMsg;
}

console.log(extract(errText1));
console.log(extract(errText2));
console.log(extract(errText3));
