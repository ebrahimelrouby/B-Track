package com.btrack.modules.nutrition.repository;

import com.btrack.modules.nutrition.entity.FoodTranslation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FoodTranslationRepository extends JpaRepository<FoodTranslation, UUID> {

    List<FoodTranslation> findByFoodItemId(UUID foodItemId);
}
