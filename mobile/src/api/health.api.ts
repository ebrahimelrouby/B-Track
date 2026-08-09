import { USE_MOCK_API } from '@/constants/config';
import { DailySleep, DailySteps, SleepLog, SleepLogRequest, StepsLogRequest } from '@/types';
import { healthMock } from './mock/health.mock';
import apiClient from './client';

export const healthApi = {
  // Sleep
  getSleepToday: (): Promise<DailySleep> =>
    USE_MOCK_API
      ? healthMock.getSleepToday()
      : apiClient.get('/health/sleep/today').then(r => r.data.data),

  getSleepHistory: (days = 14): Promise<DailySleep[]> =>
    USE_MOCK_API
      ? healthMock.getSleepHistory(days)
      : apiClient.get('/health/sleep/history', { params: { days } }).then(r => r.data.data),

  logSleep: (req: SleepLogRequest): Promise<SleepLog> =>
    USE_MOCK_API
      ? healthMock.logSleep(req)
      : apiClient.post('/health/sleep', req).then(r => r.data.data),

  deleteSleepLog: (id: string): Promise<void> =>
    USE_MOCK_API
      ? healthMock.deleteSleepLog(id)
      : apiClient.delete(`/health/sleep/${id}`).then(() => undefined),

  // Steps
  getStepsToday: (): Promise<DailySteps> =>
    USE_MOCK_API
      ? healthMock.getStepsToday()
      : apiClient.get('/health/steps/today').then(r => r.data.data),

  getStepsHistory: (days = 14): Promise<DailySteps[]> =>
    USE_MOCK_API
      ? healthMock.getStepsHistory(days)
      : apiClient.get('/health/steps/history', { params: { days } }).then(r => r.data.data),

  logSteps: (req: StepsLogRequest): Promise<DailySteps> =>
    USE_MOCK_API
      ? healthMock.logSteps(req)
      : apiClient.post('/health/steps', req).then(r => r.data.data),
};
