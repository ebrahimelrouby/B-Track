package com.btrack.modules.exercise.importer;

import com.btrack.modules.exercise.entity.Exercise;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Imports from yuhonas/free-exercise-db (MIT License).
 * Dataset: https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FreeExerciseDbProvider implements ExerciseImportProvider {

    private static final String DATASET_URL =
            "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
    private static final String MEDIA_BASE =
            "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Override
    public String getId() { return "FREE_EXERCISE_DB"; }

    @Override
    public String getDisplayName() { return "Free Exercise DB (yuhonas) — MIT License"; }

    @Override
    public String getVersion() { return "latest"; }

    @Override
    public List<Map<String, Object>> load(Map<String, Object> options) throws Exception {
        String url = options != null && options.containsKey("url")
                ? (String) options.get("url")
                : DATASET_URL;

        log.info("Loading exercises from {}", url);
        String json = restTemplate.getForObject(url, String.class);
        return objectMapper.readValue(json, new TypeReference<>() {});
    }

    @Override
    public Exercise.ExerciseBuilder map(Map<String, Object> raw) {
        String name = (String) raw.get("name");
        String category = (String) raw.get("category");
        String force = (String) raw.get("force");
        String mechanic = (String) raw.get("mechanic");
        String equipment = (String) raw.get("equipment");
        String level = (String) raw.get("level");
        String id = (String) raw.get("id");

        @SuppressWarnings("unchecked")
        List<String> primaryMuscles = (List<String>) raw.get("primaryMuscles");
        @SuppressWarnings("unchecked")
        List<String> secondaryMusclesRaw = (List<String>) raw.get("secondaryMuscles");
        @SuppressWarnings("unchecked")
        List<String> instructions = (List<String>) raw.get("instructions");
        @SuppressWarnings("unchecked")
        List<String> images = (List<String>) raw.get("images");

        Exercise.MuscleGroup muscleGroup = mapMuscleGroup(primaryMuscles);
        Exercise.EquipmentType equipmentType = mapEquipment(equipment);
        Exercise.Difficulty difficulty = mapDifficulty(level);

        List<Exercise.MuscleGroup> secondary = new ArrayList<>();
        if (secondaryMusclesRaw != null) {
            for (String m : secondaryMusclesRaw) {
                Exercise.MuscleGroup mg = mapSingleMuscle(m);
                if (mg != null) secondary.add(mg);
            }
        }

        String instructionText = instructions != null
                ? String.join(". ", instructions)
                : null;

        String imageUrl = null;
        String gifUrl = null;
        if (images != null && !images.isEmpty()) {
            String firstImg = images.get(0);
            // images are relative paths like "Barbell-Bench-Press_chest/0.jpg"
            imageUrl = MEDIA_BASE + firstImg;
            if (images.size() > 1) {
                // Check for GIF convention (some providers use index 1 as animated)
                gifUrl = MEDIA_BASE + images.get(1);
            }
        }

        String slug = name != null
                ? name.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").replaceAll("\\s+", "-").trim()
                : id;

        return Exercise.builder()
                .name(name)
                .slug(slug)
                .muscleGroup(muscleGroup != null ? muscleGroup : Exercise.MuscleGroup.OTHER)
                .secondaryMuscles(secondary.isEmpty() ? null : secondary)
                .equipment(equipmentType != null ? equipmentType : Exercise.EquipmentType.OTHER)
                .difficulty(difficulty != null ? difficulty : Exercise.Difficulty.INTERMEDIATE)
                .category(category)
                .mechanic(mechanic)
                .forceType(force)
                .instructions(instructionText)
                .imageUrl(imageUrl)
                .gifUrl(gifUrl)
                .licenseType("MIT")
                .attribution("yuhonas/free-exercise-db")
                .sourceProvider(getId())
                .externalId(id)
                .status(Exercise.ExerciseStatus.DRAFT)
                .custom(false)
                .active(true);
    }

    @Override
    public String extractExternalId(Map<String, Object> raw) {
        return (String) raw.get("id");
    }

    private Exercise.MuscleGroup mapMuscleGroup(List<String> muscles) {
        if (muscles == null || muscles.isEmpty()) return Exercise.MuscleGroup.OTHER;
        return mapSingleMuscle(muscles.get(0));
    }

    private Exercise.MuscleGroup mapSingleMuscle(String m) {
        if (m == null) return null;
        return switch (m.toLowerCase().trim()) {
            case "chest" -> Exercise.MuscleGroup.CHEST;
            case "back", "lats", "middle back", "lower back", "traps" -> Exercise.MuscleGroup.BACK;
            case "shoulders", "neck" -> Exercise.MuscleGroup.SHOULDERS;
            case "biceps" -> Exercise.MuscleGroup.BICEPS;
            case "triceps" -> Exercise.MuscleGroup.TRICEPS;
            case "forearms" -> Exercise.MuscleGroup.FOREARMS;
            case "abdominals", "abductors", "adductors" -> Exercise.MuscleGroup.CORE;
            case "glutes" -> Exercise.MuscleGroup.GLUTES;
            case "quadriceps" -> Exercise.MuscleGroup.QUADRICEPS;
            case "hamstrings" -> Exercise.MuscleGroup.HAMSTRINGS;
            case "calves" -> Exercise.MuscleGroup.CALVES;
            case "cardio" -> Exercise.MuscleGroup.CARDIO;
            default -> Exercise.MuscleGroup.OTHER;
        };
    }

    private Exercise.EquipmentType mapEquipment(String eq) {
        if (eq == null) return Exercise.EquipmentType.OTHER;
        return switch (eq.toLowerCase().trim()) {
            case "barbell" -> Exercise.EquipmentType.BARBELL;
            case "dumbbell" -> Exercise.EquipmentType.DUMBBELL;
            case "machine" -> Exercise.EquipmentType.MACHINE;
            case "cable" -> Exercise.EquipmentType.CABLE;
            case "body only", "none" -> Exercise.EquipmentType.BODYWEIGHT;
            case "kettlebells" -> Exercise.EquipmentType.KETTLEBELL;
            case "bands", "exercise ball" -> Exercise.EquipmentType.RESISTANCE_BAND;
            default -> Exercise.EquipmentType.OTHER;
        };
    }

    private Exercise.Difficulty mapDifficulty(String level) {
        if (level == null) return Exercise.Difficulty.INTERMEDIATE;
        return switch (level.toLowerCase().trim()) {
            case "beginner" -> Exercise.Difficulty.BEGINNER;
            case "expert" -> Exercise.Difficulty.ADVANCED;
            default -> Exercise.Difficulty.INTERMEDIATE;
        };
    }
}
