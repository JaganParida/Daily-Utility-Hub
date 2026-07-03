import { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, ListTodo, Plus, Trash2, CheckCircle2, Circle, Coffee, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PomodoroHub = () => {
  const [mode, setMode] = useState('pomodoro'); // pomodoro, shortBreak, longBreak
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Review Chapter 4 for Biology', completed: false },
    { id: 2, text: 'Write introductory paragraph', completed: true },
  ]);
  const [newTaskText, setNewTaskText] = useState('');

  const MODES = {
    pomodoro: { time: 25 * 60, label: 'Pomodoro', color: 'text-primary' },
    shortBreak: { time: 5 * 60, label: 'Short Break', color: 'text-emerald-500' },
    longBreak: { time: 15 * 60, label: 'Long Break', color: 'text-blue-500' },
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or show notification here in a real app
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].time);
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG Circle calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / MODES[mode].time;
  const strokeDashoffset = circumference - progress * circumference;

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-[1600px] mx-auto w-full px-2 md:px-8">
      <div className="mb-6 flex items-center gap-3 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Timer size={24} />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">Pomodoro Study Hub</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Stay focused, manage your tasks, and boost your productivity.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Left: Timer Hub */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm flex flex-col relative overflow-hidden min-h-[450px] lg:min-h-[600px]">
          
          <div className="p-4 border-b border-border bg-muted/30 flex justify-center shrink-0">
            <div className="flex bg-background border border-border rounded-xl p-1 shadow-inner gap-1">
              <button onClick={() => switchMode('pomodoro')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'pomodoro' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted/80'}`}>
                <Brain size={16} /> Pomodoro
              </button>
              <button onClick={() => switchMode('shortBreak')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'shortBreak' ? 'bg-emerald-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted/80'}`}>
                <Coffee size={16} /> Short Break
              </button>
              <button onClick={() => switchMode('longBreak')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'longBreak' ? 'bg-blue-500 text-white shadow-md' : 'text-muted-foreground hover:bg-muted/80'}`}>
                <Timer size={16} /> Long Break
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center relative p-8">
            <div className="relative flex items-center justify-center">
              {/* SVG Ring Timer */}
              <svg viewBox="0 0 300 300" className="w-full max-w-[280px] sm:max-w-[300px] aspect-square transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="150" cy="150" r={radius}
                  stroke="currentColor" strokeWidth="8" fill="transparent"
                  className="text-muted opacity-30"
                />
                {/* Progress Ring */}
                <motion.circle
                  cx="150" cy="150" r={radius}
                  stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={circumference}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.5, ease: "linear" }}
                  strokeLinecap="round"
                  className={MODES[mode].color}
                />
              </svg>

              {/* Time Display */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-6xl font-black tabular-nums tracking-tight ${MODES[mode].color}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">
                  {MODES[mode].label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-border flex justify-center gap-4 shrink-0 bg-muted/10">
            <button 
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${isActive ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}`}
            >
              {isActive ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
            </button>
            <button 
              onClick={() => switchMode(mode)}
              className="w-16 h-16 rounded-2xl flex items-center justify-center bg-background border border-border text-foreground hover:bg-muted transition-all shadow-sm active:scale-95"
            >
              <RotateCcw size={28} />
            </button>
          </div>
        </div>

        {/* Right: Task List */}
        <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col min-h-[500px] lg:min-h-[600px] lg:max-h-[600px]">
            
            <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
              <ListTodo size={20} className="text-primary" />
              <h3 className="font-bold uppercase tracking-wider text-foreground">Study Tasks</h3>
              <span className="ml-auto text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                {tasks.filter(t=>t.completed).length}/{tasks.length} Done
              </span>
            </div>
            
            <form onSubmit={addTask} className="mb-4 relative">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What are you working on?"
                className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
              />
              <button type="submit" disabled={!newTaskText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-lg disabled:opacity-50 transition-opacity">
                <Plus size={16} />
              </button>
            </form>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
              <AnimatePresence>
                {tasks.map(task => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group flex items-start gap-3 p-3 rounded-xl mb-2 transition-colors border ${task.completed ? 'bg-muted/50 border-transparent' : 'bg-background border-border hover:border-primary/30'}`}
                  >
                    <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0 transition-colors">
                      {task.completed ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} className="text-muted-foreground group-hover:text-primary" />}
                    </button>
                    <span className={`flex-1 text-sm leading-relaxed transition-all ${task.completed ? 'text-muted-foreground line-through opacity-70' : 'text-foreground font-medium'}`}>
                      {task.text}
                    </span>
                    <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-500 transition-colors rounded-md hover:bg-rose-500/10">
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground mt-10">
                    No tasks yet. Add a task to start studying!
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroHub;
