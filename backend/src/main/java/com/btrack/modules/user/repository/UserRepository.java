package com.btrack.modules.user.repository;

import com.btrack.modules.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.profile WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findByIdWithProfile(UUID id);

    @Modifying
    @Query("UPDATE User u SET u.lastActiveAt = :ts WHERE u.id = :id")
    void touchLastActiveAt(@Param("id") UUID id, @Param("ts") Instant ts);

    @Query("""
            SELECT u FROM User u WHERE u.deletedAt IS NULL
            AND (:search IS NULL OR :search = ''
                 OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                 OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<User> search(@Param("search") String search, Pageable pageable);

    long countByDeletedAtIsNull();

    long countByLastActiveAtAfterAndDeletedAtIsNull(Instant threshold);

    long countByCreatedAtAfterAndDeletedAtIsNull(Instant threshold);
}
