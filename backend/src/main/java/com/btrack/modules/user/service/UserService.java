package com.btrack.modules.user.service;

import com.btrack.common.exception.BTrackException;
import com.btrack.common.exception.ErrorCode;
import com.btrack.modules.user.dto.UpdateProfileRequest;
import com.btrack.modules.user.entity.User;
import com.btrack.modules.user.entity.UserProfile;
import com.btrack.modules.user.repository.UserProfileRepository;
import com.btrack.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    public User getUser(UUID userId) {
        return userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> BTrackException.notFound("User not found", ErrorCode.USER_NOT_FOUND));
    }

    @Transactional
    public User updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findByIdWithProfile(userId)
                .orElseThrow(() -> BTrackException.notFound("User not found", ErrorCode.USER_NOT_FOUND));

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = UserProfile.builder().user(user).build();
        }

        if (request.gender() != null) {
            profile.setGender(UserProfile.GenderType.valueOf(request.gender().toUpperCase()));
        }
        if (request.dateOfBirth() != null) profile.setDateOfBirth(request.dateOfBirth());
        if (request.heightCm() != null) profile.setHeightCm(request.heightCm());
        if (request.weightKg() != null) profile.setWeightKg(request.weightKg());
        if (request.targetWeightKg() != null) profile.setTargetWeightKg(request.targetWeightKg());
        if (request.fitnessGoal() != null) {
            profile.setFitnessGoal(UserProfile.FitnessGoal.valueOf(request.fitnessGoal().toUpperCase()));
        }
        if (request.activityLevel() != null) {
            profile.setActivityLevel(UserProfile.ActivityLevel.valueOf(request.activityLevel().toUpperCase()));
        }
        if (request.trainingExperience() != null) {
            profile.setTrainingExperience(UserProfile.TrainingExperience.valueOf(request.trainingExperience().toUpperCase()));
        }
        if (request.dietaryPreference() != null) {
            profile.setDietaryPreference(UserProfile.DietaryPreference.valueOf(request.dietaryPreference().toUpperCase()));
        }
        if (request.targetWaterMl() != null) profile.setTargetWaterMl(request.targetWaterMl());
        if (request.targetSteps() != null) profile.setTargetSteps(request.targetSteps());
        if (request.targetSleepHours() != null) profile.setTargetSleepHours(request.targetSleepHours());

        // Auto-calculate macros
        if (profile.getWeightKg() != null && profile.getHeightCm() != null
                && profile.getDateOfBirth() != null && profile.getGender() != null) {
            calculateAndSetMacros(profile);
        }

        profileRepository.save(profile);

        // Mark onboarding complete if key fields are set
        if (!user.isOnboardingComplete() && isOnboardingComplete(profile)) {
            user.setOnboardingComplete(true);
        }

        return userRepository.save(user);
    }

    private void calculateAndSetMacros(UserProfile profile) {
        int age = java.time.Period.between(profile.getDateOfBirth(), java.time.LocalDate.now()).getYears();
        double weight = profile.getWeightKg();
        double height = profile.getHeightCm();

        // Mifflin-St Jeor BMR
        double bmr;
        if (profile.getGender() == UserProfile.GenderType.MALE) {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }

        double activityMultiplier = switch (profile.getActivityLevel()) {
            case SEDENTARY -> 1.2;
            case LIGHTLY_ACTIVE -> 1.375;
            case MODERATELY_ACTIVE -> 1.55;
            case VERY_ACTIVE -> 1.725;
            case EXTRA_ACTIVE -> 1.9;
        };

        int tdee = (int) Math.round(bmr * activityMultiplier);

        int targetCalories = switch (profile.getFitnessGoal()) {
            case LOSE_FAT -> (int) (tdee * 0.80);    // 20% deficit
            case MAINTAIN -> tdee;
            case GAIN_MUSCLE -> (int) (tdee * 1.10); // 10% surplus
        };

        profile.setTargetCalories(targetCalories);
        // Protein: 2.0g per kg for muscle gain, 1.8g maintain, 2.2g cut
        double proteinMultiplier = switch (profile.getFitnessGoal()) {
            case LOSE_FAT -> 2.2;
            case MAINTAIN -> 1.8;
            case GAIN_MUSCLE -> 2.0;
        };
        int protein = (int) Math.round(weight * proteinMultiplier);
        int fats = (int) Math.round(targetCalories * 0.25 / 9);
        int carbs = (int) Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4.0);

        profile.setTargetProteinG(protein);
        profile.setTargetFatsG(Math.max(fats, 40));
        profile.setTargetCarbsG(Math.max(carbs, 0));
    }

    private boolean isOnboardingComplete(UserProfile profile) {
        return profile.getGender() != null
                && profile.getDateOfBirth() != null
                && profile.getWeightKg() != null
                && profile.getHeightCm() != null
                && profile.getFitnessGoal() != null
                && profile.getActivityLevel() != null;
    }
}
