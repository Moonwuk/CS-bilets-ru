# Ситуационные задачи: методика и источники

Проверено: **3 октября 2026 года**. Банк `scenarios-questions.json`: **36 задач**, по 12 на направление. Это авторские учебные ситуации с вымышленными условиями. Ссылки подтверждают технические механизмы и условия, а не происшествия в названных организациях. Задачи не являются официальным экзаменом MITRE, OWASP или CVE.

## Принципы составления

- Проверяется решение по наблюдаемым фактам, ограничениям и доступным действиям. Номер техники или CVE запоминать не требуется.
- Четыре правдоподобных варианта, один лучший при заданных условиях; у каждого есть объяснение. Исходные позиции верного ответа сбалансированы: по 9 на каждую. При новой попытке порядок вопросов и вариантов перемешивается.
- Разбор отделяет подтверждённые факты от гипотез, объясняет компромиссы и условия, при которых ответ изменится. Дополнительные вопросы помогают перенести принцип на другую ситуацию.
- Обязательные факты о версиях и конфигурации видны до ответа. Сопоставление с каталогами и ссылки показаны в разборе: после проверки в обучении или завершения репетиции.
- MITRE ATT&CK используется для описания поведения; наличие одного события не доказывает всю цепочку атаки.
- Для OWASP указана редакция там, где есть номера требований: API Security 2023, ASVS 5.0.0, WSTG v4.2. Cheat Sheets — изменяемые материалы с датой проверки.
- Каждая задача CVE ссылается на официальную запись CNA в CVEProject/cvelistV5 и бюллетень или документацию проекта/производителя. Здесь 9 различных CVE, не более двух задач на один идентификатор. Номера первых исправлений — исторические сведения; практическое решение предполагает поддерживаемую исправленную сборку или проверенный перенос патча.
- Проверена близость к прежним 700 вопросам. Пересечение тем сохраняется, когда требуется другое решение. Повтор про распаковку ZIP исключён; вместо него добавлен контроль реальной параллельности при отмене фоновой работы.

## Справка и прогресс

Добавлено **53** коротких определений с примерами; общий словарь содержит **231** запись. Все `conceptIds` в новых задачах разрешаются в понятия, которые можно открыть до ответа. Общие определения не содержат ответа на конкретную задачу. Нажатие на термин внутри варианта не выбирает ответ.

Ключ сохранения нового режима — `cs-bilets-ru.scenarios.v1`. Доступны все 36 задач, направления по 12 и смешанная попытка из 10 (4/3/3 с перемешиваемой очередностью направлений), ошибки и заметки. Прежние три банка не изменены, их ключи и сигнатуры сохранения сохраняются. Страница, JSON и Android-адаптер включены в обе схемы поставки: GitHub Pages и APK.

Общий режим `all-questions.html` объединяет 600 базовых вопросов, 40 по ИИ и 36 ситуаций (676); банк «Сеньор» исключён. Он загружает исходные JSON без копирования контента и сохраняет попытку отдельно в `cs-bilets-ru.all-questions.v1`. Число вопросов вычисляется динамически. Ошибка загрузки любого входящего банка блокирует старт неполной попытки. Исходные ID, пояснения и источники сохраняются, расширенный разбор ситуаций остаётся доступен.

## Указатель задач

