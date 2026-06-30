import { useState, useEffect } from 'react';
import { Clock, HelpCircle } from 'lucide-react';
import cronstrue from 'cronstrue';
import parser from 'cron-parser';

const CronParser = () => {
  const [expression, setExpression] = useState('*/5 8-17 * * 1-5');
  const [description, setDescription] = useState('');
  const [nextRuns, setNextRuns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!expression.trim()) {
      setDescription('');
      setNextRuns([]);
      setError(null);
      return;
    }

    try {
      // 1. Get Human Readable Description
      const desc = cronstrue.toString(expression, { throwExceptionOnParseError: true });
      setDescription(desc);
      setError(null);

      // 2. Calculate Next 5 runs
      const interval = parser.parseExpression(expression);
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(interval.next().toString());
      }
      setNextRuns(runs);

    } catch (err) {
      setError('Invalid cron expression. Please check the syntax.');
      setDescription('');
      setNextRuns([]);
    }
  }, [expression]);

  const presetExamples = [
    { label: 'Every minute', expr: '* * * * *' },
    { label: 'Every 5 minutes', expr: '*/5 * * * *' },
    { label: 'Every hour at minute 30', expr: '30 * * * *' },
    { label: 'Every day at midnight', expr: '0 0 * * *' },
    { label: 'Every Monday at 9AM', expr: '0 9 * * 1' },
    { label: 'Weekdays, 8AM to 5PM', expr: '0 8-17 * * 1-5' },
    { label: '1st of every month', expr: '0 0 1 * *' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shadow-sm">
          <Clock size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cron Expression Parser</h1>
          <p className="text-muted-foreground mt-1 text-sm">Translate cron schedules into plain English and see upcoming run times.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        
        {/* Main Panel */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
              Cron Expression
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="* * * * *"
                className={`w-full bg-background border rounded-xl px-5 py-4 text-xl font-mono text-foreground focus:outline-none focus:ring-2 shadow-sm transition-all ${
                  error ? 'border-red-500 focus:ring-red-500/50 text-red-500' : 'border-border focus:ring-blue-500/50'
                }`}
              />
              
              <div className="absolute -bottom-6 left-2 flex gap-4 text-xs font-mono text-muted-foreground">
                <span className="w-8 text-center">min</span>
                <span className="w-8 text-center">hour</span>
                <span className="w-8 text-center">day</span>
                <span className="w-8 text-center">month</span>
                <span className="w-8 text-center">week</span>
              </div>
            </div>

            <div className="mt-12 p-6 bg-muted/30 border border-border rounded-xl min-h-[120px] flex items-center justify-center text-center">
              {error ? (
                <p className="text-red-500 font-medium">{error}</p>
              ) : description ? (
                <p className="text-2xl font-medium text-foreground leading-relaxed">&quot;{description}&quot;</p>
              ) : (
                <p className="text-muted-foreground flex items-center gap-2">
                  <HelpCircle size={18} /> Enter a valid expression above
                </p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">
              Next 5 Expected Runs
            </h3>
            
            {nextRuns.length > 0 ? (
              <ul className="space-y-3">
                {nextRuns.map((run, idx) => (
                  <li key={idx} className="flex items-center gap-4 bg-muted/50 px-4 py-3 rounded-lg border border-border font-mono text-sm">
                    <span className="text-muted-foreground font-bold bg-background border px-2 py-1 rounded">#{idx + 1}</span>
                    <span className="text-foreground">{new Date(run).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm italic">Runs will appear here once expression is valid.</p>
            )}
          </div>
        </div>

        {/* Sidebar Examples */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 border-b border-border pb-2">
            Common Examples
          </h3>
          <div className="flex flex-col gap-2">
            {presetExamples.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setExpression(preset.expr)}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                  expression === preset.expr
                    ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-sm'
                    : 'bg-background border-border hover:bg-muted text-foreground'
                }`}
              >
                <div className="font-bold mb-1">{preset.label}</div>
                <div className={`font-mono text-xs ${expression === preset.expr ? 'text-blue-500/70' : 'text-muted-foreground'}`}>
                  {preset.expr}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CronParser;
