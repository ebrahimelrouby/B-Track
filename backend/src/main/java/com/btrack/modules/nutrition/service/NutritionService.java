package com.btrack.modules.nutrition.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.nutrition.dto.*;
import com.btrack.modules.nutrition.entity.FoodItem;
import com.btrack.modules.nutrition.entity.Meal;
import com.btrack.modules.nutrition.entity.MealItem;
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
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class NutritionService {

    private final FoodItemRepository foodItemRepository;
    private final MealRepository mealRepository;
    private final MealItemRepository mealItemRepository;
    private final UserRepository userRepository;

    public List<FoodItemResponse> searchFoods(String query) {
        return foodItemRepository.searchByName(query.trim())
                .stream().map(this::toFoodResponse).toList();
    }

    public FoodItemResponse getFoodById(UUID id) {
        FoodItem item = foodItemRepository.findById(id)
                .orElseThrow(() -> BTrackException.notFound("Food not found", ErrorCode.RESOURCE_NOT_FOUND));
        return toFoodResponse(item);
    }

    public List<MealEntryResponse> getDiaryForDate(UUID userId, LocalDate date) {
        return mealRepository.findByUserIdAndLoggedDate(userId, date)
                .stream()
                .flatMap(meal -> meal.getItems().stream()
                        .map(item -> toEntryResponse(item, meal)))
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
        return toEntryResponse(item, meal);
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

    private FoodItemResponse toFoodResponse(FoodItem f) {
        String label = f.getServingSizeG().intValue() + (f.getServingUnit() != null ? f.getServingUnit() : "g");
        return new FoodItemResponse(
                f.getId(), f.getName(), f.getBrand(),
                f.getCalories(), f.getProteinG(), f.getCarbsG(), f.getFatsG(),
                f.getServingSizeG(), f.getServingUnit(), label, null
        );
    }

    private MealEntryResponse toEntryResponse(MealItem item, Meal meal) {
        return new MealEntryResponse(
                item.getId(),
                item.getFoodItem().getId(),
                toFoodResponse(item.getFoodItem()),
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
