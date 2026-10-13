package disaster.interfaces; import disaster.zone.Zone; @FunctionalInterface public interface ZoneFilter { boolean check(Zone zone); }
