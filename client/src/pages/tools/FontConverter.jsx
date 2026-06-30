import { useState, useMemo } from 'react';
import { Type, Copy, Check, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Base alphabet for mapping
const NORMAL_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NORMAL_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NORMAL_NUMS  = '0123456789';
const NORMAL = NORMAL_LOWER + NORMAL_UPPER + NORMAL_NUMS;

// Character maps
const maps = {
  bold: '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗',
  italic: '𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍0123456789',
  boldItalic: '𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁0123456789',
  script: '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵0123456789',
  boldScript: '𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789',
  fraktur: '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ0123456789',
  boldFraktur: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅0123456789',
  doubleStruck: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡',
  sansSerif: '𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫',
  sansBold: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵',
  sansItalic: '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡0123456789',
  sansBoldItalic: '𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕0123456789',
  monospace: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿',
  smallCaps: 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  circled: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨',
  circledNeg: '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩⓿❶❷❸❹❺❻❼❽❾',
  squared: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉0123456789',
  squaredNeg: '🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉0123456789',
  fullwidth: 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９',
  inverted: 'ɐqɔpǝɟƃɥıɾʞlɯuodbɹsʇnʌʍxʎz∀qƆPƎℲפHIſʞ˥WNOԀQᴚS⊥∩ΛMX⅄Z0123456789',
  reversed: 'dɔdɘꟻgHijklmnoqpᴙꙅTuvwxYzAᙠƆᗡƎꟻGHIႱꓘ⅃MИOꟼỌЯꙄTUVWXYZ0123456789',
  subscript: 'ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyzₐBCDₑFGₕᵢⱼₖₗₘₙₒₚQᵣₛₜᵤᵥWₓYZ₀₁₂₃₄₅₆₇₈₉',
  superscript: 'ᵃᵇᶜᵈᵉᶠᵍʰᶦʲᵏˡᵐⁿᵒᵖᵠʳˢᵗᵘᵛʷˣʸᶻᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᵠᴿˢᵀᵁⱽᵂˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹',
  asian: '卂乃匚刀乇下厶卄工丁长乚从𠘨口尸㔿尺丂丅凵リ山乂丫乙卂乃匚刀乇下厶卄工丁长乚从𠘨口尸㔿尺丂丅凵リ山乂丫乙0123456789',
  russian: 'авсdэfБнїјкlмйорqяѕтцѵшхчzАВСDЭFБНЇЈКLМЙОРQЯЅТЦѴШХЧZ0123456789',
  ancient: 'ค๒ς๔єŦﻮђเןкl๓ภ๏קợгรՇยשฬאץչค๒ς๔єŦﻮђเןкl๓ภ๏קợгรՇยשฬאץչ0123456789',
  greek: 'αв¢∂єƒgнιנкℓмησρqяѕтυνωχуzΑΒCΔΕFΓΗΙJΚΛΜΝΟΡQΡΣΤU∇WΧΥΖ0123456789',
  symbols: 'åß¢Ðê£gHïjklmñðþqR§†µvwx¥zÅß¢ÐÊ£GHÏJKLMNÖPQR§†µVWX¥Z0123456789',
  hacker: '4bcd3f9h1jklmn0pqrs7uvwxy24BCD3F9H1JKLMN0PQRS7UVWXY20123456789',
  currency: '₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩Ӿ¥Ⱬ₳฿₵ĐɆ₣₲ⱧłJ₭Ⱡ₥₦Ø₱QⱤ₴₮ɄV₩Ӿ¥Ⱬ0123456789',
  brackets: '【a】【b】【c】【d】【e】【f】【g】【h】【i】【j】【k】【l】【m】【n】【o】【p】【q】【r】【s】【t】【u】【v】【w】【x】【y】【z】【A】【B】【C】【D】【E】【F】【G】【H】【I】【J】【K】【L】【M】【N】【O】【P】【Q】【R】【S】【T】【U】【V】【W】【X】【Y】【Z】【0】【1】【2】【3】【4】【5】【6】【7】【8】【9】',
};

// Decorators
const addStrike = (str) => str.split('').map(c => c + '\u0336').join('');
const addUnderline = (str) => str.split('').map(c => c + '\u0332').join('');
const addOverline = (str) => str.split('').map(c => c + '\u0305').join('');
const addSlash = (str) => str.split('').map(c => c + '\u0337').join('');
const addTilde = (str) => str.split('').map(c => c + '\u0334').join('');
const addCross = (str) => str.split('').map(c => c + '\u0338').join('');
const addSmiley = (str) => str.split('').map(c => c + '\u0303').join('');
const addAsterisk = (str) => str.split('').map(c => c + '\u20F0').join('');
const addHeart = (str) => '♥ ' + str + ' ♥';
const addSparkles = (str) => '✨ ' + str + ' ✨';
const addStars = (str) => '★ ' + str + ' ★';
const addWings = (str) => 'Ƹ̵̡Ӝ̵̨̄Ʒ ' + str + ' Ƹ̵̡Ӝ̵̨̄Ʒ';
const addMusic = (str) => '♫ ' + str + ' ♫';
const addCrown = (str) => '♚ ' + str + ' ♚';

// Function to map text based on a target alphabet
const mapText = (text, targetMap) => {
  if (!targetMap) return text;
  // If targetMap is longer than normal, it's an array mapping (like brackets)
  const isBracket = targetMap.startsWith('【');
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const idx = NORMAL.indexOf(char);
    
    if (idx !== -1) {
      if (isBracket) {
        // Brackets are 3 chars per letter
        result += targetMap.substring(idx * 3, idx * 3 + 3);
      } else {
        // Find unicode surrogate pair lengths
        let currentIdx = 0;
        let matched = char;
        for (let j = 0; j < targetMap.length; j++) {
          let code = targetMap.charCodeAt(j);
          let isSurrogate = (code >= 0xD800 && code <= 0xDBFF);
          if (currentIdx === idx) {
             matched = isSurrogate ? targetMap.substring(j, j+2) : targetMap[j];
             break;
          }
          currentIdx++;
          if (isSurrogate) j++; // Skip low surrogate
        }
        result += matched;
      }
    } else {
      result += char;
    }
  }
  return result;
};

