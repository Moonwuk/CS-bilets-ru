# Расширение JWT, OAuth, PKI и OWASP Top 10:2025

Дата технической сверки: 6 октября 2026 года.

Добавлены 140 законченных вопросов № 1–140 из пользовательского файла `ib_questions_jwt_owasp2025_security_tools.md`. В приложении они получили постоянные ID q601–q740; исходный номер сохранён в `sourceQuestionNumber`, пакет отмечен `importBatch: jwt-owasp-2025`. К каждому варианту добавлен разбор принципа и ограничений. Правильные ответы распределены по четырём позициям поровну (35 на позицию); при прохождении варианты дополнительно перемешиваются.

Предыдущие 600 заданий и их ID не изменены. Теперь базовый банк содержит 740 вопросов по 40 темам, общий режим — 816 вопросов, барабан — 47 тем с учётом 4 разделов ИИ и 3 разделов ситуаций. Сеньор остаётся отдельным банком. Новые задания автоматически входят в случайные билеты 20/50, подготовку по темам, весь базовый банк, общий режим и барабан через существующие загрузчики.

В конце исходного файла также есть план будущих разделов инструментов и пять примеров будущих ситуационных вопросов без вариантов. Они не включены в число готовых вопросов и не превращены автоматически в задания. Существующая отдельная подборка «Инструменты ИБ» из 100 заданий сохранена; 7 новых антивирусных вопросов доступны в профильной теме и общих режимах.

## Тематическое распределение

Четыре новые темы: JWT и проверка токенов; OAuth и жизненный цикл токенов; PKI и сертификаты; Архитектура безопасности. Они расположены рядом с аутентификацией, криптографией и основами ИБ. Практические вопросы из блока OWASP распределены по тому, какой механизм они проверяют; вопросы о классификации OWASP остались в «OWASP углублённо». Поэтому SQL-параметризация находится в веб-безопасности, журналы — в SOC, а KMS/HSM — в инструментах доступа и секретов.

| Тема | Добавлено |
|---|---:|
| JWT и проверка токенов | 27 |
| Криптография | 11 |
| OAuth и жизненный цикл токенов | 19 |
| PKI и сертификаты | 19 |
| Аутентификация и доступ | 3 |
| Архитектура безопасности | 16 |
| Безопасность API | 3 |
| Инструменты: защита приложений | 1 |
| Сетевая безопасность | 1 |
| Инструменты: доступ и секреты | 3 |
| Веб-безопасность | 4 |
| OWASP углублённо | 15 |
| Безопасная разработка | 8 |
| SOC и реагирование | 3 |
| Инструменты: обнаружение и реагирование | 7 |

## Термины и уточнения

В общий интерактивный словарь добавлено 118 определений (всего 349) с простым объяснением и примером. Дополнены английские варианты написания существующих терминов. `conceptIds` каждого задания ссылаются только на определения, доступные по нажатию в самом вопросе или вариантах. Длинные названия имеют приоритет перед вложенными короткими словами. Часть вспомогательного англоязычного текста переведена на русский.

Уточнения по сравнению с черновиком:

- JWE скрывает содержимое от клиента только если клиент не владеет ключом расшифрования; проверка вложенного JWS обязательна.
- Публичный JWKS endpoint не должен раскрывать секретные ключи; сам формат JWK Set не ограничен публичными ключами.
- Плановая ротация отделена от компрометации; подпись JWT не предотвращает предъявление украденного токена.
- `jti`, `typ`, DPoP, PKCE и отзыв работают только вместе с необходимыми серверными проверками. Отзыв не обещает мгновенного прекращения приёма всех локально проверяемых JWT.
- `basicConstraints` задаёт ограничения, а не выполняет проверку; статус OCSP good не заменяет проверку имени, срока и цепочки.
- В OWASP 2025 XXE/CWE-611 относится к A02; A03 и A08 могут пересекаться. Неизменённые стандартные пароли прямо приведены в A02.
- Ссылка на BFF обозначена как Internet-Draft, а HPKP рассмотрен как устаревший механизм, без рекомендации его включать.

## Проверки

Проверки основного тренажёра, словаря, сценариев, общего банка, логики барабана и геометрии его секторов проходят с новым составом. Проверяется миграция с 600 вопросов: накопленная статистика и список ошибок сохраняются, незавершённая попытка со старой сигнатурой банка не восстанавливается с неверными индексами ответов. Для общего режима и барабана действуют существующие правила миграции при изменении состава банка. Проверки скрытия правильности до завершения темы сохранены.

