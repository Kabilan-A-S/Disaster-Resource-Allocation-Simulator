package disaster.file;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import disaster.interfaces.DataStore;
import disaster.disaster.*;
import disaster.zone.Zone;
import disaster.resource.*;
import disaster.simulation.SimulationResult;

public class FileManager implements DataStore {
    private final File dataDirectory;

    public FileManager() {
        this(findDefaultDataDirectory());
    }

    public FileManager(File d) {
        this.dataDirectory = d;
    }

    private static File findDefaultDataDirectory() {
        File f1 = new File("data");
        if (f1.isDirectory() && new File(f1, "zones.txt").isFile()) return f1;
        File f2 = new File("backend/data");
        if (f2.isDirectory() && new File(f2, "zones.txt").isFile()) return f2;
        File f3 = new File("../data");
        if (f3.isDirectory() && new File(f3, "zones.txt").isFile()) return f3;
        return f1;
    }

    private File resolveFile(String name) throws FileNotFoundException {
        File file = new File(dataDirectory, name);
        if (file.isFile()) return file;
        File f2 = new File("backend/data", name);
        if (f2.isFile()) return f2;
        File f3 = new File("data", name);
        if (f3.isFile()) return f3;
        File f4 = new File("../data", name);
        if (f4.isFile()) return f4;
        throw new FileNotFoundException("Missing required data file: " + file.getAbsolutePath());
    }

    private List<String> lines(String name) throws IOException {
        File file = resolveFile(name);
        List<String> out = new ArrayList<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            String s;
            while ((s = r.readLine()) != null) {
                if (!s.isBlank() && !s.startsWith("#")) {
                    out.add(s.trim());
                }
            }
        }
        return out;
    }

    @Override
    public Disaster loadDisaster() throws IOException {
        try {
            String[] p = lines("disasters.txt").get(0).split("\\|");
            return switch (p[1]) {
                case "Flood" -> new Flood(Integer.parseInt(p[2]), Integer.parseInt(p[3]), Long.parseLong(p[4]));
                case "Earthquake" -> new Earthquake(Integer.parseInt(p[2]), Integer.parseInt(p[3]), Long.parseLong(p[4]));
                case "Cyclone" -> new Cyclone(Integer.parseInt(p[2]), Integer.parseInt(p[3]), Long.parseLong(p[4]));
                default -> throw new IllegalArgumentException("Unknown disaster: " + p[1]);
            };
        } catch (RuntimeException e) {
            throw new IOException("Invalid disasters.txt: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Zone> loadZones() throws IOException {
        List<Zone> out = new ArrayList<>();
        Set<String> ids = new HashSet<>();
        try {
            for (String s : lines("zones.txt")) {
                String delimiter = s.contains(",") ? "," : "\\|";
                String[] p = s.split(delimiter);
                Zone z = new Zone(p[0].trim(), p[1].trim(), Long.parseLong(p[2].trim()), Integer.parseInt(p[3].trim()), Integer.parseInt(p[4].trim()), Integer.parseInt(p[5].trim()));
                if (!ids.add(z.getId())) {
                    throw new IllegalArgumentException("Duplicate zone ID: " + z.getId());
                }
                out.add(z);
            }
            return out;
        } catch (RuntimeException e) {
            throw new IOException("Invalid zones.txt: " + e.getMessage(), e);
        }
    }

    @Override
    public void saveZones(List<Zone> zones) throws IOException {
        StringBuilder sb = new StringBuilder();
        sb.append("# zoneId,zoneName,population,severity,medicalNeed,distanceKm\n");
        for (Zone z : zones) {
            sb.append(z.getId()).append(",")
              .append(z.getName()).append(",")
              .append(z.getPopulation()).append(",")
              .append(z.getSeverity()).append(",")
              .append(z.getMedicalNeed()).append(",")
              .append(z.getDistanceKm()).append("\n");
        }
        String content = sb.toString();
        write("zones.txt", content, false);
        syncFile("zones.txt", content);
    }

    @Override
    public Map<String, Resource> loadResources() throws IOException {
        Map<String, Resource> out = new HashMap<>();
        try {
            for (String s : lines("resources.txt")) {
                String delimiter = s.contains(",") ? "," : "\\|";
                String[] p = s.split(delimiter);
                long q = Long.parseLong(p[1].trim());
                Resource r = switch (p[0].trim()) {
                    case "Water" -> new Water(q);
                    case "Food" -> new Food(q);
                    case "Medicine" -> new Medicine(q);
                    case "Fuel" -> new Fuel(q);
                    default -> throw new IllegalArgumentException("Unknown resource: " + p[0]);
                };
                out.put(p[0].trim(), r);
            }
            return out;
        } catch (RuntimeException e) {
            throw new IOException("Invalid resources.txt: " + e.getMessage(), e);
        }
    }

    @Override
    public void saveSimulationResult(String id, SimulationResult r) throws IOException {
        write("simulation_results.txt", id + "|teams=" + r.teamsRequired + "|available=" + r.teamsAvailable + "\n", false);
    }

    @Override
    public void appendRunHistory(String id, String status, String summary) throws IOException {
        write("run_history.txt", id + "|" + status + "|" + summary + "\n", true);
    }

    @Override
    public List<String> loadHistory() throws IOException {
        File f = new File(dataDirectory, "run_history.txt");
        if (!f.isFile()) {
            try { f = resolveFile("run_history.txt"); } catch (FileNotFoundException ignored) {}
        }
        return f.isFile() ? java.nio.file.Files.readAllLines(f.toPath(), StandardCharsets.UTF_8) : List.of();
    }

    @Override
    public void clearHistory() throws IOException {
        write("run_history.txt", "", false);
        syncFile("run_history.txt", "");
    }

    @Override
    public File getZonesFile() throws FileNotFoundException {
        return resolveFile("zones.txt");
    }

    private void write(String n, String s, boolean append) throws IOException {
        if (!dataDirectory.exists() && !dataDirectory.mkdirs()) {
            throw new IOException("Cannot create " + dataDirectory.getAbsolutePath());
        }
        try (Writer w = new OutputStreamWriter(new FileOutputStream(new File(dataDirectory, n), append), StandardCharsets.UTF_8)) {
            w.write(s);
        }
    }

    private void syncFile(String n, String content) {
        List<File> targets = List.of(
            new File("data", n),
            new File("backend/data", n),
            new File("../data", n)
        );
        for (File f : targets) {
            try {
                File p = f.getParentFile();
                if (p != null && p.isDirectory() && !f.equals(new File(dataDirectory, n))) {
                    try (Writer w = new OutputStreamWriter(new FileOutputStream(f, false), StandardCharsets.UTF_8)) {
                        w.write(content);
                    }
                }
            } catch (Exception ignored) {}
        }
    }
}
