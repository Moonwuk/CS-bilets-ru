#!/usr/bin/env python3
"""Build offline APKs and Android App Bundles with official Android SDK tools."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
ANDROID = ROOT / "android"
VERSION = json.loads((ANDROID / "version.json").read_text())
SITE_FILES = [
    "index.html", "senior.html", "ai-security.html", "scenarios.html",
    "all-questions.html", "topic-wheel.html", "privacy.html", "support.html",
    "support.js", "style.css", "case-trainer.css", "feedback.css", "app.js",
    "case-trainer.js", "all-questions.js", "wheel-visual.js", "wheel-visual.css",
    "feedback.js", "glossary.js", "questions.json", "senior-questions.json",
    "ai-security-questions.json", "scenarios-questions.json",
    "basic-bank.js", "compliance.html", "compliance-glossary.js", "compliance-materials.html",
    "compliance-materials.js", "data"
]

def run(*args):
    subprocess.run([str(arg) for arg in args], check=True, cwd=ROOT)

def java_tool(name):
    java_home = os.environ.get("JAVA_HOME")
    tool = Path(java_home) / ("bin/" + name) if java_home else shutil.which(name)
    if not tool or not Path(tool).is_file():
        raise SystemExit("Install JDK 17, including " + name + ".")
    return tool

def checksum(path):
    path.with_suffix(path.suffix + ".sha256").write_text(
        hashlib.sha256(path.read_bytes()).hexdigest() + "  " + path.name + "\n"
    )

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--unsigned", action="store_true", help="CI review build only.")
    parser.add_argument("--store", choices=["rustore", "googleplay"], default="rustore")
    parser.add_argument("--format", choices=["apk", "aab", "both"], default="apk")
    args = parser.parse_args()
    sdk = os.environ.get("ANDROID_SDK_ROOT") or os.environ.get("ANDROID_HOME")
    if not sdk:
        raise SystemExit("Set ANDROID_SDK_ROOT to an installed Android SDK.")
    tools = Path(sdk) / "build-tools" / VERSION["buildTools"]
    platform = Path(sdk) / "platforms" / ("android-" + str(VERSION["compileSdk"])) / "android.jar"
    javac = java_tool("javac")
    if not platform.is_file() or not (tools / "aapt2").is_file():
        raise SystemExit("Install SDK platform android-36 and build-tools 35.0.0.")
    bundletool = Path(os.environ.get("INFOSEC_BUNDLETOOL", ""))
    if args.format in ("aab", "both") and not bundletool.is_file():
        raise SystemExit("Set INFOSEC_BUNDLETOOL to the verified bundletool JAR.")
    key = os.environ.get("INFOSEC_KEYSTORE")
    password = os.environ.get("INFOSEC_PASSWORD_FILE")
    alias = os.environ.get("INFOSEC_KEY_ALIAS", "infosec-release")
    if not args.unsigned and (not key or not password or
            not Path(key).is_file() or not Path(password).is_file()):
        raise SystemExit("Set INFOSEC_KEYSTORE and INFOSEC_PASSWORD_FILE. No debug key is substituted.")
    work = ANDROID / "build" / ("work-" + args.store)
    default_output = ANDROID / "build/outputs"
    if args.store == "googleplay":
        default_output /= "googleplay"
    output = Path(os.environ.get("INFOSEC_OUTPUT_DIR", str(default_output))).resolve()
    if output == work or work in output.parents:
        raise SystemExit("INFOSEC_OUTPUT_DIR must be outside the temporary build directory.")
    if work.exists():
        shutil.rmtree(work)
    for directory in [work, output, work / "assets/site", work / "classes", work / "dex", work / "gen"]:
        directory.mkdir(parents=True, exist_ok=True)
    assets = work / "assets/site"
    for name in SITE_FILES:
        if args.store == "googleplay" and name in ("support.html", "support.js"):
            continue
        source = ROOT / name
        if source.is_dir():
            shutil.copytree(source, assets / name)
        else:
            shutil.copy2(source, assets / name)
    if args.store == "googleplay":
        home = assets / "index.html"
        page = home.read_text()
        support_link = '<a class="support-link" href="./support.html">♡ Поддержать проект</a>'
        if page.count(support_link) != 1:
            raise SystemExit("Google Play packaging must be updated for the changed support menu.")
        for file in assets.glob("*.html"):
            file.write_text(file.read_text().replace(support_link, ""))
        # Free text feedback is written on GitHub in the external browser.
        # The Play app itself receives no feedback text or account identifiers.
        shutil.copy2(ANDROID / "googleplay-feedback.js", assets / "feedback.js")
    shutil.copy2(ANDROID / "android-adapter.js", assets / "android-adapter.js")
    for file in assets.glob("*.html"):
        page = file.read_text()
        # Android's CSP permits external scripts only. The native adapter
        # supplies the shared menu behavior instead of these inline scripts.
        for inline in re.findall(r"<script>([\s\S]*?)</script>", page):
            if "const menu = document.querySelector('.mode-menu');" not in inline:
                raise SystemExit("Review the new inline script before Android packaging: " + file.name)
        page = re.sub(r"<script>[\s\S]*?</script>", "", page)
        file.write_text(page.replace("</head>",
            '<script src="./android-adapter.js" defer></script>\n</head>', 1))
    run(tools / "aapt2", "compile", "--dir", ANDROID / "res", "-o", work / "resources.zip")
    link = [tools / "aapt2", "link", "-I", platform, "--manifest", ANDROID / "AndroidManifest.xml",
        "--min-sdk-version", VERSION["minSdk"], "--target-sdk-version", VERSION["targetSdk"],
        "--version-code", VERSION["versionCode"], "--version-name", VERSION["versionName"],
        "-A", work / "assets"]
    run(*link, "--java", work / "gen", "-o", work / "resources.apk", work / "resources.zip")
    sources = sorted((ANDROID / "src").rglob("*.java")) + sorted((work / "gen").rglob("*.java"))
    run(javac, "--release", "8", "-encoding", "UTF-8", "-classpath", platform,
        "-d", work / "classes", *sources)
    run(tools / "d8", "--release", "--min-api", VERSION["minSdk"], "--lib", platform,
        "--output", work / "dex", *sorted((work / "classes").rglob("*.class")))
    stem = "infosec-tickets-" + VERSION["versionName"]
    if args.store == "googleplay":
        stem += "-googleplay"
    if args.format in ("apk", "both"):
        unsigned = output / (stem + "-unsigned.apk")
        unaligned = work / "unaligned.apk"
        shutil.copy2(work / "resources.apk", unaligned)
        with zipfile.ZipFile(unaligned, "a", compression=zipfile.ZIP_DEFLATED) as archive:
            for dex in sorted((work / "dex").glob("*.dex")):
                archive.write(dex, dex.name)
        run(tools / "zipalign", "-f", "-P", "16", "4", unaligned, unsigned)
        run(tools / "zipalign", "-c", "-P", "16", "4", unsigned)
        if args.unsigned:
            print("Unsigned review APK:", unsigned)
        else:
            signed = output / (stem + ".apk")
            run(tools / "apksigner", "sign", "--ks", key, "--ks-key-alias", alias,
                "--ks-pass", "file:" + password, "--v1-signing-enabled", "true",
                "--v2-signing-enabled", "true", "--v3-signing-enabled", "true",
                "--out", signed, unsigned)
            run(tools / "apksigner", "verify", "--verbose", "--print-certs", signed)
            run(tools / "zipalign", "-c", "-P", "16", "4", signed)
            checksum(signed)
            print("Release APK:", signed)
    if args.format in ("aab", "both"):
        run(*link, "--proto-format", "-o", work / "resources-proto.apk", work / "resources.zip")
        module = work / "base.zip"
        with zipfile.ZipFile(work / "resources-proto.apk") as resources, \
                zipfile.ZipFile(module, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name in resources.namelist():
                if name.endswith("/"):
                    continue
                destination = "manifest/AndroidManifest.xml" if name == "AndroidManifest.xml" else name
                archive.writestr(destination, resources.read(name))
            for dex in sorted((work / "dex").glob("*.dex")):
                archive.write(dex, "dex/" + dex.name)
        unsigned = output / (stem + "-unsigned.aab")
        if unsigned.exists():
            unsigned.unlink()
        run(java_tool("java"), "-jar", bundletool, "build-bundle",
            "--modules=" + str(module), "--output=" + str(unsigned))
        run(java_tool("java"), "-jar", bundletool, "validate", "--bundle=" + str(unsigned))
        if args.unsigned:
            print("Unsigned review AAB:", unsigned)
        else:
            signed = output / (stem + ".aab")
            shutil.copy2(unsigned, signed)
            run(java_tool("jarsigner"), "-keystore", key, "-storepass:file", password,
                "-sigalg", "SHA256withRSA", "-digestalg", "SHA-256", signed, alias)
            # Self-signed app certificates are expected. Content/signature integrity
            # is checked without requiring a public certificate authority.
            run(java_tool("jarsigner"), "-verify", signed)
            run(java_tool("java"), "-jar", bundletool, "validate", "--bundle=" + str(signed))
            checksum(signed)
            print("Release AAB:", signed)

if __name__ == "__main__":
    main()
