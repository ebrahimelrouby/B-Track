package com.btrackscaffold.watch

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.gms.wearable.Wearable
import org.json.JSONObject

private const val STATE_PATH = "/btrack/state"

/**
 * Phone-side bridge to the BTrack Wear OS companion app, mirroring the shape
 * of the iOS WatchBridge module so RN code (src/native/watch.ts) is unified
 * across platforms. Pushes workout state over the Data Layer API and relays
 * watch-triggered actions back to JS (see WatchActionListenerService).
 */
class WatchBridgeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        @Volatile
        var reactContextRef: ReactApplicationContext? = null

        fun emitWatchAction(action: String) {
            val ctx = reactContextRef ?: return
            val params = Arguments.createMap().apply { putString("action", action) }
            ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("WatchAction", params)
        }
    }

    init {
        reactContextRef = reactContext
    }

    override fun getName() = "WatchBridge"

    @ReactMethod
    fun updateWorkoutState(state: ReadableMap) {
        val json = JSONObject(state.toHashMap() as Map<*, *>)
        val messageClient = Wearable.getMessageClient(reactApplicationContext)
        val nodeClient = Wearable.getNodeClient(reactApplicationContext)
        nodeClient.connectedNodes.addOnSuccessListener { nodes ->
            nodes.forEach { node ->
                messageClient.sendMessage(node.id, STATE_PATH, json.toString().toByteArray(Charsets.UTF_8))
            }
        }
    }

    // Required by RN's NativeEventEmitter contract on Android — the actual
    // event stream comes from WatchActionListenerService, not JS-driven add/remove.
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
