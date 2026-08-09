package com.btrackscaffold.wear

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService

private const val STATE_PATH = "/btrack/state"
const val ACTION_PATH = "/btrack/action"

/** Receives workout state pushes from the phone over the Data Layer API. */
class PhoneMessageService : WearableListenerService() {
    override fun onMessageReceived(event: MessageEvent) {
        if (event.path == STATE_PATH) {
            val json = String(event.data, Charsets.UTF_8)
            WorkoutStateHolder.state.value = WorkoutState.fromJson(json)
        }
    }
}

/** Sends a watch-triggered action ("logSet" | "finishWorkout" | "skipRest") back to the phone. */
fun sendActionToPhone(context: android.content.Context, action: String) {
    val messageClient = Wearable.getMessageClient(context)
    val nodeClient = Wearable.getNodeClient(context)
    nodeClient.connectedNodes.addOnSuccessListener { nodes ->
        nodes.forEach { node ->
            messageClient.sendMessage(node.id, ACTION_PATH, action.toByteArray(Charsets.UTF_8))
        }
    }
}
