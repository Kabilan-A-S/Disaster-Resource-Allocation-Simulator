const http = require('http');

const data = 'disaster=Earthquake&severity=2&duration=12&population=50000&teams=5&water=20000&food=10000&medicine=500&fuel=200&zones=2&zone_0_name=Zone+1&zone_0_population=6000&zone_0_severity=2&zone_0_medicalNeed=1&zone_0_distance=5&zone_1_name=Zone+2&zone_1_population=4000&zone_1_severity=1&zone_1_medicalNeed=2&zone_1_distance=10';

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
        res2.on('data', (d) => process.stdout.write(d));
      });
    }, 1000);
  });
  res.resume();
});

req.write(data);
req.end();
