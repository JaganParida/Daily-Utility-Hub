import { useState, useMemo, useEffect, useCallback } from 'react';
import ToolHeader from '../../components/ToolHeader';
import { Type, Copy, CheckCircle, Search, Settings, Sparkles, Smile, Star, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Base alphabets
const NORMAL_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NORMAL_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NORMAL_NUMS  = '0123456789';
const NORMAL = NORMAL_LOWER + NORMAL_UPPER + NORMAL_NUMS;

// Character maps
const maps = {
  bold: '𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗',
  italic: '𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽Κ𝛬𝛭𝛮𝛯𝛰𝛱𝛲𝛳𝛴𝛵𝛶𝛷𝛸𝛹𝛺0123456789',
  boldItalic: '𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝒬𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁0123456789',
  script: '𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽ℐ𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵0123456789',
  boldScript: '𝓪\u{1D4EE}𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼\u{1D502}𝓾𝓋𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓\u{1D4D4}𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩0123456789',
  fraktur: '𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ0123456789',
  boldFraktur: '𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅0123456789',
  doubleStruck: '𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂDoubleStruck𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡',
  sansSerif: '𝖺𝖻𝖼\u{1D5BA}𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭\u{1D5A4}𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫',
  sansBold: '𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝐒𝐓𝐔𝐕𝗪𝗫𝗬𝗭𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵',
  sansItalic: '𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡0123456789',
  sansBoldItalic: '𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠 𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕0123456789',
  monospace: '𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿',
  smallCaps: 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  circled: 'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ⓪①②③④⑤⑥⑦⑧⑨',
  circledNeg: '🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩⓿❶❷❸❹❺❻❼❽❾',
  squared: '🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉0123456789',
  fullwidth: 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ０１２３４５６７８９',
  brackets: '【a】【b】【c】【d】【e】【f】【g】【h】【i】【j】【k】【l】【m】【n】【o】【p】【q】【r】【s】【t】【u】【v】【w】【x】【y】【z】【A】【B】【C】【D】【E】【F】【G】【H】【I】【J】【K】【L】【M】【N】【O】【P】【Q】【R】【S】【T】【U】【V】【W】【X】【Y】【Z】【0】【1】【2】【3】【4】【5】【6】【7】【8】【9】',
};

// Decorators
const addStrike = (str) => [...str].map(c => c + '\u0336').join('');
const addUnderline = (str) => [...str].map(c => c + '\u0332').join('');
const addOverline = (str) => [...str].map(c => c + '\u0305').join('');
const addSlash = (str) => [...str].map(c => c + '\u0337').join('');

const mapText = (text, targetMap) => {
  if (!targetMap) return text;
  const isBracket = targetMap.startsWith('【');
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const idx = NORMAL.indexOf(char);
    
    if (idx !== -1) {
      if (isBracket) {
        result += targetMap.substring(idx * 3, idx * 3 + 3);
      } else {
        // Safe mapping for surrogate pairs
        const arr = Array.from(targetMap);
        result += arr[idx] || char;
      }
    } else {
      result += char;
    }
  }
  return result;
};

// Generate list of font styles
const generateStyles = (text) => {
  const t = text || 'Stylish Text';
  const styles = [];
  
  Object.keys(maps).forEach(key => {
    styles.push({ 
      id: key,
      name: key.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase()).trim(), 
      text: mapText(t, maps[key]) 
    });
  });

  // Basic Decorated styles
  styles.push({ id: 'strike', name: 'Strikethrough', text: addStrike(t) });
  styles.push({ id: 'underline', name: 'Underline', text: addUnderline(t) });
  styles.push({ id: 'overline', name: 'Overline', text: addOverline(t) });
  styles.push({ id: 'slash', name: 'Slashed Text', text: addSlash(t) });

  return styles;
};

