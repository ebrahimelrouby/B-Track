package com.btrackscaffold.wear

import android.content.Context
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import kotlinx.coroutines.delay

private val LimeAccent = Color(0xFFAAFF00)
private val Background = Color(0xFF0A0A0A)
private val SurfaceElevated = Color(0xFF1C1C1C)
private val CardBorder = Color(0xFF2A2A2A)
private val DangerRed = Color(0xFFEF4444)
private val LimeDeep = Color(0xFF6FB800)

/** Small filled play triangle used as the leading icon on the primary CTA chips. */
@Composable
private fun PlayGlyph(modifier: Modifier = Modifier, color: Color = Color.Black) {
    Canvas(modifier = modifier.size(11.dp)) {
        val path = Path().apply {
            moveTo(0f, 0f)
            lineTo(size.width, size.height / 2f)
            lineTo(0f, size.height)
            close()
        }
        drawPath(path, color = color)
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                WorkoutScreen()
            }
        }
    }
}

@Composable
fun WorkoutScreen() {
    val state by WorkoutStateHolder.state.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        if (!state.isActive) {
            IdleView(onStart = { sendActionToPhone(context, "startWorkout") })
        } else {
            ActiveWorkoutView(
                state = state,
                onLogSet = { sendActionToPhone(context, "logSet") },
                onFinish = { sendActionToPhone(context, "finishWorkout") },
                onSkipRest = { sendActionToPhone(context, "skipRest") },
            )
        }
    }
}

@Composable
private fun IdleView(onStart: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        // Soft glow ring + glyph badge — echoes the app's neon-on-black brand mark.
        Box(contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .background(LimeAccent.copy(alpha = 0.14f), CircleShape)
            )
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .background(SurfaceElevated, CircleShape)
                    .border(1.dp, LimeAccent.copy(alpha = 0.45f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(text = "🏋", fontSize = 14.sp)
            }
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "B-TRACK",
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Black,
            letterSpacing = 2.sp,
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = "Ready when you are",
            color = Color.Gray,
            fontSize = 10.sp,
            textAlign = TextAlign.Center,
        )

        Spacer(modifier = Modifier.height(10.dp))
        Chip(
            onClick = onStart,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            icon = {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .background(Color.Black.copy(alpha = 0.16f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    PlayGlyph(modifier = Modifier.padding(start = 2.dp))
                }
            },
            label = {
                Text(
                    text = "Start Workout",
                    color = Color.Black,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                )
            },
            colors = ChipDefaults.gradientBackgroundChipColors(
                startBackgroundColor = LimeDeep,
                endBackgroundColor = LimeAccent,
                contentColor = Color.Black,
            ),
        )
    }
}

/** Vibration + tone burst when a rest timer finishes — the whole point of glancing at a watch mid-set. */
private fun alertRestComplete(context: Context) {
    val vibrator = context.getSystemService(Vibrator::class.java)
    vibrator?.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 300, 120, 300), -1))
    val toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, ToneGenerator.MAX_VOLUME)
    toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 700)
}

@Composable
private fun ActiveWorkoutView(
    state: WorkoutState,
    onLogSet: () -> Unit,
    onFinish: () -> Unit,
    onSkipRest: () -> Unit,
) {
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            nowMs = System.currentTimeMillis()
        }
    }

    val context = androidx.compose.ui.platform.LocalContext.current
    // Re-launches whenever the phone pushes a new rest end time (new rest period
    // started, or cleared via skip) and fires exactly once when it naturally elapses.
    LaunchedEffect(state.restEndTimeMs) {
        val endTime = state.restEndTimeMs ?: return@LaunchedEffect
        val remaining = endTime - System.currentTimeMillis()
        if (remaining > 0) {
            delay(remaining)
            alertRestComplete(context)
        }
    }

    val elapsedSec = state.startedAtMs?.let { ((nowMs - it) / 1000).coerceAtLeast(0) } ?: 0
    val restRemainingSec = state.restEndTimeMs?.let { ((it - nowMs) / 1000).coerceAtLeast(0) }
    val resting = restRemainingSec != null && restRemainingSec > 0

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = formatTime(elapsedSec), color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        state.workoutName?.let {
            Text(text = it, color = Color.Gray, fontSize = 10.sp)
        }
    }

    Spacer(modifier = Modifier.height(8.dp))
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(1.dp)
            .background(CardBorder)
    )
    Spacer(modifier = Modifier.height(8.dp))

    if (resting) {
        Box(contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .background(LimeAccent.copy(alpha = 0.14f), CircleShape)
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(text = "REST", color = LimeAccent, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Text(text = formatTime(restRemainingSec ?: 0), color = LimeAccent, fontSize = 19.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Chip(
            onClick = onSkipRest,
            modifier = Modifier.fillMaxWidth(),
            label = { Text(text = "Skip Rest", fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
            colors = ChipDefaults.secondaryChipColors(),
        )
    } else {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = state.currentExerciseName ?: "No exercise yet",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )
            if (state.lastWeightKg != null || state.lastReps != null) {
                val w = state.lastWeightKg?.let { fmtWeight(it) } ?: "-"
                val r = state.lastReps?.toString() ?: "-"
                Text(text = "$w kg × $r reps", color = Color.Gray, fontSize = 11.sp)
            }
        }
        Spacer(modifier = Modifier.height(10.dp))
        Chip(
            onClick = onLogSet,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            icon = {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .background(Color.Black.copy(alpha = 0.16f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(text = "✓", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            },
            label = {
                Text(
                    text = "Log Set",
                    color = Color.Black,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                )
            },
            colors = ChipDefaults.gradientBackgroundChipColors(
                startBackgroundColor = LimeDeep,
                endBackgroundColor = LimeAccent,
                contentColor = Color.Black,
            ),
        )
    }

    Spacer(modifier = Modifier.height(8.dp))
    Chip(
        onClick = onFinish,
        modifier = Modifier.fillMaxWidth(),
        label = { Text(text = "Finish", color = DangerRed, fontSize = 11.sp, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center) },
        colors = ChipDefaults.secondaryChipColors(),
    )
}

private fun formatTime(totalSeconds: Long): String {
    val m = totalSeconds / 60
    val s = totalSeconds % 60
    return "%02d:%02d".format(m, s)
}

private fun fmtWeight(w: Double): String =
    if (w == w.toLong().toDouble()) w.toLong().toString() else w.toString()
