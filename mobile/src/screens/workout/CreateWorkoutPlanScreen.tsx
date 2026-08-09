import React from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Spacing } from '@/theme';
import Screen from '@/components/common/Screen';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { workoutApi } from '@/api/workout.api';
import { WorkoutNavigationProp } from '@/navigation/types';

type FormData = { name: string; description?: string };

export default function CreateWorkoutPlanScreen() {
  const navigation = useNavigation<WorkoutNavigationProp>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const schema = z.object({
    name: z.string().min(1, t('createWorkoutPlan.nameRequired')).max(200),
    description: z.string().optional(),
  });

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: workoutApi.createPlan,
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      navigation.replace('WorkoutPlanDetail', { planId: plan.id });
    },
    onError: (err: any) => {
      Alert.alert(t('createWorkoutPlan.errorTitle'), err.response?.data?.message ?? t('createWorkoutPlan.errorDefault'));
    },
  });

  const onSubmit = (data: FormData) => mutation.mutate(data);

  return (
    <Screen scrollable keyboardAvoiding contentStyle={{ padding: Spacing['2xl'] }}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value, ref } }) => (
          <Input
            ref={ref}
            label={t('createWorkoutPlan.planName')}
            placeholder={t('createWorkoutPlan.planNamePlaceholder')}
            onChangeText={onChange}
            value={value}
            error={errors.name?.message}
            autoFocus
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, value } }) => (
          <Input
            label={t('createWorkoutPlan.description')}
            placeholder={t('createWorkoutPlan.descriptionPlaceholder')}
            onChangeText={onChange}
            value={value ?? ''}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        )}
      />

      <Button
        title={t('createWorkoutPlan.createBtn')}
        onPress={handleSubmit(onSubmit)}
        loading={mutation.isPending}
        fullWidth
        style={{ marginTop: Spacing.md }}
      />

      <Button
        title={t('createWorkoutPlan.cancelBtn')}
        variant="ghost"
        onPress={() => navigation.goBack()}
        fullWidth
        style={{ marginTop: Spacing.sm }}
      />
    </Screen>
  );
}
