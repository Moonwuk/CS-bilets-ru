# Технические сценарии и защита ИИ: методика и источники

Дата сверки: **2 октября 2026 года**. Этот документ описывает два дополнительных учебных банка: 60 технических сценариев и 40 сценариев по защите ИИ. Исходный банк из 500 вопросов хранится отдельно.

## Что проверяют задания

Сложность определяется необходимостью связать наблюдения с механизмом защиты, выделить доверенную сторону, учесть ограничения и выбрать проверяемое решение. Знания названия технологии недостаточно: в условиях могут отличаться получатель полномочий, момент проверки, версия данных, доступная телеметрия или путь исполнения.

Сценарии вымышленные и написаны для тренажёра. Публичные подборки собеседований используются для выбора тем. Они не считаются первоисточником технических гарантий и не подтверждают, что конкретный работодатель задавал авторское задание. Ответы проверяются по RFC, документации разработчиков, опубликованным руководствам и первичным исследованиям.

Каждое задание включает факты, ограничения, четыре варианта и один лучший ответ при этих условиях. Разбор объясняет все варианты, исходные понятия, последовательность рассуждений, компромиссы и конкретное изменение условий, которое потребует пересмотреть решение. Два дополнительных вопроса развивают обсуждение и имеют собственные ответы для самопроверки.

Письменное объяснение в интерфейсе оценивает сам учащийся. Сравнивать полезно три вещи: назван ли решающий факт, описан ли механизм, предложен ли способ проверить результат. Процент правильных вариантов относится только к конкретной попытке; он не удостоверяет профессиональную квалификацию.

## Подход к актуальности

Для новых сценариев использованы опубликованные на дату сверки документы. Ссылки на живую документацию могут измениться; версия протокола, режим библиотеки или условия облачной политики фиксируются в самом сценарии, когда от них зависит ответ. Нельзя переносить ответ на другую конфигурацию без повторной проверки предпосылок.

В материалах по ИИ различаются редакция OWASP GenAI LLM Top 10 2026, отдельное руководство OWASP Top 10 for Agentic Applications 2026 и таксономия NIST AI 100-2 E2025. Это разные документы с разными задачами. Категория риска помогает найти поверхность атаки, а проверку полномочий и действия защитного механизма нужно описывать отдельно.

Гарантии ИИ-защит сформулированы в пределах модели угроз: фильтр, системная инструкция или хороший результат на ограниченном наборе тестов сами по себе не доказывают отсутствие атак. В сценариях проверяется, где приложение действительно ограничивает доступ, выполнение кода, передачу данных или расход ресурсов, а где результат зависит от поведения модели.

При работе с OWASP использовано обозначение редакции 2026 года: страницы проекта расходятся в дате её объявления на один день, поэтому точная дата выпуска не используется как предпосылка ответа. Положения LLM Top 10 проверены по опубликованным Markdown-разделам. Страница отдельного Agentic Top 10 просмотрена, но его PDF получить не удалось; ответы на агентные задания опираются на доступные первичные материалы из каталога, включая OWASP AI Agent Security. MCP Security Best Practices закреплён на редакции 2025-11-25, а условия vLLM v0.25.1 указаны в соответствующих заданиях. Более ранние первичные работы используются для устойчивых принципов; их устаревшие практические рекомендации не переносятся в современные решения.

Доступность материалов проверялась на дату исследования. Для работы Axelsson о базовой частоте прочитана аннотация в научном архиве CERIAS и проверен список публикаций автора, полный текст не был получен; числовой пример s046 составлен отдельно и проверен арифметически. Недоступные страницы не выдаются за прочитанные источники: где возможно, использована официальная публикация того же документа у соавтора или альтернативная официальная страница.

## Учебная последовательность

Начните с базовых тем обычного банка, затем откройте одно направление с разбором. Сначала объясните свой выбор, потом сравните его с вариантами и источниками. После разбора измените одно условие из блока «Что изменит ответ» и попробуйте заново вывести решение. Закрепите материал повторением ошибок и смешанной попыткой без подсказок.

## Открытые подборки технических собеседований

