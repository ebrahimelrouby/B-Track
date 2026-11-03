package com.btrack.modules.nutrition.repository;

import com.btrack.modules.nutrition.entity.FoodBrand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FoodBrandRepository extends JpaRepository<FoodBrand, UUID> {
}
