package com.btrackscaffold.watch

import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.WearableListenerService

private const val ACTION_PATH = "/btrack/action"

/** Receives logSet/finishWorkout/skipRest actions sent from the watch. */
class WatchActionListenerService : WearableListenerService() {
    override fun onMessageReceived(event: MessageEvent) {
        if (event.path == ACTION_PATH) {
            val action = String(event.data, Charsets.UTF_8)
            WatchBridgeModule.emitWatchAction(action)
        }
    }
}
