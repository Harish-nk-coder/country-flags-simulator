/**
 * Complete 198 World Countries and Territories Database
 * ISO-3166-1 alpha-2 codes with FlagCDN support and instant offline fallbacks.
 */

const COUNTRIES_DATA = [
  { code: 'af', name: 'Afghanistan', continent: 'Asia', color: '#000000', altColor: '#d32011' },
  { code: 'al', name: 'Albania', continent: 'Europe', color: '#e41e20', altColor: '#000000' },
  { code: 'dz', name: 'Algeria', continent: 'Africa', color: '#006233', altColor: '#d21034' },
  { code: 'ad', name: 'Andorra', continent: 'Europe', color: '#0018a8', altColor: '#fed100' },
  { code: 'ao', name: 'Angola', continent: 'Africa', color: '#cc092f', altColor: '#000000' },
  { code: 'ag', name: 'Antigua and Barbuda', continent: 'North America', color: '#ce1126', altColor: '#000000' },
  { code: 'ar', name: 'Argentina', continent: 'South America', color: '#74acdf', altColor: '#ffffff' },
  { code: 'am', name: 'Armenia', continent: 'Asia', color: '#d90012', altColor: '#0033a0' },
  { code: 'au', name: 'Australia', continent: 'Oceania', color: '#00008b', altColor: '#ff0000' },
  { code: 'at', name: 'Austria', continent: 'Europe', color: '#ed2939', altColor: '#ffffff' },
  { code: 'az', name: 'Azerbaijan', continent: 'Asia', color: '#0092bc', altColor: '#e03c31' },
  { code: 'bs', name: 'Bahamas', continent: 'North America', color: '#00778b', altColor: '#ffc72c' },
  { code: 'bh', name: 'Bahrain', continent: 'Asia', color: '#ce1126', altColor: '#ffffff' },
  { code: 'bd', name: 'Bangladesh', continent: 'Asia', color: '#006a4e', altColor: '#f42a41' },
  { code: 'bb', name: 'Barbados', continent: 'North America', color: '#00267f', altColor: '#ffc72c' },
  { code: 'by', name: 'Belarus', continent: 'Europe', color: '#c8313e', altColor: '#4aa658' },
  { code: 'be', name: 'Belgium', continent: 'Europe', color: '#000000', altColor: '#ed2939' },
  { code: 'bz', name: 'Belize', continent: 'North America', color: '#003f87', altColor: '#ce1126' },
  { code: 'bj', name: 'Benin', continent: 'Africa', color: '#008751', altColor: '#fcd116' },
  { code: 'bt', name: 'Bhutan', continent: 'Asia', color: '#ff4e12', altColor: '#ffd520' },
  { code: 'bo', name: 'Bolivia', continent: 'South America', color: '#d52b1e', altColor: '#007934' },
  { code: 'ba', name: 'Bosnia and Herz.', continent: 'Europe', color: '#002395', altColor: '#fecb00' },
  { code: 'bw', name: 'Botswana', continent: 'Africa', color: '#00cbff', altColor: '#000000' },
  { code: 'br', name: 'Brazil', continent: 'South America', color: '#009739', altColor: '#fedd00' },
  { code: 'bn', name: 'Brunei', continent: 'Asia', color: '#f7e017', altColor: '#000000' },
  { code: 'bg', name: 'Bulgaria', continent: 'Europe', color: '#ffffff', altColor: '#00966e' },
  { code: 'bf', name: 'Burkina Faso', continent: 'Africa', color: '#de3831', altColor: '#009e49' },
  { code: 'bi', name: 'Burundi', continent: 'Africa', color: '#1eb53a', altColor: '#ce1126' },
  { code: 'cv', name: 'Cabo Verde', continent: 'Africa', color: '#003893', altColor: '#cf2027' },
  { code: 'kh', name: 'Cambodia', continent: 'Asia', color: '#032ea1', altColor: '#e00025' },
  { code: 'cm', name: 'Cameroon', continent: 'Africa', color: '#007a5e', altColor: '#ce1126' },
  { code: 'ca', name: 'Canada', continent: 'North America', color: '#ff0000', altColor: '#ffffff' },
  { code: 'cf', name: 'Central African Rep.', continent: 'Africa', color: '#003082', altColor: '#289728' },
  { code: 'td', name: 'Chad', continent: 'Africa', color: '#00205b', altColor: '#ffcd00' },
  { code: 'cl', name: 'Chile', continent: 'South America', color: '#0039a6', altColor: '#d52b1e' },
  { code: 'cn', name: 'China', continent: 'Asia', color: '#de2910', altColor: '#ffde00' },
  { code: 'co', name: 'Colombia', continent: 'South America', color: '#fcd116', altColor: '#003893' },
  { code: 'km', name: 'Comoros', continent: 'Africa', color: '#ffc61e', altColor: '#3d944c' },
  { code: 'cg', name: 'Congo', continent: 'Africa', color: '#009543', altColor: '#fbde4a' },
  { code: 'cd', name: 'DR Congo', continent: 'Africa', color: '#007fff', altColor: '#ce1021' },
  { code: 'cr', name: 'Costa Rica', continent: 'North America', color: '#001489', altColor: '#da291c' },
  { code: 'hr', name: 'Croatia', continent: 'Europe', color: '#ff0000', altColor: '#171796' },
  { code: 'cu', name: 'Cuba', continent: 'North America', color: '#002590', altColor: '#cb1515' },
  { code: 'cy', name: 'Cyprus', continent: 'Europe', color: '#d57800', altColor: '#4e5b31' },
  { code: 'cz', name: 'Czechia', continent: 'Europe', color: '#11457e', altColor: '#d7141a' },
  { code: 'dk', name: 'Denmark', continent: 'Europe', color: '#c8102e', altColor: '#ffffff' },
  { code: 'dj', name: 'Djibouti', continent: 'Africa', color: '#6ab2e7', altColor: '#12ad2b' },
  { code: 'dm', name: 'Dominica', continent: 'North America', color: '#006b3f', altColor: '#fcd116' },
  { code: 'do', name: 'Dominican Rep.', continent: 'North America', color: '#002f6c', altColor: '#ce1126' },
  { code: 'ec', name: 'Ecuador', continent: 'South America', color: '#ffdd00', altColor: '#034ea2' },
  { code: 'eg', name: 'Egypt', continent: 'Africa', color: '#c8102e', altColor: '#000000' },
  { code: 'sv', name: 'El Salvador', continent: 'North America', color: '#0f47af', altColor: '#ffffff' },
  { code: 'gq', name: 'Equatorial Guinea', continent: 'Africa', color: '#3e9a00', altColor: '#e32118' },
  { code: 'er', name: 'Eritrea', continent: 'Africa', color: '#12ad2b', altColor: '#eb1c24' },
  { code: 'ee', name: 'Estonia', continent: 'Europe', color: '#0072ce', altColor: '#000000' },
  { code: 'sz', name: 'Eswatini', continent: 'Africa', color: '#3e5eb9', altColor: '#fed800' },
  { code: 'et', name: 'Ethiopia', continent: 'Africa', color: '#078930', altColor: '#fcdd09' },
  { code: 'fj', name: 'Fiji', continent: 'Oceania', color: '#68bfe5', altColor: '#cc0000' },
  { code: 'fi', name: 'Finland', continent: 'Europe', color: '#002f6c', altColor: '#ffffff' },
  { code: 'fr', name: 'France', continent: 'Europe', color: '#002654', altColor: '#ed2939' },
  { code: 'ga', name: 'Gabon', continent: 'Africa', color: '#009e60', altColor: '#fcd116' },
  { code: 'gm', name: 'Gambia', continent: 'Africa', color: '#ce1126', altColor: '#0c1c8c' },
  { code: 'ge', name: 'Georgia', continent: 'Asia', color: '#ff0000', altColor: '#ffffff' },
  { code: 'de', name: 'Germany', continent: 'Europe', color: '#000000', altColor: '#dd0000' },
  { code: 'gh', name: 'Ghana', continent: 'Africa', color: '#ce1126', altColor: '#fcd116' },
  { code: 'gr', name: 'Greece', continent: 'Europe', color: '#0d5eaf', altColor: '#ffffff' },
  { code: 'gd', name: 'Grenada', continent: 'North America', color: '#ce1126', altColor: '#007a3d' },
  { code: 'gt', name: 'Guatemala', continent: 'North America', color: '#4997d0', altColor: '#ffffff' },
  { code: 'gn', name: 'Guinea', continent: 'Africa', color: '#ce1126', altColor: '#fcd116' },
  { code: 'gw', name: 'Guinea-Bissau', continent: 'Africa', color: '#ce1126', altColor: '#fcd116' },
  { code: 'gy', name: 'Guyana', continent: 'South America', color: '#009e49', altColor: '#fcd116' },
  { code: 'ht', name: 'Haiti', continent: 'North America', color: '#00209f', altColor: '#d21034' },
  { code: 'hn', name: 'Honduras', continent: 'North America', color: '#0073cf', altColor: '#ffffff' },
  { code: 'hu', name: 'Hungary', continent: 'Europe', color: '#ce2939', altColor: '#477050' },
  { code: 'is', name: 'Iceland', continent: 'Europe', color: '#02529c', altColor: '#dc1e35' },
  { code: 'in', name: 'India', continent: 'Asia', color: '#ff9933', altColor: '#138808' },
  { code: 'id', name: 'Indonesia', continent: 'Asia', color: '#ce1126', altColor: '#ffffff' },
  { code: 'ir', name: 'Iran', continent: 'Asia', color: '#239f40', altColor: '#da0000' },
  { code: 'iq', name: 'Iraq', continent: 'Asia', color: '#ce1126', altColor: '#007a3d' },
  { code: 'ie', name: 'Ireland', continent: 'Europe', color: '#169b62', altColor: '#ff883e' },
  { code: 'il', name: 'Israel', continent: 'Asia', color: '#0038b8', altColor: '#ffffff' },
  { code: 'it', name: 'Italy', continent: 'Europe', color: '#008c45', altColor: '#cd212a' },
  { code: 'ci', name: 'Ivory Coast', continent: 'Africa', color: '#f77f00', altColor: '#009e60' },
  { code: 'jm', name: 'Jamaica', continent: 'North America', color: '#000000', altColor: '#fed100' },
  { code: 'jp', name: 'Japan', continent: 'Asia', color: '#bc002d', altColor: '#ffffff' },
  { code: 'jo', name: 'Jordan', continent: 'Asia', color: '#007a3d', altColor: '#ce1126' },
  { code: 'kz', name: 'Kazakhstan', continent: 'Asia', color: '#00afca', altColor: '#fec50c' },
  { code: 'ke', name: 'Kenya', continent: 'Africa', color: '#000000', altColor: '#bb0000' },
  { code: 'ki', name: 'Kiribati', continent: 'Oceania', color: '#ce1126', altColor: '#00205b' },
  { code: 'kp', name: 'North Korea', continent: 'Asia', color: '#ed1c27', altColor: '#024fa2' },
  { code: 'kr', name: 'South Korea', continent: 'Asia', color: '#cd2e3a', altColor: '#0047a0' },
  { code: 'kw', name: 'Kuwait', continent: 'Asia', color: '#007a3d', altColor: '#ce1126' },
  { code: 'kg', name: 'Kyrgyzstan', continent: 'Asia', color: '#e8112d', altColor: '#ffed00' },
  { code: 'la', name: 'Laos', continent: 'Asia', color: '#ce1126', altColor: '#002868' },
  { code: 'lv', name: 'Latvia', continent: 'Europe', color: '#9e3039', altColor: '#ffffff' },
  { code: 'lb', name: 'Lebanon', continent: 'Asia', color: '#ed1c24', altColor: '#ffffff' },
  { code: 'ls', name: 'Lesotho', continent: 'Africa', color: '#00209f', altColor: '#009543' },
  { code: 'lr', name: 'Liberia', continent: 'Africa', color: '#bf0a30', altColor: '#002868' },
  { code: 'ly', name: 'Libya', continent: 'Africa', color: '#e70013', altColor: '#239e46' },
  { code: 'li', name: 'Liechtenstein', continent: 'Europe', color: '#002b7f', altColor: '#ce1126' },
  { code: 'lt', name: 'Lithuania', continent: 'Europe', color: '#fdb913', altColor: '#c1272d' },
  { code: 'lu', name: 'Luxembourg', continent: 'Europe', color: '#ea141d', altColor: '#00a1de' },
  { code: 'mg', name: 'Madagascar', continent: 'Africa', color: '#fc3d32', altColor: '#007e3a' },
  { code: 'mw', name: 'Malawi', continent: 'Africa', color: '#000000', altColor: '#ce1126' },
  { code: 'my', name: 'Malaysia', continent: 'Asia', color: '#010066', altColor: '#cc0000' },
  { code: 'mv', name: 'Maldives', continent: 'Asia', color: '#d21034', altColor: '#007e3a' },
  { code: 'ml', name: 'Mali', continent: 'Africa', color: '#14b53a', altColor: '#fcd116' },
  { code: 'mt', name: 'Malta', continent: 'Europe', color: '#ffffff', altColor: '#cf142b' },
  { code: 'mh', name: 'Marshall Islands', continent: 'Oceania', color: '#003893', altColor: '#dd7500' },
  { code: 'mr', name: 'Mauritania', continent: 'Africa', color: '#006233', altColor: '#d21034' },
  { code: 'mu', name: 'Mauritius', continent: 'Africa', color: '#ea2839', altColor: '#1a2061' },
  { code: 'mx', name: 'Mexico', continent: 'North America', color: '#006847', altColor: '#ce1126' },
  { code: 'fm', name: 'Micronesia', continent: 'Oceania', color: '#75b2dd', altColor: '#ffffff' },
  { code: 'md', name: 'Moldova', continent: 'Europe', color: '#003da5', altColor: '#cc092f' },
  { code: 'mc', name: 'Monaco', continent: 'Europe', color: '#ce1126', altColor: '#ffffff' },
  { code: 'mn', name: 'Mongolia', continent: 'Asia', color: '#e4002b', altColor: '#0066b2' },
  { code: 'me', name: 'Montenegro', continent: 'Europe', color: '#c40308', altColor: '#d4af37' },
  { code: 'ma', name: 'Morocco', continent: 'Africa', color: '#c1272d', altColor: '#006233' },
  { code: 'mz', name: 'Mozambique', continent: 'Africa', color: '#007a5e', altColor: '#d21034' },
  { code: 'mm', name: 'Myanmar', continent: 'Asia', color: '#fecb00', altColor: '#ea2839' },
  { code: 'na', name: 'Namibia', continent: 'Africa', color: '#003580', altColor: '#d21034' },
  { code: 'nr', name: 'Nauru', continent: 'Oceania', color: '#002b7f', altColor: '#ffc72c' },
  { code: 'np', name: 'Nepal', continent: 'Asia', color: '#dc143c', altColor: '#003893' },
  { code: 'nl', name: 'Netherlands', continent: 'Europe', color: '#ae1c28', altColor: '#21468b' },
  { code: 'nz', name: 'New Zealand', continent: 'Oceania', color: '#00247d', altColor: '#cc142b' },
  { code: 'ni', name: 'Nicaragua', continent: 'North America', color: '#0067c6', altColor: '#ffffff' },
  { code: 'ne', name: 'Niger', continent: 'Africa', color: '#e05206', altColor: '#0db02b' },
  { code: 'ng', name: 'Nigeria', continent: 'Africa', color: '#008751', altColor: '#ffffff' },
  { code: 'mk', name: 'North Macedonia', continent: 'Europe', color: '#d20000', altColor: '#ffe600' },
  { code: 'no', name: 'Norway', continent: 'Europe', color: '#ba0c2f', altColor: '#00205b' },
  { code: 'om', name: 'Oman', continent: 'Asia', color: '#db161d', altColor: '#008000' },
  { code: 'pk', name: 'Pakistan', continent: 'Asia', color: '#01411c', altColor: '#ffffff' },
  { code: 'pw', name: 'Palau', continent: 'Oceania', color: '#4aadd6', altColor: '#ffde00' },
  { code: 'ps', name: 'Palestine', continent: 'Asia', color: '#000000', altColor: '#e4312b' },
  { code: 'pa', name: 'Panama', continent: 'North America', color: '#005293', altColor: '#d21034' },
  { code: 'pg', name: 'Papua New Guinea', continent: 'Oceania', color: '#ce1126', altColor: '#000000' },
  { code: 'py', name: 'Paraguay', continent: 'South America', color: '#d52b1e', altColor: '#0038a8' },
  { code: 'pe', name: 'Peru', continent: 'South America', color: '#d91023', altColor: '#ffffff' },
  { code: 'ph', name: 'Philippines', continent: 'Asia', color: '#0038a8', altColor: '#ce1126' },
  { code: 'pl', name: 'Poland', continent: 'Europe', color: '#dc143c', altColor: '#ffffff' },
  { code: 'pt', name: 'Portugal', continent: 'Europe', color: '#046a38', altColor: '#da291c' },
  { code: 'qa', name: 'Qatar', continent: 'Asia', color: '#8d1b3d', altColor: '#ffffff' },
  { code: 'ro', name: 'Romania', continent: 'Europe', color: '#002b7f', altColor: '#ce1126' },
  { code: 'ru', name: 'Russia', continent: 'Europe', color: '#0039a6', altColor: '#d52b1e' },
  { code: 'rw', name: 'Rwanda', continent: 'Africa', color: '#00a1de', altColor: '#fad201' },
  { code: 'kn', name: 'Saint Kitts and Nevis', continent: 'North America', color: '#009e49', altColor: '#ce1126' },
  { code: 'lc', name: 'Saint Lucia', continent: 'North America', color: '#65c5f4', altColor: '#ffd100' },
  { code: 'vc', name: 'St. Vincent & Grenadines', continent: 'North America', color: '#0072c6', altColor: '#009e60' },
  { code: 'ws', name: 'Samoa', continent: 'Oceania', color: '#ce1126', altColor: '#002b7f' },
  { code: 'sm', name: 'San Marino', continent: 'Europe', color: '#5eb6e4', altColor: '#ffffff' },
  { code: 'st', name: 'Sao Tome and Principe', continent: 'Africa', color: '#12ad2b', altColor: '#d21034' },
  { code: 'sa', name: 'Saudi Arabia', continent: 'Asia', color: '#006c35', altColor: '#ffffff' },
  { code: 'sn', name: 'Senegal', continent: 'Africa', color: '#00853f', altColor: '#fdef42' },
  { code: 'rs', name: 'Serbia', continent: 'Europe', color: '#c6363c', altColor: '#0c4076' },
  { code: 'sc', name: 'Seychelles', continent: 'Africa', color: '#003f87', altColor: '#d92323' },
  { code: 'sl', name: 'Sierra Leone', continent: 'Africa', color: '#1eb53a', altColor: '#0072c6' },
  { code: 'sg', name: 'Singapore', continent: 'Asia', color: '#ed2939', altColor: '#ffffff' },
  { code: 'sk', name: 'Slovakia', continent: 'Europe', color: '#0b4ea2', altColor: '#ee1c25' },
  { code: 'si', name: 'Slovenia', continent: 'Europe', color: '#005da4', altColor: '#ed1c24' },
  { code: 'sb', name: 'Solomon Islands', continent: 'Oceania', color: '#0051ba', altColor: '#215b33' },
  { code: 'so', name: 'Somalia', continent: 'Africa', color: '#4189dd', altColor: '#ffffff' },
  { code: 'za', name: 'South Africa', continent: 'Africa', color: '#007749', altColor: '#e03c31' },
  { code: 'ss', name: 'South Sudan', continent: 'Africa', color: '#078930', altColor: '#0f47af' },
  { code: 'es', name: 'Spain', continent: 'Europe', color: '#aa151b', altColor: '#f1bf00' },
  { code: 'lk', name: 'Sri Lanka', continent: 'Asia', color: '#8d153a', altColor: '#ffbe29' },
  { code: 'sd', name: 'Sudan', continent: 'Africa', color: '#d21034', altColor: '#007229' },
  { code: 'sr', name: 'Suriname', continent: 'South America', color: '#377e3f', altColor: '#b40a2d' },
  { code: 'se', name: 'Sweden', continent: 'Europe', color: '#005293', altColor: '#fecc00' },
  { code: 'ch', name: 'Switzerland', continent: 'Europe', color: '#ff0000', altColor: '#ffffff' },
  { code: 'sy', name: 'Syria', continent: 'Asia', color: '#ce1126', altColor: '#007a3d' },
  { code: 'tw', name: 'Taiwan', continent: 'Asia', color: '#fe0000', altColor: '#000095' },
  { code: 'tj', name: 'Tajikistan', continent: 'Asia', color: '#cc0000', altColor: '#006600' },
  { code: 'tz', name: 'Tanzania', continent: 'Africa', color: '#1eb53a', altColor: '#00a3dd' },
  { code: 'th', name: 'Thailand', continent: 'Asia', color: '#a51931', altColor: '#2d2a4a' },
  { code: 'tl', name: 'Timor-Leste', continent: 'Asia', color: '#cb1515', altColor: '#ffc726' },
  { code: 'tg', name: 'Togo', continent: 'Africa', color: '#006a4e', altColor: '#d21034' },
  { code: 'to', name: 'Tonga', continent: 'Oceania', color: '#c10000', altColor: '#ffffff' },
  { code: 'tt', name: 'Trinidad and Tobago', continent: 'North America', color: '#ce1126', altColor: '#000000' },
  { code: 'tn', name: 'Tunisia', continent: 'Africa', color: '#e70013', altColor: '#ffffff' },
  { code: 'tr', name: 'Turkey', continent: 'Europe', color: '#e30a17', altColor: '#ffffff' },
  { code: 'tm', name: 'Turkmenistan', continent: 'Asia', color: '#298c47', altColor: '#d22630' },
  { code: 'tv', name: 'Tuvalu', continent: 'Oceania', color: '#5b97b1', altColor: '#ce1126' },
  { code: 'ug', name: 'Uganda', continent: 'Africa', color: '#000000', altColor: '#fcdc04' },
  { code: 'ua', name: 'Ukraine', continent: 'Europe', color: '#005bbb', altColor: '#ffd500' },
  { code: 'ae', name: 'United Arab Emirates', continent: 'Asia', color: '#00732f', altColor: '#ff0000' },
  { code: 'gb', name: 'United Kingdom', continent: 'Europe', color: '#012169', altColor: '#c8102e' },
  { code: 'us', name: 'United States', continent: 'North America', color: '#b22234', altColor: '#3c3b6e' },
  { code: 'uy', name: 'Uruguay', continent: 'South America', color: '#0038a8', altColor: '#ffffff' },
  { code: 'uz', name: 'Uzbekistan', continent: 'Asia', color: '#0099b5', altColor: '#1eb53a' },
  { code: 'vu', name: 'Vanuatu', continent: 'Oceania', color: '#d21034', altColor: '#009543' },
  { code: 'va', name: 'Vatican City', continent: 'Europe', color: '#ffe000', altColor: '#ffffff' },
  { code: 've', name: 'Venezuela', continent: 'South America', color: '#fce300', altColor: '#00247d' },
  { code: 'vn', name: 'Vietnam', continent: 'Asia', color: '#da251d', altColor: '#ffff00' },
  { code: 'ye', name: 'Yemen', continent: 'Asia', color: '#ce1126', altColor: '#000000' },
  { code: 'zm', name: 'Zambia', continent: 'Africa', color: '#198a00', altColor: '#ef7d00' },
  { code: 'zw', name: 'Zimbabwe', continent: 'Africa', color: '#006400', altColor: '#ffd700' },
  { code: 'xk', name: 'Kosovo', continent: 'Europe', color: '#244aa5', altColor: '#d0a650' },
  { code: 'pr', name: 'Puerto Rico', continent: 'North America', color: '#ed0000', altColor: '#00205b' },
  { code: 'hk', name: 'Hong Kong', continent: 'Asia', color: '#de2910', altColor: '#ffffff' },
  { code: 'mo', name: 'Macau', continent: 'Asia', color: '#00785e', altColor: '#ffffff' },
  { code: 'ck', name: 'Cook Islands', continent: 'Oceania', color: '#00247d', altColor: '#ffffff' }
];

