package com.graphiquestor.terminal

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.graphiquestor.terminal.data.local.AppDatabase
import com.graphiquestor.terminal.data.repository.TelemetryRepository
import kotlinx.coroutines.runBlocking
import java.util.concurrent.TimeUnit

class GraphiQuestorApp : Application() {

    lateinit var database: AppDatabase
        private set

    lateinit var repository: TelemetryRepository
        private set

    override fun onCreate() {
        super.onCreate()
        database = AppDatabase.getDatabase(this)
        repository = TelemetryRepository(database.metricDao())

        // Schedule battery-aware background telemetry refresh for home screen widget
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()

        val syncWork = PeriodicWorkRequestBuilder<TelemetrySyncWorker>(30, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "TelemetrySyncWork",
            ExistingPeriodicWorkPolicy.KEEP,
            syncWork
        )
    }
}

class TelemetrySyncWorker(
    appContext: android.content.Context,
    workerParams: WorkerParameters
) : Worker(appContext, workerParams) {

    override fun doWork(): Result {
        val app = applicationContext as? GraphiQuestorApp ?: return Result.failure()
        return try {
            runBlocking {
                app.repository.refreshTelemetry()
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
