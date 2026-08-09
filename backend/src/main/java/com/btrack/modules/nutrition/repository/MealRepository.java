package com.btrack.modules.nutrition.repository;

import com.btrack.modules.nutrition.entity.Meal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealRepository extends JpaRepository<Meal, UUID> {

    List<Meal> findByUserIdAndLoggedDate(UUID userId, LocalDate date);

    Optional<Meal> findByUserIdAndLoggedDateAndMealType(UUID userId, LocalDate date, Meal.MealType mealType);

    @Query("SELECT m FROM Meal m JOIN FETCH m.items i JOIN FETCH i.foodItem WHERE m.user.id = :userId AND m.loggedDate >= :from ORDER BY m.loggedDate DESC")
    List<Meal> findByUserIdSince(@Param("userId") UUID userId, @Param("from") LocalDate from);
}
