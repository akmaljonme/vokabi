# Vokabi — Android APK yaratish

## Kerakli dasturlar
1. **Android Studio** — https://developer.android.com/studio
2. **Java JDK 17+** — Android Studio bilan birga keladi

## Qadamlar

### 1. Repo ni clone qiling
```bash
git clone https://github.com/akmaljonme/vokabi.git
cd vokabi
npm install --legacy-peer-deps
```

### 2. Build qiling
```bash
npm run build
npx cap sync android
```

### 3. Android Studio da oching
```bash
npx cap open android
```

### 4. APK yarating
Android Studio da:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Release APK (Play Store uchun)
- **Build** → **Generate Signed Bundle / APK**
- Keystore yarating va imzolang

## Muammolar
- `JAVA_HOME` xatosi → Android Studio JDK ni ko'rsating
- Gradle xatosi → `./gradlew clean` ishga tushiring

## APK o'rnatish (test uchun)
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```
