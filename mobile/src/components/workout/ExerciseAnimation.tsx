import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';

import { MuscleGroup } from '@/types';
import { useColors, Radius } from '@/theme';

// ── Coordinate space: 200 × 260 ──────────────────────────────────────────────
const CX = 100;

type Vec2 = readonly [number, number];
interface Pose {
  head: Vec2;
  shoulderL: Vec2; shoulderR: Vec2;
  elbowL: Vec2;    elbowR: Vec2;
  handL: Vec2;     handR: Vec2;
  hipL: Vec2;      hipR: Vec2;
  kneeL: Vec2;     kneeR: Vec2;
  footL: Vec2;     footR: Vec2;
}

// ── Standing base ─────────────────────────────────────────────────────────────
const STAND: Pose = {
  head:      [CX, 26],
  shoulderL: [CX - 24, 56], shoulderR: [CX + 24, 56],
  elbowL:    [CX - 36, 92], elbowR:    [CX + 36, 92],
  handL:     [CX - 40, 128], handR:    [CX + 40, 128],
  hipL:      [CX - 14, 126], hipR:     [CX + 14, 126],
  kneeL:     [CX - 16, 174], kneeR:    [CX + 16, 174],
  footL:     [CX - 18, 222], footR:    [CX + 18, 222],
};

type AnimType = 'squat' | 'deadlift' | 'press' | 'curl' | 'pushup' | 'run';

const POSES: Record<AnimType, [Pose, Pose]> = {
  squat: [STAND, {
    head:      [CX, 78],
    shoulderL: [CX - 24, 106], shoulderR: [CX + 24, 106],
    elbowL:    [CX - 48, 118], elbowR:    [CX + 48, 118],
    handL:     [CX - 56, 132], handR:     [CX + 56, 132],
    hipL:      [CX - 18, 168], hipR:      [CX + 18, 168],
    kneeL:     [CX - 32, 196], kneeR:     [CX + 32, 196],
    footL:     [CX - 24, 222], footR:     [CX + 24, 222],
  }],

  deadlift: [STAND, {
    head:      [CX - 38, 88],
    shoulderL: [CX - 56, 100], shoulderR: [CX, 86],
    elbowL:    [CX - 52, 134], elbowR:    [CX + 4, 120],
    handL:     [CX - 44, 168], handR:     [CX + 12, 156],
    hipL:      [CX - 14, 126], hipR:      [CX + 14, 126],
    kneeL:     [CX - 16, 176], kneeR:     [CX + 16, 176],
    footL:     [CX - 18, 222], footR:     [CX + 18, 222],
  }],

  press: [STAND, {
    head:      [CX, 26],
    shoulderL: [CX - 24, 56], shoulderR: [CX + 24, 56],
    elbowL:    [CX - 28, 20], elbowR:    [CX + 28, 20],
    handL:     [CX - 26, -8], handR:     [CX + 26, -8],
    hipL:      [CX - 14, 126], hipR:     [CX + 14, 126],
    kneeL:     [CX - 16, 174], kneeR:    [CX + 16, 174],
    footL:     [CX - 18, 222], footR:    [CX + 18, 222],
  }],

  curl: [STAND, {
    head:      [CX, 26],
    shoulderL: [CX - 24, 56], shoulderR: [CX + 24, 56],
    elbowL:    [CX - 38, 92], elbowR:    [CX + 38, 92],
    handL:     [CX - 28, 64], handR:     [CX + 28, 64],
    hipL:      [CX - 14, 126], hipR:     [CX + 14, 126],
    kneeL:     [CX - 16, 174], kneeR:    [CX + 16, 174],
    footL:     [CX - 18, 222], footR:    [CX + 18, 222],
  }],

  pushup: [
    {
      head:      [28, 78],
      shoulderL: [58, 90],  shoulderR: [58, 66],
      elbowL:    [96, 92],  elbowR:    [96, 62],
      handL:     [128, 92], handR:     [128, 62],
      hipL:      [144, 90], hipR:      [156, 74],
      kneeL:     [172, 92], kneeR:     [174, 72],
      footL:     [196, 92], footR:     [196, 70],
    },
    {
      head:      [28, 62],
      shoulderL: [58, 74],  shoulderR: [58, 50],
      elbowL:    [100, 82], elbowR:    [100, 46],
      handL:     [128, 92], handR:     [128, 62],
      hipL:      [144, 90], hipR:      [156, 74],
      kneeL:     [172, 92], kneeR:     [174, 72],
      footL:     [196, 92], footR:     [196, 70],
    },
  ],

  run: [
    {
      head:      [CX, 26],
      shoulderL: [CX - 22, 56], shoulderR: [CX + 22, 56],
      elbowL:    [CX - 44, 40], elbowR:    [CX + 26, 80],
      handL:     [CX - 54, 22], handR:     [CX + 32, 100],
      hipL:      [CX - 14, 126], hipR:     [CX + 14, 126],
      kneeL:     [CX - 36, 160], kneeR:    [CX + 28, 186],
      footL:     [CX - 54, 134], footR:    [CX + 24, 222],
    },
    {
      head:      [CX, 26],
      shoulderL: [CX - 22, 56], shoulderR: [CX + 22, 56],
      elbowL:    [CX - 26, 80], elbowR:    [CX + 44, 40],
      handL:     [CX - 32, 100], handR:    [CX + 54, 22],
      hipL:      [CX - 14, 126], hipR:     [CX + 14, 126],
      kneeL:     [CX - 28, 186], kneeR:    [CX + 36, 160],
      footL:     [CX - 24, 222], footR:    [CX + 54, 134],
    },
  ],
};

