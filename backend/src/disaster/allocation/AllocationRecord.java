package disaster.allocation; public record AllocationRecord(String zoneId,String resource,long required,long allocated){public long shortage(){return required-allocated;}}
