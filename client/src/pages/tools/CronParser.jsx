import { useState, useEffect } from 'react';
import { 
  Clock, HelpCircle, Settings2, Sparkles, 
  Calendar, Check, ChevronDown, BookOpen 
} from 'lucide-react';
import cronstrue from 'cronstrue';
import parser from 'cron-parser';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const PRESET_EXAMPLES = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every hour at minute 30', expr: '30 * * * *' },
  { label: 'Every day at midnight', expr: '0 0 * * *' },
  { label: 'Every Monday at 9 AM', expr: '0 9 * * 1' },
  { label: 'Weekdays, 9 AM to 5 PM', expr: '0 9-17 * * 1-5' },
  { label: 'First of every month', expr: '0 0 1 * *' },
  { label: 'Every 15 mins on Sunday', expr: '*/15 * * * 0' }
];

const CronParser = () => {
  const [expression, setExpression] = useState('*/5 8-17 * * 1-5');
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [error, setError] = useState(null);
  
  const [builderMin, setBuilderMin] = useState('*');
  const [builderHour, setBuilderHour] = useState('*');
  const [builderDay, setBuilderDay] = useState('*');
  const [builderMonth, setBuilderMonth] = useState('*');
  const [builderDayOfWeek, setBuilderDayOfWeek] = useState('*');

  const [mode, setMode] = useState('parse');

  useEffect(() => {
    if (!expression.trim()) {
      setDescription('');
      setNextRuns([]);
      setError(null);
      return;
    }

    try {
      const desc = cronstrue.toString(expression, { throwExceptionOnParseError: true });
      setDescription(desc);
      setError(null);

      const interval = parser.parseExpression(expression);
      const runs = [];
      for (let i = 0; i < 10; i++) {
        runs.push(interval.next().toString());
      }
      setNextRuns(runs);

      const parts = expression.trim().split(/\s+/);
      if (parts.length >= 5) {
        setBuilderMin(parts[0]);
        setBuilderHour(parts[1]);
        setBuilderDay(parts[2]);
        setBuilderMonth(parts[3]);
        setBuilderDayOfWeek(parts[4]);
      }

    } catch (err) {
      setError('Invalid cron expression. Please check the 5-field syntax.');
      setDescription('');
      setNextRuns([]);
    }
  }, [expression]);

  const handleBuilderChange = (field, val) => {
    let m = builderMin, h = builderHour, d = builderDay, mo = builderMonth, dw = builderDayOfWeek;
    if (field === 'min') { setBuilderMin(val); m = val; }
    if (field === 'hour') { setBuilderHour(val); h = val; }
    if (field === 'day') { setBuilderDay(val); d = val; }
    if (field === 'month') { setBuilderMonth(val); mo = val; }
    if (field === 'dayOfWeek') { setBuilderDayOfWeek(val); dw = val; }

    const newExpr = `${m} ${h} ${d} ${mo} ${dw}`;
    setExpression(newExpr);
  };

  const getRelativeTime = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target - now;
    
    if (diffMs < 0) return 'Just passed';
    
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 60) return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    
    const diffDays = Math.round(diffHours / 24);
    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-[1600px] mx-auto w-full px-2 md:px-8"
    >
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 sm:pt-0">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl shadow-sm shrink-0">
          <Clock size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Cron Expression Parser & Builder</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Translate cron schedules into plain English, see future execution runs, or build expressions visually.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Workspace */}
        <div className="flex-1 w-full bg-card border border-border/80 p-6 rounded-2xl shadow-sm flex flex-col min-h-[440px]">
          
          {/* Mode Tabs */}
          <div className="flex p-1 bg-muted/30 rounded-xl border border-border/50 shadow-inner mb-6 shrink-0 max-w-xs">
            {[
              { id: 'parse', label: 'Parse Expression', icon: Clock },
              { id: 'builder', label: 'Visual Builder', icon: Settings2 }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`flex-1 relative py-2.5 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  mode === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode === t.id && (
                  <motion.div
                    layoutId="cron-mode-active"
                    className="absolute inset-0 bg-background border border-border rounded-lg shadow-sm -z-10 animate-none"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Editors / Visualizer */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <AnimatePresence mode="wait">
              {mode === 'parse' ? (
                <motion.div
                  key="parse-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Cron Expression</label>
                    <div className="relative pt-1 pb-6">
                      <input
                        type="text"
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        placeholder="* * * * *"
                        className={`w-full bg-background/40 border rounded-xl px-5 py-4 text-xl font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 shadow-inner transition-all ${
                          error ? 'border-red-500/40 focus:ring-red-500/40' : 'border-border/80'
                        }`}
                      />
                      <div className="absolute bottom-0 left-3.5 flex gap-5 text-[10px] font-mono text-muted-foreground/60 font-bold uppercase select-none">
                        <span className="w-8 text-center">min</span>
                        <span className="w-8 text-center">hour</span>
                        <span className="w-8 text-center">day</span>
                        <span className="w-8 text-center">month</span>
                        <span className="w-8 text-center">week</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="builder-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4"
                >
                  {/* Minute */}
                  <div className="space-y-2 bg-muted/10 border border-border/80 p-4 rounded-xl flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Minutes</label>
                    <select
                      value={builderMin}
                      onChange={(e) => handleBuilderChange('min', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                    >
                      <option value="*">Every Minute (*)</option>
                      <option value="*/2">Every 2 Mins</option>
                      <option value="*/5">Every 5 Mins</option>
                      <option value="*/10">Every 10 Mins</option>
                      <option value="*/15">Every 15 Mins</option>
                      <option value="*/30">Every 30 Mins</option>
                      <option value="0">At Minute 0</option>
                    </select>
                  </div>

                  {/* Hour */}
                  <div className="space-y-2 bg-muted/10 border border-border/80 p-4 rounded-xl flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hours</label>
                    <select
                      value={builderHour}
                      onChange={(e) => handleBuilderChange('hour', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                    >
                      <option value="*">Every Hour (*)</option>
                      <option value="*/2">Every 2 Hours</option>
                      <option value="*/6">Every 6 Hours</option>
                      <option value="*/12">Every 12 Hours</option>
                      <option value="0">At Midnight (00:00)</option>
                      <option value="9">At 9 AM</option>
                      <option value="12">At 12 PM (Noon)</option>
                      <option value="18">At 6 PM</option>
                    </select>
                  </div>

                  {/* Day of Month */}
                  <div className="space-y-2 bg-muted/10 border border-border/80 p-4 rounded-xl flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Day of Month</label>
                    <select
                      value={builderDay}
                      onChange={(e) => handleBuilderChange('day', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                    >
                      <option value="*">Every Day (*)</option>
                      <option value="1">1st of Month</option>
                      <option value="15">15th of Month</option>
                      <option value="L">Last Day of Month</option>
                    </select>
                  </div>

                  {/* Month */}
                  <div className="space-y-2 bg-muted/10 border border-border/80 p-4 rounded-xl flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Months</label>
                    <select
                      value={builderMonth}
                      onChange={(e) => handleBuilderChange('month', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                    >
                      <option value="*">Every Month (*)</option>
                      <option value="*/2">Every 2 Months</option>
                      <option value="1">January</option>
                      <option value="6">June</option>
                      <option value="12">December</option>
                    </select>
                  </div>

                  {/* Day of Week */}
                  <div className="space-y-2 bg-muted/10 border border-border/80 p-4 rounded-xl flex flex-col">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Day of Week</label>
                    <select
                      value={builderDayOfWeek}
                      onChange={(e) => handleBuilderChange('dayOfWeek', e.target.value)}
                      className="w-full bg-background border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary/50 outline-none"
                    >
                      <option value="*">Every Day (*)</option>
                      <option value="1-5">Weekdays (Mon-Fri)</option>
                      <option value="0,6">Weekends (Sat-Sun)</option>
                      <option value="1">Monday</option>
                      <option value="5">Friday</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Translation Output Box */}
            <div className="p-6 bg-muted/20 border border-border/80 rounded-2xl min-h-[120px] flex items-center justify-center text-center relative overflow-hidden shadow-inner">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.p
                    key="error-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 font-semibold flex items-center gap-1.5"
                  >
                    <HelpCircle size={18} /> {error}
                  </motion.p>
                ) : description ? (
                  <motion.div
                    key="desc-text"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-2"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Plain English Schedule</span>
                    <span className="text-xl md:text-2xl font-bold text-foreground leading-snug">
                      &ldquo;{description}&rdquo;
                    </span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-muted-foreground italic text-sm"
                  >
                    Enter or build a valid expression to translate...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div className="w-full lg:w-[380px] xl:w-[460px] shrink-0 space-y-6">
          
          {/* Next Runs list */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar size={16} /> Upcoming Runs (Next 10)
              </h3>
            </div>
            
            {nextRuns.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {nextRuns.map((run, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-background/50 border border-border/80 px-3.5 py-3 rounded-xl text-xs font-mono group">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-muted-foreground font-bold bg-muted/65 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <span className="text-foreground truncate">{new Date(run).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary shrink-0 ml-2">
                      {getRelativeTime(run)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-6 text-center">Runs will appear here once expression is valid.</p>
            )}
          </div>

          {/* Preset Examples */}
          <div className="bg-card border border-border/80 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen size={14} /> Common Presets
              </h3>
            </div>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {PRESET_EXAMPLES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setExpression(preset.expr);
                    toast.success(`Loaded preset: ${preset.label}`);
                  }}
                  className={`text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                    expression === preset.expr
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-background border-border/80 hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <div className="font-bold mb-0.5">{preset.label}</div>
                  <code className={`font-mono text-[10px] ${expression === preset.expr ? 'text-primary/70' : 'text-muted-foreground/60'}`}>
                    {preset.expr}
                  </code>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CronParser;
