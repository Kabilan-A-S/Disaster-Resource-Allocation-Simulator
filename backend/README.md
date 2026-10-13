# Disaster Resource Allocation Simulator Backend

JDK-only Java backend (Java 21 source compatibility) for the React command center. No Spring, database, JSON library, or executor framework is used.

## Run

From `backend`:

```powershell
javac --release 21 -d out (Get-ChildItem -Recurse -Filter *.java src | ForEach-Object FullName)
java -cp out disaster.Main
java -cp out disaster.server.ApiServer
```

The HTTP server listens on `http://localhost:8080`.

## Tests

The repository includes the JUnit Platform standalone runner in `lib/`.

```powershell
javac --release 21 -d out (Get-ChildItem -Recurse -Filter *.java src | ForEach-Object FullName)
javac --release 21 -cp 'out;lib\junit-platform-console-standalone-1.11.4.jar' -d test-out (Get-ChildItem -Recurse -Filter *.java test | ForEach-Object FullName)
java -jar lib\junit-platform-console-standalone-1.11.4.jar execute --class-path 'out;test-out' --scan-class-path
```

## API

- `POST /api/simulation/start` — starts the 10-team Golden Scenario asynchronously.
- `GET /api/simulation/status` — current run state.
- `GET /api/simulation/results` — completed result summary.
- `GET /api/zones` and `GET /api/resources` — scenario data.
- `POST /api/simulation/what-if` with `teams=15` — asynchronous what-if run.
- `GET /api/history` — persisted run history.

Form posts use `application/x-www-form-urlencoded`; responses are hand-built JSON. CORS is enabled for the local frontend.

## Golden formulas

Water and food use population × daily rate × hours/24 × demand percent. Flood impact is `100 × severity × ceil(duration/6) / 100`; severity 5 for 24 hours gives impact 20 and demand 120%. Medicine is 1 kit per 100 people per medical need, multiplied by demand percent. Fuel is distance × 10 L. Team demand is `ceil(population / 2500)`.

## Structure

`src/disaster/disaster` contains the three-level disaster hierarchy; `zone`, `resource`, `allocation`, `rescue`, and `simulation` contain domain logic; `file` is persistence; `server` is HTTP transport; `test` contains JUnit tests. Golden input files are in `data/`.

## React integration

`src/api/simulationApi.ts` calls the Java API. Simulation Control invokes `POST /api/simulation/start` while preserving the existing visual timeline.
