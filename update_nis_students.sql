-- Update NIS for students based on name matching

UPDATE public.students 
SET nis = '1486' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ADNAN%ARDHANI%GINTING%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1487' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ADSKHAN%SYAFIQ%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1488' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ADZRIEL%ALFAKHRI%POHAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1489' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AFIF%MAKARIM%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1490' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AHMAD%ABIDZAR%ALFARIZKI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1491' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%GAISHAN%RAFFASYA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1492' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%IRSYAD%ZAVIYAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1493' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%IZZAN%SYAH%SYAZWAN%SIANIPAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1494' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KHAIRIL%ALFATH%AMIQ%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1495' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KHALID%BIN%KHAIRIL%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1496' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%M%GILANG%ARSYA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1497' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MSHABIEL%EVANO%MEKKA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1498' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MALIK%TAMCHLIS%ZEN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1499' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MHD%ATHA%SHAHEER%NASUTION%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1500' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MHD%REZKY%MAULANA%SITEPU%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1501' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUDZAKKIR%ALKAHFI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1502' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%AL%HAFIDZH%NST%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1598' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%EL%RUMI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1503' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NAQEEB%ATHALLAH%NARAYA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1504' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NAUFAL%ALIF%AL%MIRZHA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1505' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RAFASYA%AL%FARIQ%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1506' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RAFFASYA%AQIL%GHAISAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1507' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RAFIQ%SHAHDAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1508' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SHADIQ%AULIA%TARIGAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1509' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SHAFIQ%AMMAR%BATUBARA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1510' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%UKASYAH%WIYANDHA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1511' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%UWAIS%AHMAD%SYAUQI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1512' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%YAHYA%AL%MUFLIH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1513' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ABDURROHMAN%AL%FATIH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1514' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AHMAD%AL%HABIB%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1515' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ALBANI%PANDIA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1516' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ALHANAN%ZADA%YUSRIZAL%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1517' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AMMAR%IBRAHIM%RAMADHAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1518' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ANAS%AL%BARRA%HIDAYAT%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1519' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ARSYAD%AL%MUQAFFI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1520' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%FARHAN%MUFLIH%QODRI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1521' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HABIB%MUHAMMAD%FATIH%AL%HAKIM%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1522' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HAMZAH%MUSTAQIM%SIREGAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1523' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%IBRAHIM%EL%HAZIQ%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1524' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%IHSAN%TSANI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1525' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%AZKA%XAVIER%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1526' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%FAROOQ%RIZKI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1527' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%FARUQ%NUFAIL%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1528' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%FATIH%KARIM%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1529' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%KHABIB%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1530' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUHAMMAD%UKKASYAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1531' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NUMAN%SYAKIR%PANJAITAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1532' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%QEANU%ARRAFIQ%AKBAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1533' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RISYAD%ALFARIZI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1534' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RUNAKO%ARSENIO%MUBARAK%SIAGIAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1535' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SYAFIQ%HANIF%BUKHARI%LUBIS%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1536' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%TSAQIF%AYYASY%AWWABIN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1537' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%UWAIS%AL%MAIDANY%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1538' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ZHAFRAN%HAMIZAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1539' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%FATHAN%MIQDAD%ABDILLAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1540' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ABIDAH%HANIYAH%KHOIRUNNISA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1541' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AISYAH%ABDUL%AZIS%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1542' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ALLETA%KHAWLA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1543' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ALMEERA%RATIFAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1544' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ALMIRA%HUMAIRA%BATRISYA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1545' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AMEERA%CHAIRUNISA%TSABITA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1546' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%DEANDRA%ADILLA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1547' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ELIF%KHAULAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1548' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HAFSHAH%NAZHIFA%KHANSA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1549' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HAFSYAH%MUJAHIDAH%ALHANAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1550' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HAMNA%LUTHFIA%SYAM%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1551' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HANA%HUMAIRAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1552' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%JIHAN%SYAFIQAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1553' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KABSYAH%HIBATILLAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1554' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KEYSHA%FARA%LIYAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1555' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MAHDEYA%SARAGIH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1556' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MARYAM%YUNEDI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1557' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MARZIA%RAMADHANI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1558' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NABILA%SYAKIRA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1559' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NAILAH%SHAFIYYAH%LUBIS%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1560' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%PUTRI%ARISHA%JULIANTI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1561' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SAJIDAH%YUMNA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1562' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SALWA%MALAIKA%SANI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1563' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SARAH%LUMBAN%TOBING%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1564' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%UMAYZA%ALMIRA%MATONDANG%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1565' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%YASMIN%ALLIFIYAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1597' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%VANESHA%ADINDA%PRICILLA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1566' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ANINDYA%MISHA%SIREGAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1567' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ARSYILLA%NUR%MAFAZA%HASIBUAN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1568' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ASIYAH%QURROTA%AYUN%SEMBIRING%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1569' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AYRA%RARIZAH%RIZQY%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1570' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%AZZAHRA%ASYILA%RAHMA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1571' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%FAHIRA%HAURO%JANNAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1572' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%GHAYDA%NAFEEZA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1573' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HANIN%SYAHIRA%RAIHANA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1574' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HANNAH%SYAFIQAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1575' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HASANAH%INARAH%ANWARI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1576' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%HUMAIRAH%PUTRI%ALVIA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1577' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KHADIJAH%AKBAR%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1578' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%KHODIJAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1579' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%LULU%HUMAIRA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1580' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MAHIRAH%AL%FAUSHA%BR%BANGUN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1581' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MIKAYLA%ARYA%HAFIQAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1582' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUTHIAH%AZZAHRA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1583' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%MUTIAH%SHALEHA%NASUTION%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1584' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NASHIFA%TISA%AFSEEN%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1585' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%NUWAIRAH%KHANZAIRA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1586' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%RAIQA%ZAFIRA%ALEA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1587' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SHAFIYYAH%SUBHI%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1588' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SHAFIYYAH%SYAHIDAH%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1589' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%SYAURAH%AGHINA%BAHIRA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1590' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ZAHIRA%PURNAMA%BATUBARA%'
  LIMIT 1
);

UPDATE public.students 
SET nis = '1591' 
WHERE id IN (
  SELECT id FROM public.students 
  WHERE REPLACE(REPLACE(nama, '''', ''), '.', '') ILIKE '%ZIYANNISA%HANIAH%ABDURRAHIM%'
  LIMIT 1
);

