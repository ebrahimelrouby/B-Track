import { USE_MOCK_API } from '@/constants/config';
import { RecoveryScore, RecoveryCheckIn, RecoveryCheckInRequest } from '@/types';
import { recoveryMock } from './mock/recovery.mock';
import apiClient from './client';

export const recoveryApi = {
  getToday: (): Promise<RecoveryScore> =>
    USE_MOCK_API
      ? recoveryMock.getToday()
      : apiClient.get('/recovery/today').then(r => r.data.data),

  getByDate: (date: string): Promise<RecoveryScore> =>
    USE_MOCK_API
      ? recoveryMock.getByDate(date)
      : apiClient.get(`/recovery/${date}`).then(r => r.data.data),

  getHistory: (page = 0, size = 30): Promise<RecoveryScore[]> =>
    USE_MOCK_API
      ? recoveryMock.getHistory()
      : apiClient.get('/recovery/history', { params: { page, size } }).then(r => r.data.data.content),

  recalculate: (): Promise<RecoveryScore> =>
    USE_MOCK_API
      ? recoveryMock.recalculate()
      : apiClient.post('/recovery/recalculate').then(r => r.data.data),

  getTodayCheckIn: (): Promise<RecoveryCheckIn | null> =>
    USE_MOCK_API
      ? recoveryMock.getTodayCheckIn()
      : apiClient.get('/recovery/check-in/today').then(r => r.data.data),

  createCheckIn: (req: RecoveryCheckInRequest): Promise<RecoveryCheckIn> =>
    USE_MOCK_API
      ? recoveryMock.createCheckIn(req)
      : apiClient.post('/recovery/check-in', req).then(r => r.data.data),

  updateCheckIn: (id: string, req: RecoveryCheckInRequest): Promise<RecoveryCheckIn> =>
    USE_MOCK_API
      ? recoveryMock.updateCheckIn(id, req)
      : apiClient.put(`/recovery/check-in/${id}`, req).then(r => r.data.data),
};
