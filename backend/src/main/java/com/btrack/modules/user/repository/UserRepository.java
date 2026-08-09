package com.btrack.modules.user.repository;

import com.btrack.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findByIdWithProfile(UUID id);
}
