"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, BrainCircuit, Play, MessageSquare, Send, CheckCircle2, RotateCw } from "lucide-react";
import { getSavedSessions, TypingSession, analyzeWeakKeys, WeakKeyAnalysis, calculateFocusScore } from "@/utils/aiEngine";
import Link from "next/link";

interface Message {
  sender: "coach" | "user";
  text: string;
}

export default function AICoachPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [weakKeys, setWeakKeys] = useState<WeakKeyAnalysis[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const data = getSavedSessions();
    setSessions(data);
    const analysis = analyzeWeakKeys(data);
    setWeakKeys(analysis);

    // Initial coach greetings
    if (data.length === 0) {
      setChatMessages([
        {
          sender: "coach",
          text: "Greetings! I am your Tactile Coach. To begin, please complete a few typing tests on the Workbench. Once I have some telemetry logs, I'll compile a custom key-latency diagnosis and design remediation drills for you!",
        },
      ]);
    } else {
      const topWeak = analysis.slice(0, 3).map(w => w.key.toUpperCase()).join(", ");
      const latestSession = data[data.length - 1];
      const focus = calculateFocusScore(latestSession);

      setChatMessages([
        {
          sender: "coach",
          text: `Welcome back! I've analyzed your recent sessions. Your current average speed is ${Math.round(data.reduce((sum, s) => sum + s.wpm, 0) / data.length)} WPM. I notice some transition friction targeting the keys [${topWeak || "None"}]. Your rhythm consistency (Focus Score) on the last run was ${focus}%. How can I help you improve today?`,
        },
      ]);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const overallStats = useMemo(() => {
    if (sessions.length === 0) return null;
    const avgWpm = Math.round(sessions.reduce((a, b) => a + b.wpm, 0) / sessions.length);
    const avgAcc = Math.round(sessions.reduce((a, b) => a + b.accuracy, 0) / sessions.length);
    return { avgWpm, avgAcc };
  }, [sessions]);

  // Handle preset questions
  const askCoachQuestion = (question: string, answerText: string) => {
    setChatMessages(prev => [...prev, { sender: "user", text: question }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: "coach", text: answerText }]);
    }, 800);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let coachReply = "I understand. Standard finger muscle memory requires repeating slow sequences. Try running a 'Weak-Key Workout' from the panel on the left to lock down these keystroke transitions.";
      
      const textLower = userText.toLowerCase();
      if (textLower.includes("wpm") || textLower.includes("speed")) {
        coachReply = "To increase WPM, you must decrease key transition hesitation. Focus on keeping your fingers closer to the home row keys rather than hovering high above the board.";
      } else if (textLower.includes("accuracy") || textLower.includes("error")) {
        coachReply = "Low accuracy points to premature speed bursts. Slow down your speed by 10 WPM and focus entirely on steady rhythm. The speed will naturally consolidate once accuracy hits 98%.";
      } else if (textLower.includes("focus") || textLower.includes("consistency")) {
        coachReply = "Your Focus Score evaluates how uniform the milliseconds between keys are. Stuttering or taking long pauses between words lowers consistency. Try typing to a steady internal beat.";
      }

      setChatMessages(prev => [...prev, { sender: "coach", text: coachReply }]);
    }, 850);
  };

  const selectCustomPracticeMode = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_mode", "custom");
    }
  };

  // Preset advice answers based on user logs
  const wpmAdvice = useMemo(() => {
    if (weakKeys.length === 0) return "No telemetry logs available. Type some runs on the workbench first!";
    const top3 = weakKeys.slice(0, 3);
    const names = top3.map(w => `'${w.key.toUpperCase()}'`).join(", ");
    return `Your transition delay on ${names} average ${Math.round(top3.reduce((s, k) => s + k.avgLatency, 0) / top3.length)}ms. Try practicing short synthetic syllable triggers like ${top3.map(w => `'e${w.key}'`).join(", ")} to build transition consolidation.`;
  }, [weakKeys]);

  const rhythmAdvice = useMemo(() => {
    if (sessions.length === 0) return "Complete a test first.";
    const latest = sessions[sessions.length - 1];
    const focus = calculateFocusScore(latest);
    if (focus > 90) {
      return "Your cadence rhythm is exceptionally steady! Keep typing with this regular mechanical pacing.";
    }
    return `Your focus score of ${focus}% indicates uneven spacing or stuttering. Avoid speeding through easy words like 'the' or 'and' only to stop at longer words. Type at a constant tempo.`;
  }, [sessions]);

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border-hairline pb-6">
          <BrainCircuit className="w-8 h-8 text-primary animate-pulse" />
          <div>
            <h1 className="text-3xl font-serif text-foreground">AI Coach Workbench</h1>
            <p className="text-sm text-muted">Intelligent tactile diagnostics, custom practice generation, and interactive coaching advice.</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          /* Empty State */
          <div className="w-full bg-card border border-border-hairline rounded-lg p-16 text-center flex flex-col items-center gap-6 shadow-sm">
            <div className="p-4 bg-primary/10 text-primary rounded-full">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif text-foreground">No Telemetry to Coach</h2>
            <p className="text-muted text-sm max-w-sm">
              Your AI coach requires keystroke telemetry logs to analyze finger latency anomalies and generate custom practice sequences.
            </p>
            <Link
              href="/type"
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-md transition-all-smooth"
            >
              Take First Test
            </Link>
          </div>
        ) : (
          /* Coach dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left columns (Diagnostics & Remediation) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Diagnosis Overview */}
              <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-5 shadow-sm">
                <h2 className="text-lg font-serif text-foreground">Keystroke Diagnostic</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slowest Keys */}
                  <div className="bg-background border border-border-hairline p-4 rounded-md">
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Transition Friction</p>
                    <p className="text-xs text-muted leading-relaxed mb-4">{wpmAdvice}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-muted-soft">Focus Keys:</span>
                      {weakKeys.slice(0, 3).map(w => (
                        <span key={w.key} className="px-2 py-0.5 bg-card border border-border-hairline font-mono text-xs font-bold text-primary rounded">
                          {w.key.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Cadence assessment */}
                  <div className="bg-background border border-border-hairline p-4 rounded-md">
                    <p className="text-[10px] font-mono text-muted uppercase tracking-wider mb-2">Rhythm assessment</p>
                    <p className="text-xs text-muted leading-relaxed mb-4">{rhythmAdvice}</p>
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Cadence Target: 90%+ focus</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remediation workout launcher */}
              <div className="bg-card border border-border-hairline rounded-lg p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-serif text-foreground">Remediation workout</h2>
                    <p className="text-xs text-muted">Generate a custom test sequence focusing specifically on letters with high transition hesitation.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary font-mono text-xs rounded-full font-bold">
                    Targeted Training
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 py-2">
                  {weakKeys.slice(0, 5).map(w => (
                    <div key={w.key} className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border-hairline rounded">
                      <span className="w-5 h-5 bg-card border border-border-hairline rounded flex items-center justify-center font-mono font-bold text-primary text-xs shadow-xs">
                        {w.key.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-muted">Hesitation: {Math.round(w.avgLatency)}ms</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/type"
                  onClick={selectCustomPracticeMode}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-md shadow transition-all-smooth cursor-pointer mt-2 w-fit"
                >
                  <span>Launch Workout on Workbench</span>
                  <Play className="w-4 h-4 fill-white" />
                </Link>
              </div>

            </div>

            {/* Right column (Conversational AI coach chatbot) */}
            <div className="bg-card border border-border-hairline rounded-lg flex flex-col h-[520px] shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-4 bg-background border-b border-border-hairline flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="font-serif text-sm font-bold text-foreground">Consult Coach</span>
              </div>

              {/* Messages board */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`max-w-[85%] p-3 rounded-md text-xs leading-relaxed ${
                      msg.sender === "coach"
                        ? "bg-background border border-border-hairline text-foreground self-start"
                        : "bg-primary text-white self-end shadow-xs"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
                {isTyping && (
                  <div className="bg-background border border-border-hairline text-muted p-3 rounded-md text-xs self-start italic flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Coach is reviewing telemetry...</span>
                  </div>
                )}
              </div>

              {/* Preset prompt selectors */}
              {overallStats && (
                <div className="p-2 bg-background/50 border-t border-border-hairline flex flex-wrap gap-1.5">
                  <button
                    onClick={() => askCoachQuestion(
                      "How do I speed up my WPM?",
                      `Your average speed is ${overallStats.avgWpm} WPM. To break past this speed ceiling, you must minimize transition gaps. Try to anticipate the next letter in your mind before clicking. Maintain steady finger position.`
                    )}
                    className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground px-2 py-1 rounded cursor-pointer hover:bg-card-elevated"
                  >
                    Speed Tips
                  </button>
                  <button
                    onClick={() => askCoachQuestion(
                      "Why is my accuracy dropping?",
                      `Your average accuracy is ${overallStats.avgAcc}%. If this falls below 95%, you are typing faster than your cognitive processing speed. Slow down, prioritize typing letters cleanly without backspacing.`
                    )}
                    className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground px-2 py-1 rounded cursor-pointer hover:bg-card-elevated"
                  >
                    Accuracy Tips
                  </button>
                  <button
                    onClick={() => askCoachQuestion(
                      "Analyze my rhythm consistency",
                      "Your focus score metrics indicate latency patterns. Sticking to a fluid rhythm is crucial. Practice typing to a slow constant metronome beat, treating every keystroke intervals identically."
                    )}
                    className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground px-2 py-1 rounded cursor-pointer hover:bg-card-elevated"
                  >
                    Cadence Analysis
                  </button>
                </div>
              )}

              {/* Custom message input form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border-hairline bg-background flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask Coach about your typing..."
                  className="flex-1 bg-card border border-border-hairline rounded px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="p-1.5 bg-primary text-white rounded hover:bg-primary-hover cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