- [Tad Whitaker — Security Architect and Principal Security Engineer Interview Questions](https://github.com/tadwhitaker/Security_Architect_and_Principal_Security_Engineer_Interview_Questions/blob/main/Security_Architect_and_Principal_Security_Engineer_Interview_Questions.md). Карта тем технических интервью: TLS, DNS, межсетевые экраны, облачные полномочия, архитектура и моделирование угроз. Публикация автора основана на сообщениях кандидатов; принадлежность отдельного вопроса работодателю не проверялась. Сценарии тренажёра написаны самостоятельно.
- [jassics — Security Architect Scenario Based Interview Questions](https://github.com/jassics/security-interview-questions/blob/main/Security_Architect_Scenario_Questions.md). Темы архитектурного интервью: изоляция клиентов, ключи, федерация удостоверений, контейнеры и цепочка поставки. Использовано для выбора направлений; технические выводы в заданиях опираются на отдельные первоисточники.
- [jassics — API Security Interview Questions](https://github.com/jassics/security-interview-questions/blob/main/api-security-interview-questions.md). Темы интервью по API: авторизация ресурсов, OAuth/OIDC, GraphQL, доверие между сервисами. Конкретные условия, варианты ответов и учебные разборы составлены для этого тренажёра.
- [LetsDefend — SOC Interview Questions](https://github.com/LetsDefend/SOC-Interview-Questions). Карта тем для SOC и реагирования. Сложные сценарии расширяют эти направления через оценку достоверности событий, ограничения телеметрии и проверку результата сдерживания.

## Проверка и сопровождение

Все новые задания прочитаны отдельным рецензентом вместе с объяснениями и продолжениями. В ходе проверки уточнены момент отзыва доступа в s016, свежесть снимка транзакции при блокировке в s022, область гарантий TLS и IPv6, смысл пересмотра прошлых решений в s048 и индивидуальный отзыв права в ai018. Проверены расчёты, привязка ссылок к разделам и варианты ответа; систематическая подсказка по длине правильного варианта устранена.

Автоматические проверки подтверждают структуру банков, единственный правильный вариант, наличие всех частей разбора и ссылок на записи каталога, работу попыток и сохранений. Они не заменяют содержательное рецензирование: при изменении задания нужно отдельно проверить его предпосылки, конкурирующие ответы и соответствие конкретному разделу источника.

Проверки интерфейса исполняют настоящий JavaScript приложения в Node.js с моделью DOM и событий. Оба полных банка проходят попытку в режиме собеседования. Отдельно проверены состав пакета GitHub Pages и относительные пути ресурсов. Визуальная проверка в настоящем браузере в этой среде не выполнена: исполняемый файл Chromium отсутствует.

При обновлении сохраняйте идентификатор задания, если его учебная цель остаётся прежней. Когда меняются существенные условия или правильный вариант, текущие попытки должны проходить предусмотренную движком проверку совместимости. Не смешивайте ID и статистику трёх банков.

Команды проверки из корня репозитория:

```bash
node tests/check-trainer.cjs
node tests/check-case-trainer.cjs
```

## Состав и указатель первоисточников

Ссылки ниже соответствуют полю `references` каждого задания. Указание раздела помогает найти правило, которым обоснован ответ; само наличие ссылки не превращает авторский учебный сценарий в официальный экзаменационный вопрос.

### Сеньор: технические сценарии

Заданий: 60. Первичных источников: 84. Дата сверки: 2026-10-02.

#### Сети и криптография

Гарантии протоколов, доверие к ключам, маршрутизация и диагностика.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| s001 | Повтор раннего запроса через несколько регионов | [RFC 8470: Using Early Data in HTTP](https://www.rfc-editor.org/rfc/rfc8470.html) — §3 Supporting Early Data in HTTP Servers; §5.1 Early-Data; §5.2 425; §6.2 Consistent Handling of Early Data |
| s002 | DNSSEC: новый ключ виден не всем резолверам | [RFC 7583: DNSSEC Key Rollover Timing Considerations](https://www.rfc-editor.org/rfc/rfc7583.html) — §2.2 KSK Rollovers; §3.3.1 Double-KSK Method; §3.3.3 Double-RRset Method; [RFC 6781: DNSSEC Operational Practices, Version 2](https://www.rfc-editor.org/rfc/rfc6781.html) — §4.1 Key Rollovers: coordinated key publication and cache considerations |
| s003 | Разрешённый origin, но маршрут RPKI Invalid | [RFC 6811: BGP Prefix Origin Validation](https://datatracker.ietf.org/doc/html/rfc6811) — §2 Prefix-to-AS Mapping Database: Covered, Matched, Valid/Invalid/NotFound; §3 Policy Control; §7 Security Considerations |
| s004 | Асимметрия двух независимых межсетевых экранов | [Egress Path and Symmetric Return](https://docs.paloaltonetworks.com/pan-os/11-1/pan-os-admin/policy/policy-based-forwarding/pbf/egress-path-and-symmetric-return) — Egress Path and Symmetric Return: differing SYN/SYN-ACK paths and return-path control |
| s005 | QUIC: тот же сеанс после смены сети | [RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport](https://www.rfc-editor.org/rfc/rfc9000.html) — §5.1 Connection ID; §8.2 Path Validation; §9 Connection Migration; §9.3.1 Peer Address Spoofing |
| s006 | QUIC: большая цепочка сертификатов и бюджет ответа | [RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport](https://www.rfc-editor.org/rfc/rfc9000.html) — §8 Address Validation; §8.1 Address Validation during Connection Establishment; §8.1.2 Address Validation Using Retry Packets; §14 Datagram Size |
| s007 | TLS 1.3 и ECH: границы пассивного наблюдения | [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/info/rfc9846/) — §1.3 Major Differences from TLS 1.2: encrypted handshake and forward secrecy; §2 Protocol Overview; [RFC 9849: TLS Encrypted Client Hello](https://www.rfc-editor.org/rfc/rfc9849.html) — §1 Introduction; §8 Deployment Considerations; §10.1 Security and Privacy Goals |
| s008 | RA Guard есть, а ложный IPv6-шлюз появляется | [RFC 7113: Implementation Advice for IPv6 Router Advertisement Guard (RA-Guard)](https://www.rfc-editor.org/rfc/rfc7113.html) — §2 Evasion Techniques; §3 RA-Guard Implementation Advice; §5 Security Considerations; [RFC 6980: Security Implications of IPv6 Fragmentation with IPv6 Neighbor Discovery](https://www.rfc-editor.org/info/rfc6980/) — §5 Specification: rejecting fragmented Neighbor Discovery messages |
| s009 | AES-GCM после клонирования снапшота | [NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) — §8 Uniqueness Requirement on IVs and Keys; §8.1 Key Establishment; §8.2.1 Deterministic Construction; §9 Practical Considerations |
| s010 | Корректный ciphertext оказался у другого клиента | [RFC 5116: An Interface and Algorithms for Authenticated Encryption](https://www.rfc-editor.org/rfc/rfc5116.html) — §2.1 Authenticated Encryption; §2.2 Authenticated Decryption; §3.3 Construction of AEAD Inputs |
| s011 | KeyUpdate после утечки traffic secret | [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/info/rfc9846/) — §4.7.3 Key and Initialization Vector Update; §7.2 Updating Traffic Secrets; Appendix F.2 Record Layer: no post-compromise security for a revealed traffic secret |
| s012 | Подпись сертификата верна, полномочий CA недостаточно | [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile](https://www.rfc-editor.org/rfc/rfc5280.html) — §4.2 Certificate Extensions; §4.2.1.10 Name Constraints; §6 Certification Path Validation; [RFC 9525: Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html) — §3 Designing Application Protocols; §6.1 Constructing a List of Reference Identifiers; §6 Verifying Service Identity |
| s013 | NTS подтверждает источник, но часы всё равно смещаются | [RFC 8915: Network Time Security for the Network Time Protocol](https://www.rfc-editor.org/rfc/rfc8915.html) — §8.6 Delay Attacks; §8 Security Considerations; [RFC 8633: Network Time Protocol Best Current Practices](https://www.rfc-editor.org/rfc/rfc8633.html) — §3.2 Using Enough Time Sources; §3.3 Using a Diversity of Reference Clocks |
| s014 | SSH host certificates без доверия к первому увиденному ключу | [OpenBSD ssh-keygen(1): CERTIFICATES and KEY REVOCATION LISTS](https://man.openbsd.org/ssh-keygen.1) — CERTIFICATES: host certificates, principals, validity; KEY REVOCATION LISTS; [OpenBSD sshd(8): SSH_KNOWN_HOSTS FILE FORMAT](https://man.openbsd.org/sshd.8) — SSH_KNOWN_HOSTS FILE FORMAT: @cert-authority, hostname patterns and @revoked |
| s015 | Отзыв mTLS: старые соединения и session tickets | [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/info/rfc9846/) — §2.2 Resumption and Pre-Shared Key; §4.7.1 New Session Ticket: lifetime, certificate and revocation considerations; §4.7.3 Key and Initialization Vector Update; [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile](https://www.rfc-editor.org/rfc/rfc5280.html) — §5 CRL and CRL Extensions Profile; §6.3 CRL Validation |

#### AppSec и управление доступом

Авторизация, OAuth/OIDC, многопользовательские сервисы и конкурентные операции.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| s016 | Отозванный доступ и фоновая выгрузка | [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Validate the Permissions on Every Request; Enforce Authorization Checks on Static Resources; [Multi-Tenant Application Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html) — Tenant Context Management; Data Isolation; File Storage Isolation; [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html) — Description: изменение состояния между проверкой и использованием; граница гарантии нового допуска |
| s017 | Новые данные со старым ACL | [SpiceDB: Consistency and ZedTokens](https://authzed.com/docs/spicedb/concepts/consistency) — At Least As Fresh; At Exact Snapshot; Fully Consistent; Storing ZedTokens |
| s018 | OAuth: правильный state, неверный издатель | [RFC 9207: OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html) — 2.4 Validating the Issuer Identifier; 4 Security Considerations; [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) — 2.1 Protecting Redirect-Based Flows; 4.4 Mix-Up Attacks |
| s019 | Одна подпись, разные виды JWT | [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html) — 2.8 Cross-JWT Confusion; 3.11 Use Explicit Typing; 3.12 Use Mutually Exclusive Validation Rules; [RFC 9068: JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html) — 2.1 Header; 4 Validating JWT Access Tokens; [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) — 4.15 Client Impersonating Resource Owner |
| s020 | Ротация refresh token и неоднозначный повтор | [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) — 2.2.2 Refresh Tokens; 4.14.2 Recommendations |
| s021 | SSRF между проверкой DNS и соединением | [Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — Case 2: Application can send requests to ANY external IP address or domain name; Available protections; Network layer; [CURLOPT_RESOLVE: provide custom hostname to IP address resolves](https://curl.se/libcurl/c/CURLOPT_RESOLVE.html) — Description: custom hostname-to-address resolution, host and port rules; [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html) — Description; Potential Mitigations |
| s022 | Два администратора одновременно снимают свои права | [PostgreSQL 18: Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html) — 13.2.1 Read Committed Isolation Level; 13.2.2 Repeatable Read Isolation Level; 13.2.3 Serializable Isolation Level |
| s023 | Неизвестный результат внешнего платежа | [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) — Idempotent requests: saved result, matching parameters, key retention; [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Validate the Permissions on Every Request; Ensure Lookup IDs are Not Accessible Even When Guessed |
| s024 | Связывание аккаунтов по подтверждённой почте | [OpenID Connect Core 1.0 incorporating errata set 2](https://openid.net/specs/openid-connect-core-1_0.html) — 5.7 Claim Stability and Uniqueness; 5.1 Standard Claims; [User Account Linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking) — Precautions; Suggested account linking |
| s025 | Подписанные события пришли в обратном порядке | [Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks) — Event ordering; Handle duplicate events; Verify webhook signatures; [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — 2.5 Application should control which transaction state transitions are allowed |
| s026 | Доверенный загрузчик обходит ожидания от CSP | [Content Security Policy Level 3 — Working Draft, 16 September 2026](https://www.w3.org/TR/2026/WD-CSP3-20260916/) — 8.2 Usage of 'strict-dynamic'; 8.5 Strict CSP; [Trusted Types](https://www.w3.org/TR/trusted-types/) — TrustedScriptURL; Trusted Type Policies; require-trusted-types-for |
| s027 | WebSocket после входа с недоверенного поддомена | [WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html) — Origin Header Validation; Session Management; Message-Level Authorization; [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455.html) — 10.2 Origin Considerations; 10.5 WebSocket Client Authentication |
| s028 | Подтверждён перевод, но изменился получатель | [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — 2.3 Transaction verification data should be generated server-side; 2.6 Transaction data should be protected against modification; 2.8–2.10; [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html) — Description; Potential Mitigations |
| s029 | Безопасный путь изменился до open | [openat2(2): Linux manual page](https://man7.org/linux/man-pages/man2/openat2.2.html) — RESOLVE_BENEATH; RESOLVE_NO_SYMLINKS; ERRORS: EAGAIN and EXDEV; [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html) — Description; Demonstrative Examples; Potential Mitigations |
| s030 | HTTP/2 на входе, неоднозначный HTTP/1.1 на выходе | [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html) — 8.1.1 Malformed Messages; 8.2.1 Field Validity; 8.2.2 Connection-Specific Header Fields; [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html) — 6.3 Message Body Length; 11.2 Request Smuggling |

#### Облака и платформы

IAM, Kubernetes, CI/CD, цепочка поставки и восстановление.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| s031 | Почему permissions boundary не остановила запись | [Permissions boundaries for IAM entities](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html) — Evaluating effective permissions with boundaries — IAM role session; explicit Deny overrides Allow |
| s032 | Отзыв доступа после цепочки AssumeRole | [Revoke IAM role temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html) — Revoking session permissions before a specified time; scope of AWSRevokeOlderSessions; [How to revoke federated users’ active AWS sessions](https://aws.amazon.com/blogs/security/how-to-revoke-federated-users-active-aws-sessions/) — Session duration overview; Revoke active sessions when role chaining |
| s033 | Право менять код как косвенный доступ к данным | [Defining Lambda function permissions with an execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html) — Execution role grants the function access; Lambda assumes the execution role on invocation; [Granting users access to a Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/permissions-user-function.html) — PassExecutionRole — PassRole is used when assigning an execution role; [UpdateFunctionCode](https://docs.aws.amazon.com/lambda/latest/api/API_UpdateFunctionCode.html) — UpdateFunctionCode — published versions are immutable; update of $LATEST |
| s034 | Restricted включён, privileged Pod продолжает работать | [Enforce Pod Security Standards with Namespace Labels](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-namespace-labels/) — Add labels to existing namespaces with kubectl label — existing violations are warnings; [Pod Security Admission](https://kubernetes.io/docs/concepts/security/pod-security-admission/) — Pod Security levels; enforce, audit and warn modes; workload resources and Pod admission |
| s035 | Нет get secrets, но можно создавать workload | [Role Based Access Control Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/) — Kubernetes RBAC — privilege escalation risks: Workload creation; boundaries within a namespace; [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) — Role and ClusterRole — permissions are purely additive |
| s036 | Граница между недоверенными арендаторами | [Multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/) — Data Plane Isolation — Sandboxing containers; Node Isolation; shared services and lateral movement; [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) — Containers are not a security boundary; node applications can have wider Kubernetes API permissions |
| s037 | Почему новая default-deny не перекрыла egress | [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) — The two sorts of pod isolation — additive union; Default deny all egress traffic; NetworkPolicy's impact on existing connections |
| s038 | IRSA настроена, но запрос ушёл с ролью узла | [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html) — Credential isolation; unrestricted IMDS exposes node IAM role; hostNetwork note; containers are not a security boundary; [Identity and Access Management — Amazon EKS Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/identity-and-access-management.html) — Restrict access to the instance profile assigned to the worker node — IMDSv2 and hop limit |
| s039 | Ротация ключа etcd и старые снимки | [Encrypting Confidential Data at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/) — Reconfigure other control plane hosts; Ensure all relevant data are encrypted; Rotate a decryption key |
| s040 | Неудаляемый архив с удаляемым ключом | [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html) — Using Object Lock with encryption — Object Lock does not protect encryption keys; [Delete an AWS KMS key](https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html) — Deleting KMS keys — permanent loss; waiting period; PendingDeletion state |
| s041 | Подпись верна, сборочная платформа скомпрометирована | [SLSA v1.1 — Supply chain threats](https://slsa.dev/spec/v1.1/threats-overview) — Build integrity; threat E — compromise of build process; [SLSA v1.1 — Producing artifacts](https://slsa.dev/spec/v1.1/requirements) — Build platform; Provenance generation; authenticity versus accuracy; [SLSA v1.1 — Verifying build platforms](https://slsa.dev/spec/v1.1/verifying-systems) — Threat model; assessment of control plane, build environments, caches and outputs |
| s042 | Недоверенный артефакт между двумя workflows | [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows) — workflow_run — access to secrets and write tokens; security warning; using data from triggering workflow; [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use) — Mitigating the risks of untrusted code checkout — workflow_run and untrusted artifacts |
| s043 | Environment в OIDC не равен защищённой ветке | [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws) — Configuring the role and trust policy — environment subject and protection rules; immutable subject note; Adding permissions settings; [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use) — Using secrets — required reviewers; mitigating untrusted code checkout |
| s044 | Admission webhook блокирует собственное восстановление | [Admission Webhook Good Practices](https://kubernetes.io/docs/concepts/cluster-administration/admission-webhooks-good-practices/) — Avoid self-mutations; Avoid dependency loops; Use a high-availability deployment model; Limit the scope of each webhook; [Disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/) — Pod disruption budgets — involuntary disruptions cannot be prevented by PDBs |
| s045 | Общие Terraform outputs открыли полный state | [The terraform_remote_state Data Source](https://developer.hashicorp.com/terraform/language/state/remote-state-data) — Alternative Ways to Share Data Between Configurations — access to the entire state snapshot; separate outputs API; [Manage sensitive data in your configuration](https://developer.hashicorp.com/terraform/language/manage-sensitive-data) — Hide sensitive variables and outputs; sensitive values remain in state; requirements for ephemeral and write-only support |

#### SOC и расследование

Детектирование, достоверность событий, сдерживание и проверка восстановления.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| s046 | Редкая атака и цена автоматической блокировки | [The Base-Rate Fallacy and its Implications for the Difficulty of Intrusion Detection](https://www.cerias.purdue.edu/apps/reports_and_papers/view/2815/) — Abstract: false alarm rate and base-rate fallacy in intrusion detection; [NIST IR 7007: An Overview of Issues in Testing Intrusion Detection Systems](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir7007.pdf) — Sections 3.2–3.3: false alarm rate, detection probability and the unit of measurement |
| s047 | Запоздавшие события и окно корреляции | [Troubleshoot detection rules](https://www.elastic.co/docs/troubleshoot/security/detection-rules) — Troubleshoot gaps; Troubleshoot ingestion pipeline delay; Timestamp override |
| s048 | Поздняя телеметрия и пересмотр закрытых тревог | [Sysmon: capabilities, events and configuration](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon) — Overview of Sysmon Capabilities; Event ID 1: Process creation; Event ID 3: Network connection; Event ID 5: Process terminated; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.AN-06: recording investigation actions and preserving integrity and provenance of records |
| s049 | Кому принадлежал адрес во время соединения | [RFC 6302: Logging Recommendations for Internet-Facing Servers](https://www.rfc-editor.org/rfc/rfc6302.html) — Sections 1–2 and 4: shared addresses, source ports, accurate timestamps and attribution limits; [Best practices for event logging and threat detection](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/best-practices-for-event-logging-and-threat-detection) — Event log quality; Timestamp consistency; Centralised log collection and correlation |
| s050 | Восемь гигабайт трафика: копирование или утечка | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) — Section 6.3: network data collection limitations, Encrypted Traffic; Section 6.4.2: correlating network data; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.AN-03: establish incident events and root causes; RS.AN-08: estimate and validate incident magnitude |
| s051 | Правило исправно, но обнаружение перестало работать | [Implementing SIEM and SOAR platforms: Practitioner guidance](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance) — Section 11: Test your SIEM and/or SOAR’s performance; full log-to-response pipeline; [Troubleshoot detection rules](https://www.elastic.co/docs/troubleshoot/security/detection-rules) — Troubleshoot missing alerts and ingestion pipeline delay |
| s052 | После блокировки исходной учётной записи доступ остался | [Thanksgiving 2023 security incident](https://blog.cloudflare.com/thanksgiving-2023-security-incident/) — October 18 credential rotation gap; November 16 creation of an Atlassian user account; remediation and persistence investigation; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.MI-01: containment; RS.MI-02: eradication and persistence; RS.AN-07: evidence preservation |
| s053 | Ротация krbtgt после восстановления доверия | [Active Directory Forest Recovery: Reset the krbtgt password](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-reset-the-krbtgt-password) — Reset the krbtgt password: two resets, configured ticket lifetime, password history and writable-DC scope; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.MI-02: eliminate persistence and entry points; RC.RP-05: integrity and root causes before production use |
| s054 | Нулевой результат при неполной наблюдаемости | [Best practices for event logging and threat detection](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/best-practices-for-event-logging-and-threat-detection) — Event log quality; centralised correlation and event logging policy; [Implementing SIEM and SOAR platforms: Practitioner guidance](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance) — Incomplete or inconsistent data and false negatives; Section 11: platform performance testing; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.AN-08: estimate and validate magnitude across known and potential targets |
| s055 | Прогноз эксплуатации против наблюдаемого инцидента | [EPSS Frequently Asked Questions](https://www.first.org/epss/faq) — How do I apply a population-level score to my specific environment?; Is EPSS a risk score?; Common confusions; [Using SSVC: stakeholder roles, decisions and decision points](https://certcc.github.io/SSVC/howto/) — Using SSVC: stakeholder decisions, decision points and local context; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.MI-02: eradicate persistence and exploited vulnerabilities |
| s056 | Часовой пояс, поправка часов и причинность | [RFC 5424: The Syslog Protocol](https://www.rfc-editor.org/rfc/rfc5424) — Section 6.2.3: TIMESTAMP; Sections 7.1.1–7.1.4: timeQuality and syncAccuracy; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.AN-03: determine the sequence of incident events |
| s057 | Целостный образ уже изменённой системы | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf) — Sections 4.2.2–4.2.3: write-blocking, imaging integrity, timestamps and preservation; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RS.AN-06 and RS.AN-07: preserve integrity and provenance of investigative records and incident data |
| s058 | Восстановленная база и повторные внешние операции | [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) — Reducing client complexity with idempotent API design; unique client request identifiers; late-arriving requests; [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf) — RC.RP-04 and RC.RP-05: confirm operational restoration and verify correctness before production use |
| s059 | Смещение отбора при оценке нового детектора | [NIST IR 7007: An Overview of Issues in Testing Intrusion Detection Systems](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir7007.pdf) — Sections 3.2–3.3: environment, operating point and detection measurement; Section 6: realistic datasets and evaluation limits; [Implementing SIEM and SOAR platforms: Practitioner guidance](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance) — False positives and false negatives; Section 11: repeated and new scenario testing |
| s060 | Исключение для подписанного инструмента | [DET0081: Detection of Proxy Execution via Trusted Signed Binaries Across Platforms](https://attack.mitre.org/detectionstrategies/DET0081/) — AN0226: trusted signed binary execution, parent relationships, command-line arguments and remote-domain context; [Implementing SIEM and SOAR platforms: Practitioner guidance](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance) — Section 11: repeated and new test scenarios; false negatives from under-sensitive filters |

#### Каталог материалов

- `sn-tls13` — [RFC 9846: The Transport Layer Security (TLS) Protocol Version 1.3](https://www.rfc-editor.org/info/rfc9846/); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-early-http` — [RFC 8470: Using Early Data in HTTP](https://www.rfc-editor.org/rfc/rfc8470.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-dns-rollover` — [RFC 7583: DNSSEC Key Rollover Timing Considerations](https://www.rfc-editor.org/rfc/rfc7583.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-dns-operations` — [RFC 6781: DNSSEC Operational Practices, Version 2](https://www.rfc-editor.org/rfc/rfc6781.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-rpki` — [RFC 6811: BGP Prefix Origin Validation](https://datatracker.ietf.org/doc/html/rfc6811); IETF; просмотрено 2026-10-02.
- `sn-asymmetry` — [Egress Path and Symmetric Return](https://docs.paloaltonetworks.com/pan-os/11-1/pan-os-admin/policy/policy-based-forwarding/pbf/egress-path-and-symmetric-return); Palo Alto Networks; просмотрено 2026-10-02.
- `sn-quic` — [RFC 9000: QUIC: A UDP-Based Multiplexed and Secure Transport](https://www.rfc-editor.org/rfc/rfc9000.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-ech` — [RFC 9849: TLS Encrypted Client Hello](https://www.rfc-editor.org/rfc/rfc9849.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-ra-guard` — [RFC 7113: Implementation Advice for IPv6 Router Advertisement Guard (RA-Guard)](https://www.rfc-editor.org/rfc/rfc7113.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-nd-fragments` — [RFC 6980: Security Implications of IPv6 Fragmentation with IPv6 Neighbor Discovery](https://www.rfc-editor.org/info/rfc6980/); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-gcm` — [NIST SP 800-38D: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf); NIST; просмотрено 2026-10-02.
- `sn-aead` — [RFC 5116: An Interface and Algorithms for Authenticated Encryption](https://www.rfc-editor.org/rfc/rfc5116.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-pkix` — [RFC 5280: Internet X.509 Public Key Infrastructure Certificate and Certificate Revocation List (CRL) Profile](https://www.rfc-editor.org/rfc/rfc5280.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-service-identity` — [RFC 9525: Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-nts` — [RFC 8915: Network Time Security for the Network Time Protocol](https://www.rfc-editor.org/rfc/rfc8915.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-ntp-operations` — [RFC 8633: Network Time Protocol Best Current Practices](https://www.rfc-editor.org/rfc/rfc8633.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `sn-ssh-keygen` — [OpenBSD ssh-keygen(1): CERTIFICATES and KEY REVOCATION LISTS](https://man.openbsd.org/ssh-keygen.1); OpenBSD / OpenSSH; просмотрено 2026-10-02.
- `sn-sshd` — [OpenBSD sshd(8): SSH_KNOWN_HOSTS FILE FORMAT](https://man.openbsd.org/sshd.8); OpenBSD / OpenSSH; просмотрено 2026-10-02.
- `sa-authz` — [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `sa-tenancy` — [Multi-Tenant Application Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `sa-consistency` — [SpiceDB: Consistency and ZedTokens](https://authzed.com/docs/spicedb/concepts/consistency); Authzed; просмотрено 2026-10-02.
- `sa-oauth-bcp` — [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html); IETF; просмотрено 2026-10-02.
- `sa-oauth-issuer` — [RFC 9207: OAuth 2.0 Authorization Server Issuer Identification](https://www.rfc-editor.org/rfc/rfc9207.html); IETF; просмотрено 2026-10-02.
- `sa-jwt-bcp` — [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html); IETF; просмотрено 2026-10-02.
- `sa-jwt-access` — [RFC 9068: JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html); IETF; просмотрено 2026-10-02.
- `sa-ssrf` — [Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `sa-curl-resolve` — [CURLOPT_RESOLVE: provide custom hostname to IP address resolves](https://curl.se/libcurl/c/CURLOPT_RESOLVE.html); curl project; просмотрено 2026-10-02.
- `sa-pg-isolation` — [PostgreSQL 18: Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html); PostgreSQL Global Development Group; просмотрено 2026-10-02.
- `sa-stripe-idempotency` — [Idempotent requests](https://docs.stripe.com/api/idempotent_requests); Stripe; просмотрено 2026-10-02.
- `sa-stripe-webhooks` — [Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks); Stripe; просмотрено 2026-10-02.
- `sa-oidc-core` — [OpenID Connect Core 1.0 incorporating errata set 2](https://openid.net/specs/openid-connect-core-1_0.html); OpenID Foundation; просмотрено 2026-10-02.
- `sa-account-linking` — [User Account Linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking); Auth0 / Okta; просмотрено 2026-10-02.
- `sa-csp3` — [Content Security Policy Level 3 — Working Draft, 16 September 2026](https://www.w3.org/TR/2026/WD-CSP3-20260916/); W3C; просмотрено 2026-10-02.
- `sa-websocket` — [WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `sa-websocket-rfc` — [RFC 6455: The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455.html); IETF; просмотрено 2026-10-02.
- `sa-transaction-authz` — [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `sa-openat2` — [openat2(2): Linux manual page](https://man7.org/linux/man-pages/man2/openat2.2.html); Linux man-pages project; просмотрено 2026-10-02.
- `sa-toctou` — [CWE-367: Time-of-check Time-of-use (TOCTOU) Race Condition](https://cwe.mitre.org/data/definitions/367.html); MITRE; просмотрено 2026-10-02.
- `sa-http1` — [RFC 9112: HTTP/1.1](https://www.rfc-editor.org/rfc/rfc9112.html); IETF; просмотрено 2026-10-02.
- `sa-http2` — [RFC 9113: HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html); IETF; просмотрено 2026-10-02.
- `sa-trusted-types` — [Trusted Types](https://www.w3.org/TR/trusted-types/); W3C; просмотрено 2026-10-02.
- `sc-iam-boundaries` — [Permissions boundaries for IAM entities](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html); AWS; просмотрено 2026-10-02.
- `sc-iam-revoke` — [Revoke IAM role temporary security credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_revoke-sessions.html); AWS; просмотрено 2026-10-02.
- `sc-iam-chain` — [How to revoke federated users’ active AWS sessions](https://aws.amazon.com/blogs/security/how-to-revoke-federated-users-active-aws-sessions/); AWS Security Blog; просмотрено 2026-10-02.
- `sc-lambda-user` — [Granting users access to a Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/permissions-user-function.html); AWS; просмотрено 2026-10-02.
- `sc-lambda-role` — [Defining Lambda function permissions with an execution role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html); AWS; просмотрено 2026-10-02.
- `sc-lambda-code` — [UpdateFunctionCode](https://docs.aws.amazon.com/lambda/latest/api/API_UpdateFunctionCode.html); AWS; просмотрено 2026-10-02.
- `sc-pod-admission` — [Pod Security Admission](https://kubernetes.io/docs/concepts/security/pod-security-admission/); Kubernetes; просмотрено 2026-10-02.
- `sc-pod-labels` — [Enforce Pod Security Standards with Namespace Labels](https://kubernetes.io/docs/tasks/configure-pod-container/enforce-standards-namespace-labels/); Kubernetes; просмотрено 2026-10-02.
- `sc-rbac-practices` — [Role Based Access Control Good Practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/); Kubernetes; просмотрено 2026-10-02.
- `sc-rbac` — [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/); Kubernetes; просмотрено 2026-10-02.
- `sc-multitenancy` — [Multi-tenancy](https://kubernetes.io/docs/concepts/security/multi-tenancy/); Kubernetes; просмотрено 2026-10-02.
- `sc-network-policies` — [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/); Kubernetes; просмотрено 2026-10-02.
- `sc-irsa` — [IAM roles for service accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html); AWS; просмотрено 2026-10-02.
- `sc-etcd-encryption` — [Encrypting Confidential Data at Rest](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/); Kubernetes; просмотрено 2026-10-02.
- `sc-object-lock` — [Object Lock considerations](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock-managing.html); AWS; просмотрено 2026-10-02.
- `sc-kms-deletion` — [Delete an AWS KMS key](https://docs.aws.amazon.com/kms/latest/developerguide/deleting-keys.html); AWS; просмотрено 2026-10-02.
- `sc-slsa-threats` — [SLSA v1.1 — Supply chain threats](https://slsa.dev/spec/v1.1/threats-overview); SLSA / OpenSSF; просмотрено 2026-10-02.
- `sc-slsa-requirements` — [SLSA v1.1 — Producing artifacts](https://slsa.dev/spec/v1.1/requirements); SLSA / OpenSSF; просмотрено 2026-10-02.
- `sc-slsa-platforms` — [SLSA v1.1 — Verifying build platforms](https://slsa.dev/spec/v1.1/verifying-systems); SLSA / OpenSSF; просмотрено 2026-10-02.
- `sc-actions-events` — [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows); GitHub; просмотрено 2026-10-02.
- `sc-actions-secure` — [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use); GitHub; просмотрено 2026-10-02.
- `sc-actions-oidc` — [Configuring OpenID Connect in Amazon Web Services](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws); GitHub; просмотрено 2026-10-02.
- `sc-webhooks` — [Admission Webhook Good Practices](https://kubernetes.io/docs/concepts/cluster-administration/admission-webhooks-good-practices/); Kubernetes; просмотрено 2026-10-02.
- `sc-terraform-state` — [The terraform_remote_state Data Source](https://developer.hashicorp.com/terraform/language/state/remote-state-data); HashiCorp; просмотрено 2026-10-02.
- `sc-terraform-sensitive` — [Manage sensitive data in your configuration](https://developer.hashicorp.com/terraform/language/manage-sensitive-data); HashiCorp; просмотрено 2026-10-02.
- `sc-disruptions` — [Disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/); Kubernetes; просмотрено 2026-10-02.
- `sc-eks-identity` — [Identity and Access Management — Amazon EKS Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/identity-and-access-management.html); AWS; просмотрено 2026-10-02.
- `ss-base-rate` — [The Base-Rate Fallacy and its Implications for the Difficulty of Intrusion Detection](https://www.cerias.purdue.edu/apps/reports_and_papers/view/2815/); Stefan Axelsson; ACM / CERIAS, Purdue University; просмотрено 2026-10-02.
- `ss-ids-testing` — [NIST IR 7007: An Overview of Issues in Testing Intrusion Detection Systems](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir7007.pdf); NIST; просмотрено 2026-10-02.
- `ss-elastic-delays` — [Troubleshoot detection rules](https://www.elastic.co/docs/troubleshoot/security/detection-rules); Elastic; просмотрено 2026-10-02.
- `ss-sysmon` — [Sysmon: capabilities, events and configuration](https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon); Microsoft Sysinternals; просмотрено 2026-10-02.
- `ss-nat-logging` — [RFC 6302: Logging Recommendations for Internet-Facing Servers](https://www.rfc-editor.org/rfc/rfc6302.html); IETF / RFC Editor; просмотрено 2026-10-02.
- `ss-forensics` — [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf); NIST; просмотрено 2026-10-02.
- `ss-ir` — [NIST SP 800-61 Rev. 3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-61r3.pdf); NIST; просмотрено 2026-10-02.
- `ss-siem-testing` — [Implementing SIEM and SOAR platforms: Practitioner guidance](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance); ASD ACSC and international partners; просмотрено 2026-10-02.
- `ss-log-quality` — [Best practices for event logging and threat detection](https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/best-practices-for-event-logging-and-threat-detection); ASD ACSC, CISA, FBI, NSA and international partners; просмотрено 2026-10-02.
- `ss-cloudflare-ir` — [Thanksgiving 2023 security incident](https://blog.cloudflare.com/thanksgiving-2023-security-incident/); Cloudflare; просмотрено 2026-10-02.
- `ss-krbtgt` — [Active Directory Forest Recovery: Reset the krbtgt password](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/forest-recovery-guide/ad-forest-recovery-reset-the-krbtgt-password); Microsoft; просмотрено 2026-10-02.
- `ss-epss` — [EPSS Frequently Asked Questions](https://www.first.org/epss/faq); FIRST; просмотрено 2026-10-02.
- `ss-ssvc` — [Using SSVC: stakeholder roles, decisions and decision points](https://certcc.github.io/SSVC/howto/); CERT Coordination Center / Carnegie Mellon University; просмотрено 2026-10-02.
- `ss-time-quality` — [RFC 5424: The Syslog Protocol](https://www.rfc-editor.org/rfc/rfc5424); IETF / RFC Editor; просмотрено 2026-10-02.
- `ss-idempotency` — [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/); Amazon Builders’ Library; просмотрено 2026-10-02.
- `ss-signed-binaries` — [DET0081: Detection of Proxy Execution via Trusted Signed Binaries Across Platforms](https://attack.mitre.org/detectionstrategies/DET0081/); MITRE ATT&CK; просмотрено 2026-10-02.

### Защита ИИ

Заданий: 40. Первичных источников: 39. Дата сверки: 2026-10-02.

#### LLM, агенты и инструменты

Границы доверия, prompt injection, полномочия и действия агентов.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| ai001 | Документ не может разрешить действие | [OWASP LLM01:2026 Prompt Injection](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM01_PromptInjection.md) — Types of Prompt Injection: Indirect Prompt Injection; Prevention and Mitigation Strategies, пункты 4 и 7 |
| ai002 | Подтверждение связано с параметрами | [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) — 1.1; 2.5–2.6; 2.8–2.10: transaction data, final control gate, uniqueness |
| ai003 | Токен для другого сервиса | [MCP Security Best Practices — 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices) — Token Passthrough: Risks, Mitigation; Scope Minimization |
| ai004 | Разрешённый URL с неожиданным переходом | [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — Case 1: Application and Network layer; redirection; IP address and domain validation |
| ai005 | Песочница с лишними полномочиями | [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude) — Defenses: environment; Patterns for containing agents; Risk we missed: Exfiltration through an approved domain |
| ai006 | Повтор вызова не означает новое действие | [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) — Reducing client complexity with idempotent API design; Late arriving requests; Same client request ID, different intent |
| ai007 | readOnlyHint не является ограничением | [Tool Annotations as Risk Vocabulary: What Hints Can and Can't Do](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/) — What Tool Annotations Are; What Annotations Can’t Do; Is it a hint or a contract? |
| ai008 | Инъекция пережила новый диалог | [AI Agent Context Poisoning — AML.T0080](https://d3fend.mitre.org/offensive-technique/attack/AML.T0080/) — Definition; subtechniques Memory and Thread |
| ai009 | JSON не делает SQL безопасным | [OWASP LLM10:2026 Improper Output Handling](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM10_ImproperOutputHandling.md) — Description; Common Examples of Risk; Prevention and Mitigation Strategies, пункты 1 и 5 |
| ai010 | Два агента не создают границу доверия | [Defeating Prompt Injections by Design — arXiv:2503.18813v2](https://arxiv.org/html/2503.18813v2) — Sections 3–3.1, 5.1–5.4, 7 and 9: threat model, control/data separation, capabilities and limitations |

#### RAG и защита данных

Авторизация поиска, изоляция памяти, отравление контекста и утечки.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| ai011 | Кому разрешено попасть в контекст | [Security filters for trimming results in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search) — About the security filter pattern; Apply the security filter in the query; предупреждение о retrievable=false |
| ai012 | Семантический кеш обошёл права | [Web Cache Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Web_Cache_Security_Cheat_Sheet.html) — Design a Complete Cache Key; Protect Application-Level Caches; Test the Complete Cache Path |
| ai013 | Подписанный документ с ложной инструкцией | [Retrieval-Augmented Generation (RAG) Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) — Section 1: Document Poisoning; Section 5: Source Attribution and Provenance; Section 7: Index Integrity |
| ai014 | Вектор не равен обезличиванию | [Text Embeddings Reveal (Almost) As Much As Text — EMNLP 2023](https://aclanthology.org/2023.emnlp-main.765/) — Abstract and paper: embedding inversion; privacy implications and experimental scope |
| ai015 | Ссылка есть, основания нет | [NIST AI 600-1: Generative Artificial Intelligence Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf) — Section 2.2 Confabulation: incorrect assertions, generated logic and citations |
| ai016 | Удаление источника оставило производные данные | [Delete documents — Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-how-to-delete-documents) — Synchronized deletion; Verify document deletion; Troubleshoot document deletion: orphaned documents; [Retrieval-Augmented Generation (RAG) Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) — Section 4: Data Deletion and Retention; Section 11: Caching Risks |
| ai017 | Дообучение не заменяет авторизацию | [Extracting Training Data from Large Language Models — USENIX Security 2021](https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting) — Abstract and paper: extraction of individual training examples; scope of GPT-2 experiments |
| ai018 | Отзыв прав ещё не дошёл до индекса | [Document-level access control — Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) — Enforce document-level permissions at query time; synchronization requirements; permission metadata for chunked documents |
| ai019 | Секрет в системном контексте | [OWASP LLM08:2026 Hidden Context Exposure](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM08_HiddenContextExposure.md) — Prevention and Mitigation Strategies: Do Not Put Sensitive Data in Hidden Context; Enforce Authorization Independently from the LLM |
| ai020 | Защита нужна до модели | [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) — File Upload Threats: Malicious Files; File Content Validation; Filesystem Permissions; Upload and Download Limits |

#### MLOps и цепочка поставки

Модели, артефакты, среда выполнения, зависимости и обучение.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| ai021 | Конвертация весов тоже выполняет загрузку | [PyTorch Security Policy — untrusted models and inputs](https://github.com/pytorch/pytorch/blob/main/SECURITY.md) — Untrusted models; Untrusted inputs during training and prediction; Using distributed features |
| ai022 | Безопасный формат и удалённый Python | [Transformers Security Policy — remote artefacts and remote code](https://github.com/huggingface/transformers/blob/main/SECURITY.md) — Remote artefacts; Remote code → Modeling: trust_remote_code and revision |
| ai023 | Подпись от неподходящей сборки | [SLSA v1.1 — Verifying artifacts](https://slsa.dev/spec/v1.1/verifying-artifacts) — Step 1: Check SLSA Build level; Step 2: Check expectations; Forming Expectations |
| ai024 | Зафиксированы веса, изменились зависимости | [Secure installs — pip documentation](https://pip.pypa.io/en/stable/topics/secure-installs/) — Hash-checking Mode; Additional restrictions; Using hashes from PyPI (or other index servers) |
| ai025 | Хорошая средняя точность и узкий триггер | [BadNets: Identifying Vulnerabilities in the Machine Learning Model Supply Chain](https://arxiv.org/abs/1708.06733) — Abstract and experiments: normal validation performance with attacker-chosen trigger behavior; transfer-learning persistence |
| ai026 | Лимит запроса и безлимитный агент | [OWASP LLM06:2026 Unbounded Consumption](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM06_UnboundedConsumption.md) — Prevention and Mitigation Strategies: Rate Limiting; Agentic Circuit Breakers; Multi-turn Tool Calling Loops and Tool Call Fan-Out |
| ai027 | API-ключ не закрывает все интерфейсы | [Security — vLLM v0.25.1](https://docs.vllm.ai/en/v0.25.1/usage/security/) — v0.25.1: API Key Authentication Limitations; Network Security; Security and Firewalls |
| ai028 | Загрузка адаптера — административная операция | [Security — vLLM v0.25.1](https://docs.vllm.ai/en/v0.25.1/usage/security/) — v0.25.1: Dynamic LoRA Loading; administrator-only access requirement |
| ai029 | Скрыть вероятности недостаточно | [Stealing Machine Learning Models via Prediction APIs — USENIX Security 2016](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/tramer) — Abstract and paper: black-box functional extraction; omission of confidence values does not eliminate extraction |
| ai030 | Единица приватности и история пользователя | [NIST SP 800-226: Guidelines for Evaluating Differential Privacy Guarantees](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-226.pdf) — Section 2.4: Unit of Privacy; Transforming the Unit of Privacy; Composition; Section 4.4: Data Security and Access Control |

#### Проверка защит и реагирование

Модель угроз, качество оценок, наблюдаемость и реакция на инциденты.

| ID | Сценарий | Источники и разделы |
| --- | --- | --- |
| ai031 | Ноль обходов не означает нулевой риск | [EXACT BINOMIAL — exact confidence bounds](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm) — One-sided upper exact binomial confidence bound; calculation for zero observed events |
| ai032 | Проверять весь агент, а не список фраз | [AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents](https://arxiv.org/abs/2406.13352) — Abstract and benchmark design: dynamic tool environment, adaptive attacks, utility and security evaluation |
| ai033 | Оценщик сам прочитал инъекцию | [Optimization-based Prompt Injection Attack to LLM-as-a-Judge](https://arxiv.org/abs/2403.17710) — Abstract and threat model: attacker-controlled candidate response influencing the LLM judge |
| ai034 | Базовая частота и нагрузка на SOC | [Classification: Accuracy, recall, precision, and related metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) — Recall; False positive rate; Precision; formulas for classification metrics |
| ai035 | Отказ проверки не равен разрешению | [AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) — Human-in-the-Loop Controls; High-Impact Action Integrity Controls: fail closed on policy or approval validation failure |
| ai036 | Аудит агента без лишних секретов | [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Event attributes; Data to exclude; Event collection; Protection |
| ai037 | Инцидент не заканчивается сменой промпта | [NIST SP 800-61r3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf) — NIST SP 800-61r3: RS.AN incident analysis; RS.MI-01 containment; RS.MI-02 eradication; RC.RP recovery execution |
| ai038 | Модель обновили — основание оценки изменилось | [NIST SP 800-218A: Secure Software Development Practices for Generative AI and Dual-Use Foundation Models](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218A.pdf) — PW.8.1: AI model testing and regression automation; PW.8.2 R1–R2: test models and retest after retraining or adding data sources |
| ai039 | Лаборатория должна быть изолирована технически | [An alignment assessment of recent cybersecurity incidents](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents) — Alignment assessment summary: simulation claims contrasted with misconfigured real internet access; environmental isolation and defense in depth |
| ai040 | Тест соответствует возможностям нарушителя | [NIST AI 100-2e2025: Adversarial Machine Learning — A Taxonomy and Terminology of Attacks and Mitigations](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf) — Sections 2.1.2–2.1.4: attacker objectives, capabilities and knowledge; 2.2.2 black-box evasion; 2.2.4 real-world feasibility |

#### Каталог материалов

- `ai-owasp-prompt-2026` — [OWASP LLM01:2026 Prompt Injection](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM01_PromptInjection.md); OWASP GenAI Security Project; просмотрено 2026-10-02.
- `ai-transaction-auth` — [Transaction Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-mcp-auth` — [MCP Security Best Practices — 2025-11-25](https://modelcontextprotocol.io/docs/2025-11-25/tutorials/security/security_best_practices); Model Context Protocol; просмотрено 2026-10-02.
- `ai-ssrf` — [Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-containment` — [How we contain Claude across products](https://www.anthropic.com/engineering/how-we-contain-claude); Anthropic; просмотрено 2026-10-02.
- `ai-idempotency` — [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/); Amazon Web Services; просмотрено 2026-10-02.
- `ai-mcp-annotations` — [Tool Annotations as Risk Vocabulary: What Hints Can and Can't Do](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/); Model Context Protocol maintainers; просмотрено 2026-10-02.
- `ai-memory-atlas` — [AI Agent Context Poisoning — AML.T0080](https://d3fend.mitre.org/offensive-technique/attack/AML.T0080/); MITRE; просмотрено 2026-10-02.
- `ai-owasp-output-2026` — [OWASP LLM10:2026 Improper Output Handling](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM10_ImproperOutputHandling.md); OWASP GenAI Security Project; просмотрено 2026-10-02.
- `ai-camel` — [Defeating Prompt Injections by Design — arXiv:2503.18813v2](https://arxiv.org/html/2503.18813v2); E. Debenedetti et al.; Google, Google DeepMind, ETH Zurich; просмотрено 2026-10-02.
- `ai-azure-filter` — [Security filters for trimming results in Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-security-trimming-for-azure-search); Microsoft; просмотрено 2026-10-02.
- `ai-cache` — [Web Cache Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Web_Cache_Security_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-rag` — [Retrieval-Augmented Generation (RAG) Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-embedding-inversion` — [Text Embeddings Reveal (Almost) As Much As Text — EMNLP 2023](https://aclanthology.org/2023.emnlp-main.765/); J. Morris, V. Kuleshov, V. Shmatikov, A. Rush; Association for Computational Linguistics; просмотрено 2026-10-02.
- `ai-genai-profile` — [NIST AI 600-1: Generative Artificial Intelligence Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf); NIST; просмотрено 2026-10-02.
- `ai-azure-delete` — [Delete documents — Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-how-to-delete-documents); Microsoft; просмотрено 2026-10-02.
- `ai-memorization` — [Extracting Training Data from Large Language Models — USENIX Security 2021](https://www.usenix.org/conference/usenixsecurity21/presentation/carlini-extracting); N. Carlini et al.; USENIX; просмотрено 2026-10-02.
- `ai-azure-permissions` — [Document-level access control — Azure AI Search](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview); Microsoft; просмотрено 2026-10-02.
- `ai-hidden-context` — [OWASP LLM08:2026 Hidden Context Exposure](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM08_HiddenContextExposure.md); OWASP GenAI Security Project; просмотрено 2026-10-02.
- `ai-file-upload` — [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-pytorch-security` — [PyTorch Security Policy — untrusted models and inputs](https://github.com/pytorch/pytorch/blob/main/SECURITY.md); PyTorch maintainers; просмотрено 2026-10-02.
- `ai-transformers-security` — [Transformers Security Policy — remote artefacts and remote code](https://github.com/huggingface/transformers/blob/main/SECURITY.md); Hugging Face; просмотрено 2026-10-02.
- `ai-slsa` — [SLSA v1.1 — Verifying artifacts](https://slsa.dev/spec/v1.1/verifying-artifacts); SLSA; просмотрено 2026-10-02.
- `ai-pip-secure` — [Secure installs — pip documentation](https://pip.pypa.io/en/stable/topics/secure-installs/); Python Packaging Authority; просмотрено 2026-10-02.
- `ai-badnets` — [BadNets: Identifying Vulnerabilities in the Machine Learning Model Supply Chain](https://arxiv.org/abs/1708.06733); T. Gu, B. Dolan-Gavitt, S. Garg; просмотрено 2026-10-02.
- `ai-unbounded` — [OWASP LLM06:2026 Unbounded Consumption](https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final/LLM06_UnboundedConsumption.md); OWASP GenAI Security Project; просмотрено 2026-10-02.
- `ai-vllm-security` — [Security — vLLM v0.25.1](https://docs.vllm.ai/en/v0.25.1/usage/security/); vLLM maintainers; просмотрено 2026-10-02.
- `ai-extraction` — [Stealing Machine Learning Models via Prediction APIs — USENIX Security 2016](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/tramer); F. Tramèr et al.; USENIX; просмотрено 2026-10-02.
- `ai-differential-privacy` — [NIST SP 800-226: Guidelines for Evaluating Differential Privacy Guarantees](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-226.pdf); NIST; просмотрено 2026-10-02.
- `ai-binomial` — [EXACT BINOMIAL — exact confidence bounds](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm); NIST Dataplot; просмотрено 2026-10-02.
- `ai-agentdojo` — [AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents](https://arxiv.org/abs/2406.13352); E. Debenedetti et al.; ETH Zurich and collaborators; просмотрено 2026-10-02.
- `ai-judge` — [Optimization-based Prompt Injection Attack to LLM-as-a-Judge](https://arxiv.org/abs/2403.17710); J. Shi et al.; просмотрено 2026-10-02.
- `ai-metrics` — [Classification: Accuracy, recall, precision, and related metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall); Google for Developers; просмотрено 2026-10-02.
- `ai-agent-security` — [AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-logging` — [Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html); OWASP; просмотрено 2026-10-02.
- `ai-ir` — [NIST SP 800-61r3: Incident Response Recommendations and Considerations for Cybersecurity Risk Management](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r3.pdf); NIST; просмотрено 2026-10-02.
- `ai-ml-ssdf` — [NIST SP 800-218A: Secure Software Development Practices for Generative AI and Dual-Use Foundation Models](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218A.pdf); NIST; просмотрено 2026-10-02.
- `ai-evaluation-containment` — [An alignment assessment of recent cybersecurity incidents](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents); Anthropic; просмотрено 2026-10-02.
- `ai-aml-taxonomy` — [NIST AI 100-2e2025: Adversarial Machine Learning — A Taxonomy and Terminology of Attacks and Mitigations](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf); NIST; просмотрено 2026-10-02.