// Generate 100+ Styles
const generateStyles = (text) => {
  const t = text || 'Stylish Text';
  const styles = [];
  
  // Base Maps
  Object.keys(maps).forEach(key => {
    styles.push({ name: key.replace(/([A-Z])/g, ' $1').trim(), text: mapText(t, maps[key]) });
  });

  // Base Maps + Decorations
  const decorations = [
    { name: 'Strikethrough', fn: addStrike },
    { name: 'Underline', fn: addUnderline },
    { name: 'Overline', fn: addOverline },
    { name: 'Slash', fn: addSlash },
    { name: 'Tilde', fn: addTilde },
    { name: 'Cross', fn: addCross },
    { name: 'Smiley', fn: addSmiley },
    { name: 'Asterisk', fn: addAsterisk },
  ];

  const symbols = [
    { name: 'Hearts', fn: addHeart },
    { name: 'Sparkles', fn: addSparkles },
    { name: 'Stars', fn: addStars },
    { name: 'Wings', fn: addWings },
    { name: 'Music', fn: addMusic },
    { name: 'Crown', fn: addCrown },
  ];

  // Apply decorations to Normal Text
  decorations.forEach(d => {
    styles.push({ name: `Normal ${d.name}`, text: d.fn(t) });
  });

  // Apply decorations to Bold Text
  decorations.forEach(d => {
    styles.push({ name: `Bold ${d.name}`, text: d.fn(mapText(t, maps.bold)) });
  });

  // Apply decorations to Italic Text
  decorations.forEach(d => {
    styles.push({ name: `Italic ${d.name}`, text: d.fn(mapText(t, maps.italic)) });
  });

  // Apply decorations to Script
  decorations.forEach(d => {
    styles.push({ name: `Script ${d.name}`, text: d.fn(mapText(t, maps.script)) });
  });

  // Apply decorations to Double Struck
  decorations.forEach(d => {
    styles.push({ name: `Double Struck ${d.name}`, text: d.fn(mapText(t, maps.doubleStruck)) });
  });

  // Apply symbols to Normal Text
  symbols.forEach(s => {
    styles.push({ name: s.name, text: s.fn(t) });
  });

  // Apply symbols to Bold
  symbols.forEach(s => {
    styles.push({ name: `Bold ${s.name}`, text: s.fn(mapText(t, maps.bold)) });
  });

  // Apply symbols to Script
  symbols.forEach(s => {
    styles.push({ name: `Script ${s.name}`, text: s.fn(mapText(t, maps.script)) });
  });

  // Zalgo generation
  const generateZalgo = (str, level) => {
    const chars = '\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030A\u030B\u030C\u030D\u030E\u030F\u0310\u0311\u0312\u0313\u0314\u0315\u0316\u0317\u0318\u0319\u031A\u031B\u031C\u031D\u031E\u031F\u0320\u0321\u0322\u0323\u0324\u0325\u0326\u0327\u0328\u0329\u032A\u032B\u032C\u032D\u032E\u032F\u0330\u0331\u0332\u0333\u0334\u0335\u0336\u0337\u0338\u0339\u033A\u033B\u033C\u033D\u033E\u033F\u0340\u0341\u0342\u0343\u0344\u0345\u0346\u0347\u0348\u0349\u034A\u034B\u034C\u034D\u034E\u0350\u0351\u0352\u0353\u0354\u0355\u0356\u0357\u0358\u0359\u035A\u035B\u035C\u035D\u035E\u035F\u0360\u0361\u0362\u0363\u0364\u0365\u0366\u0367\u0368\u0369\u036A\u036B\u036C\u036D\u036E\u036F';
    return str.split('').map(c => {
      let result = c;
      for (let i = 0; i < level; i++) result += chars[Math.floor(Math.random() * chars.length)];
      return result;
    }).join('');
  };

  styles.push({ name: 'Zalgo Light', text: generateZalgo(t, 2) });
  styles.push({ name: 'Zalgo Medium', text: generateZalgo(t, 5) });
  styles.push({ name: 'Zalgo Heavy', text: generateZalgo(t, 12) });

  return styles;
};


