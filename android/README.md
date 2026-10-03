# Android APK для RuStore

Релиз 1.0.0 упаковывает текущий сайт и 600 базовых вопросов, 60 сценариев Senior, 40 сценариев по защите ИИ и 36 ситуационных задач по MITRE ATT&CK, OWASP и CVE в автономное Android-приложение.
Общий режим «Все вопросы» — один билет на все 676 заданий базового банка, ИИ и ситуаций до первой ошибки; «Сеньор» доступен отдельно.

Минимальная версия — Android 8.0 (API 26), целевая — Android 16 (API 36).
Нужен системный WebView версии 100 или новее. Google Play Services не требуются.

Приложение использует локальный HTTPS-origin для HTML, JavaScript, JSON и localStorage.
Ни одного разрешения Android, доступа к произвольным файлам или JavaScript/native bridge нет.
Ссылки на внешние источники открываются только в браузере после нажатия.
Системная кнопка «Назад» сохраняет текущий подход; системные панели и клавиатура учитываются.
При закрытии, повороте экрана и обновлении результаты остаются в локальном хранилище.
При удалении приложения или очистке данных прогресс удаляется.

## Сборка

Нужны JDK 17, Python 3, Android SDK Platform 36 и Build Tools 35.0.0.
Gradle, Node-зависимости, AndroidX и сервер для сборки APK не требуются.

    export JAVA_HOME=/absolute/path/to/jdk17
    export PATH="$JAVA_HOME/bin:$PATH"
    export ANDROID_SDK_ROOT=/absolute/path/to/android-sdk
    bash android/build.sh --unsigned

Проверка исходного тренажёра:

    node tests/check-glossary.cjs
    node tests/check-trainer.cjs
    node tests/check-case-trainer.cjs

## Подпись релиза

Перед первой публикацией создайте один постоянный приватный ключ.
Не публикуйте ключ или его пароль в git, публичных артефактах и логах.
Копия ключа первого подготовленного релиза передаётся владельцу отдельно.

    export INFOSEC_KEYSTORE=/private/path/infosec-release.jks
    export INFOSEC_PASSWORD_FILE=/private/path/signing-password.txt
    export INFOSEC_KEY_ALIAS=infosec-release
    bash android/build.sh

Пароль считывается из файла, а не из текста командной строки.
Без ключа сборщик создаёт неподписанный APK и прекращает релизную сборку.
Он не подменяет отсутствующий релизный ключ тестовым.
Для обновлений сохраняйте applicationId и ключ, увеличивайте versionCode в android/version.json.
Не меняйте package в AndroidManifest.xml и package Java-класса при обычном обновлении.

## Файлы результата

android/build/outputs/infosec-tickets-1.0.0.apk — подписанный релиз.
android/build/outputs/infosec-tickets-1.0.0.apk.sha256 — контрольная сумма.
Файл с суффиксом -unsigned.apk нельзя устанавливать или загружать в RuStore без подписи.
По желанию задайте INFOSEC_OUTPUT_DIR для сохранения результатов в другой папке.

Инструкция и текст карточки магазина находятся в store/rustore-listing.txt.
Политика данных — privacy.html. Её публичный адрес заработает после публикации этой ветки в Pages.

## GitHub Actions

Build Android APK проверяет тренажёр и собирает неподписанный APK для review.
Релиз подписывается только при ручном запуске workflow_dispatch с двумя repository secrets:
INFOSEC_SIGNING_KEY_BASE64 — исходный постоянный JKS, кодированный в Base64;
INFOSEC_SIGNING_PASSWORD — его пароль. В PR-сборках подпись не используется.
Секретные файлы не попадают в артефакты; после сборки временная копия удаляется.
