"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, BrainCircuit, Play, MessageSquare, Send, RotateCw, AlertCircle, BarChart3, Target, Zap, Trophy, TrendingUp } from "lucide-react";
import { 
  getSavedSessions, 
  TypingSession, 
  analyzeWeakKeys, 
  WeakKeyAnalysis, 
  calculateFocusScore, 
  analyzeBigrams, 
  BigramAnalysis, 
  identifyMistakePatterns, 
  MistakePattern,
  predictGrowthTrend,
  GrowthPrediction
} from "@/utils/aiEngine";
import Link from "next/link";

interface Message {
  sender: "coach" | "user";
  text: string;
}

export default function AICoachPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [weakKeys, setWeakKeys] = useState<WeakKeyAnalysis[]>([]);
  const [bigrams, setBigrams] = useState<BigramAnalysis[]>([]);
  const [patterns, setPatterns] = useState<MistakePattern[]>([]);
  const [prediction, setPrediction] = useState<GrowthPrediction | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const data = getSavedSessions();
    setSessions(data);
    const analysis = analyzeWeakKeys(data);
    setWeakKeys(analysis);
    setBigrams(analyzeBigrams(data));
    setPatterns(identifyMistakePatterns(data));
    setPrediction(predictGrowthTrend(data));

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
    
    // Calculate Rank
    let rank = "Novice";
    if (avgWpm > 100) rank = "Grandmaster";
    else if (avgWpm > 80) rank = "Master";
    else if (avgWpm > 60) rank = "Expert";
    else if (avgWpm > 40) rank = "Adept";
    
    return { avgWpm, avgAcc, rank };
  }, [sessions]);

  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

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
        coachReply = "To increase WPM, you must decrease key transition hesitation. Focus on keeping your fingers closer to the home row keys rather than hovering high above the board. Practice high-frequency bigrams like 'th', 'er', and 'on'.";
      } else if (textLower.includes("accuracy") || textLower.includes("error")) {
        coachReply = "Low accuracy points to premature speed bursts. Slow down your speed by 10 WPM and focus entirely on steady rhythm. The speed will naturally consolidate once accuracy hits 98%. Stop backspacing and focus on hitting the right key the first time.";
      } else if (textLower.includes("focus") || textLower.includes("consistency")) {
        coachReply = "Your Focus Score evaluates how uniform the milliseconds between keys are. Stuttering or taking long pauses between words lowers consistency. Try typing to a steady internal beat, like a metronome.";
      } else if (textLower.includes("mistake") || textLower.includes("pattern")) {
        const topPattern = patterns[0];
        coachReply = topPattern 
          ? `I've noticed a pattern of ${topPattern.description}. You've done this ${topPattern.count} times recently. Focus on ${topPattern.type === "transposition" ? "slowing down during complex letter sequences" : "being more deliberate with your keystrokes"}.`
          : "I haven't detected any major mistake patterns yet. Keep typing to provide more data!";
      }

      setChatMessages(prev => [...prev, { sender: "coach", text: coachReply }]);
    }, 850);
  };

  const selectCustomPracticeMode = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("justtype_config_mode", "custom");
    }
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border-hairline pb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BrainCircuit className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl font-serif text-foreground tracking-tight">AI Coach Workbench</h1>
              <p className="text-sm text-muted">Deep tactile diagnostics and intelligent remediation strategies.</p>
            </div>
          </div>
          
          {overallStats && (
            <div className="flex items-center gap-4 bg-card border border-border-hairline p-4 rounded-xl shadow-sm">
              <div className="text-right">
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest">Training Rank</p>
                <p className="text-xl font-serif text-primary font-bold">{overallStats.rank}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          /* Empty State */
          <div className="w-full bg-card border border-border-hairline rounded-lg p-20 text-center flex flex-col items-center gap-6 shadow-sm">
            <div className="p-5 bg-primary/10 text-primary rounded-full">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-serif text-foreground">Awaiting Telemetry Data</h2>
            <p className="text-muted text-sm max-w-md leading-relaxed">
              Your AI coach requires keystroke telemetry logs to analyze finger latency anomalies and generate custom practice sequences. Take a test to begin your training.
            </p>
            <Link
              href="/type"
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg transition-all-smooth shadow-lg shadow-primary/20"
            >
              Initiate Training
            </Link>
          </div>
        ) : (
          /* Coach dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left columns (Diagnostics & Remediation) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* Latest Session Analysis */}
              {latestSession && (
                <div className="bg-card border border-border-hairline rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-serif text-foreground">Latest Session Deep Dive</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-muted uppercase">Speed</span>
                      <span className="text-2xl font-serif text-foreground">{latestSession.wpm} <span className="text-xs text-muted">WPM</span></span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-muted uppercase">Accuracy</span>
                      <span className="text-2xl font-serif text-foreground">{latestSession.accuracy}%</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-muted uppercase">Consistency</span>
                      <span className="text-2xl font-serif text-foreground">{calculateFocusScore(latestSession)}%</span>
                    </div>
                  </div>

                  <div className="mt-8 p-4 bg-background border border-border-hairline rounded-lg">
                    <div className="flex items-start gap-3">
                      <Zap className="w-4 h-4 text-primary mt-1" />
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">Coach&apos;s Direct Feedback</p>
                        <p className="text-xs text-muted leading-relaxed">
                          {latestSession.wpm > (overallStats?.avgWpm || 0) 
                            ? "Excellent! You surpassed your average speed in this run. Focus on maintaining this pace while keeping accuracy above 97%." 
                            : "This run was slightly slower than your average. This is often a good time to focus purely on accuracy and rhythmic consistency."}
                          {" "}
                          {latestSession.accuracy < 95 && "Your accuracy dropped below the target threshold. Slow down and ensure your fingers are returning to the home row."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mistake Patterns & Bigrams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Patterns */}
                <div className="bg-card border border-border-hairline rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-serif text-foreground">Mistake Patterns</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {patterns.length > 0 ? patterns.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-background border border-border-hairline p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-foreground capitalize">{p.type.replace("_", " ")}</span>
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{p.count} instances</span>
                        </div>
                        <p className="text-[11px] text-muted mb-2">{p.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {p.examples.map((ex, j) => (
                            <span key={j} className="text-[9px] font-mono bg-card px-1.5 py-0.5 border border-border-hairline rounded text-muted-soft">{ex}</span>
                          ))}
                        </div>
                      </div>
                    )) : (
                      <p className="text-xs text-muted italic">No clear mistake patterns detected yet. Keep practicing!</p>
                    )}
                  </div>
                </div>

                {/* Bigrams */}
                <div className="bg-card border border-border-hairline rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-serif text-foreground">Transition Friction</h2>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    {bigrams.slice(0, 5).map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-background border border-border-hairline rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 flex items-center justify-center bg-card border border-border-hairline rounded font-mono font-bold text-primary text-sm shadow-sm">
                            {b.bigram.toUpperCase()}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-muted uppercase">Latency</span>
                            <span className="text-xs font-bold text-foreground">{Math.round(b.avgLatency)}ms</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-16 bg-muted/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${Math.min(100, (b.avgLatency / 400) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {bigrams.length === 0 && (
                      <p className="text-xs text-muted italic">Analyze transitions by completing more runs.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remediation workout launcher */}
              <div className="bg-card border border-border-hairline rounded-xl p-8 flex flex-col gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Zap className="w-32 h-32 text-primary" />
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-serif text-foreground">Adaptive Training Protocol</h2>
                    <p className="text-sm text-muted max-w-md mt-1">I&apos;ve designed a specialized workout targeting your specific weak points and slow transitions.</p>
                  </div>
                  <span className="px-3 py-1 bg-primary text-white font-mono text-[10px] rounded-full font-bold uppercase tracking-wider shadow-sm">
                    Recommended
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {weakKeys.slice(0, 6).map(w => (
                    <div key={w.key} className="flex flex-col items-center gap-1 p-3 bg-background border border-border-hairline rounded-xl min-w-[80px]">
                      <span className="text-xl font-mono font-bold text-primary">
                        {w.key.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-muted uppercase tracking-tighter">
                        {Math.round(w.avgLatency)}ms delay
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/type"
                  onClick={selectCustomPracticeMode}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-xl shadow-primary/20 transition-all-smooth cursor-pointer mt-2 w-fit group"
                >
                  <span>Launch Custom Remediation</span>
                  <Play className="w-4 h-4 fill-white group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Growth Projection */}
              {prediction && prediction.slope > 0 && (
                <div className="bg-card border border-border-hairline rounded-xl p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-serif text-foreground">Growth Projection</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex flex-col p-4 bg-background border border-border-hairline rounded-lg">
                      <span className="text-[10px] font-mono text-muted uppercase">Current Avg</span>
                      <span className="text-xl font-serif text-foreground">{prediction.currentAverage} WPM</span>
                    </div>
                    <div className="flex flex-col p-4 bg-background border border-border-hairline rounded-lg">
                      <span className="text-[10px] font-mono text-muted uppercase">+10 Sessions</span>
                      <span className="text-xl font-serif text-primary">~{prediction.predictedWPM10} WPM</span>
                    </div>
                    <div className="flex flex-col p-4 bg-background border border-border-hairline rounded-lg">
                      <span className="text-[10px] font-mono text-muted uppercase">+30 Sessions</span>
                      <span className="text-xl font-serif text-primary">~{prediction.predictedWPM30} WPM</span>
                    </div>
                    <div className="flex flex-col p-4 bg-background border border-border-hairline rounded-lg">
                      <span className="text-[10px] font-mono text-muted uppercase">+60 Sessions</span>
                      <span className="text-xl font-serif text-primary">~{prediction.predictedWPM60} WPM</span>
                    </div>
                  </div>
                  
                  <p className="mt-6 text-xs text-muted leading-relaxed">
                    Based on your current trajectory of <span className="text-foreground font-bold">{prediction.slope} WPM/session</span>, you are on track to significantly increase your speed. Consistency is key to reaching these targets.
                  </p>
                </div>
              )}

            </div>

            {/* Right column (Conversational AI coach chatbot) */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-card border border-border-hairline rounded-xl flex flex-col h-[600px] shadow-sm overflow-hidden sticky top-8">
                {/* Header */}
                <div className="p-5 bg-background border-b border-border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span className="font-serif text-sm font-bold text-foreground">Tactile Analysis AI</span>
                  </div>
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>

                {/* Messages board */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                        msg.sender === "coach"
                          ? "bg-background border border-border-hairline text-foreground self-start rounded-tl-none"
                          : "bg-primary text-white self-end rounded-tr-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="bg-background border border-border-hairline text-muted p-4 rounded-2xl rounded-tl-none text-xs self-start italic flex items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin text-primary" />
                      <span>Coach is reviewing telemetry...</span>
                    </div>
                  )}
                </div>

                {/* Preset prompt selectors */}
                {overallStats && (
                  <div className="p-3 bg-background/50 border-t border-border-hairline flex flex-wrap gap-2">
                    <button
                      onClick={() => askCoachQuestion(
                        "How do I speed up my WPM?",
                        `Your average speed is ${overallStats.avgWpm} WPM. To break past this speed ceiling, you must minimize transition gaps. Try to anticipate the next letter in your mind before clicking. Focus on high-frequency bigrams like 'th', 'er', and 'on'.`
                      )}
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Speed Tips
                    </button>
                    <button
                      onClick={() => askCoachQuestion(
                        "Why is my accuracy dropping?",
                        `Your average accuracy is ${overallStats.avgAcc}%. If this falls below 95%, you are typing faster than your cognitive processing speed. Slow down, prioritize typing letters cleanly without backspacing.`
                      )}
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Accuracy Tips
                    </button>
                    <button
                      onClick={() => askCoachQuestion(
                        "Analyze my mistake patterns",
                        patterns.length > 0 
                          ? `I've detected ${patterns.length} distinct mistake patterns in your telemetry. The most common is '${patterns[0].description}'. This suggests you should focus more on ${patterns[0].type === "transposition" ? "letter sequence precision" : "deliberate keystrokes"}.`
                          : "I haven't detected significant mistake patterns yet. Keep typing to provide more telemetry!"
                      )}
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Mistake Patterns
                    </button>
                  </div>
                )}

                {/* Custom message input form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border-hairline bg-background flex gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Coach about your typing..."
                    className="flex-1 bg-card border border-border-hairline rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