| Задача | Направление | Ситуация | Основа |
| --- | --- | --- | --- |
| sc001 | MITRE ATT&CK | Копии писем после смены пароля | T1114.003 |
| sc002 | MITRE ATT&CK | Возвращающийся ключ | T1098.004 |
| sc003 | MITRE ATT&CK | Изменение доступа у работающего приложения | T1098.001 |
| sc004 | MITRE ATT&CK | Тишина между запусками | T1053.006 |
| sc005 | MITRE ATT&CK | Необычный набор запросов к каталогу | T1558.003 |
| sc006 | MITRE ATT&CK | Что действительно показывает успешный вход | T1550.002 |
| sc007 | MITRE ATT&CK | Файл на соседнем сервере | T1021.002 |
| sc008 | MITRE ATT&CK | Связь через общий резолвер | T1071.004 |
| sc009 | MITRE ATT&CK | Новый файл в рабочем каталоге | T1560.001 |
| sc010 | MITRE ATT&CK | Удаления продолжаются после изоляции узла | T1490 |
| sc011 | MITRE ATT&CK | Загрузка модуля из рабочей папки | T1574.001 |
| sc012 | MITRE ATT&CK | Редкие ошибки у многих пользователей | T1110.003 |
| sc013 | OWASP | Две заявки на частичный возврат | Business Logic Security — concurrency and value invariants |
| sc014 | OWASP | Бонус после отмены заявки | WSTG v4.2 WSTG-BUSL-06 |
| sc015 | OWASP | Свободные места есть только на бумаге | API6:2023 |
| sc016 | OWASP | Редактирование профиля организации | API3:2023; Mass Assignment Cheat Sheet — General Solutions |
| sc017 | OWASP | Запросы восстановления выключают чужой вход | Forgot Password Cheat Sheet — Account Lockout |
| sc018 | OWASP | Вложение доступно во время проверки | File Upload Cheat Sheet — File Storage Location; File Content Validation |
| sc019 | OWASP | Отмена экспорта и занятые ресурсы | API4:2023; Business Logic Security — explicit state machines |
| sc020 | OWASP | Имя файла меняет режим конвертера | ASVS v5.0.0-1.2.5; OS Command Injection Defense — Argument Injection |
| sc021 | OWASP | Лишняя успешная запись в журнале | Logging Cheat Sheet — Event collection |
| sc022 | OWASP | Секрет в аналитическом событии | Third Party JavaScript Management — disclosure of sensitive information |
| sc023 | OWASP | Что подтверждает отчёт перед выпуском | ASVS 5.0.0 — verification scope and requirements |
| sc024 | OWASP | Успешная оплата с другой валютой | Third Party Payment Gateway Integration — payment verification |
| sc025 | CVE | Настройки исходящего соединения | CVE-2023-38545 |
| sc026 | CVE | Проверка временного обходного решения | CVE-2023-38545 |
| sc027 | CVE | Роли одной библиотеки в двух сервисах | CVE-2022-3602 |
| sc028 | CVE | Предложение отключить проверку сертификатов | CVE-2022-3602 |
| sc029 | CVE | Одинаковая зависимость, разная упаковка | CVE-2022-22965 |
| sc030 | CVE | Повторное уведомление после обновления | CVE-2021-41773; CVE-2021-42013 |
| sc031 | CVE | Граница подтверждённых последствий | CVE-2021-42013 |
| sc032 | CVE | Номер версии и пакет дистрибутива | CVE-2023-4911 |
| sc033 | CVE | Подписанный архив в сборочном кеше | CVE-2024-3094 |
| sc034 | CVE | После замены затронутого компонента | CVE-2024-3094 |
| sc035 | CVE | Копия библиотеки внутри обработчика изображений | CVE-2023-4863 |
| sc036 | CVE | Нагрузка при небольшом числе активных запросов | CVE-2023-44487 |

## Технические нюансы проверки

- Все 12 ситуаций вымышлены и написаны самостоятельно; они не описывают конкретные реальные инциденты и не приписываются организациям из примеров ATT&CK.
- На 2026-10-03 открыты и прочитаны официальные страницы всех 12 указанных техник. Использованы описания механики и соответствующие разделы обнаружения/мер защиты; операционные команды атак в вопросы не переносились.
- ATT&CK — классификация поведения, а не готовый обязательный регламент реагирования. Приоритеты действий, ограничения и критерии проверки в вариантах — авторские выводы из явно заданных условий сценария.
- T1574.001 в проверенной текущей версии называется DLL и включает, среди прочего, DLL Search Order Hijacking. В sc011 используется именно этот раздел; старое более узкое название не выдаётся за текущее название всей подтехники.
- В sc006 успешный NTLM-вход не считается достаточным доказательством Pass the Hash; в sc005 выдача билетов не считается доказательством успешного подбора пароля.
- В sc007 копирование файла не равно его выполнению, в sc009 локальное архивирование не равно эксфильтрации. Подтверждённые факты отделены от гипотез и пробелов телеметрии.
- Sc002 отличается от общей теории SSH: проверяется возврат ключа из облачного источника. Sc004 отличается от q247: проверяется устранение таймера, а не узнавание названия механизма. Sc011 отличается от q255: проверяется исправление порядка поиска DLL, а не доверие подписи процесса.
- Sc010 не повторяет s040 про KMS и защищённые копии: рассматривается продолжающееся удаление через облачный API после сетевой изоляции станции.
- Прежние вопросы просмотрены по индексу; автоматическое сравнение точных формулировок и лексического сходства выполнено отдельно. Повторение базовых понятий намеренное, проверяемое решение новое.

