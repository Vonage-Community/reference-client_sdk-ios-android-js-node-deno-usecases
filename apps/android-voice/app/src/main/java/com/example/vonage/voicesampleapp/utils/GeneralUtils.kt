package com.example.vonage.voicesampleapp.utils

import android.app.KeyguardManager
import android.app.KeyguardManager.KeyguardDismissCallback
import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.core.os.postDelayed
import com.example.vonage.voicesampleapp.activities.CallActivity

internal fun showToast(context: Context, text: String, duration: Int = Toast.LENGTH_LONG){
    Handler(Looper.getMainLooper()).post {
        Toast.makeText(context, text, duration).show()
    }
}

/**
 * If the device is locked the App will not be able to record audio
 */
internal fun isDeviceLocked(context: Context): Boolean {
    val keyguardManager = context.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    return keyguardManager.isKeyguardLocked
}

/**
 * This method will allow the Call Activity to turn the screen on and unlock the device
 */
fun CallActivity.turnKeyguardOff(onSuccessCallback: (() -> Unit)? = null){
    val keyguardManager = getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
    Handler(Looper.getMainLooper()).postDelayed(500){
        keyguardManager.requestDismissKeyguard(this@turnKeyguardOff, object : KeyguardDismissCallback() {
            override fun onDismissSucceeded() {
                super.onDismissSucceeded()
                Handler(Looper.getMainLooper()).post {
                    onSuccessCallback?.invoke()
                }
            }

            override fun onDismissError() {
                super.onDismissError()
            }

            override fun onDismissCancelled() {
                super.onDismissCancelled()
            }
        })
    }
}

/**
 * Helper to listen for Network Connectivity updates
 */
internal fun registerNetworkCallback(context: Context, onOfflineCallback: (()-> Unit)? = null, onOnlineCallback: (()-> Unit)? = null) {
    val connectivityManager = context.getSystemService(ConnectivityManager::class.java) as ConnectivityManager
    val networkCallback = object : ConnectivityManager.NetworkCallback() {
        // network is available for use
        override fun onAvailable(network: Network) {
            super.onAvailable(network)
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return
            val isWifi = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
            val isCellular = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
            val message = "Connected${if(isWifi)" to Wi-Fi" else if(isCellular)" to Mobile Data" else ""}"
            showToast(context, message, Toast.LENGTH_SHORT)
            onOnlineCallback?.invoke()
        }

        // lost network connection
        override fun onLost(network: Network) {
            super.onLost(network)
            showToast(context, "Connection Lost", Toast.LENGTH_SHORT)
            onOfflineCallback?.invoke()
        }
    }
    connectivityManager.registerDefaultNetworkCallback(networkCallback)
}