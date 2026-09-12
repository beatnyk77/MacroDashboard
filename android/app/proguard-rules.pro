# GraphiQuestor R8 / ProGuard Optimization Rules for Top Android Vitals

# Keep Room SQLite schemas and entities
-keep class androidx.room.** { *; }
-dontwarn androidx.room.paging.**

# Keep Kotlinx Serialization models
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}
-keep,allowobfuscation,allowshrinking class * {
    @kotlinx.serialization.Serializable class *;
}

# Keep Ktor CIO client & suppress slf4j optional logger warning
-keep class io.ktor.** { *; }
-dontwarn io.ktor.**
-dontwarn org.slf4j.**

# Keep Glance AppWidget
-keep class androidx.glance.** { *; }
-keep class com.graphiquestor.terminal.widget.** { *; }

# Google Play In-App Review
-keep class com.google.android.play.core.** { *; }
