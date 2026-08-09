package com.btrack.modules.exercise.importer;

import com.btrack.modules.exercise.entity.Exercise;

import java.util.List;
import java.util.Map;

public interface ExerciseImportProvider {

    String getId();          // e.g. "FREE_EXERCISE_DB"
    String getDisplayName(); // e.g. "Free Exercise DB (yuhonas)"
    String getVersion();     // dataset version or "latest"

    /** Load raw records from the source (GitHub, API, file, etc.) */
    List<Map<String, Object>> load(Map<String, Object> options) throws Exception;

    /** Map a raw record to an Exercise builder (without saving) */
    Exercise.ExerciseBuilder map(Map<String, Object> rawRecord);

    /** Derive an external identifier from a raw record for dedup */
    String extractExternalId(Map<String, Object> rawRecord);
}
