#!/usr/bin/env python3
"""Install a checksum-pinned official bundletool release."""
import argparse
import hashlib
import os
from pathlib import Path
import urllib.request

VERSION = "1.18.3"
SHA256 = "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29"
URL = f"https://github.com/google/bundletool/releases/download/{VERSION}/bundletool-all-{VERSION}.jar"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tools-dir", required=True)
    args = parser.parse_args()
    directory = Path(args.tools_dir).resolve()
    directory.mkdir(parents=True, exist_ok=True)
    jar = directory / f"bundletool-all-{VERSION}.jar"
    if not jar.exists():
        temporary = jar.with_suffix(".download")
        try:
            with urllib.request.urlopen(URL, timeout=60) as response, temporary.open("wb") as stream:
                while block := response.read(1024 * 1024):
                    stream.write(block)
            if hashlib.sha256(temporary.read_bytes()).hexdigest() != SHA256:
                raise SystemExit("bundletool SHA-256 mismatch.")
            temporary.replace(jar)
        finally:
            temporary.unlink(missing_ok=True)
    if hashlib.sha256(jar.read_bytes()).hexdigest() != SHA256:
        raise SystemExit("bundletool SHA-256 mismatch.")
    if os.environ.get("GITHUB_ENV"):
        with open(os.environ["GITHUB_ENV"], "a") as environment:
            environment.write("INFOSEC_BUNDLETOOL=" + str(jar) + "\n")
    print("Verified official bundletool:", jar)

if __name__ == "__main__":
    main()
