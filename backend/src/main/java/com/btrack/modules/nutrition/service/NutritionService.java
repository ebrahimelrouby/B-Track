package com.btrack.modules.nutrition.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.nutrition.dto.*;
import com.btrack.modules.nutrition.entity.FoodCategory;
import com.btrack.modules.nutrition.entity.FoodItem;
import com.btrack.modules.nutrition.entity.Meal;
import com.btrack.modules.nutrition.entity.MealItem;
import com.btrack.modules.nutrition.repository.FoodCategoryRepository;
import com.btrack.modules.nutrition.repository.FoodItemRepository;
import com.btrack.modules.nutrition.repository.MealItemRepository;
import com.btrack.modules.nutrition.repository.MealRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final FoodItemRepository foodItemRepository;
    private final FoodCategoryRepository foodCategoryRepository;
    private final MealRepository mealRepository;
    private final MealItemRepository mealItemRepository;
    private final UserRepository userRepository;

    public List<FoodItemResponse> searchFoods(String query) {
        List<FoodItem> items = foodItemRepository.searchByName(query.trim());
        Map<UUID, String> categoryNames = loadCategoryNames(items);
        return items.stream().map(f -> toFoodResponse(f, categoryNames)).toList();
    }

    public FoodItemResponse getFoodById(UUID id) {
        FoodItem item = foodItemRepository.findById(id)
                .orElseThrow(() -> BTrackException.notFound("Food not found", ErrorCode.RESOURCE_NOT_FOUND));
        return toFoodResponse(item, loadCategoryNames(List.of(item)));
    }

    public List<MealEntryResponse> getDiaryForDate(UUID userId, LocalDate date) {
        List<Meal> meals = mealRepository.findByUserIdAndLoggedDate(userId, date);
        Map<UUID, String> categoryNames = loadCategoryNames(
                meals.stream().flatMap(m -> m.getItems().stream()).map(MealItem::getFoodItem).toList());
        return meals.stream()
                .flatMap(meal -> meal.getItems().stream()
                        .map(item -> toEntryResponse(item, meal, categoryNames)))
                .toList();
    }

    @Transactional
    public MealEntryResponse logFood(UUID userId, AddMealItemRequest req) {
        FoodItem food = foodItemRepository.findById(req.foodId())
                .orElseThrow(() -> BTrackException.notFound("Food not found", ErrorCode.RESOURCE_NOT_FOUND));

        Meal.MealType mealType = parseMealType(req.meal());
        Meal meal = mealRepository
                .findByUserIdAndLoggedDateAndMealType(userId, req.date(), mealType)
                .orElseGet(() -> mealRepository.save(Meal.builder()
                        .user(userRepository.getReferenceById(userId))
                        .loggedDate(req.date())
                        .mealType(mealType)
                        .build()));

        BigDecimal ratio = BigDecimal.valueOf(req.servings());
        MealItem item = MealItem.builder()
                .meal(meal)
                .foodItem(food)
                .quantity(ratio)
                .servingSizeG(food.getServingSizeG().multiply(ratio))
                .calories(food.getCalories().multiply(ratio).setScale(1, RoundingMode.HALF_UP))
                .proteinG(food.getProteinG().multiply(ratio).setScale(2, RoundingMode.HALF_UP))
                .carbsG(food.getCarbsG().multiply(ratio).setScale(2, RoundingMode.HALF_UP))
                .fatsG(food.getFatsG().multiply(ratio).setScale(2, RoundingMode.HALF_UP))
                .build();

        mealItemRepository.save(item);
        return toEntryResponse(item, meal, loadCategoryNames(List.of(food)));
    }

    @Transactional
    public void removeEntry(UUID userId, LocalDate date, UUID entryId) {
        MealItem item = mealItemRepository.findById(entryId)
                .orElseThrow(() -> BTrackException.notFound("Entry not found", ErrorCode.RESOURCE_NOT_FOUND));
        if (!item.getMeal().getUser().getId().equals(userId)) {
            throw BTrackException.forbidden("Access denied");
        }
        mealItemRepository.delete(item);
    }

    public List<DailyCalorieResponse> getWeeklySummary(UUID userId) {
        LocalDate from = LocalDate.now().minusDays(6);
        List<Meal> meals = mealRepository.findByUserIdSince(userId, from);

        return Stream.iterate(from, d -> !d.isAfter(LocalDate.now()), d -> d.plusDays(1))
                .map(date -> {
                    List<MealItem> items = meals.stream()
                            .filter(m -> m.getLoggedDate().equals(date))
                            .flatMap(m -> m.getItems().stream())
                            .toList();
                    int cals = items.stream().mapToInt(i -> i.getCalories().intValue()).sum();
                    double prot = items.stream().mapToDouble(i -> i.getProteinG().doubleValue()).sum();
                    double carbs = items.stream().mapToDouble(i -> i.getCarbsG().doubleValue()).sum();
                    double fat  = items.stream().mapToDouble(i -> i.getFatsG().doubleValue()).sum();
                    return new DailyCalorieResponse(date, cals, prot, carbs, fat);
                }).toList();
    }

    // ── Mappers ────────────────────────────────────────────────────────────────

    // Batched (not per-item) category name lookup — callers pass every
    // FoodItem they're about to map in one go so this is a single query
    // regardless of list size, not an N+1.
    private Map<UUID, String> loadCategoryNames(List<FoodItem> items) {
        List<UUID> categoryIds = items.stream()
                .map(FoodItem::getCategoryId).filter(Objects::nonNull).distinct().toList();
        if (categoryIds.isEmpty()) return Map.of();
        return foodCategoryRepository.findAllById(categoryIds).stream()
                .collect(Collectors.toMap(FoodCategory::getId, FoodCategory::getName));
    }

    private FoodItemResponse toFoodResponse(FoodItem f, Map<UUID, String> categoryNames) {
        String label = f.getServingSizeG().intValue() + (f.getServingUnit() != null ? f.getServingUnit() : "g");
        String category = f.getCategoryId() != null ? categoryNames.get(f.getCategoryId()) : null;
        return new FoodItemResponse(
                f.getId(), f.getName(), f.getBrand(),
                f.getCalories(), f.getProteinG(), f.getCarbsG(), f.getFatsG(),
                f.getServingSizeG(), f.getServingUnit(), label, category
        );
    }

    private MealEntryResponse toEntryResponse(MealItem item, Meal meal, Map<UUID, String> categoryNames) {
        return new MealEntryResponse(
                item.getId(),
                item.getFoodItem().getId(),
                toFoodResponse(item.getFoodItem(), categoryNames),
                item.getQuantity().doubleValue(),
                meal.getMealType().name().toLowerCase(),
                meal.getLoggedDate()
        );
    }

    private Meal.MealType parseMealType(String meal) {
        try {
            return Meal.MealType.valueOf(meal.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Meal.MealType.SNACK;
        }
    }
}
