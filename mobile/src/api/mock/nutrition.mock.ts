import { localDb } from './localDb';

export interface Food {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSizeG: number;
  servingLabel: string;
  category: string;
}

export interface MealEntry {
  id: string;
  foodId: string;
  food: Food;
  servings: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
}

export interface WaterEntry { id: string; date: string; ml: number }

const FOODS: Food[] = [
  { id: 'f1', name: 'Chicken Breast', calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f2', name: 'Brown Rice', calories: 216, proteinG: 5, carbsG: 45, fatG: 1.8, servingSizeG: 185, servingLabel: '1 cup cooked', category: 'Carbs' },
  { id: 'f3', name: 'Whole Eggs', calories: 78, proteinG: 6, carbsG: 0.6, fatG: 5, servingSizeG: 50, servingLabel: '1 large egg', category: 'Protein' },
  { id: 'f4', name: 'Greek Yogurt', calories: 100, proteinG: 17, carbsG: 6, fatG: 0.7, servingSizeG: 170, servingLabel: '6oz', category: 'Dairy' },
  { id: 'f5', name: 'Oats', calories: 150, proteinG: 5, carbsG: 27, fatG: 3, servingSizeG: 40, servingLabel: '½ cup dry', category: 'Carbs' },
  { id: 'f6', name: 'Salmon', calories: 208, proteinG: 20, carbsG: 0, fatG: 13, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f7', name: 'Broccoli', calories: 55, proteinG: 3.7, carbsG: 11, fatG: 0.6, servingSizeG: 148, servingLabel: '1 cup', category: 'Vegetables' },
  { id: 'f8', name: 'Banana', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, servingSizeG: 118, servingLabel: '1 medium', category: 'Fruits' },
  { id: 'f9', name: 'Peanut Butter', calories: 188, proteinG: 8, carbsG: 6, fatG: 16, servingSizeG: 32, servingLabel: '2 tbsp', category: 'Fats' },
  { id: 'f10', name: 'Whey Protein', calories: 120, proteinG: 25, carbsG: 3, fatG: 1.5, servingSizeG: 30, servingLabel: '1 scoop', category: 'Supplements' },
  { id: 'f11', name: 'Sweet Potato', calories: 103, proteinG: 2.3, carbsG: 24, fatG: 0.1, servingSizeG: 130, servingLabel: '1 medium', category: 'Carbs' },
  { id: 'f12', name: 'Almonds', calories: 164, proteinG: 6, carbsG: 6, fatG: 14, servingSizeG: 28, servingLabel: '1oz', category: 'Fats' },
  { id: 'f13', name: 'Cottage Cheese', calories: 206, proteinG: 28, carbsG: 8, fatG: 5, servingSizeG: 226, servingLabel: '1 cup', category: 'Dairy' },
  { id: 'f14', name: 'Turkey Breast', calories: 135, proteinG: 30, carbsG: 0, fatG: 1, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f15', name: 'Avocado', calories: 234, proteinG: 3, carbsG: 12, fatG: 21, servingSizeG: 150, servingLabel: '1 medium', category: 'Fats' },
  { id: 'f16', name: 'Spinach', calories: 7, proteinG: 0.9, carbsG: 1.1, fatG: 0.1, servingSizeG: 30, servingLabel: '1 cup', category: 'Vegetables' },
  { id: 'f17', name: 'Quinoa', calories: 222, proteinG: 8, carbsG: 39, fatG: 3.5, servingSizeG: 185, servingLabel: '1 cup cooked', category: 'Carbs' },
  { id: 'f18', name: 'Tuna (canned)', calories: 109, proteinG: 25, carbsG: 0, fatG: 0.8, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f19', name: 'Milk (2%)', calories: 122, proteinG: 8, carbsG: 12, fatG: 5, servingSizeG: 240, servingLabel: '1 cup', category: 'Dairy' },
  { id: 'f20', name: 'Blueberries', calories: 84, proteinG: 1.1, carbsG: 21, fatG: 0.5, servingSizeG: 148, servingLabel: '1 cup', category: 'Fruits' },
  { id: 'f21', name: 'Beef (lean)', calories: 215, proteinG: 26, carbsG: 0, fatG: 12, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f22', name: 'Pasta (whole grain)', calories: 174, proteinG: 7, carbsG: 37, fatG: 0.8, servingSizeG: 140, servingLabel: '1 cup cooked', category: 'Carbs' },
  { id: 'f23', name: 'Olive Oil', calories: 119, proteinG: 0, carbsG: 0, fatG: 13.5, servingSizeG: 13.5, servingLabel: '1 tbsp', category: 'Fats' },
  { id: 'f24', name: 'Apple', calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, servingSizeG: 182, servingLabel: '1 medium', category: 'Fruits' },
  { id: 'f25', name: 'Egg Whites', calories: 17, proteinG: 3.6, carbsG: 0.2, fatG: 0, servingSizeG: 46, servingLabel: '1 large', category: 'Protein' },
  { id: 'f26', name: 'Bread (whole wheat)', calories: 81, proteinG: 4, carbsG: 15, fatG: 1, servingSizeG: 30, servingLabel: '1 slice', category: 'Carbs' },
  { id: 'f27', name: 'Walnuts', calories: 185, proteinG: 4.3, carbsG: 3.9, fatG: 18.5, servingSizeG: 28, servingLabel: '1oz', category: 'Fats' },
  { id: 'f28', name: 'Orange', calories: 62, proteinG: 1.2, carbsG: 15, fatG: 0.2, servingSizeG: 131, servingLabel: '1 medium', category: 'Fruits' },
  { id: 'f29', name: 'Tofu (firm)', calories: 76, proteinG: 8, carbsG: 2, fatG: 4.3, servingSizeG: 100, servingLabel: '100g', category: 'Protein' },
  { id: 'f30', name: 'Black Beans', calories: 227, proteinG: 15, carbsG: 41, fatG: 0.9, servingSizeG: 172, servingLabel: '1 cup cooked', category: 'Protein' },
];

const MEAL_KEY = (date: string) => `nutrition:meals:${date}`;
const WATER_KEY = (date: string) => `nutrition:water:${date}`;

function uid() { return Math.random().toString(36).slice(2, 9); }

export const nutritionMock = {
  searchFoods: async (query: string): Promise<Food[]> => {
    if (!query.trim()) return FOODS.slice(0, 12);
    const q = query.toLowerCase();
    return FOODS.filter(f => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
  },

  getFoodById: async (id: string): Promise<Food | null> => {
    return FOODS.find(f => f.id === id) ?? null;
  },

  getDiaryForDate: async (date: string): Promise<MealEntry[]> => {
    return localDb.getList<MealEntry>(MEAL_KEY(date));
  },

  logFood: async (params: { foodId: string; servings: number; meal: MealEntry['meal']; date: string }): Promise<MealEntry> => {
    const food = FOODS.find(f => f.id === params.foodId)!;
    const entry: MealEntry = { id: uid(), ...params, food };
    localDb.append<MealEntry>(MEAL_KEY(params.date), entry);
    return entry;
  },

  removeEntry: async (date: string, entryId: string): Promise<void> => {
    localDb.remove<MealEntry>(MEAL_KEY(date), entryId);
  },

  getWater: async (date: string): Promise<number> => {
    const entries = localDb.getList<WaterEntry>(WATER_KEY(date));
    return entries.reduce((sum, e) => sum + e.ml, 0);
  },

  logWater: async (date: string, ml: number): Promise<void> => {
    const id = uid();
    localDb.append<WaterEntry & { id: string }>(WATER_KEY(date), { id, date, ml });
  },
};
