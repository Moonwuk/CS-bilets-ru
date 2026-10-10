# Протоколы по уровням OSI — расширение и проверка

Дата сверки: **10 октября 2026 года**. Исходный снимок: `a5e82de3a151298213174d7a9decc470ba857638`, после интеграции PR №22.

Добавлены **60 авторских вопросов q841–q900** в существующую тему «Модель OSI». У каждого — четыре варианта, один правильный ответ при заданных условиях, отдельное объяснение каждого варианта, учебная цель, источники и доступные до ответа пояснения терминов. Словарь дополнен 45 определениями, всего в общем словаре 474; ещё 20 понятий комплаенса подключаются отдельно.

## Состав и счётчики

| Набор | До | После | Тем после |
|---|---:|---:|---:|
| Файл `questions.json` | 840 | 900 | 44 |
| Составной базовый банк, включая комплаенс | 955 | 1015 | 45 |
| Тема «Модель OSI» внутри базового банка | 41 | 101 | 1 |
| «Все вопросы» и барабан: базовый + ИИ + ситуации | 1031 | 1091 | 52 |
| Отдельный «Сеньор» | 60 | 60 | 4 |

Всего в четырёх направлениях 1151 вопрос. Количество тем OSI-расширение не меняет. Разница между меню базового банка и барабаном составляет семь тем: четыре по ИИ и три ситуационных. Барабан и общий билет используют одну композицию данных; числа в интерфейсе вычисляются из неё.

## Покрытие уровней

| Область | Вопросы | Что проверяется |
|---|---|---|
| L1 и граница L1/L2 | q841–q844 | IEEE 802.3, 1000BASE-T/SX, автосогласование, full duplex и CSMA/CD |
| L2 | q845–q854 | 802.1Q, native VLAN, STP/BPDU, LACP, LLDP, 802.1X/EAPOL/RADIUS, PPP/LCP/IPCP, MACsec, EtherType, ARP Announcement |
| L3 и связанные механизмы | q855–q866 | IPv6, ICMPv6, RA, SLAAC/DAD, link-local, OSPF/BGP, ESP/IKE, GRE, MPLS, выбор маршрута |
| L4 и транспортные гарантии | q867–q876 | TCP ACK/окно/half-close/границы записей, UDP Length, QUIC streams, SCTP, доступность HTTP/3 |
| Классическая L5 и сопоставление с TCP/IP | q877–q879 | X.225, data token, ограниченность автоматического отнесения RPC к L5 |
| L6 и представление данных | q880–q882 | X.226, presentation context, ASN.1/BER/DER |
| L7 и зависимости от нижних уровней | q883–q896 | DNS, DHCPv4/v6, HTTP/2, SSH, FTP, SMTP/IMAP, NTP, SNMP, SIP/RTP, STARTTLS |
| Инкапсуляция и разбор пакета | q897–q900 | VXLAN, стек HTTP/3, IPv6 extension headers, цитирование пакета в ICMP |

Это группировка учебных задач, а не требование помещать каждый реальный протокол ровно в одну клетку OSI. Ethernet охватывает физические и канальные функции. BGP управляет маршрутами через TCP; его назначение не делает его инкапсуляцию такой же, как у OSPF. «MPLS L2.5» — неформальное выражение. X.225/X.226 названы именно как стандарты классической OSI; современные интернет-приложения не обязаны иметь отдельные протоколы для каждой из L5–L7. Для QUIC, GRE и VXLAN явно описан фактический стек.

## Открытые вопросы и учебные примеры

Изучены публичные задания Cisco Press и лабораторные James F. Kurose / Keith W. Ross. Их полные тексты и захваты не копируются в репозиторий. В тренажёр вошли самостоятельно сформулированные варианты с собственными условиями, числами, отвлекающими ответами и объяснениями. Поле `exerciseSourceIds` отмечает четыре вопроса с таким учебным ориентиром; техническое обоснование хранится отдельно в `sourceIds`.

