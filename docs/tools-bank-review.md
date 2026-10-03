# Концептуальные вопросы об инструментах ИБ

100 новых авторских заданий (q501–q600), 10 тем по 10 вопросов. Дата сверки: 3 октября 2026 года. Все задания входят в основной банк и отдельную подборку «Инструменты ИБ».

## Подход к содержанию

Вопросы проверяют назначение класса средств, доступные ему данные, ограничения и интерпретацию результата. Условия не требуют знания интерфейса конкретного продукта. У каждого вопроса один верный вариант и отдельный разбор каждого ответа. Сценарии и пояснения написаны для тренажёра; они не являются цитатами из экзаменов или документации.

Технические положения сверены по первоисточникам ниже. Документация конкретных продуктов используется для проверки механики соответствующего класса. Она не означает, что любой продукт этого класса имеет все описанные возможности. Рекомендации о конкретных версиях и коммерческих предложениях не входят в банк. Старые публикации NIST используются для устойчивых понятий, а не как свидетельство актуальности каждой технологии из публикации.

Датчики и проверки не считаются всевидящими: в формулировках учитываются точка наблюдения, покрытие, права, фактическое выполнение теста и зависимость вывода от условий. Отдельно различаются сигнал, подтверждённая проблема и доказанные последствия.

## Справка и проверки

Для ключевых понятий в каждом новом вопросе заданы `conceptIds`. Автоматическая проверка подтверждает наличие определения и кликабельного написания в условии или вариантах. Справка общая для основного банка, «Сеньора» и раздела ИИ. Определения объясняют понятия вне привязки к правильному ответу текущего задания.

Проверяются уникальные ID и формулировки, четыре разных варианта и один правильный ответ, ссылки, покрытие терминов, состав отдельной подборки, новая случайная попытка, восстановление порядка и переход с банка из 500 вопросов. Изменённая раскладка содержит 12 билетов по 50 вопросов. Существующие 500 заданий и отдельные банки 60/40 сохранены.

## Указатель вопросов и источников

