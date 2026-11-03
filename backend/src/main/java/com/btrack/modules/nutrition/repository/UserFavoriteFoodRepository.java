package com.btrack.modules.nutrition.repository;

import com.btrack.modules.nutrition.entity.UserFavoriteFood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserFavoriteFoodRepository extends JpaRepository<UserFavoriteFood, UUID> {

    List<UserFavoriteFood> findByUserId(UUID userId);

    boolean existsByUserIdAndFoodItemId(UUID userId, UUID foodItemId);

    void deleteByUserIdAndFoodItemId(UUID userId, UUID foodItemId);
}
