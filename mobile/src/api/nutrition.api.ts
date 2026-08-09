import { USE_MOCK_API } from '@/constants/config';
import { nutritionMock, Food, MealEntry } from './mock/nutrition.mock';

export const nutritionApi = {
  searchFoods: (query: string): Promise<Food[]> =>
    USE_MOCK_API ? nutritionMock.searchFoods(query) : Promise.resolve([]),

  getFoodById: (id: string): Promise<Food | null> =>
    USE_MOCK_API ? nutritionMock.getFoodById(id) : Promise.resolve(null),

  getDiaryForDate: (date: string): Promise<MealEntry[]> =>
    USE_MOCK_API ? nutritionMock.getDiaryForDate(date) : Promise.resolve([]),

  logFood: (params: { foodId: string; servings: number; meal: MealEntry['meal']; date: string }): Promise<MealEntry> =>
    USE_MOCK_API ? nutritionMock.logFood(params) : Promise.reject(new Error('Not connected')),

  removeEntry: (date: string, entryId: string): Promise<void> =>
    USE_MOCK_API ? nutritionMock.removeEntry(date, entryId) : Promise.resolve(),

  getWater: (date: string): Promise<number> =>
    USE_MOCK_API ? nutritionMock.getWater(date) : Promise.resolve(0),

  logWater: (date: string, ml: number): Promise<void> =>
    USE_MOCK_API ? nutritionMock.logWater(date, ml) : Promise.resolve(),
};

export type { Food, MealEntry };
