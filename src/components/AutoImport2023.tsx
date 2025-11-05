import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// CSV-Daten direkt eingebettet
const csvData = `Name,Adresse,Rechnungsnummer,Rechnungsdatum,Nettosumme,Bruttosumme
Eiscafe Firenze,"Marktplatz 1, 74564 Crailsheim",01/2023/186,2023-01-02,"568,90","675,30"
Eiscafe Positano,"Bahnhofstraße 29, 31698 Lindhorst",01/2023/187,2023-01-02,"462,90","521,21"
Eiscafe Al Ponte,"Brückenstr 19, 34212 Melsungen",01/2023/188,2023-01-02,"201,00","216,96"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",01/2023/189,2023-01-02,"2613,90","3105,81"
EISCAFE DOLOMITI,"Am Markt 5, 31867 Lauenau",01/2023/190,2023-01-03,"875,53","1041,88"
Buongiorno Bernhard's,"Am Markt 15, 31655 Stadthagen",01/2023/191,2023-01-05,"1853,38","2202,69"
Eiscafe Diego,Hindenburger Str. 26,01/2023/192,2023-01-10,"2067,90","2457,97"
Eiscafe Sorriso,"Lutherstraße 1, 30171 Hannover",01/2023/193,2023-01-12,"554,90","657,50"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",01/2023/194,2023-01-14,"546,15","647,09"
EISCAFE BOF,"Klosterstrasse 6, 89143 - Blaubeuren",01/2023/195,2023-01-14,"555,70","658,45"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",01/2023/196,2023-01-17,"158,90","187,40"
EISCAFE ROMA,"Obere Hauptstraße 3, 76863 Herxheim",01/2023/197,2023-01-18,"248,90","294,50"
Eiscafe Peccati di Gola,"Am Hammergraben 1, 56567 Niederbieber",01/2023/198,2023-01-23,"644,90","764,60"
Eiscafe Gelateria Lentini,"Dreikönigenstraße 20, 47799 Krefeld",01/2023/199,2023-01-24,"701,80","832,31"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",01/2023/200,2023-01-25,"336,90","398,08"
Eiscafe VENEZIA,"Grabenstr. 13, 53424 Remagen",01/2023/201,2023-01-26,"313,90","371,85"
Eiscafe Riccardi,"Neue Str. 7, 49143 Bissendorf",01/2023/202,2023-01-27,"878,90","1027,10"
CAFE ZUR EISZEIT,"Wendischbora 61a, 01683 Nossen",01/2023/203,2023-01-28,"680,31","806,74"
Eiscafe Nino & Sarah,"Walzweg 6 A, 58710 Menden",01/2023/204,2023-01-30,"543,90","632,25"
Eiscafe Venezia,"Alte Bielefelder Str. 11, 33824 Werther",01/2023/205,2023-01-31,"232,20","276,32"
Eiscafe Ti Amo,"Debusstraße 10, 33442 Herzebrock",01/2023/206,2023-01-31,"283,80","335,86"
EISMANUFAKTUR CAFÉ,Große Straße 46/48,01/2023/207,2023-01-31,"105,40","123,56"
EICHIS EISCAFE,"Alsenzer Weg 69, 12559 Berlin",01/2023/208,2023-01-31,"550,80","653,59"
EISCAFE MILLEFIORI,"Breitestr. 35, 13597 Berlin",01/2023/209,2023-02-01,"473,40","561,48"
Eiscafe am Kirchplatz,"Münsterstaße 2, 33428 Harsewinkel",01/2023/210,2023-02-02,"3360,10","3989,04"
EISCAFE TAORMINA GMBH,"Hauptmarkt 17-18, 08056 Zwickau",01/2023/211,2023-02-02,"2456,10","2919,93"
EISCAFE BRUSTOLON,"Konrad Adenauer Str.110, 52511 Geilenkirchen, DE 340 786 593",01/2023/212,2023-02-02,"875,90","1039,49"
Eisdiele Venezia Brakel,"Hanekamp 18, 33034 Brakel",02/2023/214,2023-02-03,"302,60","358,23"
Eiscafe Taormina,"Untermarkt 8, 85354 Freising",02/2023/215,2023-02-04,"459,90","546,88"
Eiscafe Da Noi,"Rathausstr. 54, 10178 Berlin",02/2023/216,2023-02-06,"424,50","504,15"
Eiscafe Paradiso,"Hauptstraße 71, 91074 Herzogenaurach",02/2023/217,2023-02-06,"390,90","464,38"
Eiscafe Sartori,"Neubaugasse 1, 91541 Rothenburg ob der Tauber",02/2023/218,2023-02-06,"257,90","305,83"
Eiscafe San Marco Hachenburg,"Grabenstr. 16, 57627 Hachenburg",02/2023/219,2023-02-07,"330,90","392,15"
Eiscafé Porto Fino,"Weserstr. 68, 32257 Bünde",02/2023/220,2023-02-08,"286,90","340,00"
Eiscafe Mamma Mia,"Marktstraße 18, 58452 Witten",02/2023/221,2023-02-09,"371,10","440,15"
Eiscafe Delicia,"Deisterstraße 4, 31785 Hameln",02/2023/222,2023-02-10,"1122,50","1331,91"
Eiscafe Venezia Stadthagen,"Markt 3-4, 31655 Stadthagen",02/2023/223,2023-02-10,"1104,90","1311,10"
Eiscafe DOLCE VITA,"Marktstraße 30, 37269 Eschwege",02/2023/224,2023-02-10,"381,90","453,05"
Eiscafe Cortina,"Gerbergasse 11, 91541 Rothenburg ob der Tauber",02/2023/225,2023-02-11,"266,90","316,96"
Eiscafe Gesuato,"Kirchweg 4, 26127 Oldenburg",02/2023/226,2023-02-14,"1016,90","1207,13"
Eiscafe Italia Nordhausen,"Rautenstraße 2, 99734 Nordhausen",02/2023/227,2023-02-14,"283,90","336,62"
Eiscafe Leonardo,"Salzstraße 2/4, 33378 Rheda-Wiedenbrück",02/2023/228,2023-02-14,"467,90","555,13"
EISCAFE VENEDIG,"Marktstraße 27, 49740 Haselünne",02/2023/229,2023-02-14,"220,40","261,05"
Eiscafe Centrale,"Rudolf Breitscheid Straße 28, 99974 Mühlhausen",02/2023/230,2023-02-15,"1121,90","1331,19"
Eiscafe San Remo,"Westerstr. 14, 33098 Paderborn",02/2023/231,2023-02-15,"1072,90","1273,40"
Eiscafe Pinocchio,"Alter Markt 6, 32052 Herford",02/2023/232,2023-02-15,"569,90","674,26"
Eiscafe Venezia,"Bornheimer Straße 38, 53111 Bonn",02/2023/233,2023-02-15,"562,90","666,89"
Eiscafe Cortina,"Alte Str. 2, 57072 Siegen",02/2023/234,2023-02-16,"1102,90","1308,73"
Eiscafe Carucci,"Ringstr. 77, 33647 Bielefeld",02/2023/235,2023-02-16,"567,90","673,89"
Eiscafe Firenze,"Hauptstr. 10, 47574 Goch",02/2023/236,2023-02-16,"336,90","398,45"
Eiscafe GELATO,"Kleine Wollenweberstraße 8, 53113 Bonn",02/2023/237,2023-02-17,"1007,90","1195,37"
Eiscafe Palazzo,"Kirchstraße 21, 46325 Borken",02/2023/238,2023-02-17,"553,90","656,62"
Eiscafe Miramare,"Königstraße 94, 47051 Duisburg",02/2023/239,2023-02-17,"381,90","452,65"
Eiscafe Dolomiti,"Am Kornmarkt 2a, 06618 Naumburg",02/2023/240,2023-02-17,"305,90","362,50"
Eiscafe Gloria,"Steintorstr. 67-69, 49080 Osnabrück",02/2023/241,2023-02-18,"1089,90","1293,49"
Eiscafe La Dolce Vita,"Westerwaldstraße 4-6, 35745 Herborn",02/2023/242,2023-02-18,"535,90","635,50"
EISCAFE La Fontana,"Hauptstraße 19, 48493 Wettringen",02/2023/243,2023-02-20,"253,90","300,95"
Eiscafe La Grappa,"Friedrich-Wilhelm-Straße 50, 47051 Duisburg",02/2023/244,2023-02-20,"166,90","197,58"
EISCAFE MORITZ,"Bahnhofstraße 5, 26122 Oldenburg",02/2023/245,2023-02-21,"555,70","658,45"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",02/2023/246,2023-02-21,"555,70","658,45"
Eiscafe SICILIA,"Bahnhofstr. 27, 48653 Coesfeld",02/2023/247,2023-02-21,"304,90","361,32"
Eiscafe Eiszeit,"Königstr. 3, 48143 Münster",02/2023/248,2023-02-21,"283,90","336,62"
Eiscafe Bellissimo,"Kirchstraße 4, 48249 Dülmen",02/2023/249,2023-02-21,"249,90","295,88"
Eiscafe San Marco,"Obere Straße 8, 59872 Meschede",02/2023/250,2023-02-21,"211,90","250,95"
Eiscafe PINO UG,"Burgplatz 1, 32052 Herford",02/2023/251,2023-02-23,"392,90","465,73"
Eiscafe Dolomiti,"Markt 1, 32699 Extertal",02/2023/252,2023-02-23,"227,90","270,19"
Eiscafe La Piazza,"Deichstraße 12, 27318 Hoya",02/2023/253,2023-02-24,"289,90","343,38"
Eiscafe Palermo,"Regensburger Str. 28, 93073 Neutraubling",02/2023/254,2023-02-27,"255,90","303,32"
Eiscafe Casanova,"Lange Str. 61, 27580 Bremerhaven",02/2023/255,2023-02-27,"236,00","279,64"
Eiscafe Cortina,"Im Krämereck 10, 34560 Fritzlar",02/2023/256,2023-02-27,"196,90","233,20"
Eiscafe Dolomiti,"Marktplatz 8, 96215 Lichtenfels",02/2023/257,2023-02-28,"387,90","459,85"
EISCAFE PORTA GELATO,"Westtorstraße 46, 33758 Schloß Holte-Stukenbrock",02/2023/258,2023-02-28,"181,90","215,45"
Eismanufaktur & Café Venezia,"An der Marktkirche 2, 30159 Hannover",03/2023/259,2023-03-02,"469,60","557,22"
EISMANUFAKTUR CAFÉ,Große Straße 46/48,03/2023/260,2023-03-02,"201,00","238,19"
Eiscafe San Remo,"Westerstr. 14, 33098 Paderborn",03/2023/261,2023-03-02,"179,90","213,18"
Eiscafe Cortina,"Gerbergasse 11, 91541 Rothenburg ob der Tauber",03/2023/262,2023-03-02,"171,90","203,65"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",03/2023/263,2023-03-02,"154,90","183,31"
Eiscafe Gelateria Lentini,"Dreikönigenstraße 20, 47799 Krefeld",03/2023/264,2023-03-02,"121,90","144,45"
Eiscafe Delicia,"Deisterstraße 4, 31785 Hameln",03/2023/265,2023-03-03,"1126,90","1336,12"
Eiscafe Cortina,"Alte Str. 2, 57072 Siegen",03/2023/266,2023-03-03,"1120,90","1329,07"
Eiscafe Venezia Stadthagen,"Markt 3-4, 31655 Stadthagen",03/2023/267,2023-03-03,"1063,90","1261,82"
Eiscafe Bellissimo,"Kirchstraße 4, 48249 Dülmen",03/2023/268,2023-03-03,"1021,90","1211,85"
Eiscafe DOLCE VITA,"Marktstraße 30, 37269 Eschwege",03/2023/269,2023-03-03,"586,90","695,59"
Eiscafe Palazzo,"Kirchstraße 21, 46325 Borken",03/2023/270,2023-03-03,"577,90","685,04"
Eiscafe La Dolce Vita,"Westerwaldstraße 4-6, 35745 Herborn",03/2023/271,2023-03-03,"543,90","644,82"
Eiscafe Eiszeit,"Königstr. 3, 48143 Münster",03/2023/272,2023-03-03,"541,90","642,45"
Eiscafe Gesuato,"Kirchweg 4, 26127 Oldenburg",03/2023/273,2023-03-03,"539,90","640,08"
Eiscafe Dolomiti,"Am Kornmarkt 2a, 06618 Naumburg",03/2023/274,2023-03-03,"501,90","594,75"
Eiscafe Italia Nordhausen,"Rautenstraße 2, 99734 Nordhausen",03/2023/275,2023-03-03,"496,90","589,82"
Eiscafe Sartori,"Neubaugasse 1, 91541 Rothenburg ob der Tauber",03/2023/276,2023-03-03,"481,90","571,05"
Eiscafe Gloria,"Steintorstr. 67-69, 49080 Osnabrück",03/2023/277,2023-03-03,"461,90","547,65"
Eiscafe Leonardo,"Salzstraße 2/4, 33378 Rheda-Wiedenbrück",03/2023/278,2023-03-03,"456,90","541,72"
Eiscafe Paradiso,"Hauptstraße 71, 91074 Herzogenaurach",03/2023/279,2023-03-03,"447,90","531,05"
Eiscafe Mamma Mia,"Marktstraße 18, 58452 Witten",03/2023/280,2023-03-03,"434,90","515,51"
Eiscafe San Remo,"Marktstraße 1, 63165 Mühlheim am Main",03/2023/281,2023-03-03,"419,90","497,68"
Eiscafe Firenze,"Hauptstr. 10, 47574 Goch",03/2023/282,2023-03-03,"399,90","474,08"
Eiscafe SICILIA,"Bahnhofstr. 27, 48653 Coesfeld",03/2023/283,2023-03-03,"389,90","461,97"
Eiscafe Miramare,"Königstraße 94, 47051 Duisburg",03/2023/284,2023-03-03,"376,90","446,70"
Eiscafe San Marco,"Obere Straße 8, 59872 Meschede",03/2023/285,2023-03-03,"302,90","359,19"
Eiscafe Taormina,"Untermarkt 8, 85354 Freising",03/2023/286,2023-03-03,"301,90","357,75"
Eiscafe Da Noi,"Rathausstr. 54, 10178 Berlin",03/2023/287,2023-03-04,"581,90","689,85"
EISCAFE La Fontana,"Hauptstraße 19, 48493 Wettringen",03/2023/288,2023-03-04,"353,90","419,62"
EISCAFE VENEDIG,"Marktstraße 27, 49740 Haselünne",03/2023/289,2023-03-04,"252,90","299,69"
Eiscafe Dolomiti,"Marktplatz 8, 96215 Lichtenfels",03/2023/290,2023-03-04,"227,90","270,19"
Eiscafe Cortina,"Im Krämereck 10, 34560 Fritzlar",03/2023/291,2023-03-04,"214,40","254,03"
Eiscafe GELATO,"Kleine Wollenweberstraße 8, 53113 Bonn",03/2023/292,2023-03-06,"1066,90","1265,38"
Eiscafe Venezia,"Bornheimer Straße 38, 53111 Bonn",03/2023/293,2023-03-06,"636,90","755,10"
Eiscafe Pinocchio,"Alter Markt 6, 32052 Herford",03/2023/294,2023-03-06,"627,90","744,43"
Eiscafe Carucci,"Ringstr. 77, 33647 Bielefeld",03/2023/295,2023-03-06,"609,90","723,17"
Eiscafe Venezia,"Alte Bielefelder Str. 11, 33824 Werther",03/2023/296,2023-03-06,"250,90","297,32"
Eiscafe Ti Amo,"Debusstraße 10, 33442 Herzebrock",03/2023/297,2023-03-06,"234,90","278,31"
Eiscafe PINO UG,"Burgplatz 1, 32052 Herford",03/2023/298,2023-03-06,"221,90","262,85"
Eiscafe La Grappa,"Friedrich-Wilhelm-Straße 50, 47051 Duisburg",03/2023/299,2023-03-07,"346,90","411,20"
Eiscafe Dolomiti,"Markt 1, 32699 Extertal",03/2023/300,2023-03-07,"313,90","371,85"
Eiscafé Porto Fino,"Weserstr. 68, 32257 Bünde",03/2023/301,2023-03-07,"296,90","351,89"
EISCAFE PORTA GELATO,"Westtorstraße 46, 33758 Schloß Holte-Stukenbrock",03/2023/302,2023-03-07,"267,90","317,35"
Eiscafe La Piazza,"Deichstraße 12, 27318 Hoya",03/2023/303,2023-03-07,"242,90","287,93"
Eiscafe San Marco Hachenburg,"Grabenstr. 16, 57627 Hachenburg",03/2023/304,2023-03-09,"347,90","412,39"
Eisdiele Venezia Brakel,"Hanekamp 18, 33034 Brakel",03/2023/305,2023-03-09,"257,90","305,34"
Eiscafe Palermo,"Regensburger Str. 28, 93073 Neutraubling",03/2023/306,2023-03-09,"183,90","217,82"
EISCAFE BRUSTOLON,"Konrad Adenauer Str.110, 52511 Geilenkirchen, DE 340 786 593",03/2023/307,2023-03-10,"569,90","675,30"
EISCAFE TAORMINA GMBH,"Hauptmarkt 17-18, 08056 Zwickau",03/2023/308,2023-03-10,"557,90","661,64"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",03/2023/309,2023-03-10,"229,90","272,56"
EISCAFE MORITZ,"Bahnhofstraße 5, 26122 Oldenburg",03/2023/310,2023-03-10,"205,90","243,99"
Eiscafe am Kirchplatz,"Münsterstaße 2, 33428 Harsewinkel",03/2023/311,2023-03-11,"1027,90","1219,35"
Eiscafe Centrale,"Rudolf Breitscheid Straße 28, 99974 Mühlhausen",03/2023/312,2023-03-13,"1073,90","1273,77"
EISCAFE ROMA,"Obere Hauptstraße 3, 76863 Herxheim",03/2023/313,2023-03-13,"237,90","281,80"
Eiscafe Casanova,"Lange Str. 61, 27580 Bremerhaven",03/2023/314,2023-03-13,"237,90","281,80"
EISCAFE BOF,"Klosterstrasse 6, 89143 - Blaubeuren",03/2023/315,2023-03-13,"216,40","256,30"
Eiscafe Peccati di Gola,"Am Hammergraben 1, 56567 Niederbieber",03/2023/316,2023-03-15,"521,90","618,85"
Eiscafe VENEZIA,"Grabenstr. 13, 53424 Remagen",03/2023/317,2023-03-15,"327,90","388,35"
Eiscafe Riccardi,"Neue Str. 7, 49143 Bissendorf",03/2023/318,2023-03-16,"878,90","1042,17"
CAFE ZUR EISZEIT,"Wendischbora 61a, 01683 Nossen",03/2023/319,2023-03-16,"583,39","691,67"
Eiscafe Nino & Sarah,"Walzweg 6 A, 58710 Menden",03/2023/320,2023-03-16,"543,90","644,82"
EICHIS EISCAFE,"Alsenzer Weg 69, 12559 Berlin",03/2023/321,2023-03-17,"569,90","675,30"
EISCAFE MILLEFIORI,"Breitestr. 35, 13597 Berlin",03/2023/322,2023-03-17,"495,40","587,05"
EISCAFE DOLOMITI,"Am Markt 5, 31867 Lauenau",04/2023/323,2023-04-03,"873,90","1036,80"
Buongiorno Bernhard's,"Am Markt 15, 31655 Stadthagen",04/2023/324,2023-04-03,"834,90","990,13"
Eiscafe Firenze,"Marktplatz 1, 74564 Crailsheim",04/2023/325,2023-04-03,"555,90","658,95"
Eiscafe Diego,Hindenburger Str. 26,04/2023/326,2023-04-03,"522,90","620,04"
Eiscafe Al Ponte,"Brückenstr 19, 34212 Melsungen",04/2023/327,2023-04-03,"401,00","475,18"
Eiscafe Sorriso,"Lutherstraße 1, 30171 Hannover",04/2023/328,2023-04-03,"350,90","415,82"
Eiscafe Positano,"Bahnhofstraße 29, 31698 Lindhorst",04/2023/329,2023-04-03,"322,90","382,63"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",04/2023/330,2023-04-03,"277,90","329,30"
Eiscafe Delicia,"Deisterstraße 4, 31785 Hameln",04/2023/331,2023-04-05,"1160,90","1376,87"
Eiscafe Venezia Stadthagen,"Markt 3-4, 31655 Stadthagen",04/2023/332,2023-04-05,"1098,90","1302,35"
Eiscafe DOLCE VITA,"Marktstraße 30, 37269 Eschwege",04/2023/333,2023-04-05,"644,90","764,60"
Eiscafe Cortina,"Alte Str. 2, 57072 Siegen",04/2023/334,2023-04-05,"571,90","678,01"
Eiscafe La Dolce Vita,"Westerwaldstraße 4-6, 35745 Herborn",04/2023/335,2023-04-05,"559,90","663,75"
Eiscafe Gesuato,"Kirchweg 4, 26127 Oldenburg",04/2023/336,2023-04-05,"459,90","545,27"
Eiscafe Palazzo,"Kirchstraße 21, 46325 Borken",04/2023/337,2023-04-05,"366,90","434,79"
Eiscafe Dolomiti,"Am Kornmarkt 2a, 06618 Naumburg",04/2023/338,2023-04-05,"351,90","417,25"
Eiscafe Bellissimo,"Kirchstraße 4, 48249 Dülmen",04/2023/339,2023-04-05,"344,90","408,91"
Eiscafe Eiszeit,"Königstr. 3, 48143 Münster",04/2023/340,2023-04-05,"340,90","404,17"
Eiscafe Italia Nordhausen,"Rautenstraße 2, 99734 Nordhausen",04/2023/341,2023-04-05,"337,90","400,61"
Eiscafe Gloria,"Steintorstr. 67-69, 49080 Osnabrück",04/2023/342,2023-04-05,"331,90","393,49"
Eiscafe Paradiso,"Hauptstraße 71, 91074 Herzogenaurach",04/2023/343,2023-04-05,"321,90","381,05"
Eiscafe San Remo,"Marktstraße 1, 63165 Mühlheim am Main",04/2023/344,2023-04-05,"315,90","374,30"
Eiscafe Mamma Mia,"Marktstraße 18, 58452 Witten",04/2023/345,2023-04-05,"313,90","371,85"
Eiscafe Leonardo,"Salzstraße 2/4, 33378 Rheda-Wiedenbrück",04/2023/346,2023-04-05,"312,90","370,67"
Eiscafe Sartori,"Neubaugasse 1, 91541 Rothenburg ob der Tauber",04/2023/347,2023-04-05,"303,90","360,12"
Eiscafe SICILIA,"Bahnhofstr. 27, 48653 Coesfeld",04/2023/348,2023-04-05,"301,90","357,75"
Eiscafe Firenze,"Hauptstr. 10, 47574 Goch",04/2023/349,2023-04-05,"290,90","344,57"
Eiscafe Miramare,"Königstraße 94, 47051 Duisburg",04/2023/350,2023-04-05,"289,90","343,76"
Eiscafe Taormina,"Untermarkt 8, 85354 Freising",04/2023/351,2023-04-05,"288,90","342,57"
Eiscafe San Marco,"Obere Straße 8, 59872 Meschede",04/2023/352,2023-04-05,"286,90","340,00"
Eiscafe Cortina,"Gerbergasse 11, 91541 Rothenburg ob der Tauber",04/2023/353,2023-04-06,"1077,90","1278,50"
Eiscafe San Remo,"Westerstr. 14, 33098 Paderborn",04/2023/354,2023-04-06,"1027,90","1219,35"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",04/2023/355,2023-04-06,"645,90","765,79"
Eiscafe Gelateria Lentini,"Dreikönigenstraße 20, 47799 Krefeld",04/2023/356,2023-04-06,"571,90","678,01"
Eiscafe Da Noi,"Rathausstr. 54, 10178 Berlin",04/2023/357,2023-04-07,"706,90","838,19"
EISMANUFAKTUR CAFÉ,Große Straße 46/48,04/2023/358,2023-04-07,"234,90","278,31"
EISCAFE La Fontana,"Hauptstraße 19, 48493 Wettringen",04/2023/359,2023-04-07,"230,90","273,57"
EISCAFE VENEDIG,"Marktstraße 27, 49740 Haselünne",04/2023/360,2023-04-07,"202,90","240,43"
Eiscafe GELATO,"Kleine Wollenweberstraße 8, 53113 Bonn",04/2023/361,2023-04-08,"1075,90","1276,32"
Eiscafe Venezia,"Bornheimer Straße 38, 53111 Bonn",04/2023/362,2023-04-08,"754,90","895,31"
Eiscafe Pinocchio,"Alter Markt 6, 32052 Herford",04/2023/363,2023-04-08,"649,90","770,54"
Eiscafe Carucci,"Ringstr. 77, 33647 Bielefeld",04/2023/364,2023-04-08,"645,90","765,79"
Eiscafe Venezia,"Alte Bielefelder Str. 11, 33824 Werther",04/2023/365,2023-04-08,"296,90","351,89"
Eiscafe Ti Amo,"Debusstraße 10, 33442 Herzebrock",04/2023/366,2023-04-08,"289,90","343,76"
EISCAFE PORTA GELATO,"Westtorstraße 46, 33758 Schloß Holte-Stukenbrock",04/2023/367,2023-04-08,"258,90","306,53"
Eiscafe PINO UG,"Burgplatz 1, 32052 Herford",04/2023/368,2023-04-08,"201,90","239,25"
Eiscafe Cortina,"Im Krämereck 10, 34560 Fritzlar",04/2023/369,2023-04-10,"266,90","316,39"
Eiscafe La Grappa,"Friedrich-Wilhelm-Straße 50, 47051 Duisburg",04/2023/370,2023-04-10,"237,90","281,80"
Eiscafe Dolomiti,"Marktplatz 8, 96215 Lichtenfels",04/2023/371,2023-04-10,"230,90","273,57"
Eiscafe Dolomiti,"Markt 1, 32699 Extertal",04/2023/372,2023-04-10,"201,90","239,25"
Eiscafé Porto Fino,"Weserstr. 68, 32257 Bünde",04/2023/373,2023-04-10,"180,90","214,37"
Eiscafe Palermo,"Regensburger Str. 28, 93073 Neutraubling",04/2023/374,2023-04-11,"231,90","274,75"
Eiscafe San Marco Hachenburg,"Grabenstr. 16, 57627 Hachenburg",04/2023/375,2023-04-11,"181,90","215,45"
Eisdiele Venezia Brakel,"Hanekamp 18, 33034 Brakel",04/2023/376,2023-04-11,"163,90","194,22"
Eiscafe La Piazza,"Deichstraße 12, 27318 Hoya",04/2023/377,2023-04-11,"153,90","182,32"
EISCAFE BRUSTOLON,"Konrad Adenauer Str.110, 52511 Geilenkirchen, DE 340 786 593",04/2023/378,2023-04-12,"579,90","687,47"
EISCAFE TAORMINA GMBH,"Hauptmarkt 17-18, 08056 Zwickau",04/2023/379,2023-04-12,"563,90","668,62"
EISCAFE MORITZ,"Bahnhofstraße 5, 26122 Oldenburg",04/2023/380,2023-04-12,"227,90","270,19"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",04/2023/381,2023-04-12,"181,90","215,45"
Eiscafe am Kirchplatz,"Münsterstaße 2, 33428 Harsewinkel",04/2023/382,2023-04-13,"1052,90","1248,93"
Eiscafe Centrale,"Rudolf Breitscheid Straße 28, 99974 Mühlhausen",04/2023/383,2023-04-14,"1099,90","1304,08"
Eiscafe Casanova,"Lange Str. 61, 27580 Bremerhaven",04/2023/384,2023-04-14,"234,90","278,31"
EISCAFE ROMA,"Obere Hauptstraße 3, 76863 Herxheim",04/2023/385,2023-04-14,"232,90","275,94"
EISCAFE BOF,"Klosterstrasse 6, 89143 - Blaubeuren",04/2023/386,2023-04-14,"168,90","200,17"
Eiscafe Peccati di Gola,"Am Hammergraben 1, 56567 Niederbieber",04/2023/387,2023-04-15,"631,90","749,15"
Eiscafe VENEZIA,"Grabenstr. 13, 53424 Remagen",04/2023/388,2023-04-15,"337,90","400,61"
Eiscafe Riccardi,"Neue Str. 7, 49143 Bissendorf",04/2023/389,2023-04-17,"824,90","978,11"
CAFE ZUR EISZEIT,"Wendischbora 61a, 01683 Nossen",04/2023/390,2023-04-17,"683,89","810,99"
Eiscafe Nino & Sarah,"Walzweg 6 A, 58710 Menden",04/2023/391,2023-04-17,"649,90","770,54"
Eismanufaktur & Café Venezia,"An der Marktkirche 2, 30159 Hannover",04/2023/392,2023-04-17,"639,90","758,78"
EISCAFE MILLEFIORI,"Breitestr. 35, 13597 Berlin",04/2023/393,2023-04-17,"589,90","699,36"
EICHIS EISCAFE,"Alsenzer Weg 69, 12559 Berlin",04/2023/394,2023-04-17,"445,90","528,67"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",05/2023/395,2023-05-02,"2613,90","3103,43"
Eiscafe Al Ponte,"Brückenstr 19, 34212 Melsungen",05/2023/396,2023-05-02,"588,90","698,17"
Eiscafe Positano,"Bahnhofstraße 29, 31698 Lindhorst",05/2023/397,2023-05-02,"577,90","685,04"
EISCAFE DOLOMITI,"Am Markt 5, 31867 Lauenau",05/2023/398,2023-05-02,"561,90","666,25"
Eiscafe Firenze,"Marktplatz 1, 74564 Crailsheim",05/2023/399,2023-05-02,"539,90","640,08"
Buongiorno Bernhard's,"Am Markt 15, 31655 Stadthagen",05/2023/400,2023-05-02,"531,90","630,75"
Eiscafe Sorriso,"Lutherstraße 1, 30171 Hannover",05/2023/401,2023-05-02,"426,90","506,18"
Eiscafe Diego,Hindenburger Str. 26,05/2023/402,2023-05-02,"423,90","502,63"
Eiscafe Delicia,"Deisterstraße 4, 31785 Hameln",05/2023/403,2023-05-04,"1117,90","1326,29"
Eiscafe Venezia Stadthagen,"Markt 3-4, 31655 Stadthagen",05/2023/404,2023-05-04,"1087,90","1290,86"
Eiscafe Bellissimo,"Kirchstraße 4, 48249 Dülmen",05/2023/405,2023-05-04,"1045,90","1240,60"
Eiscafe DOLCE VITA,"Marktstraße 30, 37269 Eschwege",05/2023/406,2023-05-04,"649,90","770,54"
Eiscafe Cortina,"Alte Str. 2, 57072 Siegen",05/2023/407,2023-05-04,"609,90","723,17"
Eiscafe La Dolce Vita,"Westerwaldstraße 4-6, 35745 Herborn",05/2023/408,2023-05-04,"555,90","659,30"
Eiscafe Palazzo,"Kirchstraße 21, 46325 Borken",05/2023/409,2023-05-04,"550,90","653,57"
Eiscafe Eiszeit,"Königstr. 3, 48143 Münster",05/2023/410,2023-05-04,"537,90","637,64"
Eiscafe Gesuato,"Kirchweg 4, 26127 Oldenburg",05/2023/411,2023-05-04,"513,90","609,63"
Eiscafe Dolomiti,"Am Kornmarkt 2a, 06618 Naumburg",05/2023/412,2023-05-04,"432,90","513,44"
Eiscafe Gloria,"Steintorstr. 67-69, 49080 Osnabrück",05/2023/413,2023-05-04,"413,90","490,93"
Eiscafe Sartori,"Neubaugasse 1, 91541 Rothenburg ob der Tauber",05/2023/414,2023-05-04,"397,90","471,69"
Eiscafe Italia Nordhausen,"Rautenstraße 2, 99734 Nordhausen",05/2023/415,2023-05-04,"373,90","443,32"
Eiscafe Paradiso,"Hauptstraße 71, 91074 Herzogenaurach",05/2023/416,2023-05-04,"358,90","425,55"
Eiscafe Leonardo,"Salzstraße 2/4, 33378 Rheda-Wiedenbrück",05/2023/417,2023-05-04,"358,90","425,55"
Eiscafe Mamma Mia,"Marktstraße 18, 58452 Witten",05/2023/418,2023-05-04,"350,90","416,07"
Eiscafe Firenze,"Hauptstr. 10, 47574 Goch",05/2023/419,2023-05-04,"330,90","392,15"
Eiscafe SICILIA,"Bahnhofstr. 27, 48653 Coesfeld",05/2023/420,2023-05-04,"311,90","369,75"
Eiscafe Miramare,"Königstraße 94, 47051 Duisburg",05/2023/421,2023-05-04,"308,90","366,55"
Eiscafe Taormina,"Untermarkt 8, 85354 Freising",05/2023/422,2023-05-04,"307,90","365,37"
Eiscafe San Remo,"Marktstraße 1, 63165 Mühlheim am Main",05/2023/423,2023-05-04,"302,90","359,19"
Eiscafe San Marco,"Obere Straße 8, 59872 Meschede",05/2023/424,2023-05-04,"285,90","339,00"
Eiscafe Cortina,"Gerbergasse 11, 91541 Rothenburg ob der Tauber",05/2023/425,2023-05-05,"1063,90","1261,82"
Eiscafe San Remo,"Westerstr. 14, 33098 Paderborn",05/2023/426,2023-05-05,"984,90","1168,61"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",05/2023/427,2023-05-05,"652,90","774,19"
Eiscafe Gelateria Lentini,"Dreikönigenstraße 20, 47799 Krefeld",05/2023/428,2023-05-05,"583,90","692,22"
Eismanufaktur & Café Venezia,"An der Marktkirche 2, 30159 Hannover",05/2023/429,2023-05-05,"570,90","677,07"
EISMANUFAKTUR CAFÉ,Große Straße 46/48,05/2023/430,2023-05-05,"252,90","299,69"
Eiscafe Da Noi,"Rathausstr. 54, 10178 Berlin",05/2023/431,2023-05-06,"731,90","867,75"
EISCAFE La Fontana,"Hauptstraße 19, 48493 Wettringen",05/2023/432,2023-05-06,"277,90","329,30"
EISCAFE VENEDIG,"Marktstraße 27, 49740 Haselünne",05/2023/433,2023-05-06,"253,90","301,12"
Eiscafe GELATO,"Kleine Wollenweberstraße 8, 53113 Bonn",05/2023/434,2023-05-08,"1071,90","1271,95"
Eiscafe Venezia,"Bornheimer Straße 38, 53111 Bonn",05/2023/435,2023-05-08,"769,90","913,56"
Eiscafe Pinocchio,"Alter Markt 6, 32052 Herford",05/2023/436,2023-05-08,"685,90","813,80"
Eiscafe Carucci,"Ringstr. 77, 33647 Bielefeld",05/2023/437,2023-05-08,"678,90","805,50"
Eiscafe Venezia,"Alte Bielefelder Str. 11, 33824 Werther",05/2023/438,2023-05-08,"302,90","359,19"
Eiscafe Ti Amo,"Debusstraße 10, 33442 Herzebrock",05/2023/439,2023-05-08,"297,90","353,08"
Eiscafe PINO UG,"Burgplatz 1, 32052 Herford",05/2023/440,2023-05-08,"283,90","336,62"
EISCAFE PORTA GELATO,"Westtorstraße 46, 33758 Schloß Holte-Stukenbrock",05/2023/441,2023-05-08,"232,90","276,13"
Eiscafe La Grappa,"Friedrich-Wilhelm-Straße 50, 47051 Duisburg",05/2023/442,2023-05-09,"343,90","407,63"
Eiscafe Cortina,"Im Krämereck 10, 34560 Fritzlar",05/2023/443,2023-05-09,"295,90","350,70"
Eiscafe Dolomiti,"Marktplatz 8, 96215 Lichtenfels",05/2023/444,2023-05-09,"289,90","343,76"
Eiscafé Porto Fino,"Weserstr. 68, 32257 Bünde",05/2023/445,2023-05-09,"261,90","310,45"
Eiscafe Dolomiti,"Markt 1, 32699 Extertal",05/2023/446,2023-05-09,"258,90","306,53"
Eiscafe La Piazza,"Deichstraße 12, 27318 Hoya",05/2023/447,2023-05-09,"237,90","281,80"
Eiscafe San Marco Hachenburg,"Grabenstr. 16, 57627 Hachenburg",05/2023/448,2023-05-10,"287,90","341,19"
Eiscafe Palermo,"Regensburger Str. 28, 93073 Neutraubling",05/2023/449,2023-05-10,"253,90","300,95"
Eisdiele Venezia Brakel,"Hanekamp 18, 33034 Brakel",05/2023/450,2023-05-10,"238,90","283,17"
EISCAFE TAORMINA GMBH,"Hauptmarkt 17-18, 08056 Zwickau",05/2023/451,2023-05-11,"573,90","680,33"
EISCAFE BRUSTOLON,"Konrad Adenauer Str.110, 52511 Geilenkirchen, DE 340 786 593",05/2023/452,2023-05-11,"567,90","673,53"
EISCAFE MORITZ,"Bahnhofstraße 5, 26122 Oldenburg",05/2023/453,2023-05-11,"233,90","277,13"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",05/2023/454,2023-05-11,"201,90","239,25"
Eiscafe am Kirchplatz,"Münsterstaße 2, 33428 Harsewinkel",05/2023/455,2023-05-12,"1083,90","1285,63"
Eiscafe Centrale,"Rudolf Breitscheid Straße 28, 99974 Mühlhausen",05/2023/456,2023-05-15,"1097,90","1302,35"
EISCAFE ROMA,"Obere Hauptstraße 3, 76863 Herxheim",05/2023/457,2023-05-15,"264,90","313,81"
Eiscafe Casanova,"Lange Str. 61, 27580 Bremerhaven",05/2023/458,2023-05-15,"257,90","305,83"
EISCAFE BOF,"Klosterstrasse 6, 89143 - Blaubeuren",05/2023/459,2023-05-15,"211,90","250,95"
Eiscafe Peccati di Gola,"Am Hammergraben 1, 56567 Niederbieber",05/2023/460,2023-05-16,"648,90","769,35"
Eiscafe VENEZIA,"Grabenstr. 13, 53424 Remagen",05/2023/461,2023-05-16,"378,90","449,32"
Eiscafe Riccardi,"Neue Str. 7, 49143 Bissendorf",05/2023/462,2023-05-17,"818,90","971,28"
CAFE ZUR EISZEIT,"Wendischbora 61a, 01683 Nossen",05/2023/463,2023-05-17,"753,90","893,62"
Eiscafe Nino & Sarah,"Walzweg 6 A, 58710 Menden",05/2023/464,2023-05-17,"676,90","802,50"
EISCAFE MILLEFIORI,"Breitestr. 35, 13597 Berlin",05/2023/465,2023-05-17,"621,90","737,25"
EICHIS EISCAFE,"Alsenzer Weg 69, 12559 Berlin",05/2023/466,2023-05-17,"513,90","609,63"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",06/2023/467,2023-06-01,"2618,90","3110,49"
Eiscafe Positano,"Bahnhofstraße 29, 31698 Lindhorst",06/2023/468,2023-06-01,"618,90","734,18"
Eiscafe Al Ponte,"Brückenstr 19, 34212 Melsungen",06/2023/469,2023-06-01,"560,90","665,07"
EISCAFE DOLOMITI,"Am Markt 5, 31867 Lauenau",06/2023/470,2023-06-01,"531,90","630,75"
Buongiorno Bernhard's,"Am Markt 15, 31655 Stadthagen",06/2023/471,2023-06-01,"508,90","603,55"
Eiscafe Firenze,"Marktplatz 1, 74564 Crailsheim",06/2023/472,2023-06-01,"493,90","585,93"
Eiscafe Sorriso,"Lutherstraße 1, 30171 Hannover",06/2023/473,2023-06-01,"478,90","568,28"
Eiscafe Diego,Hindenburger Str. 26,06/2023/474,2023-06-01,"463,90","550,63"
Eiscafe Delicia,"Deisterstraße 4, 31785 Hameln",06/2023/475,2023-06-05,"1193,90","1417,33"
Eiscafe Venezia Stadthagen,"Markt 3-4, 31655 Stadthagen",06/2023/476,2023-06-05,"1149,90","1365,16"
Eiscafe Bellissimo,"Kirchstraße 4, 48249 Dülmen",06/2023/477,2023-06-05,"1085,90","1288,00"
Eiscafe DOLCE VITA,"Marktstraße 30, 37269 Eschwege",06/2023/478,2023-06-05,"695,90","825,90"
Eiscafe Cortina,"Alte Str. 2, 57072 Siegen",06/2023/479,2023-06-05,"668,90","793,58"
Eiscafe La Dolce Vita,"Westerwaldstraße 4-6, 35745 Herborn",06/2023/480,2023-06-05,"627,90","744,93"
Eiscafe Palazzo,"Kirchstraße 21, 46325 Borken",06/2023/481,2023-06-05,"611,90","726,05"
Eiscafe Gesuato,"Kirchweg 4, 26127 Oldenburg",06/2023/482,2023-06-05,"598,90","710,58"
Eiscafe Eiszeit,"Königstr. 3, 48143 Münster",06/2023/483,2023-06-05,"548,90","651,77"
Eiscafe Gloria,"Steintorstr. 67-69, 49080 Osnabrück",06/2023/484,2023-06-05,"487,90","579,39"
Eiscafe Dolomiti,"Am Kornmarkt 2a, 06618 Naumburg",06/2023/485,2023-06-05,"476,90","565,90"
Eiscafe Sartori,"Neubaugasse 1, 91541 Rothenburg ob der Tauber",06/2023/486,2023-06-05,"436,90","518,20"
Eiscafe Italia Nordhausen,"Rautenstraße 2, 99734 Nordhausen",06/2023/487,2023-06-05,"435,90","517,01"
Eiscafe Leonardo,"Salzstraße 2/4, 33378 Rheda-Wiedenbrück",06/2023/488,2023-06-05,"418,90","497,27"
Eiscafe Paradiso,"Hauptstraße 71, 91074 Herzogenaurach",06/2023/489,2023-06-05,"409,90","486,76"
Eiscafe Mamma Mia,"Marktstraße 18, 58452 Witten",06/2023/490,2023-06-05,"407,90","484,38"
Eiscafe Firenze,"Hauptstr. 10, 47574 Goch",06/2023/491,2023-06-05,"385,90","457,60"
Eiscafe SICILIA,"Bahnhofstr. 27, 48653 Coesfeld",06/2023/492,2023-06-05,"369,90","438,96"
Eiscafe Miramare,"Königstraße 94, 47051 Duisburg",06/2023/493,2023-06-05,"365,90","434,20"
Eiscafe Taormina,"Untermarkt 8, 85354 Freising",06/2023/494,2023-06-05,"352,90","418,94"
Eiscafe San Remo,"Marktstraße 1, 63165 Mühlheim am Main",06/2023/495,2023-06-05,"350,90","416,07"
Eiscafe San Marco,"Obere Straße 8, 59872 Meschede",06/2023/496,2023-06-05,"339,90","403,36"
Eiscafe Cortina,"Gerbergasse 11, 91541 Rothenburg ob der Tauber",06/2023/497,2023-06-06,"1046,90","1242,00"
Eiscafe San Remo,"Westerstr. 14, 33098 Paderborn",06/2023/498,2023-06-06,"997,90","1184,29"
EISCAFE GELATIAMO,"Darmstädter Str. 9, 64846 Groß-Zimmern",06/2023/499,2023-06-06,"681,90","808,65"
Eiscafe Gelateria Lentini,"Dreikönigenstraße 20, 47799 Krefeld",06/2023/500,2023-06-06,"612,90","727,24"
Eismanufaktur & Café Venezia,"An der Marktkirche 2, 30159 Hannover",06/2023/501,2023-06-06,"597,90","709,39"
EISMANUFAKTUR CAFÉ,Große Straße 46/48,06/2023/502,2023-06-06,"257,90","305,83"
Eiscafe Da Noi,"Rathausstr. 54, 10178 Berlin",06/2023/503,2023-06-07,"741,90","880,25"
EISCAFE VENEDIG,"Marktstraße 27, 49740 Haselünne",06/2023/504,2023-06-07,"305,90","362,50"
EISCAFE La Fontana,"Hauptstraße 19, 48493 Wettringen",06/2023/505,2023-06-07,"290,90","344,97"
Eiscafe GELATO,"Kleine Wollenweberstraße 8, 53113 Bonn",06/2023/506,2023-06-08,"1058,90","1256,57"
Eiscafe Venezia,"Bornheimer Straße 38, 53111 Bonn",06/2023/507,2023-06-08,"783,90","930,23"
Eiscafe Pinocchio,"Alter Markt 6, 32052 Herford",06/2023/508,2023-06-08,"722,90","857,84"
Eiscafe Carucci,"Ringstr. 77, 33647 Bielefeld",06/2023/509,2023-06-08,"699,90","830,88"
Eiscafe Venezia,"Alte Bielefelder Str. 11, 33824 Werther",06/2023/510,2023-06-08,"320,90","380,67"
Eiscafe Ti Amo,"Debusstraße 10, 33442 Herzebrock",06/2023/511,2023-06-08,"315,90","374,70"
Eiscafe PINO UG,"Burgplatz 1, 32052 Herford",06/2023/512,2023-06-08,"299,90","355,88"
EISCAFE PORTA GELATO,"Westtorstraße 46, 33758 Schloß Holte-Stukenbrock",06/2023/513,2023-06-08,"284,90","337,81"
Eiscafe La Grappa,"Friedrich-Wilhelm-Straße 50, 47051 Duisburg",06/2023/514,2023-06-09,"382,90","454,04"
Eiscafe Cortina,"Im Krämereck 10, 34560 Fritzlar",06/2023/515,2023-06-09,"329,90","391,16"
Eiscafe Dolomiti,"Marktplatz 8, 96215 Lichtenfels",06/2023/516,2023-06-09,"318,90","378,28"
Eiscafé Porto Fino,"Weserstr. 68, 32257 Bünde",06/2023/517,2023-06-09,"298,90","354,28"
Eiscafe Dolomiti,"Markt 1, 32699 Extertal",06/2023/518,2023-06-09,"283,90","336,62"
Eiscafe La Piazza,"Deichstraße 12, 27318 Hoya",06/2023/519,2023-06-09,"262,90","311,84"
Eiscafe San Marco Hachenburg,"Grabenstr. 16, 57627 Hachenburg",06/2023/520,2023-06-12,"329,90","391,16"
Eiscafe Palermo,"Regensburger Str. 28, 93073 Neutraubling",06/2023/521,2023-06-12,"285,90","339,00"
Eisdiele Venezia Brakel,"Hanekamp 18, 33034 Brakel",06/2023/522,2023-06-12,"265,90","315,40"
EISCAFE TAORMINA GMBH,"Hauptmarkt 17-18, 08056 Zwickau",06/2023/523,2023-06-13,"577,90","685,68"
EISCAFE BRUSTOLON,"Konrad Adenauer Str.110, 52511 Geilenkirchen, DE 340 786 593",06/2023/524,2023-06-13,"569,90","676,16"
EISCAFE MORITZ,"Bahnhofstraße 5, 26122 Oldenburg",06/2023/525,2023-06-13,"233,90","277,13"
EISCAFE LA DOLCE LUCANIA,"Industriestr. 6, 91567 Herrieden",06/2023/526,2023-06-13,"201,90","239,25"
Eiscafe am Kirchplatz,"Münsterstaße 2, 33428 Harsewinkel",06/2023/527,2023-06-14,"1108,90","1315,57"
Eiscafe Centrale,"Rudolf Breitscheid Straße 28, 99974 Mühlhausen",06/2023/528,2023-06-15,"1115,90","1324,30"
EISCAFE ROMA,"Obere Hauptstraße 3, 76863 Herxheim",06/2023/529,2023-06-15,"277,90","329,30"
Eiscafe Casanova,"Lange Str. 61, 27580 Bremerhaven",06/2023/530,2023-06-15,"257,90","305,83"
EISCAFE BOF,"Klosterstrasse 6, 89143 - Blaubeuren",06/2023/531,2023-06-15,"238,90","283,17"
Eiscafe Peccati di Gola,"Am Hammergraben 1, 56567 Niederbieber",06/2023/532,2023-06-19,"708,90","841,57"
Eiscafe VENEZIA,"Grabenstr. 13, 53424 Remagen",06/2023/533,2023-06-19,"425,90","505,40"
Eiscafe Riccardi,"Neue Str. 7, 49143 Bissendorf",06/2023/534,2023-06-19,"869,90","1032,16"
CAFE ZUR EISZEIT,"Wendischbora 61a, 01683 Nossen",06/2023/535,2023-06-19,"804,39","954,21"
Eiscafe Nino & Sarah,"Walzweg 6 A, 58710 Menden",06/2023/536,2023-06-19,"699,90","830,88"
EISCAFE MILLEFIORI,"Breitestr. 35, 13597 Berlin",06/2023/537,2023-06-19,"646,90","767,79"
EICHIS EISCAFE,"Alsenzer Weg 69, 12559 Berlin",06/2023/538,2023-06-19,"579,90","688,56"`;