- 12 авторских учебных ситуаций sc013–sc024. Условия вымышлены, источники подтверждают механизмы и проверки; это не пересказ конкретных инцидентов.
- Проверены OWASP API Security Top 10 2023: API3, API4, API6; WSTG v4.2 WSTG-BUSL-06; ASVS stable 5.0.0 и точное требование v5.0.0-1.2.5, приведённое в README официального репозитория. Не используется нумерация из старых ASVS без версии.
- Тематические пересечения уточнены: sc013 — общий остаток денежных возвратов при разных ID запросов, а не повтор webhook; sc014 — отложенное право расхода бонуса; sc018 — доступность до сканирования и связь с версией, а не распознавание типа файла; sc019 — преждевременное освобождение квоты ещё работающим заданием; sc024 — несовпадение валюты, а не повтор либо порядок событий.
- Ограничения источников: страницы Cheat Sheets изменяемые, проверены 2026-10-03; API Top 10 и WSTG в источниках привязаны к редакции. Официальная страница ASVS и README подтверждают 5.0.0 как latest stable, несмотря на отдельно отображаемые сведения о разрабатываемой версии.
- Не утверждается, что отсутствие находок доказывает безопасность, что антивирус выявляет всё, что подпись подтверждает бизнес-смысл или что отсутствие shell предотвращает разбор опций самой программой.
- Правильные ответы распределены по четырём исходным позициям поровну; у каждого один лучший ответ, в каждом варианте есть объяснение. Сценарии допускают продолжение обсуждения через whatChangesAnswer и followUps.
- При сравнении с 700 прежними вопросами заменён первоначальный сценарий о ZIP-бомбе: он дублировал q360. Вместо него sc019 проверяет учёт продолжающихся фоновых работ после запроса отмены. sc023 расширяет простое знание границ DAST до проверки полноты доказательств относительно требований ASVS.

- 12 авторских учебных ситуаций; 9 разных идентификаторов CVE, поскольку sc030 связывает первоначальный дефект Apache и неполное исправление. Не более двух задач на один CVE.
- Все девять записей CNA прочитаны 2026-10-03 через официальный репозиторий CVEProject/cvelistV5. Проверены description, affected и references. Страница CVE.org требовала JavaScript, cveawg API и raw URL были недоступны поиску; данные получены через GitHub connector.
- Первоисточники дополнительно прочитаны: curl advisory целиком (включая ADDITIONAL INFO), OpenSSL advisory 2022-11-01, Spring security CVE-2022-22965, Apache sections CVE-2021-41773/42013, Red Hat CVE-2023-4911 Statement, XZ maintainer backdoor facts, libwebp NEWS v1.3.2, Cloudflare technical breakdown (stream concurrency, mitigation layer).
- У curl CNA version range содержит неудачное машинное представление границы: точный диапазон 7.69.0–8.3.0 и исправление 8.4.0 взяты из авторитетного бюллетеня проекта. У libwebp граница 1.3.2 сверена по NEWS проекта; формулировка описания CVE без этого неоднозначна.
- Версии в задачах обозначают исторические свойства CVE, а не рекомендуемые для установки сегодня релизы. Ответы направляют к поддерживаемой исправленной сборке или подтверждённому backport.
- Сценарии и организационные ограничения вымышлены; первоисточники подтверждают технические условия, а не происшествия в описанных компаниях. Решения о сдерживании и проверке развёртывания — авторское применение этих условий.
- Нет эксплуатационных команд, payload или инструкций атаки; акцент на применимости, области доказанного влияния, остаточном риске, цепочке поставки и подтверждении исправления.
- Ни один существующий вопрос из scenario-work/existing-questions.json не содержит выбранных CVE; единственный именованный старый CVE-вопрос q041 относится к Log4Shell и не повторяется. Тематическое пересечение (SBOM, роль конфигурации, подпись) намеренное: новые задачи требуют конкретного решения по данным бюллетеня.
- Ограничения: сценарии не подтверждают наличие уязвимостей у реального пользователя и не заменяют проверку актуального бюллетеня при работе с реальной системой. Нет заявления, что обновление отменяет прошлую компрометацию.

