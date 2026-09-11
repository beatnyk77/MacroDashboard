package com.graphiquestor.terminal.review

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.play.core.review.ReviewManagerFactory

object PlayReviewManager {
    private const val PREFS_NAME = "review_prefs"
    private const val KEY_ACTIONS_COUNT = "actions_count"
    private const val KEY_LAST_REVIEW_TIME = "last_review_time"
    private const val TAG = "PlayReviewManager"

    fun requestReviewIfAppropriate(activity: Activity) {
        val prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val actions = prefs.getInt(KEY_ACTIONS_COUNT, 0) + 1
        val lastReview = prefs.getLong(KEY_LAST_REVIEW_TIME, 0L)
        val now = System.currentTimeMillis()

        prefs.edit().putInt(KEY_ACTIONS_COUNT, actions).apply()

        // Prompt after at least 2 key interactions (e.g. creating rules, pinning metrics)
        // and only once every 30 days
        val daysSinceLast = (now - lastReview) / (1000 * 60 * 60 * 24)
        if (actions >= 2 && daysSinceLast >= 30) {
            val manager = ReviewManagerFactory.create(activity)
            val request = manager.requestReviewFlow()
            request.addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val reviewInfo = task.result
                    val flow = manager.launchReviewFlow(activity, reviewInfo)
                    flow.addOnCompleteListener {
                        prefs.edit().putLong(KEY_LAST_REVIEW_TIME, now).apply()
                        Log.d(TAG, "In-App Review flow finished.")
                    }
                } else {
                    Log.w(TAG, "Review flow request failed: ${task.exception?.message}")
                }
            }
        }
    }
}