const MUSCLE_ANIM: Record<MuscleGroup, AnimType> = {
  QUADRICEPS: 'squat',  HAMSTRINGS: 'squat', GLUTES: 'squat', CALVES: 'squat',
  BACK:       'deadlift',
  SHOULDERS:  'press',
  CHEST:      'pushup',
  BICEPS:     'curl',   TRICEPS: 'curl',   FOREARMS: 'curl',
  CORE:       'squat',
  CARDIO:     'run',    FULL_BODY: 'run',
  OTHER:      'squat',
};

const DURATIONS: Record<AnimType, number> = {
  squat: 1600, deadlift: 1800, press: 1400, curl: 1200, pushup: 1400, run: 700,
};

const ACCENT_SEGMENTS: Record<AnimType, Set<string>> = {
  squat:    new Set(['leftThigh', 'rightThigh', 'leftShin', 'rightShin']),
  deadlift: new Set(['spine', 'leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm']),
  press:    new Set(['leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm']),
  curl:     new Set(['leftForearm', 'rightForearm']),
  pushup:   new Set(['leftUpperArm', 'rightUpperArm', 'leftForearm', 'rightForearm']),
  run:      new Set(['leftThigh', 'rightThigh', 'leftShin', 'rightShin']),
};

// ── Easing & lerp ─────────────────────────────────────────────────────────────
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lv(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function interpolatePose(a: Pose, b: Pose, t: number): Pose {
  return {
    head:      lv(a.head,      b.head,      t),
    shoulderL: lv(a.shoulderL, b.shoulderL, t),
    shoulderR: lv(a.shoulderR, b.shoulderR, t),
    elbowL:    lv(a.elbowL,    b.elbowL,    t),
    elbowR:    lv(a.elbowR,    b.elbowR,    t),
    handL:     lv(a.handL,     b.handL,     t),
    handR:     lv(a.handR,     b.handR,     t),
    hipL:      lv(a.hipL,      b.hipL,      t),
    hipR:      lv(a.hipR,      b.hipR,      t),
    kneeL:     lv(a.kneeL,     b.kneeL,     t),
    kneeR:     lv(a.kneeR,     b.kneeR,     t),
    footL:     lv(a.footL,     b.footL,     t),
    footR:     lv(a.footR,     b.footR,     t),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  muscleGroup: MuscleGroup;
  accentColor: string;
}

export default function ExerciseAnimation({ muscleGroup, accentColor }: Props) {
  const colors = useColors();
  const animType = MUSCLE_ANIM[muscleGroup] ?? 'squat';
  const [poseA, poseB] = POSES[animType];
  const duration = DURATIONS[animType];
  const accented = ACCENT_SEGMENTS[animType];

  const [rawProgress, setRawProgress] = useState(0);
  const dirRef = useRef(1);
  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setRawProgress(0);
    dirRef.current = 1;
    lastRef.current = null;

    const tick = (time: number) => {
      if (lastRef.current !== null) {
        const delta = time - lastRef.current;
        setRawProgress(prev => {
          let next = prev + (delta / duration) * dirRef.current;
          if (next >= 1) { next = 1; dirRef.current = -1; }
          else if (next <= 0) { next = 0; dirRef.current = 1; }
          return next;
        });
      }
      lastRef.current = time;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, [animType, duration]);

  const t = easeInOut(rawProgress);
  const p = interpolatePose(poseA, poseB, t);

  const body = colors.textSecondary;
  const accent = accentColor;

  const seg = (name: string, x1: number, y1: number, x2: number, y2: number) => (
    <Line
      key={name}
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={accented.has(name) ? accent : body}
      strokeWidth={accented.has(name) ? 6 : 5}
      strokeLinecap="round"
    />
  );

  // Midpoints for spine anchors
  const scx = (p.shoulderL[0] + p.shoulderR[0]) / 2;
  const scy = (p.shoulderL[1] + p.shoulderR[1]) / 2;
  const hcx = (p.hipL[0] + p.hipR[0]) / 2;
  const hcy = (p.hipL[1] + p.hipR[1]) / 2;
  const neckY = p.head[1] + 15;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surfaceElevated }]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 260" preserveAspectRatio="xMidYMid meet">

        {/* Neck */}
        {seg('neck', p.head[0], neckY, scx, scy)}
        {/* Clavicle */}
        {seg('clavicle', p.shoulderL[0], p.shoulderL[1], p.shoulderR[0], p.shoulderR[1])}
        {/* Spine */}
        {seg('spine', scx, scy, hcx, hcy)}
        {/* Pelvis */}
        {seg('pelvis', p.hipL[0], p.hipL[1], p.hipR[0], p.hipR[1])}

        {/* Arms */}
        {seg('leftUpperArm',  p.shoulderL[0], p.shoulderL[1], p.elbowL[0], p.elbowL[1])}
        {seg('leftForearm',   p.elbowL[0],    p.elbowL[1],    p.handL[0],  p.handL[1])}
        {seg('rightUpperArm', p.shoulderR[0], p.shoulderR[1], p.elbowR[0], p.elbowR[1])}
        {seg('rightForearm',  p.elbowR[0],    p.elbowR[1],    p.handR[0],  p.handR[1])}

        {/* Legs */}
        {seg('leftThigh',  p.hipL[0],  p.hipL[1],  p.kneeL[0], p.kneeL[1])}
        {seg('leftShin',   p.kneeL[0], p.kneeL[1], p.footL[0], p.footL[1])}
        {seg('rightThigh', p.hipR[0],  p.hipR[1],  p.kneeR[0], p.kneeR[1])}
        {seg('rightShin',  p.kneeR[0], p.kneeR[1], p.footR[0], p.footR[1])}

        {/* Head */}
        <Circle
          cx={p.head[0]} cy={p.head[1]} r={15}
          stroke={body} strokeWidth={5} fill="transparent"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: Radius.lg, overflow: 'hidden' },
});