| Открытая подборка | Использованный учебный ориентир | Наш вопрос |
|---|---|---|
| [Cisco Press: Review Questions о протоколах и моделях](https://www.ciscopress.com/articles/article.asp?p=3192417&seqNum=9) | Различать функцию уровня и границы семейства стандартов | q841 — Ethernet охватывает L1 и MAC L2 |
| [Kurose/Ross: Wireshark TCP v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_TCP_v9.pdf) | Связь sequence/acknowledgement numbers с переданными байтами | q867 — собственный пример SEQ=7000 и 300 байт |
| [Kurose/Ross: Wireshark UDP v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_UDP_v9.pdf) | Что учитывает поле UDP Length | q871 — собственный расчёт полезной нагрузки |
| [Kurose/Ross: Wireshark DNS v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_DNS_v9.pdf) | Разбирать запрос, ответ и адреса в DNS, не смешивая их с адресом сервера | q883 — самостоятельное сравнение A и AAAA |

Остальные 56 задач разработаны как самостоятельные сценарии по техническим источникам. Все 60 имеют `origin: authored`: это не дословный импорт внешней контрольной и не официальный экзаменационный банк. [Каталог лабораторных авторов](https://gaia.cs.umass.edu/kurose_ross/wireshark.php) позволяет отдельно выполнять исходные упражнения с захватами.

## Сверка и устранение неоднозначностей

Просмотрены условия, четыре ответа и объяснения всех 60 вопросов. Для чисел протоколов и EtherType используются реестры IANA; для поведения — RFC, стандарты ITU-T/IEEE и документация производителя, указанная у вопроса.

- В q861 явно исключён NAT-T: ESP Protocol 50 нельзя подменить TCP/UDP-портом 50.
- В q856 указаны условия отправки диагностического ICMPv6; фрагментацию IPv6 выполняет источник, не промежуточный маршрутизатор.
- В q858 исключена optimistic DAD, а в q887–q888 — ускоренный обмен DHCP.
- q888 опирается на [RFC 9915, §7.2](https://www.rfc-editor.org/rfc/rfc9915.html#section-7.2), который заменил RFC 8415 в январе 2026 года. Вопрос спрашивает порты **приёма** 546/547: текущий стандарт допускает иной исходный порт сообщения.
- q867 исключает SYN/FIN и пропуски: ACK=7000+300=7300. q871 исключает IPv6 jumbogram: полезная нагрузка равна 100−8=92. В q866 адрес 10.20.30.77 попадает под /24, который длиннее /16 и /0.
- q869 отделяет подтверждение байтов от успешного COMMIT; q872 — поток TCP от границ вызовов записи.
- q873 описывает надёжные QUIC streams, отдельно исключая QUIC DATAGRAM. q874 не обещает отсутствия общих ограничений соединения или зависимостей приложения. В q876 откат на HTTP/2 зависит от клиента.
- В q852 и q863 инкапсуляция и защита канала не объявляются сквозным шифрованием приложения. В q884 совпадение DNS ID и сетевых адресов не объявляется криптографической аутентификацией.
- q894 различает SNMPv3 authNoPriv и authPriv. В q896 ответ SMTP 220 означает готовность начать TLS, а не уже завершённое шифрование.

## Повторы и совместимость

Сравнены учебные цели новых вопросов и прежних 41 задания OSI, а также соседние сетевые задачи. Точные повторы формулировок проверяются автоматически во всём составном банке. Это не автоматическое доказательство отсутствия всех смысловых пересечений.

| Соседние вопросы | Почему сохранены оба |
|---|---|
| q856 и q793 | Фрагментация IPv6 только источником / диагностика IPv4 DF и PMTU |
| q857–q858 и q314 | Обнаружение маршрутизатора и дубликата адреса / разрешение канального адреса соседа |
| q861 и q313 | ESP непосредственно в IP / ARP непосредственно в канальном обмене |
| q872 и q322 | Интерфейс приложения и границы чтения TCP / сборка HTTP из наблюдаемых сегментов |
| q898 и q297 | Конкретный стек QUIC/HTTP/3 / общая инкапсуляция TCP/IPv4 |
| q852 и q328 | Граница защиты MACsec / завершение TLS на прокси |

Черновой q863 о номере GRE повторял приём q861. Он заменён задачей о различии GRE-инкапсуляции и криптографической защиты. Существующие вопросы о различии аутентификации и авторизации не размножались.

Тексты, варианты, объяснения и ID прежних 840 вопросов сохранены. В q612 изменена только ссылка на понятие справки: `http` → `http2`, поскольку теперь фраза HTTP/2 открывает своё более точное определение. Исходные источники, другие банки и пакет комплаенса не изменены.

После расширения сохраняются накопленная статистика и допустимые ID ошибок. По существующему правилу приложения изменившийся состав банка сбрасывает незавершённый билет и прежнюю раскладку; барабан также сбрасывает попытку и закрытые темы с уведомлением. Проверка миграции включает прежний составной банк из 955 вопросов и исходные 840.

## Проверки

Восемь существующих наборов проверок охватывают структуру банков, объяснения и источники, отсутствие точных повторов, доступность словаря, подсчёт итогов, перемешивание, экзамен, сохранения, композицию общего билета и барабана. Добавлены проверки 60 новых ID, 101 вопроса OSI, четырёх ссылок на учебные упражнения и покрытия справкой. Позиции правильного ответа распределены по 15 на каждый вариант.

Браузерный сценарий проверяет упакованные Google Play-ресурсы при мобильном размере: открытие темы OSI на 101 вопрос, наличие всех 60 новых ID, синюю кнопку QUIC в q898, работу справки без выбора ответа и скрытие источников до проверки. CI собирает APK и AAB. Проверка в Chromium не заменяет установку на физический Android-телефон.

## Указатель новых вопросов

Канонический текст и разбор находятся в `questions.json`; таблица ниже связывает ID, цель и источники.

| ID | Учебная цель | Источники |
|---|---|---|
| q841 | Ethernet охватывает физический и канальный уровни | [Cisco — Ethernet (IEEE 802.3), physical and data-link functions](https://www.cisco.com/c/en/us/td/docs/net_mgmt/prime/network/3-8/reference/guide/ethrnt.html); [Cisco Networking Academy — открытые Check Your Understanding Questions](https://www.ciscopress.com/articles/article.asp?p=3192417&seqNum=9) |
| q842 | Физические варианты Ethernet и среда передачи | [Cisco — 1000BASE-T and 1000BASE-SX media](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/gigabit-ethernet-gbic-sfp-modules/datasheet-c78-366584.html) |
| q843 | Автосогласование Ethernet не требует IP-настроек | [Cisco — Ethernet speed, duplex and autonegotiation](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html) |
| q844 | CSMA/CD и полнодуплексный Ethernet | [Cisco — Ethernet speed, duplex and autonegotiation](https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html) |
| q845 | Различение идентификатора VLAN и приоритета кадра | [Cisco — IEEE 802.1Q and native VLAN](https://www.cisco.com/en/US/docs/ios/lanswitch/configuration/guide/lsw_rtng_vlan_ovw.html) |
| q846 | Нетегированный кадр на порту с заданной native VLAN | [Cisco — IEEE 802.1Q and native VLAN](https://www.cisco.com/en/US/docs/ios/lanswitch/configuration/guide/lsw_rtng_vlan_ovw.html) |
| q847 | STP устраняет петли коммутации | [Cisco — Spanning Tree Protocol and BPDUs](https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol/24063-pvid-inconsistency-24063.html) |
| q848 | Пропускная способность одного потока в агрегированном канале | [Cisco — EtherChannel and flow-based load balancing](https://www.cisco.com/c/en/us/support/docs/lan-switching/etherchannel/12023-4.html) |
| q849 | LLDP обнаруживает соседей на канальном уровне | [IEEE 802.1AB — Link Layer Discovery Protocol](https://standards.ieee.org/standard/802_1AB-2016.html) |
| q850 | Разные участки обмена 802.1X | [Cisco — IEEE 802.1X Port-Based Authentication](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/sec_usr_8021x/configuration/15-e/sec-usr-8021x-15-e-book/config-ieee-802x-pba.html) |
| q851 | PPP: управление каналом и настройка IPv4 различаются | [IETF RFC 1661 — PPP](https://www.rfc-editor.org/rfc/rfc1661.html); [IETF RFC 1332 — IPCP](https://www.rfc-editor.org/rfc/rfc1332.html) |
| q852 | Граница защиты MACsec | [Cisco — MACsec, IEEE 802.1AE link protection](https://www.cisco.com/c/en/us/td/docs/dcn/aci/apic/6x/l2-configuration/cisco-apic-layer-2-networking-configuration-guide-62x/g_macsec.html) |
| q853 | EtherType выбирает протокол полезной нагрузки Ethernet | [IANA — IEEE 802 Numbers, EtherTypes](https://www.iana.org/assignments/ieee-802-numbers/ieee-802-numbers.xhtml) |
| q854 | Назначение ARP Announcement | [IETF RFC 5227 — IPv4 Address Conflict Detection](https://www.rfc-editor.org/rfc/rfc5227.html) |
| q855 | Отсутствие контрольной суммы основного заголовка IPv6 | [IETF RFC 8200 — IPv6](https://www.rfc-editor.org/rfc/rfc8200.html) |
| q856 | Маршрутизатор IPv6 не фрагментирует слишком большой пакет | [IETF RFC 8200 — IPv6](https://www.rfc-editor.org/rfc/rfc8200.html) |
| q857 | Маршрут по умолчанию в IPv6 через RA | [RFC 4861: Neighbor Discovery for IP version 6](https://datatracker.ietf.org/doc/html/rfc4861) |
| q858 | Проверка конфликта адреса после SLAAC | [IETF RFC 4862 — IPv6 Stateless Address Autoconfiguration](https://www.rfc-editor.org/rfc/rfc4862.html) |
| q859 | Область действия link-local адреса | [IETF RFC 4291 — IPv6 Addressing Architecture](https://www.rfc-editor.org/rfc/rfc4291.html) |
| q860 | Назначение протокола маршрутизации и его перенос по сети | [IETF RFC 2328 — OSPFv2](https://www.rfc-editor.org/rfc/rfc2328.html); [IETF RFC 4271 — BGP-4](https://www.rfc-editor.org/rfc/rfc4271.html); [IANA — реестр номеров протоколов IP](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
| q861 | ESP: номер протокола IP и порт — разные понятия | [IETF RFC 4303 — IP Encapsulating Security Payload (ESP)](https://www.rfc-editor.org/rfc/rfc4303.html); [IANA — реестр номеров протоколов IP](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
| q862 | IKEv2 согласует ключи и ассоциации, ESP защищает трафик | [IETF RFC 7296 — IKEv2](https://www.rfc-editor.org/rfc/rfc7296.html); [IETF RFC 4303 — IP Encapsulating Security Payload (ESP)](https://www.rfc-editor.org/rfc/rfc4303.html) |
| q863 | GRE не предоставляет шифрование и криптографическую аутентификацию | [IETF RFC 2784 — Generic Routing Encapsulation (GRE)](https://www.rfc-editor.org/rfc/rfc2784.html) |
| q864 | Внутренние и внешние адреса GRE-туннеля | [IETF RFC 2784 — Generic Routing Encapsulation (GRE)](https://www.rfc-editor.org/rfc/rfc2784.html) |
| q865 | Условность термина Layer 2.5 для MPLS | [IETF RFC 3032 — MPLS Label Stack Encoding](https://www.rfc-editor.org/rfc/rfc3032.html); [ITU-T X.200 — базовая эталонная модель OSI](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-X.200-199407-I%21%21PDF-E&lang=e&type=items) |
| q866 | Выбор маршрута по наиболее длинному совпадающему префиксу | [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812.html) |
| q867 | Номер ACK указывает следующий ожидаемый байт | [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html); [Kurose/Ross — открытая лабораторная Wireshark TCP v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_TCP_v9.pdf) |
| q868 | Receive window управляет нагрузкой на получателя | [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q869 | Транспортное подтверждение не равно завершению прикладной операции | [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q870 | TCP допускает закрытие одного направления | [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q871 | UDP Length включает заголовок и данные | [RFC 768 — User Datagram Protocol](https://www.rfc-editor.org/rfc/rfc768.html); [Kurose/Ross — открытая лабораторная Wireshark UDP v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_UDP_v9.pdf) |
| q872 | Границы вызовов записи не сохраняются в TCP | [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q873 | QUIC может обеспечивать надёжность поверх UDP | [IETF RFC 9000 — QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) |
| q874 | Независимый порядок данных в разных streams QUIC | [IETF RFC 9000 — QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) |
| q875 | SCTP сохраняет границы сообщений | [IETF RFC 9260 — Stream Control Transmission Protocol](https://www.rfc-editor.org/rfc/rfc9260.html); [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q876 | HTTP/3 требует доступности соответствующего UDP-пути | [IETF RFC 9114 — HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html); [IETF RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html) |
| q877 | Реальный пример сеансового протокола OSI | [ITU-T X.225 — Connection-oriented Session protocol](https://www.itu.int/rec/T-REC-X.225-199511-I/en) |
| q878 | Сеансовый data token и токен доступа различаются | [ITU-T X.215 — определение сеансового сервиса OSI](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-X.215-199511-I%21%21PDF-E&lang=e&type=items) |
| q879 | RPC нельзя классифицировать только по слову сеанс | [IETF RFC 5531 — Remote Procedure Call Protocol Version 2](https://www.rfc-editor.org/rfc/rfc5531.html); [ITU-T X.200 — базовая эталонная модель OSI](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-X.200-199407-I%21%21PDF-E&lang=e&type=items) |
| q880 | Согласование контекста представления в X.226 | [ITU-T X.226 — Connection-oriented Presentation protocol](https://www.itu.int/rec/T-REC-X.226-199407-I/en); [ITU-T X.216 — определение сервиса представления OSI](https://www.itu.int/rec/dologin_pub.asp?id=T-REC-X.216-199407-I%21%21PDF-E&lang=e&type=items) |
| q881 | ASN.1 и правила кодирования выполняют разные задачи | [ITU-T X.690 — ASN.1 encoding: BER, CER and DER](https://www.itu.int/rec/T-REC-X.690-202102-I/en) |
| q882 | DER ограничивает допустимые варианты BER | [ITU-T X.690 — ASN.1 encoding: BER, CER and DER](https://www.itu.int/rec/T-REC-X.690-202102-I/en) |
| q883 | A и AAAA содержат адреса разных версий IP | [IETF RFC 1035 — Domain Names — Implementation](https://www.rfc-editor.org/rfc/rfc1035.html); [IETF RFC 3596 — DNS Extensions to Support IP Version 6](https://www.rfc-editor.org/rfc/rfc3596.html); [Kurose/Ross — открытая лабораторная Wireshark DNS v9](https://www-net.cs.umass.edu/wireshark-labs/Wireshark_DNS_v9.pdf) |
| q884 | DNS Transaction ID помогает сопоставить ответ, но не аутентифицирует его | [IETF RFC 1035 — Domain Names — Implementation](https://www.rfc-editor.org/rfc/rfc1035.html); [IETF RFC 4033 — DNS Security Introduction and Requirements](https://www.rfc-editor.org/rfc/rfc4033.html) |
| q885 | Одинаковое имя TTL не означает одинаковую функцию | [IETF RFC 1035 — Domain Names — Implementation](https://www.rfc-editor.org/rfc/rfc1035.html); [RFC 1812: Requirements for IP Version 4 Routers](https://www.rfc-editor.org/rfc/rfc1812.html) |
| q886 | Двухбайтовая длина сообщения DNS поверх TCP | [IETF RFC 1035 — Domain Names — Implementation](https://www.rfc-editor.org/rfc/rfc1035.html); [IETF RFC 7766 — DNS Transport over TCP](https://www.rfc-editor.org/rfc/rfc7766.html) |
| q887 | Порядок обычного получения аренды DHCPv4 | [IETF RFC 2131 — DHCP](https://www.rfc-editor.org/rfc/rfc2131.html) |
| q888 | DHCPv6 имеет собственные сообщения и порты | [IETF RFC 9915 — DHCP for IPv6 (STD 102; obsoletes RFC 8415)](https://www.rfc-editor.org/rfc/rfc9915.html) |
| q889 | Streams HTTP/2 не устраняют задержку общей доставки TCP | [IETF RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113.html); [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html) |
| q890 | SSH мультиплексирует каналы в защищённом соединении | [IETF RFC 4254 — SSH Connection Protocol](https://www.rfc-editor.org/rfc/rfc4254.html) |
| q891 | Управляющее соединение FTP не заменяет соединение данных | [IETF RFC 959 — FTP](https://www.rfc-editor.org/rfc/rfc959.html); [IETF RFC 2428 — FTP Extensions — EPSV](https://www.rfc-editor.org/rfc/rfc2428.html) |
| q892 | SMTP передаёт почту, IMAP предоставляет доступ к ящику | [IETF RFC 5321 — SMTP](https://www.rfc-editor.org/rfc/rfc5321.html); [IETF RFC 9051 — IMAP4rev2](https://www.rfc-editor.org/rfc/rfc9051.html) |
| q893 | Синхронизация времени и часовой пояс различаются | [IETF RFC 5905 — NTPv4](https://www.rfc-editor.org/rfc/rfc5905.html) |
| q894 | Имя SNMPv3 не гарантирует включённую конфиденциальность | [IETF RFC 3411 — SNMP Management Frameworks](https://www.rfc-editor.org/rfc/rfc3411.html) |
| q895 | Сигнализация SIP не доказывает прохождение медиапотока | [IETF RFC 3261 — SIP](https://www.rfc-editor.org/rfc/rfc3261.html); [IETF RFC 3550 — RTP](https://www.rfc-editor.org/rfc/rfc3550.html) |
| q896 | STARTTLS переключает существующее соединение на TLS | [IETF RFC 3207 — SMTP STARTTLS](https://www.rfc-editor.org/rfc/rfc3207.html) |
| q897 | VXLAN переносит внутренний Ethernet-кадр поверх UDP/IP | [IETF RFC 7348 — VXLAN](https://www.rfc-editor.org/rfc/rfc7348.html) |
| q898 | Порядок инкапсуляции HTTP/3 без туннелей | [IETF RFC 9114 — HTTP/3](https://www.rfc-editor.org/rfc/rfc9114.html); [IETF RFC 9000 — QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) |
| q899 | Next Header может указывать расширение, а не транспорт | [IETF RFC 8200 — IPv6](https://www.rfc-editor.org/rfc/rfc8200.html); [IANA — реестр номеров протоколов IP](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
| q900 | Порты процитированного пакета не являются портами ICMP | [IETF RFC 792 — ICMP](https://www.rfc-editor.org/rfc/rfc792.html); [IANA — реестр номеров протоколов IP](https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml) |
