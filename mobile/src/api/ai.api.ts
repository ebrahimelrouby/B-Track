import { USE_MOCK_API } from '@/constants/config';
import {
  AiNutritionEstimate, AiNutritionSaveRequest,
  AiBodyFatEstimate, AiBodyFatMetadata,
  ApiResponse, PagedResponse,
} from '@/types';
import { aiMock } from './mock/ai.mock';
import apiClient from './client';

export const aiApi = {
  // ── Nutrition: Text ──────────────────────────────────────────────────────────
  estimateNutritionFromText: (description: string): Promise<AiNutritionEstimate> =>
    USE_MOCK_API
      ? aiMock.estimateFromText(description)
      : apiClient
          .post<ApiResponse<AiNutritionEstimate>>('/ai/nutrition/text', { description })
          .then(r => r.data.data!),

  // ── Nutrition: Photo ─────────────────────────────────────────────────────────
  estimateNutritionFromPhoto: (photoUri: string, mimeType: string): Promise<AiNutritionEstimate> => {
    if (USE_MOCK_API) return aiMock.estimateFromPhoto(photoUri);
    const formData = new FormData();
    formData.append('photo', { uri: photoUri, type: mimeType, name: 'food.jpg' } as unknown as Blob);
    return apiClient
      .post<ApiResponse<AiNutritionEstimate>>('/ai/nutrition/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data.data!);
  },

  // ── Nutrition: Save ──────────────────────────────────────────────────────────
  saveNutritionEstimate: (estimateId: string, data: AiNutritionSaveRequest): Promise<AiNutritionEstimate> =>
    USE_MOCK_API
      ? aiMock.saveNutritionEstimate(estimateId, data as Partial<AiNutritionEstimate>)
      : apiClient
          .put<ApiResponse<AiNutritionEstimate>>(`/ai/nutrition/${estimateId}/save`, data)
          .then(r => r.data.data!),

  // ── Nutrition: History ───────────────────────────────────────────────────────
  getNutritionHistory: (page = 0, size = 20): Promise<PagedResponse<AiNutritionEstimate>> =>
    USE_MOCK_API
      ? aiMock.getNutritionHistory().then(content => ({
          content, page, size, totalElements: content.length,
          totalPages: 1, last: true, first: true,
        }))
      : apiClient
          .get<ApiResponse<PagedResponse<AiNutritionEstimate>>>('/ai/nutrition/history', { params: { page, size } })
          .then(r => r.data.data!),

  // ── Nutrition: Delete ────────────────────────────────────────────────────────
  deleteNutritionEstimate: (estimateId: string): Promise<void> =>
    USE_MOCK_API
      ? aiMock.deleteNutritionEstimate(estimateId)
      : apiClient.delete(`/ai/nutrition/${estimateId}`).then(() => {}),

  // ── Body Fat: Analyze ────────────────────────────────────────────────────────
  analyzeBodyFat: (
    photoUris: string[],
    metadata: AiBodyFatMetadata,
  ): Promise<AiBodyFatEstimate> => {
    if (USE_MOCK_API) return aiMock.analyzeBodyFat(photoUris, metadata);
    const formData = new FormData();
    photoUris.forEach(uri => {
      formData.append('photos', { uri, type: 'image/jpeg', name: 'body.jpg' } as unknown as Blob);
    });
    formData.append('metadata', JSON.stringify(metadata));
    return apiClient
      .post<ApiResponse<AiBodyFatEstimate>>('/ai/body-fat/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data.data!);
  },

  // ── Body Fat: Save ───────────────────────────────────────────────────────────
  saveBodyFatEstimate: (estimateId: string): Promise<AiBodyFatEstimate> =>
    USE_MOCK_API
      ? aiMock.saveBodyFatEstimate(estimateId)
      : apiClient
          .put<ApiResponse<AiBodyFatEstimate>>(`/ai/body-fat/${estimateId}/save`)
          .then(r => r.data.data!),

  // ── Body Fat: History ────────────────────────────────────────────────────────
  getBodyFatHistory: (page = 0, size = 20): Promise<PagedResponse<AiBodyFatEstimate>> =>
    USE_MOCK_API
      ? aiMock.getBodyFatHistory().then(content => ({
          content, page, size, totalElements: content.length,
          totalPages: 1, last: true, first: true,
        }))
      : apiClient
          .get<ApiResponse<PagedResponse<AiBodyFatEstimate>>>('/ai/body-fat/history', { params: { page, size } })
          .then(r => r.data.data!),

  // ── Body Fat: Delete ─────────────────────────────────────────────────────────
  deleteBodyFatEstimate: (estimateId: string): Promise<void> =>
    USE_MOCK_API
      ? aiMock.deleteBodyFatEstimate(estimateId)
      : apiClient.delete(`/ai/body-fat/${estimateId}`).then(() => {}),
};
