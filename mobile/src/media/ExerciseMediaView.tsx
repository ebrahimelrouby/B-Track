import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Image, ActivityIndicator, Text, TouchableOpacity,
  Linking, StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { MuscleGroup } from '@/types';
import { useColors, Spacing, Typography, Radius } from '@/theme';
import ExerciseAnimation from '@/components/workout/ExerciseAnimation';
import { resolveExerciseMedia } from './providers/registry';
import { ExerciseMedia } from './types';

// ── Media priority chain ──────────────────────────────────────────────────────
// gif → image → animation (mock)
type ActiveMedia = 'gif' | 'image' | 'animation';

function pickInitial(media: ExerciseMedia): ActiveMedia {
  if (media.gifUrl)   return 'gif';
  if (media.imageUrl) return 'image';
  return 'animation';
}

function pickFallback(current: ActiveMedia, media: ExerciseMedia): ActiveMedia {
  if (current === 'gif' && media.imageUrl) return 'image';
  return 'animation';
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  accentColor: string;
  secondaryMuscles?: MuscleGroup[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ExerciseMediaView({
  exerciseId, exerciseName, muscleGroup, accentColor, secondaryMuscles,
}: Props) {
  const colors = useColors();

  const media = useMemo(
    () => resolveExerciseMedia({ exerciseId, exerciseName, muscleGroup, secondaryMuscles }),
    [exerciseId, exerciseName, muscleGroup, secondaryMuscles],
  );

  const [active, setActive]     = useState<ActiveMedia>(() => pickInitial(media));
  const [loading, setLoading]   = useState(active !== 'animation');

  const handleLoad = useCallback(() => setLoading(false), []);

  const handleError = useCallback(() => {
    const next = pickFallback(active, media);
    setActive(next);
    setLoading(next !== 'animation');
  }, [active, media]);

  const sourceUri = active === 'gif' ? media.gifUrl : media.imageUrl;
  const showImage = active !== 'animation' && !!sourceUri;

  const openAttribution = useCallback(() => {
    if (media.attributionUrl) Linking.openURL(media.attributionUrl);
  }, [media.attributionUrl]);

  return (
    <View style={styles.root}>

      {/* Built-in animated stick figure — shown when no remote media is available */}
      {active === 'animation' && (
        <ExerciseAnimation muscleGroup={muscleGroup} accentColor={accentColor} />
      )}

      {/* Remote image / GIF — opacity:0 while loading so onLoad fires on iOS */}
      {showImage && (
        <Image
          key={active}
          source={{ uri: sourceUri }}
          style={[styles.media, { opacity: loading ? 0 : 1 }]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Loading spinner */}
      {showImage && loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      )}

      {/* Attribution — required for non-mock providers */}
      {media.attribution && media.mediaProvider !== 'mock' && (
        <TouchableOpacity
          style={[styles.attribution, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
          onPress={openAttribution}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="information-outline" size={10} color="rgba(255,255,255,0.7)" />
          <Text style={styles.attributionText} numberOfLines={1}>
            {media.licenseType} · {media.attribution}
          </Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  media: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  attribution: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    maxWidth: '80%',
  },
  attributionText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: Typography.medium,
  },
});