class FlagManager {
  constructor() {
    this.images = new Map();
    this.loadState = new Map();
    this.spriteCache = new Map();
    this.preloadFlags();
  }

  getFlagUrl(code) {
    return `https://flagcdn.com/w160/${code.toLowerCase()}.png`;
  }

  preloadFlags() {
    COUNTRIES_DATA.forEach(country => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.getFlagUrl(country.code);
      img.onload = () => {
        this.images.set(country.code, img);
        this.loadState.set(country.code, true);
        // Invalidate cached sprites for this country so it draws the loaded image
        this.invalidateCountryCache(country.code);
      };
      img.onerror = () => {
        this.loadState.set(country.code, false);
      };
    });
  }

  invalidateCountryCache(code) {
    const prefix = `${code.toLowerCase()}_`;
    for (const key of this.spriteCache.keys()) {
      if (key.startsWith(prefix)) {
        this.spriteCache.delete(key);
      }
    }
  }

  getRectSprite(country, width, height, radius = 3, borderCol = '#ffffff', borderWidth = 1.5) {
    const code = (country.code || '').toLowerCase();
    const key = `${code}_r_${width}_${height}_${radius}_${borderCol}_${borderWidth}`;
    let sprite = this.spriteCache.get(key);
    if (sprite) return sprite;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));
    const sCtx = canvas.getContext('2d');
    if (!sCtx) return null;

    const w = canvas.width;
    const h = canvas.height;

    sCtx.save();
    if (radius > 0 && sCtx.roundRect) {
      sCtx.beginPath();
      sCtx.roundRect(0, 0, w, h, radius);
      sCtx.clip();
    }

    const img = this.images.get(country.code);
    if (img && img.complete && img.naturalWidth > 0) {
      sCtx.drawImage(img, 0, 0, w, h);
    } else {
      const grad = sCtx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, country.color || '#3b82f6');
      grad.addColorStop(1, country.altColor || '#1e293b');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, w, h);

      sCtx.fillStyle = '#ffffff';
      sCtx.font = `bold ${Math.max(7, Math.floor(h * 0.52))}px Inter, sans-serif`;
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText((country.code || '').toUpperCase(), w / 2, h / 2);
    }
    sCtx.restore();

    if (borderWidth > 0) {
      sCtx.save();
      sCtx.beginPath();
      if (sCtx.roundRect) {
        sCtx.roundRect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth, radius);
      } else {
        sCtx.rect(borderWidth / 2, borderWidth / 2, w - borderWidth, h - borderWidth);
      }
      sCtx.strokeStyle = borderCol;
      sCtx.lineWidth = borderWidth;
      sCtx.stroke();
      sCtx.restore();
    }

    this.spriteCache.set(key, canvas);
    return canvas;
  }

  getCircleSprite(country, radius, borderCol = '#ffffff', borderWidth = 2) {
    const code = (country.code || '').toLowerCase();
    const key = `${code}_c_${radius}_${borderCol}_${borderWidth}`;
    let sprite = this.spriteCache.get(key);
    if (sprite) return sprite;

    const size = Math.max(2, Math.ceil(radius * 2));
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const sCtx = canvas.getContext('2d');
    if (!sCtx) return null;

    const half = size / 2;

    sCtx.save();
    sCtx.beginPath();
    sCtx.arc(half, half, radius, 0, Math.PI * 2);
    sCtx.clip();

    const img = this.images.get(country.code);
    if (img && img.complete && img.naturalWidth > 0) {
      sCtx.drawImage(img, 0, 0, size, size);
    } else {
      const grad = sCtx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, country.color || '#3b82f6');
      grad.addColorStop(1, country.altColor || '#1e293b');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, size, size);

      sCtx.fillStyle = '#ffffff';
      sCtx.font = `bold ${Math.max(8, Math.floor(radius * 0.72))}px Inter, sans-serif`;
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText((country.code || '').toUpperCase(), half, half);
    }
    sCtx.restore();

    if (borderWidth > 0) {
      sCtx.save();
      sCtx.beginPath();
      sCtx.arc(half, half, Math.max(1, radius - borderWidth / 2), 0, Math.PI * 2);
      sCtx.strokeStyle = borderCol;
      sCtx.lineWidth = borderWidth;
      sCtx.stroke();
      sCtx.restore();
    }

    this.spriteCache.set(key, canvas);
    return canvas;
  }

  /**
   * High-Performance Instant Rectangular Flag Draw
   */
  drawRectFlag(ctx, country, x, y, width, height, radius = 3, borderCol = '#ffffff', borderWidth = 1.5) {
    const sprite = this.getRectSprite(country, width, height, radius, borderCol, borderWidth);
    if (sprite) {
      ctx.drawImage(sprite, Math.round(x - width / 2), Math.round(y - height / 2));
    }
  }

  /**
   * High-Performance Instant Circular Flag Draw
   */
  drawCircularFlag(ctx, country, x, y, radius, borderCol = '#ffffff', borderWidth = 2) {
    const sprite = this.getCircleSprite(country, radius, borderCol, borderWidth);
    if (sprite) {
      ctx.drawImage(sprite, Math.round(x - radius), Math.round(y - radius));
    }
  }

  getRandomCountry() {
    const idx = Math.floor(Math.random() * COUNTRIES_DATA.length);
    return COUNTRIES_DATA[idx];
  }

  getCountryByCode(code) {
    return COUNTRIES_DATA.find(c => c.code.toLowerCase() === code.toLowerCase());
  }

  getCountryByNameOrAlias(name) {
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return COUNTRIES_DATA.find(c => {
      const cName = c.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cCode = c.code.toLowerCase();
      return cName === clean || cCode === clean || cName.includes(clean);
    });
  }

  getAll() {
    return [...COUNTRIES_DATA];
  }

  getCount() {
    return COUNTRIES_DATA.length;
  }
}

window.FlagManager = new FlagManager();