| ID | Тема | Понятия | Первичные материалы |
| --- | --- | --- | --- |
| q501 | инвентаризация и сканирование | asset-inventory | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q502 | инвентаризация и сканирование | passive-discovery | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q503 | инвентаризация и сканирование | port-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q504 | инвентаризация и сканирование | port-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q505 | инвентаризация и сканирование | vulnerability-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q506 | инвентаризация и сканирование | vulnerability-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final); [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q507 | инвентаризация и сканирование | vulnerability-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q508 | инвентаризация и сканирование | vulnerability-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q509 | инвентаризация и сканирование | configuration-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q510 | инвентаризация и сканирование | asset-inventory, vulnerability-scanner | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q511 | анализ сети | packet-analyzer | [Wireshark User’s Guide: capturing, filtering and analysing packets](https://www.wireshark.org/docs/wsug_html/) |
| q512 | анализ сети | packet-analyzer, capture-filter | [Wireshark User’s Guide: capturing, filtering and analysing packets](https://www.wireshark.org/docs/wsug_html/) |
| q513 | анализ сети | packet-analyzer, display-filter | [Wireshark User’s Guide: capturing, filtering and analysing packets](https://www.wireshark.org/docs/wsug_html/) |
| q514 | анализ сети | packet-analyzer | [Wireshark User’s Guide: capturing, filtering and analysing packets](https://www.wireshark.org/docs/wsug_html/) |
| q515 | анализ сети | flow-analyzer | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q516 | анализ сети | flow-analyzer | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q517 | анализ сети | ids, ips | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q518 | анализ сети | ips | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q519 | анализ сети | ids | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q520 | анализ сети | dns-monitor | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q521 | обнаружение и реагирование | siem | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q522 | обнаружение и реагирование | siem | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q523 | обнаружение и реагирование | siem | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q524 | обнаружение и реагирование | edr | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q525 | обнаружение и реагирование | edr | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q526 | обнаружение и реагирование | edr | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q527 | обнаружение и реагирование | soar | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q528 | обнаружение и реагирование | xdr | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q529 | обнаружение и реагирование | threat-intelligence, ioc | [Microsoft Learn: SIEM and XDR security operations](https://learn.microsoft.com/en-us/security/operations/siem-xdr-overview) |
| q530 | обнаружение и реагирование | siem | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q531 | защита приложений | sast | [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html) |
| q532 | защита приложений | dast | [OWASP Developer Guide: DevSecOps](https://devguide.owasp.org/en/09-operations/01-devsecops/) |
| q533 | защита приложений | iast | [OWASP DevSecOps Verification Standard: IAST](https://github.com/OWASP/www-project-devsecops-verification-standard/blob/main/document/TEST-003-Interactive-Application-Security-Testing-IAST.md) |
| q534 | защита приложений | sca | [OWASP: Component Analysis](https://community.owasp.org/Component_Analysis) |
| q535 | защита приложений | sbom | [OWASP: Component Analysis](https://community.owasp.org/Component_Analysis) |
| q536 | защита приложений | fuzzer | [LLVM: libFuzzer — coverage-guided fuzz testing](https://llvm.org/docs/LibFuzzer.html) |
| q537 | защита приложений | fuzzer | [LLVM: libFuzzer — coverage-guided fuzz testing](https://llvm.org/docs/LibFuzzer.html) |
| q538 | защита приложений | secret-scanner | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) |
| q539 | защита приложений | http-proxy | [OWASP Authorization Testing Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html) |
| q540 | защита приложений | waf | [OWASP Developer Guide: DevSecOps](https://devguide.owasp.org/en/09-operations/01-devsecops/) |
| q541 | анализ файлов и расследование | sandbox | [CAPEv2: Per-analysis network routing and INetSim](https://capev2.readthedocs.io/en/latest/installation/host/routing.html) |
| q542 | анализ файлов и расследование | sandbox | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q543 | анализ файлов и расследование | disassembler | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q544 | анализ файлов и расследование | decompiler | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q545 | анализ файлов и расследование | debugger | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q546 | анализ файлов и расследование | memory-analyzer | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q547 | анализ файлов и расследование | disk-imager | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q548 | анализ файлов и расследование | write-blocker | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q549 | анализ файлов и расследование | hash, disk-imager | [NIST SP 800-86: Guide to Integrating Forensic Techniques into Incident Response](https://csrc.nist.gov/pubs/sp/800/86/final) |
| q550 | анализ файлов и расследование | fim | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q551 | доступ и секреты | iam | [Microsoft Learn: Identity Governance overview](https://learn.microsoft.com/en-us/entra/id-governance/identity-governance-overview) |
| q552 | доступ и секреты | sso | [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) |
| q553 | доступ и секреты | pam | [Microsoft Learn: Identity Governance overview](https://learn.microsoft.com/en-us/entra/id-governance/identity-governance-overview) |
| q554 | доступ и секреты | pam | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html); [Microsoft Learn: Identity Governance overview](https://learn.microsoft.com/en-us/entra/id-governance/identity-governance-overview) |
| q555 | доступ и секреты | secret-vault | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) |
| q556 | доступ и секреты | dynamic-credentials, secret-vault | [HashiCorp Vault: Troubleshoot irrevocable leases](https://developer.hashicorp.com/vault/tutorials/monitoring/troubleshoot-irrevocable-leases) |
| q557 | доступ и секреты | kms | [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) |
| q558 | доступ и секреты | hsm | [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html) |
| q559 | доступ и секреты | certificate-manager | [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) |
| q560 | доступ и секреты | password-manager | [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) |
| q561 | данные и восстановление | dlp | [Microsoft Learn: Data loss prevention](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp) |
| q562 | данные и восстановление | dlp, false-positive | [Microsoft Learn: Data loss prevention](https://learn.microsoft.com/en-us/purview/dlp-learn-about-dlp) |
| q563 | данные и восстановление | data-discovery | [Microsoft Learn: Information protection](https://learn.microsoft.com/en-us/purview/information-protection) |
| q564 | данные и восстановление | data-classification | [Microsoft Learn: Information protection](https://learn.microsoft.com/en-us/purview/information-protection) |
| q565 | данные и восстановление | dam | [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |
| q566 | данные и восстановление | backup-system | [CISA: #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide) |
| q567 | данные и восстановление | immutable-backup | [NIST SP 800-209: Security Guidelines for Storage Infrastructure](https://csrc.nist.gov/pubs/sp/800/209/final) |
| q568 | данные и восстановление | backup-system, rpo, rto | [NIST SP 800-209: Security Guidelines for Storage Infrastructure](https://csrc.nist.gov/pubs/sp/800/209/final) |
| q569 | данные и восстановление | snapshot, backup-system | [NIST SP 800-209: Security Guidelines for Storage Infrastructure](https://csrc.nist.gov/pubs/sp/800/209/final) |
| q570 | данные и восстановление | incremental-backup | [NIST SP 800-209: Security Guidelines for Storage Infrastructure](https://csrc.nist.gov/pubs/sp/800/209/final) |
| q571 | облака и контейнеры | cspm | [Microsoft Learn: Cloud Security Posture Management](https://learn.microsoft.com/en-us/azure/defender-for-cloud/concept-cloud-security-posture-management) |
| q572 | облака и контейнеры | iac-scanner, cspm | [OWASP Developer Guide: DevSecOps](https://devguide.owasp.org/en/09-operations/01-devsecops/); [Microsoft Learn: Cloud Security Posture Management](https://learn.microsoft.com/en-us/azure/defender-for-cloud/concept-cloud-security-posture-management) |
| q573 | облака и контейнеры | ciem | [AWS IAM: Review access analyzer findings, including unused access](https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-findings-view.html) |
| q574 | облака и контейнеры | cwpp, cspm | [Microsoft Learn: Cloud workload protection (CWPP), runtime and container protection](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction) |
| q575 | облака и контейнеры | admission-controller | [Kubernetes: Admission Controllers](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/) |
| q576 | облака и контейнеры | image-scanner | [Sigstore: Verifying signatures](https://docs.sigstore.dev/cosign/verifying/verify/); [OWASP Developer Guide: DevSecOps](https://devguide.owasp.org/en/09-operations/01-devsecops/) |
| q577 | облака и контейнеры | artifact-verifier | [Sigstore: Verifying signatures](https://docs.sigstore.dev/cosign/verifying/verify/) |
| q578 | облака и контейнеры | image-scanner, cwpp | [Microsoft Learn: Cloud workload protection (CWPP), runtime and container protection](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-cloud-introduction); [OWASP Developer Guide: DevSecOps](https://devguide.owasp.org/en/09-operations/01-devsecops/) |
| q579 | облака и контейнеры | network-policy | [Kubernetes: Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/) |
| q580 | облака и контейнеры | service-mesh | [Istio: Security architecture and mutual TLS](https://istio.io/latest/docs/concepts/security/) |
| q581 | проверка защитных мер | bas | [MITRE: Automated adversary emulation with CALDERA](https://www.mitre.org/our-impact/intellectual-property/caldera) |
| q582 | проверка защитных мер | bas | [MITRE: Automated adversary emulation with CALDERA](https://www.mitre.org/our-impact/intellectual-property/caldera); [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q583 | проверка защитных мер | honeypot | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q584 | проверка защитных мер | honeytoken | [Thinkst: Canarytokens documentation](https://docs.canarytokens.org/guide/) |
| q585 | проверка защитных мер | tls-scanner | [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) |
| q586 | проверка защитных мер | password-auditor | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q587 | проверка защитных мер | authorization-test | [OWASP Authorization Testing Automation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Testing_Automation_Cheat_Sheet.html) |
| q588 | проверка защитных мер | detection-test | [NIST SP 800-94: Guide to Intrusion Detection and Prevention Systems](https://csrc.nist.gov/pubs/sp/800/94/final) |
| q589 | проверка защитных мер | load-testing | [NIST SP 800-115: Technical Guide to Information Security Testing and Assessment](https://csrc.nist.gov/pubs/sp/800/115/final) |
| q590 | проверка защитных мер | threat-modeling | [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html) |
| q591 | защита ИИ | prompt-detector | [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) |
| q592 | защита ИИ | html-sanitizer, output-validator | [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) |
| q593 | защита ИИ | retrieval-evaluator | [OWASP RAG Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) |
| q594 | защита ИИ | ai-gateway | [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html) |
| q595 | защита ИИ | evaluation-harness | [NIST AI RMF Playbook: testing, evaluation and measurement](https://airc.nist.gov/airmf-resources/playbook/) |
| q596 | защита ИИ | evaluation-harness | [NIST AI RMF Playbook: testing, evaluation and measurement](https://airc.nist.gov/airmf-resources/playbook/) |
| q597 | защита ИИ | model-registry | [OWASP Secure AI Model Ops Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_AI_Model_Ops_Cheat_Sheet.html) |
| q598 | защита ИИ | ai-redteam | [OWASP LLM Prompt Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html); [NIST AI RMF Playbook: testing, evaluation and measurement](https://airc.nist.gov/airmf-resources/playbook/) |
| q599 | защита ИИ | dataset-scanner | [OWASP Secure AI Model Ops Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_AI_Model_Ops_Cheat_Sheet.html) |
| q600 | защита ИИ | llm-observability | [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html); [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) |

## Обновление банка

При росте банка общая статистика и существующие ошибки сохраняются. Незавершённая попытка и результаты прежних нумерованных билетов сбрасываются с уведомлением: прежняя раскладка не соответствует новой. После обновления вновь начатые попытки сохраняются и возобновляются в прежнем порядке.