// Zalgo generator
const generateZalgo = (str, level) => {
  const chars = '\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307\u0308\u0309\u030A\u030B\u030C\u030D\u030E\u030F\u0310\u0311\u0312\u0313\u0314\u0315\u0316\u0317\u0318\u0319\u031A\u031B\u031C\u031D\u031E\u031F\u0320\u0321\u0322\u0323\u0324\u0325\u0326\u0327\u0328\u0329\u032A\u032B\u032C\u032D\u032E\u032F\u0330\u0331\u0332\u0333\u0334\u0335\u0336\u0337\u0338\u0339\u033A\u033B\u033C\u033D\u033E\u033F\u0340\u0341\u0342\u0343\u0344\u0345\u0346\u0347\u0348\u0349\u034A\u034B\u034C\u034D\u034E\u0350\u0351\u0352\u0353\u0354\u0355\u0356\u0357\u0358\u0359\u035A\u035B\u035C\u035D\u035E\u035F\u0360\u0361\u0362\u0363\u0364\u0365\u0366\u0367\u0368\u0369\u036A\u036B\u036C\u036D\u036E\u036F';
  return [...str].map(c => {
    let result = c;
    for (let i = 0; i < level; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }).join('');
};

const FontConverter = () => {
  const [text, setText] = useState('Aesthetic');
  const [search, setSearch] = useState('');
  const [copiedState, setCopiedState] = useState(false);
  const [selectedFont, setSelectedFont] = useState(null);

  // Decorator selections
  const [decorator, setDecorator] = useState('none'); // 'none' | 'hearts' | 'sparkles' | 'stars' | 'music' | 'crown'
  const [zalgoLevel, setZalgoLevel] = useState(0); // 0 (off), 1 (light), 2 (heavy)

  const allStyles = useMemo(() => generateStyles(text), [text]);

  const filteredStyles = useMemo(() => {
    return allStyles.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [allStyles, search]);

  // Set default selection on load or text change
  useEffect(() => {
    if (filteredStyles.length > 0 && !selectedFont) {
      setSelectedFont(filteredStyles[0]);
    }
  }, [filteredStyles, selectedFont]);

  // Apply custom decorators dynamically
  const applyDecoration = useCallback((baseText) => {
    let output = baseText;
    
    if (zalgoLevel === 1) {
      output = generateZalgo(output, 2);
    } else if (zalgoLevel === 2) {
      output = generateZalgo(output, 7);
    }

    if (decorator === 'hearts')      output = `♥ ${output} ♥`;
    else if (decorator === 'sparkles') output = `✨ ${output} ✨`;
    else if (decorator === 'stars')    output = `★ ${output} ★`;
    else if (decorator === 'music')    output = `♫ ${output} ♫`;
    else if (decorator === 'crown')    output = `♚ ${output} ♚`;

    return output;
  }, [decorator, zalgoLevel]);

  const handleCopy = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedState(true);
    toast.success('Font copied to clipboard!');
    setTimeout(() => setCopiedState(false), 2000);
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="tool-page-container">
      {/* Header */}
      <ToolHeader
        title="100+ Stylish Font Swatches"
        description="Transform plain text into aesthetic social media styles with custom symbols & sparkles."
        category="Text Tools"
        categoryPath="/search"
        icon={Type}
        iconColor="text-[#ea4335] bg-[#fce8e6] border-[#fad2cf]"
        badge="Unicode Fonts"
        extraBadge="Instagram & Bio Ready"
      />

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left: Input & Font Grid Area */}
        <motion.div 
          layout
          className="flex-1 w-full bg-card border border-border p-4 md:p-5 rounded-2xl shadow-sm flex flex-col relative lg:h-[calc(100vh-250px)] lg:max-h-[620px] lg:min-h-[520px]"
        >
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-3 shrink-0">
              {/* Text Input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Your Input Text</label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (selectedFont) {
                      // refresh text mapping
                      const matchingFont = allStyles.find(s => s.id === selectedFont.id);
                      if (matchingFont) setSelectedFont(matchingFont);
                    }
                  }}
                  placeholder="Type text to convert..."
                  className="w-full bg-muted/20 border border-border/50 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all shadow-sm"
                  spellCheck="false"
                />
              </div>

              {/* Style Search */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Filter Styles</label>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search styles..."
                    className="w-full bg-muted/20 border border-border/50 pl-9 pr-4 py-2.5 rounded-xl text-xs font-semibold text-foreground outline-none focus:border-primary transition-all shadow-sm"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* List swatches area */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0 pt-1">
              {filteredStyles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredStyles.map((font) => {
                    const activeTxt = applyDecoration(font.text);
                    const isSelected = selectedFont?.id === font.id;

                    return (
                      <motion.div
                        key={font.id}
                        layout
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFont(font)}
                        className={`bg-muted/30 border p-3 rounded-xl flex flex-col gap-2 transition-all cursor-pointer group ${
                          isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex justify-between items-center shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{font.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(activeTxt);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors p-1 rounded-md"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <div className="text-sm font-semibold text-foreground truncate select-all pr-2 pt-0.5">
                          {activeTxt}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground italic text-xs">
                  No font styles match your search filters.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right: Sidebar Customizer Panel */}
        <motion.div 
          animate={{ opacity: hasText ? 1 : 0.5 }}
          transition={{ duration: 0.25 }}
          className={`w-full lg:w-[350px] xl:w-[400px] shrink-0 space-y-6 transition-all duration-300 ${!hasText ? 'pointer-events-none grayscale-[0.5]' : ''}`}
        >
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-3 flex items-center gap-2">
              <Settings size={15} /> Style Customizer
            </h3>

            {/* Selected Swatch Swell Display */}
            {selectedFont ? (
              <div className="bg-muted/30 border border-border/50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Active Swatch</span>
                  <span className="text-[9px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded uppercase">
                    {selectedFont.name}
                  </span>
                </div>
                <div className="bg-background/80 border border-border/30 p-3 rounded-lg text-center break-all select-all font-semibold text-base min-h-[50px] flex items-center justify-center text-foreground shadow-inner">
                  {applyDecoration(selectedFont.text)}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCopy(applyDecoration(selectedFont.text))}
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_12px_rgba(var(--primary),0.3)] active:scale-[0.98]"
                >
                  {copiedState ? <CheckCircle size={14} /> : <Copy size={14} />} Copy Aesthetic Swatch
                </motion.button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4">Select a font style to customize.</p>
            )}

            {/* Aesthetic Decorators Selector */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> Aesthetic Borders
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none',     label: 'No Borders' },
                  { id: 'hearts',   label: '♥ Hearts ♥' },
                  { id: 'sparkles', label: '✨ Sparkles' },
                  { id: 'stars',    label: '★ Stars ★' },
                  { id: 'music',    label: '♫ Music ♫' },
                  { id: 'crown',    label: '♚ Crown ♚' }
                ].map(dec => (
                  <motion.button
                    key={dec.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDecorator(dec.id)}
                    className={`py-2.5 px-2.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                      decorator === dec.id
                        ? 'border-primary/50 bg-primary/10 text-primary font-bold'
                        : 'border-border/50 bg-muted/20 hover:bg-muted text-foreground'
                    }`}
                  >
                    {dec.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Zalgo glitch controls */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-primary" /> Glitched Zalgo Level
              </label>

              <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 gap-1">
                {[
                  { id: 0, label: 'Disabled' },
                  { id: 1, label: 'Light' },
                  { id: 2, label: 'Heavy' }
                ].map(level => (
                  <button
                    key={level.id}
                    onClick={() => setZalgoLevel(level.id)}
                    className={`flex-1 relative py-2.5 text-xs font-bold rounded-xl transition-all ${
                      zalgoLevel === level.id ? 'text-foreground font-extrabold' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {zalgoLevel === level.id && (
                      <motion.div
                        layoutId="zalgo-active"
                        className="absolute inset-0 bg-background border border-border rounded-xl shadow-sm -z-10"
                      />
                    )}
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FontConverter;