## Каталог первичных источников

В каждом разборе приведены только относящиеся к нему источники и указатели разделов. Полный каталог содержит 43 записей.

- `case-mitre-t1114-003`: [MITRE ATT&CK — T1114.003: Email Collection: Email Forwarding Rule](https://attack.mitre.org/techniques/T1114/003/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1098-004`: [MITRE ATT&CK — T1098.004: Account Manipulation: SSH Authorized Keys](https://attack.mitre.org/techniques/T1098/004/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1098-001`: [MITRE ATT&CK — T1098.001: Account Manipulation: Additional Cloud Credentials](https://attack.mitre.org/techniques/T1098/001/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1053-006`: [MITRE ATT&CK — T1053.006: Scheduled Task/Job: Systemd Timers](https://attack.mitre.org/techniques/T1053/006/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1558-003`: [MITRE ATT&CK — T1558.003: Steal or Forge Kerberos Tickets: Kerberoasting](https://attack.mitre.org/techniques/T1558/003/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1550-002`: [MITRE ATT&CK — T1550.002: Use Alternate Authentication Material: Pass the Hash](https://attack.mitre.org/techniques/T1550/002/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1021-002`: [MITRE ATT&CK — T1021.002: Remote Services: SMB/Windows Admin Shares](https://attack.mitre.org/techniques/T1021/002/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1071-004`: [MITRE ATT&CK — T1071.004: Application Layer Protocol: DNS](https://attack.mitre.org/techniques/T1071/004/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1560-001`: [MITRE ATT&CK — T1560.001: Archive Collected Data: Archive via Utility](https://attack.mitre.org/techniques/T1560/001/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1490`: [MITRE ATT&CK — T1490: Inhibit System Recovery](https://attack.mitre.org/techniques/T1490/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1574-001`: [MITRE ATT&CK — T1574.001: Hijack Execution Flow: DLL](https://attack.mitre.org/techniques/T1574/001/) — MITRE; проверено 2026-10-03.
- `case-mitre-t1110-003`: [MITRE ATT&CK — T1110.003: Brute Force: Password Spraying](https://attack.mitre.org/techniques/T1110/003/) — MITRE; проверено 2026-10-03.
- `case-owasp-business`: [OWASP Business Logic Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-workflow`: [OWASP WSTG v4.2 — Testing for the Circumvention of Work Flows (WSTG-BUSL-06)](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/10-Business_Logic_Testing/06-Testing_for_the_Circumvention_of_Work_Flows/) — OWASP; проверено 2026-10-03.
- `case-owasp-api6`: [OWASP API Security Top 10 2023 — API6: Unrestricted Access to Sensitive Business Flows](https://api-security.owasp.org/editions/2023/en/0xa6-unrestricted-access-to-sensitive-business-flows/) — OWASP; проверено 2026-10-03.
- `case-owasp-api3`: [OWASP API Security Top 10 2023 — API3: Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/) — OWASP; проверено 2026-10-03.
- `case-owasp-assignment`: [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-recovery`: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-uploads`: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-api4`: [OWASP API Security Top 10 2023 — API4: Unrestricted Resource Consumption](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/) — OWASP; проверено 2026-10-03.
- `case-owasp-commands`: [OWASP OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-logging`: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-third-party-js`: [OWASP Third Party JavaScript Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-owasp-asvs`: [OWASP ASVS — stable 5.0.0 and versioned requirement references](https://github.com/OWASP/ASVS) — OWASP; проверено 2026-10-03.
- `case-owasp-asvs-project`: [OWASP Application Security Verification Standard — purpose and verification scope](https://owasp.org/projects/asvs) — OWASP; проверено 2026-10-03.
- `case-owasp-payment`: [OWASP Third Party Payment Gateway Integration Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Payment_Gateway_Integration_Cheat_Sheet.html) — OWASP; проверено 2026-10-03.
- `case-cve-record-2023-38545`: [Запись CVE: CVE-2023-38545](https://github.com/CVEProject/cvelistV5/blob/main/cves/2023/38xxx/CVE-2023-38545.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2022-3602`: [Запись CVE: CVE-2022-3602](https://github.com/CVEProject/cvelistV5/blob/main/cves/2022/3xxx/CVE-2022-3602.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2022-22965`: [Запись CVE: CVE-2022-22965](https://github.com/CVEProject/cvelistV5/blob/main/cves/2022/22xxx/CVE-2022-22965.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2021-42013`: [Запись CVE: CVE-2021-42013](https://github.com/CVEProject/cvelistV5/blob/main/cves/2021/42xxx/CVE-2021-42013.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2021-41773`: [Запись CVE: CVE-2021-41773](https://github.com/CVEProject/cvelistV5/blob/main/cves/2021/41xxx/CVE-2021-41773.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2023-4911`: [Запись CVE: CVE-2023-4911](https://github.com/CVEProject/cvelistV5/blob/main/cves/2023/4xxx/CVE-2023-4911.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2024-3094`: [Запись CVE: CVE-2024-3094](https://github.com/CVEProject/cvelistV5/blob/main/cves/2024/3xxx/CVE-2024-3094.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2023-4863`: [Запись CVE: CVE-2023-4863](https://github.com/CVEProject/cvelistV5/blob/main/cves/2023/4xxx/CVE-2023-4863.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-record-2023-44487`: [Запись CVE: CVE-2023-44487](https://github.com/CVEProject/cvelistV5/blob/main/cves/2023/44xxx/CVE-2023-44487.json) — CVE Program / CNA; проверено 2026-10-03.
- `case-cve-curl`: [curl: SOCKS5 heap buffer overflow — CVE-2023-38545](https://curl.se/docs/CVE-2023-38545.html) — curl project; проверено 2026-10-03.
- `case-cve-openssl`: [OpenSSL Security Advisory, 1 November 2022](https://mta.openssl.org/pipermail/openssl-project/2022-November/003047.html) — OpenSSL project; проверено 2026-10-03.
- `case-cve-spring`: [Spring Framework RCE via Data Binding on JDK 9+](https://spring.io/security/cve-2022-22965/) — Spring / VMware; проверено 2026-10-03.
- `case-cve-apache`: [Apache HTTP Server: CVE-2021-42013 и CVE-2021-41773](https://httpd.apache.org/security/vulnerabilities_24.html#CVE-2021-42013) — Apache HTTP Server project; проверено 2026-10-03.
- `case-cve-glibc`: [Red Hat: CVE-2023-4911, описание и статус RHEL](https://access.redhat.com/security/cve/cve-2023-4911) — Red Hat Product Security; проверено 2026-10-03.
- `case-cve-xz`: [XZ Utils backdoor: facts and review notes](https://tukaani.org/xz-backdoor/) — XZ Utils / Lasse Collin; проверено 2026-10-03.
- `case-cve-libwebp`: [libwebp NEWS: security fix in version 1.3.2](https://github.com/webmproject/libwebp/blob/main/NEWS) — WebM project; проверено 2026-10-03.
- `case-cve-rapid-reset`: [HTTP/2 Rapid Reset: deconstructing the record-breaking attack](https://blog.cloudflare.com/technical-breakdown-http2-rapid-reset-ddos-attack/) — Cloudflare engineering; проверено 2026-10-03.

## Проверки

```bash
node --check app.js
node --check case-trainer.js
node --check all-questions.js
node --check glossary.js
node tests/check-trainer.cjs
node tests/check-case-trainer.cjs
node tests/check-glossary.cjs
node tests/check-scenarios.cjs
node tests/check-all-questions.cjs
```

Проверки покрывают структуру банка, источники, кликабельность всех обязательных понятий, скрытие разбора в репетиции, возобновление, отдельные сохранения, заметки, сброс, обратную связь, наличие файлов в Pages и Android. Проверки интерфейсной логики выполняются в Node VM с моделью DOM. Они не заменяют проверку отображения в настоящем браузере и запуск APK на устройстве.
