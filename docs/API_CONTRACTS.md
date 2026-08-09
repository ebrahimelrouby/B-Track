# B-Track API Contracts

Base URL: `https://api.btrack.app/api/v1` (production)
Dev URL: `http://localhost:8080/api/v1`

All responses wrap data in: `{ "success": bool, "data": T, "message": string?, "errorCode": string? }`

---

## Authentication

### POST /auth/register
```json
Request:  { "firstName": "John", "lastName": "Doe", "email": "john@example.com", "password": "Secret123" }
Response: AuthResponse (tokens + user info)
```

### POST /auth/login
```json
Request:  { "email": "john@example.com", "password": "Secret123" }
Response: AuthResponse
```

### POST /auth/refresh
```json
Request:  { "refreshToken": "..." }
Response: AuthResponse (new access + refresh tokens)
```

### POST /auth/logout
```
Headers: Authorization: Bearer <accessToken>
Response: { "success": true, "message": "Logged out" }
```

---

## User

### GET /users/me → UserWithProfile
### PATCH /users/me → update profile (partial)

---

## Subscriptions

### GET /subscriptions/entitlements → EntitlementResponse
```json
{
  "plan": "FREE",
  "status": "ACTIVE",
  "isPremium": false,
  "features": [],
  "maxWorkoutPlans": 3,
  "maxCustomExercises": 10,
  "maxProgressPhotos": 5,
  "workoutHistoryDays": 30
}
```

### POST /subscriptions/verify → activate IAP
```json
Request: {
  "platform": "ios",
  "plan": "annual",
  "transactionId": "...",
  "receiptData": "...",
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

---

## Exercises

### GET /exercises?search=bench&muscleGroup=CHEST&page=0&size=30
### POST /exercises (create custom, requires auth)

---

## Workout Plans

### GET /workout-plans → List<WorkoutPlan>
### POST /workout-plans → WorkoutPlan
### GET /workout-plans/{id} → WorkoutPlan (with days + exercises)
### DELETE /workout-plans/{id}
### POST /workout-plans/{planId}/days → WorkoutDay
### POST /workout-plans/days/{dayId}/exercises → WorkoutDayExercise

---

## Workout Sessions

### POST /sessions/start
```json
Request: { "planId": "uuid?", "dayId": "uuid?", "name": "Push Day", "localSessionId": "local-uuid" }
```

### POST /sessions/{sessionId}/finish
```json
Request: { "notes": "Great session!" }
```

### POST /sessions/sync (offline sync — idempotent by localSessionId)
```json
Request: {
  "localSessionId": "...",
  "planId": "uuid?",
  "startedAt": "2024-01-01T10:00:00Z",
  "completedAt": "2024-01-01T11:00:00Z",
  "durationSeconds": 3600,
  "exercises": [
    {
      "exerciseId": "uuid",
      "sortOrder": 0,
      "sets": [
        { "setNumber": 1, "setType": "NORMAL", "weightKg": 80, "reps": 8, "rpe": 7, "completed": true }
      ]
    }
  ]
}
```

### GET /sessions/history?page=0&size=20 → PagedResponse<WorkoutSession>
### GET /sessions/{id} → WorkoutSession

---

## Nutrition (Phase 2)

### GET /nutrition/daily?date=2024-01-01 → DailyNutritionSummary
### POST /nutrition/meals → Meal
### POST /nutrition/meals/{mealId}/items → MealItem
### GET /food-items?search=chicken&page=0
### POST /food-items (custom food)

---

## Water (Phase 2)

### POST /water/logs → WaterLog
### GET /water/daily?date=2024-01-01 → DailyWaterSummary
### DELETE /water/logs/{id}

---

## Error Codes

| Code | Meaning |
|---|---|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Token invalid |
| AUTH_004 | Email already exists |
| AUTH_005 | Refresh token invalid |
| SUB_001 | Feature requires premium |
| SUB_002 | Free plan limit reached |
| WRK_001 | Workout plan not found |
| WRK_003 | Session not found |
| GEN_001 | Validation error |
| GEN_005 | Rate limit exceeded |
