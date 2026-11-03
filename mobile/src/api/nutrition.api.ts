import { USE_MOCK_API } from '@/constants/config';
import { ApiResponse } from '@/types';
import { nutritionMock, Food, MealEntry } from './mock/nutrition.mock';
import apiClient from './client';

export const nutritionApi = {
  searchFoods: (query: string): Promise<Food[]> =>
    USE_MOCK_API
      ? nutritionMock.searchFoods(query)
      : apiClient
          .get<ApiResponse<Food[]>>('/nutrition/foods/search', { params: { q: query } })
          .then(r => r.data.data!),

  getFoodById: (id: string): Promise<Food | null> =>
    USE_MOCK_API
      ? nutritionMock.getFoodById(id)
      : apiClient
          .get<ApiResponse<Food>>(`/nutrition/foods/${id}`)
          .then(r => r.data.data ?? null),

  getDiaryForDate: (date: string): Promise<MealEntry[]> =>
    USE_MOCK_API
      ? nutritionMock.getDiaryForDate(date)
      : apiClient
          .get<ApiResponse<MealEntry[]>>(`/nutrition/diary/${date}`)
          .then(r => r.data.data!),

  logFood: (params: { foodId: string; servings: number; meal: MealEntry['meal']; date: string }): Promise<MealEntry> =>
    USE_MOCK_API
      ? nutritionMock.logFood(params)
      : apiClient
          .post<ApiResponse<MealEntry>>('/nutrition/diary', params)
          .then(r => r.data.data!),

  removeEntry: (date: string, entryId: string): Promise<void> =>
    USE_MOCK_API
      ? nutritionMock.removeEntry(date, entryId)
      : apiClient.delete(`/nutrition/diary/${date}/${entryId}`).then(() => {}),

  getWater: (date: string): Promise<number> =>
    USE_MOCK_API
      ? nutritionMock.getWater(date)
      : apiClient.get<ApiResponse<number>>(`/water/${date}`).then(r => r.data.data ?? 0),

  logWater: (date: string, ml: number): Promise<void> =>
    USE_MOCK_API
      ? nutritionMock.logWater(date, ml)
      : apiClient.post(`/water/${date}`, { ml }).then(() => {}),
};

export type { Food, MealEntry };
