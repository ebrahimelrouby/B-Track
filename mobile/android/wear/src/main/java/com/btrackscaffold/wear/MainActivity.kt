package com.btrackscaffold.wear

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import kotlinx.coroutines.delay

private val LimeAccent = Color(0xFFAAFF00)
private val Background = Color(0xFF0A0A0A)

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
            IdleView()
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
private fun IdleView() {
    Text(
        text = "B-TRACK",
        color = Color.White,
        fontSize = 14.sp,
        fontWeight = FontWeight.Black,
    )
    Spacer(modifier = Modifier.height(8.dp))
    Text(
        text = "Start a workout\non your phone",
        color = Color.Gray,
        fontSize = 12.sp,
        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
    )
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

    val elapsedSec = state.startedAtMs?.let { ((nowMs - it) / 1000).coerceAtLeast(0) } ?: 0
    val restRemainingSec = state.restEndTimeMs?.let { ((it - nowMs) / 1000).coerceAtLeast(0) }

    Text(text = formatTime(elapsedSec), color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
    state.workoutName?.let {
        Text(text = it, color = Color.Gray, fontSize = 11.sp)
    }

    Spacer(modifier = Modifier.height(6.dp))

    if (restRemainingSec != null && restRemainingSec > 0) {
        Text(text = "REST", color = LimeAccent, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(text = formatTime(restRemainingSec), color = LimeAccent, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Button(onClick = onSkipRest, colors = ButtonDefaults.secondaryButtonColors()) {
            Text(text = "Skip Rest", fontSize = 11.sp)
        }
    } else {
        state.currentExerciseName?.let {
            Text(text = it, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
        if (state.lastWeightKg != null || state.lastReps != null) {
            val w = state.lastWeightKg?.let { fmtWeight(it) } ?: "-"
            val r = state.lastReps?.toString() ?: "-"
            Text(text = "$w kg × $r reps", color = Color.Gray, fontSize = 11.sp)
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onLogSet, colors = ButtonDefaults.primaryButtonColors(backgroundColor = LimeAccent)) {
            Text(text = "Log Set", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }

    Spacer(modifier = Modifier.height(10.dp))
    Button(onClick = onFinish, colors = ButtonDefaults.secondaryButtonColors()) {
        Text(text = "Finish", color = Color(0xFFEF4444), fontSize = 11.sp)
    }
}

private fun formatTime(totalSeconds: Long): String {
    val m = totalSeconds / 60
    val s = totalSeconds % 60
    return "%02d:%02d".format(m, s)
}

private fun fmtWeight(w: Double): String =
    if (w == w.toLong().toDouble()) w.toLong().toString() else w.toString()
