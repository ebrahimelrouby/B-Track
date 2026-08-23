import { AiNutritionEstimate, AiBodyFatEstimate } from '@/types';

const delay = (ms: number) => new Promise<void>(res => setTimeout(() => res(), ms));

const mockNutritionEstimate = (description: string): AiNutritionEstimate => ({
  id: `mock-${Date.now()}`,
  inputType: 'TEXT',
  inputText: description,
  foodName: description.split(' ').slice(0, 3).join(' '),
  estimatedCalories: 420,
  estimatedProteinG: 32,
  estimatedCarbsG: 38,
  estimatedFatG: 14,
  estimatedFiberG: 4,
  estimatedSugarG: 6,
  estimatedSodiumMg: 680,
  estimatedServingG: 250,
  confidenceScore: 0.82,
  assumptions: [
    'Standard serving size assumed (250g)',
    'Grilled, not fried preparation assumed',
    'No added sauces accounted for',
  ],
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
});

const mockPhotoNutritionEstimate = (): AiNutritionEstimate => ({
  id: `mock-photo-${Date.now()}`,
  inputType: 'PHOTO',
  foodName: 'Mixed meal from photo',
  estimatedCalories: 580,
  estimatedProteinG: 28,
  estimatedCarbsG: 65,
  estimatedFatG: 18,
  estimatedFiberG: 6,
  estimatedSugarG: 12,
  estimatedSodiumMg: 920,
  estimatedServingG: 350,
  confidenceScore: 0.71,
  assumptions: [
    'Photo quality was sufficient for analysis',
    'Portion size estimated visually — may vary ±20%',
    'Ingredients estimated from appearance',
  ],
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
});

const mockBodyFatEstimate = (): AiBodyFatEstimate => ({
  id: `mock-bf-${Date.now()}`,
  minBodyFatPct: 16.5,
  maxBodyFatPct: 19.5,
  confidenceScore: 0.74,
  visualObservations: [
    'Visible muscle definition in arms and shoulders',
    'Moderate abdominal definition — some fat covering lower abs',
    'Waist-to-hip ratio suggests healthy fat distribution',
    'This is an AI estimate — accuracy depends on photo quality and lighting',
  ],
  recommendations: [
    'Continue current training program — good muscle tone visible',
    'A 200–300 calorie deficit may help reveal more definition',
    'Focus on compound lifts to preserve muscle during any cut',
    'Consult a certified fitness professional for precise measurements',
  ],
  status: 'DRAFT',
  createdAt: new Date().toISOString(),
});

export const aiMock = {
  async estimateFromText(description: string): Promise<AiNutritionEstimate> {
    await delay(2200);
    return mockNutritionEstimate(description);
  },

  async estimateFromPhoto(_photoUri: string): Promise<AiNutritionEstimate> {
    await delay(3500);
    return mockPhotoNutritionEstimate();
  },

  async saveNutritionEstimate(
    estimateId: string,
    data: Partial<AiNutritionEstimate>,
  ): Promise<AiNutritionEstimate> {
    await delay(400);
    return { ...mockNutritionEstimate(''), ...data, id: estimateId, status: 'SAVED' };
  },

  async getNutritionHistory(): Promise<AiNutritionEstimate[]> {
    await delay(500);
    return [];
  },

  async deleteNutritionEstimate(_id: string): Promise<void> {
    await delay(300);
  },

  async analyzeBodyFat(_photos: string[], _metadata: object): Promise<AiBodyFatEstimate> {
    await delay(4500);
    return mockBodyFatEstimate();
  },

  async saveBodyFatEstimate(estimateId: string): Promise<AiBodyFatEstimate> {
    await delay(400);
    return { ...mockBodyFatEstimate(), id: estimateId, status: 'SAVED' };
  },

  async getBodyFatHistory(): Promise<AiBodyFatEstimate[]> {
    await delay(500);
    return [];
  },

  async deleteBodyFatEstimate(_id: string): Promise<void> {
    await delay(300);
  },
};
