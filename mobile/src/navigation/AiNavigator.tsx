import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AiStackParamList } from './types';

import AiFoodEntryScreen from '@/screens/ai/AiFoodEntryScreen';
import AiEstimateReviewScreen from '@/screens/ai/AiEstimateReviewScreen';
import AiNutritionHistoryScreen from '@/screens/ai/AiNutritionHistoryScreen';
import AiBodyFatConsentScreen from '@/screens/ai/AiBodyFatConsentScreen';
import AiBodyFatPhotoScreen from '@/screens/ai/AiBodyFatPhotoScreen';
import AiBodyFatResultScreen from '@/screens/ai/AiBodyFatResultScreen';
import AiBodyFatHistoryScreen from '@/screens/ai/AiBodyFatHistoryScreen';
import BodyScanVisualizationScreen from '@/screens/ai/BodyScanVisualizationScreen';

const Stack = createNativeStackNavigator<AiStackParamList>();

export default function AiNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AiFoodEntry"             component={AiFoodEntryScreen} />
      <Stack.Screen name="AiEstimateReview"        component={AiEstimateReviewScreen} />
      <Stack.Screen name="AiNutritionHistory"      component={AiNutritionHistoryScreen} />
      <Stack.Screen name="AiBodyFatConsent"        component={AiBodyFatConsentScreen} />
      <Stack.Screen name="AiBodyFatPhoto"          component={AiBodyFatPhotoScreen} />
      <Stack.Screen name="AiBodyFatResult"         component={AiBodyFatResultScreen} />
      <Stack.Screen name="AiBodyFatHistory"        component={AiBodyFatHistoryScreen} />
      <Stack.Screen name="BodyScanVisualization"   component={BodyScanVisualizationScreen} />
    </Stack.Navigator>
  );
}
