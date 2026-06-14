# 🤖 Standalone Android APK Compilation Guide

This guide explains how to compile **Debug** and **Release** APKs for the HostelOS mobile application directly from your command line on **Windows**, **macOS**, and **Linux** without requiring Android Studio. It also explains how to retrieve them automatically from the GitHub Actions CI/CD pipeline.

---

## 🛠️ Local Prerequisites & Requirements

To compile the APKs locally, your host machine must have the following developer toolchains:

1. **Java Development Kit (JDK 17 or JDK 21)**
   - Gradle 8.11 and Android compile SDK 35 require Java 17 or 21 to compile.
   - **Command to verify:** `java -version`
   - Set the `JAVA_HOME` environment variable to point to your JDK installation.

2. **Android SDK & Command Line Tools**
   - You need the Android SDK platform tools and build tools installed.
   - Set the `ANDROID_HOME` environment variable (e.g., `~/Library/Android/sdk` on macOS or `%USERPROFILE%\AppData\Local\Android\Sdk` on Windows).
   - Ensure the SDK's `platform-tools` and `build-tools` are added to your system `PATH`.

3. **Node.js (v18 or v20)**
   - Used to run Vite build packaging and Capacitor asset sync.

---

## 🚀 How to Build APKs Locally

We have configured convenient cross-platform scripts in `package.json` to handle compilation.

### 1. Build & Package Debug APK
This compiles the web app, syncs assets into the Android native envelope, and outputs an installable, unsigned debug APK.
```bash
npm run android:build:debug
```
- **Execution Script:** `node scripts/build-apk.js debug`
- **Output File:** `android/app/build/outputs/apk/debug/app-debug.apk`

### 2. Build & Package Release APK
This compiles the application in production mode. By default, if no custom environment keys are present, this generates an unsigned release APK.
```bash
npm run android:build:release
```
- **Execution Script:** `node scripts/build-apk.js release`
- **Output File:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## 🔐 Keystore Generation & Custom Signing

To sign your Release APK for testing or publication on Google Play, you can generate a custom Keystore file and configure Gradle to sign it.

### Step 1: Generate a Keystore
Run this command in your terminal (using `keytool` from your Java JDK):
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
This generates a file named `my-release-key.keystore`. Secure it and remember your passwords.

### Step 2: Build Signed Release APK locally
Expose the signing credentials as environment variables before compiling:

#### On macOS / Linux:
```bash
export KEYSTORE_FILE="/absolute/path/to/my-release-key.keystore"
export KEYSTORE_PASSWORD="your_keystore_password"
export KEY_ALIAS="my-key-alias"
export KEY_PASSWORD="your_key_password"
npm run android:build:release
```

#### On Windows (PowerShell):
```powershell
$env:KEYSTORE_FILE="C:\path\to\my-release-key.keystore"
$env:KEYSTORE_PASSWORD="your_keystore_password"
$env:KEY_ALIAS="my-key-alias"
$env:KEY_PASSWORD="your_key_password"
npm run android:build:release
```
- **Output File:** `android/app/build/outputs/apk/release/app-release.apk` (Fully signed and installable!)

---

## ☁️ Automated Builds via GitHub Actions

We have created an automated CI/CD workflow at `.github/workflows/build-apk.yml`. Every time you push code to `main` or `master` branches, or trigger it manually, GitHub will build both APKs in the cloud.

### How to set up Custom Release Signing on GitHub:
To sign your Release APK automatically with your own key on GitHub:
1. Encode your Keystore file to Base64 (so you can store it as text):
   ```bash
   openssl base64 -in my-release-key.keystore -out keystore-base64.txt
   ```
2. Open your GitHub Repository.
3. Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
4. Add the following secrets:
   - `KEYSTORE_BASE64`: Paste the content of `keystore-base64.txt`.
   - `KEYSTORE_PASSWORD`: Keystore password.
   - `KEY_ALIAS`: Alias name.
   - `KEY_PASSWORD`: Key password.

*If these secrets are not configured, GitHub Actions will automatically generate a self-signed key to sign the Release APK, ensuring the download is immediately ready and installable on testing devices.*

### How to Download the compiled APKs:
1. Push your code changes to GitHub.
2. Click on the **Actions** tab on your GitHub repository page.
3. Select the **Build Android APKs** workflow.
4. Click on the most recent run.
5. Scroll down to the **Artifacts** section at the bottom.
6. Click on the **HostelOS-Android-APKs** link to download the zip file containing:
   - `HostelOS-debug.apk`
   - `HostelOS-release.apk` (or `HostelOS-release-unsigned.apk`)

---

## 🛡️ Project Verification Checklist

Confirm these points before executing standard builds:
* [x] Target SDK defined as `35` (Android 15) and Min SDK as `23` (Android 6) in `android/variables.gradle`.
* [x] Cross-platform build script created in `scripts/build-apk.js`.
* [x] Vite relative base configured as `base: './'` in `vite.config.ts`.
* [x] React Router setup uses `HashRouter` inside `src/App.tsx`.
* [x] Viewport optimized for notches and scaling disabled in `index.html`.
* [x] Safe area notch spacing classes defined in `src/index.css`.
* [x] NPM scripts added to `package.json`.
* [x] Native Permissions declared in `android/app/src/main/AndroidManifest.xml` (Camera, Scoped Storage, Notifications, SMS Retriever).
