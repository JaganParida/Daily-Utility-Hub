import { useState, useEffect } from 'react';
import { Type, AlertCircle, Copy, Check, Terminal, FileCode2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RegexTester = () => {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      setError(null);

      if (!testString) {
        setMatches([]);
        return;
      }

      const newMatches = [];
      let match;
      
      // If global flag is not set, matchAll throws error. Handle single match manually.
      if (!flags.includes('g')) {
        match = regex.exec(testString);
        if (match) {
          newMatches.push(match);
        }
      } else {
        const matchesIterator = testString.matchAll(regex);
        for (const m of matchesIterator) {
          newMatches.push(m);
        }
      }
      
      setMatches(newMatches);
    } catch (err) {
      setError(err.message);
      setMatches([]);
    }
  }, [pattern, flags, testString]);

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const getHighlightedText = () => {
    if (!pattern || error || matches.length === 0 || !testString) return testString;

    try {
      const regex = new RegExp(pattern, flags);
      // Split by regex to interleave matches and non-matches
      // A small trick: replace the matched strings with a unique token, then map them back
      // Since matchAll gave us exact indices, we can construct the highlighted string manually
      
      let lastIndex = 0;
      const nodes = [];
      
      matches.forEach((match, i) => {
        // Add text before match
        if (match.index > lastIndex) {
          nodes.push(<span key={`text-${i}`}>{testString.substring(lastIndex, match.index)}</span>);
        }
        
        // Add matched text
        nodes.push(
          <span key={`match-${i}`} className="bg-sky-500/30 text-sky-700 dark:text-sky-300 rounded-[2px] px-0.5 border border-sky-500/30 font-bold">
            {match[0]}
          </span>
        );
        
        lastIndex = match.index + match[0].length;
      });
      
      // Add remaining text
      if (lastIndex < testString.length) {
        nodes.push(<span key="text-last">{testString.substring(lastIndex)}</span>);
      }
      
      return nodes;
    } catch (e) {
      return testString;
    }
  };

  const codeSnippets = {
    js: `const regex = /${pattern || 'pattern'}/${flags};\nconst str = \`${testString || 'string'}\`;\n\n// Check if matches\nconst isMatch = regex.test(str);\n\n// Get all matches\nconst matches = str.match(regex);`,
    python: `import re\n\npattern = r"${pattern || 'pattern'}"\nstring = """${testString || 'string'}"""\n\n# Check if matches\nis_match = bool(re.search(pattern, string))\n\n# Get all matches\nmatches = re.findall(pattern, string)`,
    go: `package main\n\nimport (\n\t"fmt"\n\t"regexp"\n)\n\nfunc main() {\n\tpattern := \`${pattern || 'pattern'}\`\n\tstr := \`${testString || 'string'}\`\n\t\n\tre, _ := regexp.Compile(pattern)\n\t\n\t// Check if matches\n\tisMatch := re.MatchString(str)\n\tfmt.Println(isMatch)\n\t\n\t// Get all matches\n\tmatches := re.FindAllString(str, -1)\n\tfmt.Println(matches)\n}`
  };

  const handleCopySnippet = (lang) => {
    navigator.clipboard.writeText(codeSnippets[lang]);
    setCopiedSnippet(lang);
    toast.success('Snippet copied!');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const cheatsheet = [
    { rule: '.', desc: 'Any character except newline' },
    { rule: '\\w \\d \\s', desc: 'Word, digit, whitespace' },
    { rule: '\\W \\D \\S', desc: 'Not word, digit, whitespace' },
    { rule: '[abc]', desc: 'Any of a, b, or c' },
    { rule: '[^abc]', desc: 'Not a, b, or c' },
    { rule: '[a-g]', desc: 'Character between a & g' },
    { rule: '^abc$', desc: 'Start / End of the string' },
    { rule: 'a*', desc: 'Zero or more of a' },
    { rule: 'a+', desc: 'One or more of a' },
    { rule: 'a?', desc: 'Zero or one of a' },
    { rule: 'a{3}', desc: 'Exactly 3 of a' },
    { rule: '(abc)', desc: 'Capture group' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg shadow-sm">
          <Type size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Regex Tester</h1>
          <p className="text-muted-foreground mt-1 text-sm">Test regular expressions, highlight matches, and generate code snippets.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        
        {/* Main Panel */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Regular Expression</label>
              <div className="flex bg-background border border-border rounded-xl focus-within:ring-2 focus-within:ring-sky-500/50 transition-all overflow-hidden shadow-sm">
                <div className="flex items-center justify-center px-4 bg-muted border-r border-border text-muted-foreground font-mono font-bold text-lg">
                  /
                </div>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Insert RegEx here (e.g. \b\w+\b)"
                  className="flex-1 bg-transparent px-4 py-3 text-lg font-mono text-foreground focus:outline-none"
                  spellCheck="false"
                />
                <div className="flex items-center justify-center px-4 bg-muted border-l border-border text-muted-foreground font-mono font-bold text-lg tracking-widest">
                  /{flags}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { flag: 'g', label: 'Global', tooltip: 'Don\'t return after first match' },
                  { flag: 'i', label: 'Case Insensitive', tooltip: 'Match upper and lower case' },
                  { flag: 'm', label: 'Multiline', tooltip: '^ and $ match start/end of line' },
                  { flag: 's', label: 'Dotall', tooltip: 'Dot (.) matches newline' }
                ].map(f => (
                  <button
                    key={f.flag}
                    onClick={() => toggleFlag(f.flag)}
                    title={f.tooltip}
                    className={`px-3 py-1.5 text-xs rounded-md border font-medium transition-colors ${
                      flags.includes(f.flag)
                        ? 'bg-sky-500/10 border-sky-500 text-sky-500 shadow-sm'
                        : 'bg-background border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {f.label} ({f.flag})
                  </button>
                ))}
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500 mt-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between items-end">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground block">Test String</label>
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground">
                  {matches.length} Match{matches.length !== 1 ? 'es' : ''}
                </span>
              </div>
              
              <div className="relative">
                <textarea
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  placeholder="Enter text to test your regex against..."
                  className="w-full min-h-[250px] p-4 bg-background border border-border rounded-xl resize-none text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 absolute top-0 left-0 text-transparent caret-foreground z-10 custom-scrollbar"
                  spellCheck="false"
                />
                <div className="w-full min-h-[250px] p-4 bg-background border border-border rounded-xl resize-none font-mono text-sm whitespace-pre-wrap break-words pointer-events-none custom-scrollbar">
                  {testString ? getHighlightedText() : <span className="text-muted-foreground">Enter text to test your regex against...</span>}
                </div>
              </div>
            </div>

          </div>

          {/* Snippets Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
             <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <FileCode2 size={16} /> Code Snippets
            </h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { id: 'js', label: 'JavaScript' },
                { id: 'python', label: 'Python' },
                { id: 'go', label: 'Go' }
              ].map(lang => (
                <div key={lang.id} className="bg-muted/50 border border-border rounded-xl overflow-hidden flex flex-col group">
                  <div className="flex justify-between items-center p-2 bg-muted border-b border-border">
                    <span className="text-xs font-bold text-foreground px-1">{lang.label}</span>
                    <button 
                      onClick={() => handleCopySnippet(lang.id)}
                      className={`p-1.5 rounded-md transition-colors ${copiedSnippet === lang.id ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {copiedSnippet === lang.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <pre className="p-3 text-[10px] sm:text-xs font-mono text-muted-foreground overflow-x-auto custom-scrollbar flex-1">
                    {codeSnippets[lang.id]}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm sticky top-24">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2 border-b border-border pb-2">
            <Terminal size={16} /> Cheatsheet
          </h3>
          <ul className="space-y-3">
            {cheatsheet.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-1 border-b border-border/50 pb-2 last:border-0">
                <code className="text-xs font-bold font-mono text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded w-max">
                  {item.rule}
                </code>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default RegexTester;
