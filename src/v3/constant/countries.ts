/**
 * Static ISO 3166-1 country list for SELF_HOSTED mode.
 *
 * Upstream sources countries from the external APP_COUNTRY_API
 * (collect-api.sws2apps.com). A self-hosted instance must not depend on that
 * (PROJECT.md §2), so getCountries serves this bundled list instead when
 * SELF_HOSTED is set. Shape matches the client CountryResponseType exactly, so
 * the client CountrySelector needs no changes. countryGuid mirrors countryCode:
 * with the external directory gone, the guid is no longer a JW.org identifier,
 * just a stable key.
 *
 * Generated once via Node Intl.DisplayNames('en',{type:'region'});
 * English names only (multi-language is a documented M5.5 follow-up).
 */

export type StaticCountry = { countryCode: string; countryName: string; countryGuid: string };

export const SELF_HOSTED_COUNTRIES: StaticCountry[] = [
  {
    "countryCode": "AF",
    "countryName": "Afghanistan",
    "countryGuid": "AF"
  },
  {
    "countryCode": "AX",
    "countryName": "Åland Islands",
    "countryGuid": "AX"
  },
  {
    "countryCode": "AL",
    "countryName": "Albania",
    "countryGuid": "AL"
  },
  {
    "countryCode": "DZ",
    "countryName": "Algeria",
    "countryGuid": "DZ"
  },
  {
    "countryCode": "AS",
    "countryName": "American Samoa",
    "countryGuid": "AS"
  },
  {
    "countryCode": "AD",
    "countryName": "Andorra",
    "countryGuid": "AD"
  },
  {
    "countryCode": "AO",
    "countryName": "Angola",
    "countryGuid": "AO"
  },
  {
    "countryCode": "AI",
    "countryName": "Anguilla",
    "countryGuid": "AI"
  },
  {
    "countryCode": "AQ",
    "countryName": "Antarctica",
    "countryGuid": "AQ"
  },
  {
    "countryCode": "AG",
    "countryName": "Antigua & Barbuda",
    "countryGuid": "AG"
  },
  {
    "countryCode": "AR",
    "countryName": "Argentina",
    "countryGuid": "AR"
  },
  {
    "countryCode": "AM",
    "countryName": "Armenia",
    "countryGuid": "AM"
  },
  {
    "countryCode": "AW",
    "countryName": "Aruba",
    "countryGuid": "AW"
  },
  {
    "countryCode": "AU",
    "countryName": "Australia",
    "countryGuid": "AU"
  },
  {
    "countryCode": "AT",
    "countryName": "Austria",
    "countryGuid": "AT"
  },
  {
    "countryCode": "AZ",
    "countryName": "Azerbaijan",
    "countryGuid": "AZ"
  },
  {
    "countryCode": "BS",
    "countryName": "Bahamas",
    "countryGuid": "BS"
  },
  {
    "countryCode": "BH",
    "countryName": "Bahrain",
    "countryGuid": "BH"
  },
  {
    "countryCode": "BD",
    "countryName": "Bangladesh",
    "countryGuid": "BD"
  },
  {
    "countryCode": "BB",
    "countryName": "Barbados",
    "countryGuid": "BB"
  },
  {
    "countryCode": "BY",
    "countryName": "Belarus",
    "countryGuid": "BY"
  },
  {
    "countryCode": "BE",
    "countryName": "Belgium",
    "countryGuid": "BE"
  },
  {
    "countryCode": "BZ",
    "countryName": "Belize",
    "countryGuid": "BZ"
  },
  {
    "countryCode": "BJ",
    "countryName": "Benin",
    "countryGuid": "BJ"
  },
  {
    "countryCode": "DY",
    "countryName": "Benin",
    "countryGuid": "DY"
  },
  {
    "countryCode": "BM",
    "countryName": "Bermuda",
    "countryGuid": "BM"
  },
  {
    "countryCode": "BT",
    "countryName": "Bhutan",
    "countryGuid": "BT"
  },
  {
    "countryCode": "BO",
    "countryName": "Bolivia",
    "countryGuid": "BO"
  },
  {
    "countryCode": "BA",
    "countryName": "Bosnia & Herzegovina",
    "countryGuid": "BA"
  },
  {
    "countryCode": "BW",
    "countryName": "Botswana",
    "countryGuid": "BW"
  },
  {
    "countryCode": "BV",
    "countryName": "Bouvet Island",
    "countryGuid": "BV"
  },
  {
    "countryCode": "BR",
    "countryName": "Brazil",
    "countryGuid": "BR"
  },
  {
    "countryCode": "IO",
    "countryName": "British Indian Ocean Territory",
    "countryGuid": "IO"
  },
  {
    "countryCode": "VG",
    "countryName": "British Virgin Islands",
    "countryGuid": "VG"
  },
  {
    "countryCode": "BN",
    "countryName": "Brunei",
    "countryGuid": "BN"
  },
  {
    "countryCode": "BG",
    "countryName": "Bulgaria",
    "countryGuid": "BG"
  },
  {
    "countryCode": "BF",
    "countryName": "Burkina Faso",
    "countryGuid": "BF"
  },
  {
    "countryCode": "HV",
    "countryName": "Burkina Faso",
    "countryGuid": "HV"
  },
  {
    "countryCode": "BI",
    "countryName": "Burundi",
    "countryGuid": "BI"
  },
  {
    "countryCode": "KH",
    "countryName": "Cambodia",
    "countryGuid": "KH"
  },
  {
    "countryCode": "CM",
    "countryName": "Cameroon",
    "countryGuid": "CM"
  },
  {
    "countryCode": "CA",
    "countryName": "Canada",
    "countryGuid": "CA"
  },
  {
    "countryCode": "CV",
    "countryName": "Cape Verde",
    "countryGuid": "CV"
  },
  {
    "countryCode": "BQ",
    "countryName": "Caribbean Netherlands",
    "countryGuid": "BQ"
  },
  {
    "countryCode": "KY",
    "countryName": "Cayman Islands",
    "countryGuid": "KY"
  },
  {
    "countryCode": "CF",
    "countryName": "Central African Republic",
    "countryGuid": "CF"
  },
  {
    "countryCode": "TD",
    "countryName": "Chad",
    "countryGuid": "TD"
  },
  {
    "countryCode": "CL",
    "countryName": "Chile",
    "countryGuid": "CL"
  },
  {
    "countryCode": "CN",
    "countryName": "China",
    "countryGuid": "CN"
  },
  {
    "countryCode": "CX",
    "countryName": "Christmas Island",
    "countryGuid": "CX"
  },
  {
    "countryCode": "CC",
    "countryName": "Cocos (Keeling) Islands",
    "countryGuid": "CC"
  },
  {
    "countryCode": "CO",
    "countryName": "Colombia",
    "countryGuid": "CO"
  },
  {
    "countryCode": "KM",
    "countryName": "Comoros",
    "countryGuid": "KM"
  },
  {
    "countryCode": "CG",
    "countryName": "Congo - Brazzaville",
    "countryGuid": "CG"
  },
  {
    "countryCode": "CD",
    "countryName": "Congo - Kinshasa",
    "countryGuid": "CD"
  },
  {
    "countryCode": "ZR",
    "countryName": "Congo - Kinshasa",
    "countryGuid": "ZR"
  },
  {
    "countryCode": "CK",
    "countryName": "Cook Islands",
    "countryGuid": "CK"
  },
  {
    "countryCode": "CR",
    "countryName": "Costa Rica",
    "countryGuid": "CR"
  },
  {
    "countryCode": "CI",
    "countryName": "Côte d’Ivoire",
    "countryGuid": "CI"
  },
  {
    "countryCode": "HR",
    "countryName": "Croatia",
    "countryGuid": "HR"
  },
  {
    "countryCode": "CU",
    "countryName": "Cuba",
    "countryGuid": "CU"
  },
  {
    "countryCode": "AN",
    "countryName": "Curaçao",
    "countryGuid": "AN"
  },
  {
    "countryCode": "CW",
    "countryName": "Curaçao",
    "countryGuid": "CW"
  },
  {
    "countryCode": "CY",
    "countryName": "Cyprus",
    "countryGuid": "CY"
  },
  {
    "countryCode": "CZ",
    "countryName": "Czechia",
    "countryGuid": "CZ"
  },
  {
    "countryCode": "DK",
    "countryName": "Denmark",
    "countryGuid": "DK"
  },
  {
    "countryCode": "DJ",
    "countryName": "Djibouti",
    "countryGuid": "DJ"
  },
  {
    "countryCode": "DM",
    "countryName": "Dominica",
    "countryGuid": "DM"
  },
  {
    "countryCode": "DO",
    "countryName": "Dominican Republic",
    "countryGuid": "DO"
  },
  {
    "countryCode": "EC",
    "countryName": "Ecuador",
    "countryGuid": "EC"
  },
  {
    "countryCode": "EG",
    "countryName": "Egypt",
    "countryGuid": "EG"
  },
  {
    "countryCode": "SV",
    "countryName": "El Salvador",
    "countryGuid": "SV"
  },
  {
    "countryCode": "GQ",
    "countryName": "Equatorial Guinea",
    "countryGuid": "GQ"
  },
  {
    "countryCode": "ER",
    "countryName": "Eritrea",
    "countryGuid": "ER"
  },
  {
    "countryCode": "EE",
    "countryName": "Estonia",
    "countryGuid": "EE"
  },
  {
    "countryCode": "SZ",
    "countryName": "Eswatini",
    "countryGuid": "SZ"
  },
  {
    "countryCode": "ET",
    "countryName": "Ethiopia",
    "countryGuid": "ET"
  },
  {
    "countryCode": "FK",
    "countryName": "Falkland Islands",
    "countryGuid": "FK"
  },
  {
    "countryCode": "FO",
    "countryName": "Faroe Islands",
    "countryGuid": "FO"
  },
  {
    "countryCode": "FJ",
    "countryName": "Fiji",
    "countryGuid": "FJ"
  },
  {
    "countryCode": "FI",
    "countryName": "Finland",
    "countryGuid": "FI"
  },
  {
    "countryCode": "FR",
    "countryName": "France",
    "countryGuid": "FR"
  },
  {
    "countryCode": "FX",
    "countryName": "France",
    "countryGuid": "FX"
  },
  {
    "countryCode": "GF",
    "countryName": "French Guiana",
    "countryGuid": "GF"
  },
  {
    "countryCode": "PF",
    "countryName": "French Polynesia",
    "countryGuid": "PF"
  },
  {
    "countryCode": "TF",
    "countryName": "French Southern Territories",
    "countryGuid": "TF"
  },
  {
    "countryCode": "GA",
    "countryName": "Gabon",
    "countryGuid": "GA"
  },
  {
    "countryCode": "GM",
    "countryName": "Gambia",
    "countryGuid": "GM"
  },
  {
    "countryCode": "GE",
    "countryName": "Georgia",
    "countryGuid": "GE"
  },
  {
    "countryCode": "DD",
    "countryName": "Germany",
    "countryGuid": "DD"
  },
  {
    "countryCode": "DE",
    "countryName": "Germany",
    "countryGuid": "DE"
  },
  {
    "countryCode": "GH",
    "countryName": "Ghana",
    "countryGuid": "GH"
  },
  {
    "countryCode": "GI",
    "countryName": "Gibraltar",
    "countryGuid": "GI"
  },
  {
    "countryCode": "GR",
    "countryName": "Greece",
    "countryGuid": "GR"
  },
  {
    "countryCode": "GL",
    "countryName": "Greenland",
    "countryGuid": "GL"
  },
  {
    "countryCode": "GD",
    "countryName": "Grenada",
    "countryGuid": "GD"
  },
  {
    "countryCode": "GP",
    "countryName": "Guadeloupe",
    "countryGuid": "GP"
  },
  {
    "countryCode": "GU",
    "countryName": "Guam",
    "countryGuid": "GU"
  },
  {
    "countryCode": "GT",
    "countryName": "Guatemala",
    "countryGuid": "GT"
  },
  {
    "countryCode": "GG",
    "countryName": "Guernsey",
    "countryGuid": "GG"
  },
  {
    "countryCode": "GN",
    "countryName": "Guinea",
    "countryGuid": "GN"
  },
  {
    "countryCode": "GW",
    "countryName": "Guinea-Bissau",
    "countryGuid": "GW"
  },
  {
    "countryCode": "GY",
    "countryName": "Guyana",
    "countryGuid": "GY"
  },
  {
    "countryCode": "HT",
    "countryName": "Haiti",
    "countryGuid": "HT"
  },
  {
    "countryCode": "HM",
    "countryName": "Heard & McDonald Islands",
    "countryGuid": "HM"
  },
  {
    "countryCode": "HN",
    "countryName": "Honduras",
    "countryGuid": "HN"
  },
  {
    "countryCode": "HK",
    "countryName": "Hong Kong SAR China",
    "countryGuid": "HK"
  },
  {
    "countryCode": "HU",
    "countryName": "Hungary",
    "countryGuid": "HU"
  },
  {
    "countryCode": "IS",
    "countryName": "Iceland",
    "countryGuid": "IS"
  },
  {
    "countryCode": "IN",
    "countryName": "India",
    "countryGuid": "IN"
  },
  {
    "countryCode": "ID",
    "countryName": "Indonesia",
    "countryGuid": "ID"
  },
  {
    "countryCode": "IR",
    "countryName": "Iran",
    "countryGuid": "IR"
  },
  {
    "countryCode": "IQ",
    "countryName": "Iraq",
    "countryGuid": "IQ"
  },
  {
    "countryCode": "IE",
    "countryName": "Ireland",
    "countryGuid": "IE"
  },
  {
    "countryCode": "IM",
    "countryName": "Isle of Man",
    "countryGuid": "IM"
  },
  {
    "countryCode": "IL",
    "countryName": "Israel",
    "countryGuid": "IL"
  },
  {
    "countryCode": "IT",
    "countryName": "Italy",
    "countryGuid": "IT"
  },
  {
    "countryCode": "JM",
    "countryName": "Jamaica",
    "countryGuid": "JM"
  },
  {
    "countryCode": "JP",
    "countryName": "Japan",
    "countryGuid": "JP"
  },
  {
    "countryCode": "JE",
    "countryName": "Jersey",
    "countryGuid": "JE"
  },
  {
    "countryCode": "JO",
    "countryName": "Jordan",
    "countryGuid": "JO"
  },
  {
    "countryCode": "KZ",
    "countryName": "Kazakhstan",
    "countryGuid": "KZ"
  },
  {
    "countryCode": "KE",
    "countryName": "Kenya",
    "countryGuid": "KE"
  },
  {
    "countryCode": "KI",
    "countryName": "Kiribati",
    "countryGuid": "KI"
  },
  {
    "countryCode": "XK",
    "countryName": "Kosovo",
    "countryGuid": "XK"
  },
  {
    "countryCode": "KW",
    "countryName": "Kuwait",
    "countryGuid": "KW"
  },
  {
    "countryCode": "KG",
    "countryName": "Kyrgyzstan",
    "countryGuid": "KG"
  },
  {
    "countryCode": "LA",
    "countryName": "Laos",
    "countryGuid": "LA"
  },
  {
    "countryCode": "LV",
    "countryName": "Latvia",
    "countryGuid": "LV"
  },
  {
    "countryCode": "LB",
    "countryName": "Lebanon",
    "countryGuid": "LB"
  },
  {
    "countryCode": "LS",
    "countryName": "Lesotho",
    "countryGuid": "LS"
  },
  {
    "countryCode": "LR",
    "countryName": "Liberia",
    "countryGuid": "LR"
  },
  {
    "countryCode": "LY",
    "countryName": "Libya",
    "countryGuid": "LY"
  },
  {
    "countryCode": "LI",
    "countryName": "Liechtenstein",
    "countryGuid": "LI"
  },
  {
    "countryCode": "LT",
    "countryName": "Lithuania",
    "countryGuid": "LT"
  },
  {
    "countryCode": "LU",
    "countryName": "Luxembourg",
    "countryGuid": "LU"
  },
  {
    "countryCode": "MO",
    "countryName": "Macao SAR China",
    "countryGuid": "MO"
  },
  {
    "countryCode": "MG",
    "countryName": "Madagascar",
    "countryGuid": "MG"
  },
  {
    "countryCode": "MW",
    "countryName": "Malawi",
    "countryGuid": "MW"
  },
  {
    "countryCode": "MY",
    "countryName": "Malaysia",
    "countryGuid": "MY"
  },
  {
    "countryCode": "MV",
    "countryName": "Maldives",
    "countryGuid": "MV"
  },
  {
    "countryCode": "ML",
    "countryName": "Mali",
    "countryGuid": "ML"
  },
  {
    "countryCode": "MT",
    "countryName": "Malta",
    "countryGuid": "MT"
  },
  {
    "countryCode": "MH",
    "countryName": "Marshall Islands",
    "countryGuid": "MH"
  },
  {
    "countryCode": "MQ",
    "countryName": "Martinique",
    "countryGuid": "MQ"
  },
  {
    "countryCode": "MR",
    "countryName": "Mauritania",
    "countryGuid": "MR"
  },
  {
    "countryCode": "MU",
    "countryName": "Mauritius",
    "countryGuid": "MU"
  },
  {
    "countryCode": "YT",
    "countryName": "Mayotte",
    "countryGuid": "YT"
  },
  {
    "countryCode": "MX",
    "countryName": "Mexico",
    "countryGuid": "MX"
  },
  {
    "countryCode": "FM",
    "countryName": "Micronesia",
    "countryGuid": "FM"
  },
  {
    "countryCode": "MD",
    "countryName": "Moldova",
    "countryGuid": "MD"
  },
  {
    "countryCode": "MC",
    "countryName": "Monaco",
    "countryGuid": "MC"
  },
  {
    "countryCode": "MN",
    "countryName": "Mongolia",
    "countryGuid": "MN"
  },
  {
    "countryCode": "ME",
    "countryName": "Montenegro",
    "countryGuid": "ME"
  },
  {
    "countryCode": "MS",
    "countryName": "Montserrat",
    "countryGuid": "MS"
  },
  {
    "countryCode": "MA",
    "countryName": "Morocco",
    "countryGuid": "MA"
  },
  {
    "countryCode": "MZ",
    "countryName": "Mozambique",
    "countryGuid": "MZ"
  },
  {
    "countryCode": "BU",
    "countryName": "Myanmar (Burma)",
    "countryGuid": "BU"
  },
  {
    "countryCode": "MM",
    "countryName": "Myanmar (Burma)",
    "countryGuid": "MM"
  },
  {
    "countryCode": "NA",
    "countryName": "Namibia",
    "countryGuid": "NA"
  },
  {
    "countryCode": "NR",
    "countryName": "Nauru",
    "countryGuid": "NR"
  },
  {
    "countryCode": "NP",
    "countryName": "Nepal",
    "countryGuid": "NP"
  },
  {
    "countryCode": "NL",
    "countryName": "Netherlands",
    "countryGuid": "NL"
  },
  {
    "countryCode": "NC",
    "countryName": "New Caledonia",
    "countryGuid": "NC"
  },
  {
    "countryCode": "NZ",
    "countryName": "New Zealand",
    "countryGuid": "NZ"
  },
  {
    "countryCode": "NI",
    "countryName": "Nicaragua",
    "countryGuid": "NI"
  },
  {
    "countryCode": "NE",
    "countryName": "Niger",
    "countryGuid": "NE"
  },
  {
    "countryCode": "NG",
    "countryName": "Nigeria",
    "countryGuid": "NG"
  },
  {
    "countryCode": "NU",
    "countryName": "Niue",
    "countryGuid": "NU"
  },
  {
    "countryCode": "NF",
    "countryName": "Norfolk Island",
    "countryGuid": "NF"
  },
  {
    "countryCode": "KP",
    "countryName": "North Korea",
    "countryGuid": "KP"
  },
  {
    "countryCode": "MK",
    "countryName": "North Macedonia",
    "countryGuid": "MK"
  },
  {
    "countryCode": "MP",
    "countryName": "Northern Mariana Islands",
    "countryGuid": "MP"
  },
  {
    "countryCode": "NO",
    "countryName": "Norway",
    "countryGuid": "NO"
  },
  {
    "countryCode": "OM",
    "countryName": "Oman",
    "countryGuid": "OM"
  },
  {
    "countryCode": "PK",
    "countryName": "Pakistan",
    "countryGuid": "PK"
  },
  {
    "countryCode": "PW",
    "countryName": "Palau",
    "countryGuid": "PW"
  },
  {
    "countryCode": "PS",
    "countryName": "Palestinian Territories",
    "countryGuid": "PS"
  },
  {
    "countryCode": "PA",
    "countryName": "Panama",
    "countryGuid": "PA"
  },
  {
    "countryCode": "PG",
    "countryName": "Papua New Guinea",
    "countryGuid": "PG"
  },
  {
    "countryCode": "PY",
    "countryName": "Paraguay",
    "countryGuid": "PY"
  },
  {
    "countryCode": "PE",
    "countryName": "Peru",
    "countryGuid": "PE"
  },
  {
    "countryCode": "PH",
    "countryName": "Philippines",
    "countryGuid": "PH"
  },
  {
    "countryCode": "PN",
    "countryName": "Pitcairn Islands",
    "countryGuid": "PN"
  },
  {
    "countryCode": "PL",
    "countryName": "Poland",
    "countryGuid": "PL"
  },
  {
    "countryCode": "PT",
    "countryName": "Portugal",
    "countryGuid": "PT"
  },
  {
    "countryCode": "PR",
    "countryName": "Puerto Rico",
    "countryGuid": "PR"
  },
  {
    "countryCode": "QA",
    "countryName": "Qatar",
    "countryGuid": "QA"
  },
  {
    "countryCode": "RE",
    "countryName": "Réunion",
    "countryGuid": "RE"
  },
  {
    "countryCode": "RO",
    "countryName": "Romania",
    "countryGuid": "RO"
  },
  {
    "countryCode": "RU",
    "countryName": "Russia",
    "countryGuid": "RU"
  },
  {
    "countryCode": "SU",
    "countryName": "Russia",
    "countryGuid": "SU"
  },
  {
    "countryCode": "RW",
    "countryName": "Rwanda",
    "countryGuid": "RW"
  },
  {
    "countryCode": "WS",
    "countryName": "Samoa",
    "countryGuid": "WS"
  },
  {
    "countryCode": "SM",
    "countryName": "San Marino",
    "countryGuid": "SM"
  },
  {
    "countryCode": "ST",
    "countryName": "São Tomé & Príncipe",
    "countryGuid": "ST"
  },
  {
    "countryCode": "CQ",
    "countryName": "Sark",
    "countryGuid": "CQ"
  },
  {
    "countryCode": "SA",
    "countryName": "Saudi Arabia",
    "countryGuid": "SA"
  },
  {
    "countryCode": "SN",
    "countryName": "Senegal",
    "countryGuid": "SN"
  },
  {
    "countryCode": "CS",
    "countryName": "Serbia",
    "countryGuid": "CS"
  },
  {
    "countryCode": "RS",
    "countryName": "Serbia",
    "countryGuid": "RS"
  },
  {
    "countryCode": "YU",
    "countryName": "Serbia",
    "countryGuid": "YU"
  },
  {
    "countryCode": "SC",
    "countryName": "Seychelles",
    "countryGuid": "SC"
  },
  {
    "countryCode": "SL",
    "countryName": "Sierra Leone",
    "countryGuid": "SL"
  },
  {
    "countryCode": "SG",
    "countryName": "Singapore",
    "countryGuid": "SG"
  },
  {
    "countryCode": "SX",
    "countryName": "Sint Maarten",
    "countryGuid": "SX"
  },
  {
    "countryCode": "SK",
    "countryName": "Slovakia",
    "countryGuid": "SK"
  },
  {
    "countryCode": "SI",
    "countryName": "Slovenia",
    "countryGuid": "SI"
  },
  {
    "countryCode": "SB",
    "countryName": "Solomon Islands",
    "countryGuid": "SB"
  },
  {
    "countryCode": "SO",
    "countryName": "Somalia",
    "countryGuid": "SO"
  },
  {
    "countryCode": "ZA",
    "countryName": "South Africa",
    "countryGuid": "ZA"
  },
  {
    "countryCode": "GS",
    "countryName": "South Georgia & South Sandwich Islands",
    "countryGuid": "GS"
  },
  {
    "countryCode": "KR",
    "countryName": "South Korea",
    "countryGuid": "KR"
  },
  {
    "countryCode": "SS",
    "countryName": "South Sudan",
    "countryGuid": "SS"
  },
  {
    "countryCode": "ES",
    "countryName": "Spain",
    "countryGuid": "ES"
  },
  {
    "countryCode": "LK",
    "countryName": "Sri Lanka",
    "countryGuid": "LK"
  },
  {
    "countryCode": "BL",
    "countryName": "St. Barthélemy",
    "countryGuid": "BL"
  },
  {
    "countryCode": "SH",
    "countryName": "St. Helena",
    "countryGuid": "SH"
  },
  {
    "countryCode": "KN",
    "countryName": "St. Kitts & Nevis",
    "countryGuid": "KN"
  },
  {
    "countryCode": "LC",
    "countryName": "St. Lucia",
    "countryGuid": "LC"
  },
  {
    "countryCode": "MF",
    "countryName": "St. Martin",
    "countryGuid": "MF"
  },
  {
    "countryCode": "PM",
    "countryName": "St. Pierre & Miquelon",
    "countryGuid": "PM"
  },
  {
    "countryCode": "VC",
    "countryName": "St. Vincent & Grenadines",
    "countryGuid": "VC"
  },
  {
    "countryCode": "SD",
    "countryName": "Sudan",
    "countryGuid": "SD"
  },
  {
    "countryCode": "SR",
    "countryName": "Suriname",
    "countryGuid": "SR"
  },
  {
    "countryCode": "SJ",
    "countryName": "Svalbard & Jan Mayen",
    "countryGuid": "SJ"
  },
  {
    "countryCode": "SE",
    "countryName": "Sweden",
    "countryGuid": "SE"
  },
  {
    "countryCode": "CH",
    "countryName": "Switzerland",
    "countryGuid": "CH"
  },
  {
    "countryCode": "SY",
    "countryName": "Syria",
    "countryGuid": "SY"
  },
  {
    "countryCode": "TW",
    "countryName": "Taiwan",
    "countryGuid": "TW"
  },
  {
    "countryCode": "TJ",
    "countryName": "Tajikistan",
    "countryGuid": "TJ"
  },
  {
    "countryCode": "TZ",
    "countryName": "Tanzania",
    "countryGuid": "TZ"
  },
  {
    "countryCode": "TH",
    "countryName": "Thailand",
    "countryGuid": "TH"
  },
  {
    "countryCode": "TL",
    "countryName": "Timor-Leste",
    "countryGuid": "TL"
  },
  {
    "countryCode": "TP",
    "countryName": "Timor-Leste",
    "countryGuid": "TP"
  },
  {
    "countryCode": "TG",
    "countryName": "Togo",
    "countryGuid": "TG"
  },
  {
    "countryCode": "TK",
    "countryName": "Tokelau",
    "countryGuid": "TK"
  },
  {
    "countryCode": "TO",
    "countryName": "Tonga",
    "countryGuid": "TO"
  },
  {
    "countryCode": "TT",
    "countryName": "Trinidad & Tobago",
    "countryGuid": "TT"
  },
  {
    "countryCode": "TN",
    "countryName": "Tunisia",
    "countryGuid": "TN"
  },
  {
    "countryCode": "TR",
    "countryName": "Türkiye",
    "countryGuid": "TR"
  },
  {
    "countryCode": "TM",
    "countryName": "Turkmenistan",
    "countryGuid": "TM"
  },
  {
    "countryCode": "TC",
    "countryName": "Turks & Caicos Islands",
    "countryGuid": "TC"
  },
  {
    "countryCode": "TV",
    "countryName": "Tuvalu",
    "countryGuid": "TV"
  },
  {
    "countryCode": "UM",
    "countryName": "U.S. Outlying Islands",
    "countryGuid": "UM"
  },
  {
    "countryCode": "VI",
    "countryName": "U.S. Virgin Islands",
    "countryGuid": "VI"
  },
  {
    "countryCode": "UG",
    "countryName": "Uganda",
    "countryGuid": "UG"
  },
  {
    "countryCode": "UA",
    "countryName": "Ukraine",
    "countryGuid": "UA"
  },
  {
    "countryCode": "AE",
    "countryName": "United Arab Emirates",
    "countryGuid": "AE"
  },
  {
    "countryCode": "GB",
    "countryName": "United Kingdom",
    "countryGuid": "GB"
  },
  {
    "countryCode": "UK",
    "countryName": "United Kingdom",
    "countryGuid": "UK"
  },
  {
    "countryCode": "US",
    "countryName": "United States",
    "countryGuid": "US"
  },
  {
    "countryCode": "UY",
    "countryName": "Uruguay",
    "countryGuid": "UY"
  },
  {
    "countryCode": "UZ",
    "countryName": "Uzbekistan",
    "countryGuid": "UZ"
  },
  {
    "countryCode": "NH",
    "countryName": "Vanuatu",
    "countryGuid": "NH"
  },
  {
    "countryCode": "VU",
    "countryName": "Vanuatu",
    "countryGuid": "VU"
  },
  {
    "countryCode": "VA",
    "countryName": "Vatican City",
    "countryGuid": "VA"
  },
  {
    "countryCode": "VE",
    "countryName": "Venezuela",
    "countryGuid": "VE"
  },
  {
    "countryCode": "VD",
    "countryName": "Vietnam",
    "countryGuid": "VD"
  },
  {
    "countryCode": "VN",
    "countryName": "Vietnam",
    "countryGuid": "VN"
  },
  {
    "countryCode": "WF",
    "countryName": "Wallis & Futuna",
    "countryGuid": "WF"
  },
  {
    "countryCode": "EH",
    "countryName": "Western Sahara",
    "countryGuid": "EH"
  },
  {
    "countryCode": "YD",
    "countryName": "Yemen",
    "countryGuid": "YD"
  },
  {
    "countryCode": "YE",
    "countryName": "Yemen",
    "countryGuid": "YE"
  },
  {
    "countryCode": "ZM",
    "countryName": "Zambia",
    "countryGuid": "ZM"
  },
  {
    "countryCode": "RH",
    "countryName": "Zimbabwe",
    "countryGuid": "RH"
  },
  {
    "countryCode": "ZW",
    "countryName": "Zimbabwe",
    "countryGuid": "ZW"
  }
];