const parseCSV = (csv: string) => {
  const lines = csv.trim().split('\n').slice(1); // Skip header
  return lines.map(line => {
    const match = line.match(/^([^,]+),"([^"]+)",([^,]+),([^,]+),"([^"]+)","([^"]+)"$/);
    if (!match) return null;
    
    const [, name, address, invoiceNumber, invoiceDate, netAmount, grossAmount] = match;
    
    return {
      customerName: name.trim(),
      customerAddress: address.trim(),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate.trim(),
      netAmount: parseFloat(netAmount.replace(',', '.')),
      grossAmount: parseFloat(grossAmount.replace(',', '.'))
    };
  }).filter(Boolean);
};

export const AutoImport2023 = () => {
  const [status, setStatus] = useState<'pending' | 'importing' | 'success' | 'error'>('pending');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const runImport = async () => {
      setStatus('importing');
      try {
        const parsedData = parseCSV(csvData);
        console.log(`Parsed ${parsedData.length} invoices from CSV`);
        
        const { data, error } = await supabase.functions.invoke('import-invoicehome', {
          body: {
            data: parsedData,
            importType: 'csv-import-2023',
            forceStatus: 'bezahlt',
            targetYear: 2023
          }
        });

        if (error) throw error;

        setResult(data);
        setStatus('success');
        toast.success(`Import erfolgreich: ${data.successful} von ${parsedData.length} Rechnungen importiert`);
      } catch (error) {
        console.error('Import error:', error);
        setStatus('error');
        toast.error('Import fehlgeschlagen');
      }
    };

    runImport();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === 'importing' && <Loader2 className="h-5 w-5 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
          Auto-Import 2023
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === 'importing' && (
          <p>Importiere 303 Rechnungen für 2023 mit Status "bezahlt"...</p>
        )}
        {status === 'success' && result && (
          <div className="space-y-2">
            <p className="text-green-600">✓ Import erfolgreich abgeschlossen!</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Verarbeitet: {result.processed}</div>
              <div>Erfolgreich: {result.successful}</div>
              <div>Neu erstellt: {result.created || 0}</div>
              <div>Aktualisiert: {result.updated || 0}</div>
            </div>
          </div>
        )}
        {status === 'error' && (
          <p className="text-red-600">Fehler beim Import</p>
        )}
      </CardContent>
    </Card>
  );
};