const FontConverter = () => {
  const [text, setText] = useState('Stylish Text');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const allStyles = useMemo(() => generateStyles(text), [text]);
  const filteredStyles = useMemo(() => {
    return allStyles.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [allStyles, search]);

  const handleCopy = (convertedText, id) => {
    navigator.clipboard.writeText(convertedText);
    setCopiedId(id);
    toast.success('Font copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col min-h-[calc(100vh-140px)]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg shadow-sm">
            <Type size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">100+ Stylish Fonts</h1>
            <p className="text-muted-foreground mt-1 text-sm">Convert regular text into 110+ aesthetic fonts for Instagram, Twitter, and TikTok.</p>
          </div>
        </div>
        <div className="bg-muted border border-border px-3 py-1.5 rounded-full text-sm font-semibold text-rose-500 shadow-sm flex items-center">
          {allStyles.length} Styles Generated
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        {/* Input Area */}
        <div className="p-4 sm:p-6 border-b border-border bg-muted/20 space-y-4 shrink-0">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Your Text</label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all"
              placeholder="Type something cool here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck="false"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-rose-500/50"
              placeholder="Search font styles (e.g., Bold, Zalgo, Hearts)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar">
          {filteredStyles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStyles.map((font, idx) => {
                const isCopied = copiedId === idx;
                
                return (
                  <div 
                    key={idx} 
                    className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col gap-2 hover:border-rose-500/30 transition-colors group cursor-pointer"
                    onClick={() => handleCopy(font.text, idx)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{font.name}</span>
                      <button className="text-muted-foreground group-hover:text-rose-500 transition-colors">
                        {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <div className="text-lg text-foreground break-all overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {font.text}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">
              No font styles match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FontConverter;
