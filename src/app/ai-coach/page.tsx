"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Sparkles, 
  BrainCircuit, 
  Play, 
  MessageSquare, 
  Send, 
  RotateCw, 
  AlertCircle, 
  Target, 
  Trophy, 
  CheckCircle,
  Activity
} from "lucide-react";
import { 
  getSavedSessions, 
  TypingSession, 
  calculateFocusScore, 
  analyzeBigrams, 
  BigramAnalysis, 
  identifyMistakePatterns, 
  MistakePattern,
  getAILearnerProfile,
  getTutorReport,
  setActiveWorkout,
  AILearnerProfile,
  TutorReport
} from "@/utils/aiEngine";
import Link from "next/link";

interface Message {
  sender: "coach" | "user";
  text: string;
}

const WORKOUT_DETAILS = [
  { id: "all_rounder", name: "AI All-Rounder Workout", description: "Balanced mix of weak keys, alternating hand flow, and double letters." },
  { id: "weak_keys", name: "Weak-Key Remediation", description: "Targets the characters with your lowest mastery scores to clean up typos." },
  { id: "bigrams", name: "Slow Transitions Drill", description: "Practices double-character letter pairs where you experience typing hesitation." },
  { id: "left_hand", name: "Left-Hand Heavy Drill", description: "Addresses hand speed/error imbalance by focusing on keys controlled by the left hand." },
  { id: "right_hand", name: "Right-Hand Heavy Drill", description: "Addresses hand speed/error imbalance by focusing on keys controlled by the right hand." },
  { id: "rhythm_steady", name: "Steady Rhythm Workout", description: "Alternating hand flow vocabulary designed to cultivate an even, steady typing cadence." },
  { id: "double_letters", name: "Double-Letter Precision", description: "Focuses on double letter words to eliminate skipped letter or duplication errors." },
  { id: "speed_booster", name: "Speed Burst Booster", description: "Practices easy, short, common vocabulary to increase raw speed and confidence." },
];

