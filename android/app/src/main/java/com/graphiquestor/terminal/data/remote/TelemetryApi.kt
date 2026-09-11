package com.graphiquestor.terminal.data.remote

import com.graphiquestor.terminal.data.model.MobileBootstrapResponse
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class TelemetryApi(
    private val baseUrl: String = "https://graphiquestor.com"
) {
    private val client = HttpClient(CIO) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    suspend fun fetchBootstrap(): MobileBootstrapResponse {
        return client.get("$baseUrl/api/mobile-bootstrap") {
            header("Accept", "application/json")
        }.body()
    }
}
