const http = require('http');

function test(data, desc) {
  return new Promise((resolve) => {
    const req = http.request('http://127.0.0.1:8080/api/simulation/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      res.on('end', () => {
        setTimeout(() => {
          http.get('http://127.0.0.1:8080/api/simulation/results', (res2) => {
            let body = '';
            res2.on('data', (d) => body += d);
            res2.on('end', () => {
                console.log(desc);
                console.log(body);
                resolve();
            });
          });
        }, 1000);
      });
      res.resume();
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  await test('disaster=Earthquake&severity=2&duration=12&population=10000&teams=5&water=5000&food=10000&medicine=500&fuel=200&zones=2', "TEST: Pop 10000 (No explicit zones)");
  await test('disaster=Earthquake&severity=2&duration=12&population=50000&teams=5&water=5000&food=10000&medicine=500&fuel=200&zones=2', "TEST: Pop 50000 (No explicit zones)");
})();