export default function AICoachPage() {
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [bigrams, setBigrams] = useState<BigramAnalysis[]>([]);
  const [patterns, setPatterns] = useState<MistakePattern[]>([]);
  const [profile, setProfile] = useState<AILearnerProfile | null>(null);
  const [tutorReport, setTutorReport] = useState<TutorReport | null>(null);
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const data = getSavedSessions();
    const prof = getAILearnerProfile();
    const report = getTutorReport(data);
    const bigs = analyzeBigrams(data);
    const pats = identifyMistakePatterns(data);

    setSessions(data);
    setProfile(prof);
    setTutorReport(report);
    setBigrams(bigs);
    setPatterns(pats);

    // Initial coach greetings
    if (data.length === 0) {
      setChatMessages([
        {
          sender: "coach",
          text: "Greetings! I am your Tactile Coach. To begin, please complete a few typing tests on the Workbench. Once I have some telemetry logs, I'll compile a custom key-latency diagnosis and design remediation drills for you!",
        },
      ]);
    } else {
      const topWeak = report.weakestKeys.map(w => w.key.toUpperCase()).join(", ");
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

  // Handle preset questions
  const askCoachQuestion = (question: string, answerText: string) => {
    setChatMessages(prev => [...prev, { sender: "user", text: question }]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { sender: "coach", text: answerText }]);
    }, 700);
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
      let coachReply = "I understand. Standard finger muscle memory requires repeating slow sequences. Try selecting one of the specialized workouts in the drill panel on the left to train targeted muscle pathways.";
      
      const textLower = userText.toLowerCase();
      if (textLower.includes("wpm") || textLower.includes("speed")) {
        coachReply = `Your average speed is ${overallStats?.avgWpm || 30} WPM. Your cognitive sweet spot is ${tutorReport?.cognitiveSweetSpotWPM || 40} WPM. To increase WPM, you must decrease key transition hesitation. Focus on keeping your fingers closer to the home row keys rather than hovering high above the board. Practice high-frequency bigrams like 'th', 'er', and 'on'.`;
      } else if (textLower.includes("accuracy") || textLower.includes("error")) {
        coachReply = `Your average accuracy is ${overallStats?.avgAcc || 95}%. If this falls below 97%, slow down by 10 WPM and aim for perfect typing. Try running a 'Weak-Key Workout' to fix keys like [${tutorReport?.weakestKeys.slice(0, 3).map(k => k.key.toUpperCase()).join(", ") || "none"}].`;
      } else if (textLower.includes("focus") || textLower.includes("consistency") || textLower.includes("rhythm")) {
        coachReply = "Your Focus Score evaluates how uniform the milliseconds between keys are. Stuttering or taking long pauses between words lowers consistency. Try typing to a steady internal beat, like a metronome, to build fluid transitions.";
      } else if (textLower.includes("mistake") || textLower.includes("pattern")) {
        const topPattern = patterns[0];
        coachReply = topPattern 
          ? `I've noticed a pattern of ${topPattern.description}. You've done this ${topPattern.count} times recently. Focus on ${topPattern.type === "transposition" ? "slowing down during complex letter sequences" : "being more deliberate with your keystrokes"}.`
          : "I haven't detected any major mistake patterns yet. Keep typing to provide more data!";
      } else if (textLower.includes("workout") || textLower.includes("drill") || textLower.includes("practice")) {
        const activeName = WORKOUT_DETAILS.find(w => w.id === profile?.activeWorkout)?.name || "All-Rounder";
        coachReply = `Your currently active drill is the '${activeName}'. Your tutor suggests standard '${tutorReport?.recommendedWorkout.replace("_", " ")}' workout. You can toggle this in the drill panel on the left.`;
      }

      setChatMessages(prev => [...prev, { sender: "coach", text: coachReply }]);
    }, 750);
  };

  const selectWorkout = (workoutId: string) => {
    setActiveWorkout(workoutId);
    setProfile(prev => prev ? { ...prev, activeWorkout: workoutId } : null);
    
    const workoutName = WORKOUT_DETAILS.find(w => w.id === workoutId)?.name || "Balanced Drill";
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: "coach",
          text: `I've set your active workout to the [${workoutName}]. This will customize the Workbench generation algorithm. Click 'Initiate Core Workout' to begin the drill sequence!`
        }
      ]);
    }, 400);
  };

  return (
    <div className="flex-1 w-full bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1300px] mx-auto flex flex-col gap-10">
        
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left columns (Diagnostics & Remediation) - lg:col-span-7 */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              
              {/* Tutor Analytics Profile row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border-hairline rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
                  <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Cognitive Sweet Spot</span>
                  <div>
                    <p className="text-2xl font-mono font-bold text-primary">{tutorReport?.cognitiveSweetSpotWPM || "--"}</p>
                    <p className="text-[10px] text-muted leading-tight">Optimal speed for &gt;96% acc</p>
                  </div>
                </div>

                <div className="bg-card border border-border-hairline rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
                  <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Learning Velocity</span>
                  <div>
                    <p className="text-2xl font-mono font-bold text-foreground">
                      {tutorReport && tutorReport.learningVelocity > 0 ? "+" : ""}
                      {tutorReport?.learningVelocity ?? "--"}
                    </p>
                    <p className="text-[10px] text-muted leading-tight">WPM delta over recent tests</p>
                  </div>
                </div>

                <div className="bg-card border border-border-hairline rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
                  <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Hand Imbalance</span>
                  <div>
                    <p className="text-sm font-mono font-bold text-foreground capitalize">
                      {profile?.handImbalance.balanceStatus === "balanced" && "Balanced Flow"}
                      {profile?.handImbalance.balanceStatus === "left_weak" && "Left Side Delay"}
                      {profile?.handImbalance.balanceStatus === "right_weak" && "Right Side Delay"}
                      {!profile && "--"}
                    </p>
                    <p className="text-[9px] text-muted-soft font-mono mt-1">
                      L: {profile?.handImbalance.leftLatency}ms | R: {profile?.handImbalance.rightLatency}ms
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border-hairline rounded-xl p-4 shadow-sm flex flex-col justify-between h-28">
                  <span className="text-[9px] font-mono text-muted uppercase tracking-wider">Tutor Grade</span>
                  <div>
                    <p className="text-lg font-serif font-bold text-primary truncate" title={tutorReport?.masteryRank}>
                      {tutorReport?.masteryRank || "--"}
                    </p>
                    <p className="text-[10px] text-muted leading-tight">Based on speed & errors</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Tutor Recommendations HUD */}
              <div className="bg-card border border-border-hairline rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <Activity className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-serif text-foreground">Tutor Insights & Recommendations</h2>
                </div>

                <div className="flex flex-col gap-4">
                  {tutorReport?.criticalRecommendations.map((rec) => (
                    <div 
                      key={rec.id} 
                      className={`border p-4 rounded-xl flex gap-4 transition-all ${
                        rec.priority === "high" 
                          ? "bg-error/5 border-error/20" 
                          : rec.priority === "medium" 
                            ? "bg-accent-amber/5 border-accent-amber/20" 
                            : "bg-background border-border-hairline"
                      }`}
                    >
                      <div className="mt-0.5">
                        <AlertCircle className={`w-5 h-5 ${
                          rec.priority === "high" 
                            ? "text-error" 
                            : rec.priority === "medium" 
                              ? "text-accent-amber" 
                              : "text-primary"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            rec.priority === "high" 
                              ? "bg-error/15 text-error" 
                              : rec.priority === "medium" 
                                ? "bg-accent-amber/15 text-accent-amber" 
                                : "bg-primary/10 text-primary"
                          }`}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed mb-2">{rec.description}</p>
                        <div className="text-xs bg-card/60 p-2.5 rounded border border-border-hairline font-mono text-foreground">
                          <span className="text-primary font-bold uppercase tracking-wider text-[9px] block mb-0.5">Action Plan:</span>
                          {rec.actionPlan}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specialized Training Drills Selector */}
              <div className="bg-card border border-border-hairline rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5 border-b border-border-hairline pb-4">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <h2 className="text-xl font-serif text-foreground">Specialized Training Drills</h2>
                      <p className="text-xs text-muted mt-0.5">Choose a focused exercise to adjust workbench generation.</p>
                    </div>
                  </div>
                  <Link
                    href="/type"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-md transition-all-smooth"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("justtype_config_mode", "zen");
                      }
                    }}
                  >
                    <span>Launch Drill</span>
                    <Play className="w-3 h-3 fill-white" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {WORKOUT_DETAILS.map((drill) => {
                    const isActive = profile?.activeWorkout === drill.id;
                    const isRecommended = tutorReport?.recommendedWorkout === drill.id;
                    return (
                      <button
                        key={drill.id}
                        onClick={() => selectWorkout(drill.id)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                          isActive 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-background border-border-hairline hover:border-primary/40"
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-accent-teal/15 text-accent-teal font-mono text-[8px] rounded uppercase font-bold tracking-wider">
                            Tutor Recommended
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isActive ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-border-hairline" />
                            )}
                            <span className="text-xs font-bold text-foreground">{drill.name}</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed pl-6">{drill.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weak Keys & Mistake breakdown columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mistake Patterns */}
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

                {/* Transition Friction */}
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

            </div>
            
            {/* Right column (Conversational AI coach chatbot) - lg:col-span-5 */}
            <div className="lg:col-span-5 flex flex-col gap-8 sticky top-8">
              
              {/* Chat container */}
              <div className="bg-card border border-border-hairline rounded-xl flex flex-col h-[680px] shadow-sm overflow-hidden">
                
                {/* Header */}
                <div className="p-5 bg-background border-b border-border-hairline flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
                    <div>
                      <span className="font-serif text-sm font-bold text-foreground block">Tactile Analysis AI</span>
                      <span className="text-[10px] text-muted block">Rolling Cognitive Diagnosis</span>
                    </div>
                  </div>
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>

                {/* Messages board */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
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
                        `Your average speed is ${overallStats.avgWpm} WPM. Your cognitive sweet spot is ${tutorReport?.cognitiveSweetSpotWPM || 40} WPM. To break past this speed ceiling, you must minimize transition gaps. Try to anticipate the next letter in your mind before clicking. Focus on high-frequency bigrams like 'th', 'er', and 'on'.`
                      )}
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Speed Tips
                    </button>
                    <button
                      onClick={() => askCoachQuestion(
                        "Why is my accuracy dropping?",
                        `Your average accuracy is ${overallStats.avgAcc}%. If this falls below 95%, you are typing faster than your cognitive processing speed. Slow down, prioritize typing letters cleanly without backspacing.`
                      )}
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-3 py-2 rounded-lg cursor-pointer transition-colors"
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
                      className="text-[10px] font-mono bg-card border border-border-hairline text-muted hover:text-foreground hover:border-primary px-3 py-2 rounded-lg cursor-pointer transition-colors"
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
                    className="flex-1 bg-card border border-border-hairline rounded-lg px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="submit"
                    className="p-3 bg-primary text-white rounded-lg hover:bg-primary-hover cursor-pointer shadow-md shadow-primary/10 transition-all active:scale-95 flex items-center justify-center"
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