Для внутренней совместимости старых сохранений остаётся раскладка 14 × 50 + 40; нумерованные билеты не возвращены в меню. Тест баланса учитывает меньший последний блок. В Android используются те же существующие questions.json и glossary.js — новых сетевых зависимостей или файлов приложения не требуется.

## Соответствие исходным вопросам

| № файла | ID | Тема | Источники |
|---:|---|---|---|
| 1 | q601 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 2 | q602 | JWT и проверка токенов | [RFC 7515 — JSON Web Signature](https://www.rfc-editor.org/rfc/rfc7515.html) |
| 3 | q603 | JWT и проверка токенов | [RFC 7516 — JSON Web Encryption](https://www.rfc-editor.org/rfc/rfc7516.html) |
| 4 | q604 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 5 | q605 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 6 | q606 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 7 | q607 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 8 | q608 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 9 | q609 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 10 | q610 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 11 | q611 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 12 | q612 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 13 | q613 | JWT и проверка токенов | [OpenID Connect Core — ID Token](https://openid.net/specs/openid-connect-core-1_0.html#IDToken); [RFC 9068 — JWT Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html) |
| 14 | q614 | JWT и проверка токенов | [RFC 9068 — JWT Profile for OAuth 2.0 Access Tokens](https://www.rfc-editor.org/rfc/rfc9068.html); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 15 | q615 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 16 | q616 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 17 | q617 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 18 | q618 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 19 | q619 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 20 | q620 | Криптография | [NIST FIPS 186-5 — Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final) |
| 21 | q621 | JWT и проверка токенов | [RFC 7515 — JSON Web Signature](https://www.rfc-editor.org/rfc/rfc7515.html) |
| 22 | q622 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 23 | q623 | JWT и проверка токенов | [RFC 7517 — JSON Web Key](https://www.rfc-editor.org/rfc/rfc7517.html); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 24 | q624 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 25 | q625 | JWT и проверка токенов | [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/); [RFC 7516 — JSON Web Encryption](https://www.rfc-editor.org/rfc/rfc7516.html) |
| 26 | q626 | JWT и проверка токенов | [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/); [IETF RFC 8725 — JSON Web Token Best Current Practices](https://www.rfc-editor.org/info/rfc8725/) |
| 27 | q627 | OAuth и жизненный цикл токенов | [RFC 6750 — OAuth 2.0 Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750.html) |
| 28 | q628 | OAuth и жизненный цикл токенов | [RFC 6750 — OAuth 2.0 Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750.html); [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 29 | q629 | OAuth и жизненный цикл токенов | [RFC 9449 — OAuth 2.0 DPoP](https://www.rfc-editor.org/rfc/rfc9449.html) |
| 30 | q630 | OAuth и жизненный цикл токенов | [RFC 9449 — OAuth 2.0 DPoP](https://www.rfc-editor.org/rfc/rfc9449.html) |
| 31 | q631 | OAuth и жизненный цикл токенов | [RFC 8705 — OAuth 2.0 Mutual-TLS and Certificate-Bound Tokens](https://www.rfc-editor.org/rfc/rfc8705.html) |
| 32 | q632 | OAuth и жизненный цикл токенов | [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636.html); [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 33 | q633 | OAuth и жизненный цикл токенов | [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636.html); [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 34 | q634 | OAuth и жизненный цикл токенов | [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636.html); [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 35 | q635 | OAuth и жизненный цикл токенов | [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636.html); [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 36 | q636 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 37 | q637 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 38 | q638 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 39 | q639 | OAuth и жизненный цикл токенов | [RFC 7662 — OAuth 2.0 Token Introspection](https://www.rfc-editor.org/rfc/rfc7662.html) |
| 40 | q640 | OAuth и жизненный цикл токенов | [RFC 7009 — OAuth 2.0 Token Revocation](https://www.rfc-editor.org/rfc/rfc7009.html) |
| 41 | q641 | OAuth и жизненный цикл токенов | [IETF RFC 6749 — The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/info/rfc6749/); [IETF RFC 7519 — JSON Web Token](https://www.rfc-editor.org/info/rfc7519/) |
| 42 | q642 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 43 | q643 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html); [OWASP OAuth 2.0 Protocol Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html) |
| 44 | q644 | OAuth и жизненный цикл токенов | [RFC 9700 — Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) |
| 45 | q645 | Криптография | [NIST — Cryptographic hash function properties](https://csrc.nist.gov/glossary/term/hash_function) |
| 46 | q646 | Криптография | [NIST CSRC Glossary — Digital Signature](https://csrc.nist.gov/glossary/term/digital_signature) |
| 47 | q647 | Криптография | [NIST CSRC Glossary — Digital Signature](https://csrc.nist.gov/glossary/term/digital_signature) |
| 48 | q648 | Криптография | [NIST CSRC Glossary — Digital Signature](https://csrc.nist.gov/glossary/term/digital_signature) |
| 49 | q649 | Криптография | [RFC 7515 — JSON Web Signature](https://www.rfc-editor.org/rfc/rfc7515.html); [NIST FIPS 186-5 — Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final) |
| 50 | q650 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 51 | q651 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 52 | q652 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 53 | q653 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 54 | q654 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 55 | q655 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 56 | q656 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 57 | q657 | PKI и сертификаты | [IETF RFC 9525 — Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html) |
| 58 | q658 | PKI и сертификаты | [IETF RFC 9525 — Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html); [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 59 | q659 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 60 | q660 | PKI и сертификаты | [RFC 5280 — X.509 Certificates, Certification Paths and Revocation](https://www.rfc-editor.org/rfc/rfc5280.html) |
| 61 | q661 | PKI и сертификаты | [RFC 6960 — OCSP](https://www.rfc-editor.org/rfc/rfc6960.html) |
| 62 | q662 | PKI и сертификаты | [RFC 6960 — OCSP](https://www.rfc-editor.org/rfc/rfc6960.html) |
| 63 | q663 | PKI и сертификаты | [RFC 2986 — PKCS #10 Certification Request Syntax](https://www.rfc-editor.org/rfc/rfc2986.html) |
| 64 | q664 | PKI и сертификаты | [RFC 8446 — TLS 1.3, Appendix E.1: Forward Secrecy](https://www.rfc-editor.org/rfc/rfc8446.html); [RFC 8705 — OAuth 2.0 Mutual-TLS and Certificate-Bound Tokens](https://www.rfc-editor.org/rfc/rfc8705.html) |
| 65 | q665 | PKI и сертификаты | [RFC 8446 — TLS 1.3, Appendix E.1: Forward Secrecy](https://www.rfc-editor.org/rfc/rfc8446.html) |
| 66 | q666 | PKI и сертификаты | [RFC 9162 — Certificate Transparency Version 2.0](https://www.rfc-editor.org/rfc/rfc9162.html) |
| 67 | q667 | PKI и сертификаты | [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) |
| 68 | q668 | PKI и сертификаты | [Chromium — Remove HTTP-Based Public Key Pinning](https://developer.chrome.com/blog/chrome-67-deps-rems/) |
| 69 | q669 | Криптография | [NIST SP 800-38D — GCM and GMAC, IV Uniqueness](https://csrc.nist.gov/pubs/sp/800/38/d/final) |
| 70 | q670 | Криптография | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) |
| 71 | q671 | Аутентификация и доступ | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 72 | q672 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 73 | q673 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 74 | q674 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 75 | q675 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 76 | q676 | Архитектура безопасности | [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) |
| 77 | q677 | Архитектура безопасности | [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) |
| 78 | q678 | Безопасность API | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 79 | q679 | Инструменты: защита приложений | [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) |
| 80 | q680 | Сетевая безопасность | [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) |
| 81 | q681 | Архитектура безопасности | [NIST SP 800-207 — Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) |
| 82 | q682 | Инструменты: доступ и секреты | [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) |
| 83 | q683 | Инструменты: доступ и секреты | [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) |
| 84 | q684 | Инструменты: доступ и секреты | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) |
| 85 | q685 | OAuth и жизненный цикл токенов | [IETF OAuth 2.0 for Browser-Based Applications — BFF (Internet-Draft)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps); [OWASP OAuth 2.0 Protocol Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html) |
| 86 | q686 | Веб-безопасность | [OWASP HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html) |
| 87 | q687 | Архитектура безопасности | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 88 | q688 | Архитектура безопасности | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 89 | q689 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 90 | q690 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 91 | q691 | Архитектура безопасности | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| 92 | q692 | OWASP углублённо | [OWASP Top 10:2025 — A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/) |
| 93 | q693 | Безопасность API | [OWASP Top 10:2025 — A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/) |
| 94 | q694 | Безопасность API | [OWASP Top 10:2025 — A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/) |
| 95 | q695 | JWT и проверка токенов | [OWASP Top 10:2025 — A01 Broken Access Control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/) |
| 96 | q696 | OWASP углублённо | [OWASP Top 10:2025 — A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) |
| 97 | q697 | OWASP углублённо | [OWASP Top 10:2025 — A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) |
| 98 | q698 | OWASP углублённо | [OWASP Top 10:2025 — A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) |
| 99 | q699 | Архитектура безопасности | [OWASP Top 10:2025 — A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) |
| 100 | q700 | OWASP углублённо | [OWASP Top 10:2025 — A02 Security Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) |
| 101 | q701 | OWASP углублённо | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 102 | q702 | Безопасная разработка | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 103 | q703 | Безопасная разработка | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 104 | q704 | Безопасная разработка | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 105 | q705 | Безопасная разработка | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 106 | q706 | Безопасная разработка | [OWASP Top 10:2025 — A03 Software Supply Chain Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/) |
| 107 | q707 | OWASP углублённо | [OWASP Top 10:2025 — A04 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures/) |
| 108 | q708 | Криптография | [OWASP Top 10:2025 — A04 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures/) |
| 109 | q709 | Криптография | [OWASP Top 10:2025 — A04 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures/) |
| 110 | q710 | Криптография | [OWASP Top 10:2025 — A04 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures/) |
| 111 | q711 | OWASP углублённо | [OWASP Top 10:2025 — A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/) |
| 112 | q712 | Веб-безопасность | [OWASP Top 10:2025 — A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/); [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) |
| 113 | q713 | Веб-безопасность | [OWASP Top 10:2025 — A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/); [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) |
| 114 | q714 | Веб-безопасность | [OWASP Top 10:2025 — A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/); [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) |
| 115 | q715 | OWASP углублённо | [OWASP Top 10:2025 — A06 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/) |
| 116 | q716 | Архитектура безопасности | [OWASP Top 10:2025 — A06 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/) |
| 117 | q717 | Архитектура безопасности | [OWASP Top 10:2025 — A06 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/) |
| 118 | q718 | Архитектура безопасности | [OWASP Top 10:2025 — A06 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/) |
| 119 | q719 | OWASP углублённо | [OWASP Top 10:2025 — A07 Authentication Failures](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/) |
| 120 | q720 | Аутентификация и доступ | [OWASP Top 10:2025 — A07 Authentication Failures](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/) |
| 121 | q721 | Аутентификация и доступ | [OWASP Top 10:2025 — A07 Authentication Failures](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/) |
| 122 | q722 | JWT и проверка токенов | [OWASP Top 10:2025 — A07 Authentication Failures](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/) |
| 123 | q723 | OWASP углублённо | [OWASP Top 10:2025 — A08 Software or Data Integrity Failures](https://top10.owasp.org/2025/A08_2025-Software_or_Data_Integrity_Failures/) |
| 124 | q724 | OWASP углублённо | [OWASP Top 10:2025 — A08 Software or Data Integrity Failures](https://top10.owasp.org/2025/A08_2025-Software_or_Data_Integrity_Failures/) |
| 125 | q725 | OWASP углублённо | [OWASP Top 10:2025 — A08 Software or Data Integrity Failures](https://top10.owasp.org/2025/A08_2025-Software_or_Data_Integrity_Failures/) |
| 126 | q726 | OWASP углублённо | [OWASP Top 10:2025 — A09 Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/) |
| 127 | q727 | SOC и реагирование | [OWASP Top 10:2025 — A09 Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/) |
| 128 | q728 | SOC и реагирование | [OWASP Top 10:2025 — A09 Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/) |
| 129 | q729 | SOC и реагирование | [OWASP Top 10:2025 — A09 Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/) |
| 130 | q730 | OWASP углублённо | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 131 | q731 | Безопасная разработка | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 132 | q732 | Безопасная разработка | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 133 | q733 | Безопасная разработка | [OWASP Top 10:2025 — A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) |
| 134 | q734 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 135 | q735 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 136 | q736 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 137 | q737 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 138 | q738 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 139 | q739 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
| 140 | q740 | Инструменты: обнаружение и реагирование | [NIST SP 800-83 Rev. 1 — Malware Prevention and Handling](https://csrc.nist.gov/pubs/sp/800/83/r1/final) |
