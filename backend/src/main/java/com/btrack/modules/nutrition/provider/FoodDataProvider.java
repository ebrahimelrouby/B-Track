package com.btrack.modules.nutrition.provider;

import com.btrack.modules.nutrition.entity.FoodItem;

import java.util.List;
import java.util.Map;

// Common interface for external food data sources (USDA FoodData Central,
// Open Food Facts, future providers). Mirrors the existing
// ExerciseImportProvider pattern (modules/exercise/importer/) — a later
// FoodImportService will autowire List<FoodDataProvider> and dispatch by
// getId(), same as ExerciseImportService does today.
//
// No implementation yet — USDA/Open Food Facts providers are a later phase.
// Raw records are passed as Map<String, Object> rather than a shared DTO
// since different providers expose very different field shapes; each
// provider is responsible for its own normalization in normalizeFood().
public interface FoodDataProvider {

    String getId();          // e.g. "USDA", "OPEN_FOOD_FACTS"
    String getDisplayName(); // e.g. "USDA FoodData Central"

    /** Live search against the provider's API (not the local catalog). */
    List<Map<String, Object>> searchFoods(String query, Map<String, Object> options) throws Exception;

    /** Full detail for a single food by the provider's own external id. */
    Map<String, Object> getFoodDetails(String externalId) throws Exception;

    /** Barcode lookup, where the provider supports it. */
    Map<String, Object> searchByBarcode(String barcode) throws Exception;

    /** Map a raw provider record to a FoodItem builder (without saving). */
    FoodItem.FoodItemBuilder normalizeFood(Map<String, Object> rawRecord);

    /** Reject records with missing/implausible required fields before they're saved. */
    boolean validateFood(FoodItem.FoodItemBuilder candidate);
}
