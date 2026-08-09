package com.btrack.modules.nutrition.repository;

import com.btrack.modules.nutrition.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, UUID> {

    @Query("SELECT f FROM FoodItem f WHERE f.active = true AND LOWER(f.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY f.name")
    List<FoodItem> searchByName(@Param("q") String query);
}
