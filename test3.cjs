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
  await test('disaster=Earthquake&severity=2&duration=12&population=10000&teams=5&water=5000&food=10000&medicine=500&fuel=200&zones=2&zone_0_name=Zone+1&zone_0_population=6000&zone_0_severity=2&zone_0_medicalNeed=1&zone_0_distance=5&zone_1_name=Zone+2&zone_1_population=4000&zone_1_severity=1&zone_1_medicalNeed=2&zone_1_distance=10', "TEST: Water 5000");
  await test('disaster=Earthquake&severity=2&duration=12&population=10000&teams=20&water=20000&food=10000&medicine=500&fuel=200&zones=2&zone_0_name=Zone+1&zone_0_population=6000&zone_0_severity=2&zone_0_medicalNeed=1&zone_0_distance=5&zone_1_name=Zone+2&zone_1_population=4000&zone_1_severity=1&zone_1_medicalNeed=2&zone_1_distance=10', "TEST: Teams 20");
  await test('disaster=Earthquake&severity=2&duration=12&population=10000&teams=5&water=20000&food=10000&medicine=500&fuel=200&zones=4&zone_0_name=Zone+1&zone_0_population=6000&zone_0_severity=2&zone_0_medicalNeed=1&zone_0_distance=5&zone_1_name=Zone+2&zone_1_population=4000&zone_1_severity=1&zone_1_medicalNeed=2&zone_1_distance=10&zone_2_name=Zone+3&zone_2_population=1000&zone_2_severity=1&zone_2_medicalNeed=1&zone_2_distance=5&zone_3_name=Zone+4&zone_3_population=1000&zone_3_severity=1&zone_3_medicalNeed=1&zone_3_distance=5', "TEST: 4 Zones");
})();
