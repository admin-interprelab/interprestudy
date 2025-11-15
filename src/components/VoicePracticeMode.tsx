import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, StopCircle, Loader2, Mic, Volume2, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PracticeSettingsComponent, PracticeSettings } from "./PracticeSettings";
import { sanitizeAIContent } from "@/lib/sanitize";

const sampleFeedbackPreview = `Alright, let's review your performance using the sandwich method.

**Strengths:**

* **Professional Introduction:** You began with a clear, concise, and professional introduction...
* **Clarification Requests:** You appropriately requested clarifications when needed...
* **Direct Communication Management:** You effectively managed the communication flow...

**Areas for Improvement with Coaching Plan:**

* **Terminology Precision:** You struggled with the medication names...`;

export const VoicePracticeMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [scenarioType, setScenarioType] = useState("consultation");
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [settings, setSettings] = useState<PracticeSettings>({
    difficulty: "intermediate",
    providerAccent: "american",
    voiceEnabled: true,
  });
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const isPremium = userRole === 'premium' || userRole === 'admin';

  const scenarios = [
    { value: "consultation", label: "Medical Consultation" },
    { value: "emergency", label: "Emergency Room" },
    { value: "pharmacy", label: "Pharmacy Visit" },
    { value: "mental-health", label: "Mental Health Session" },
    { value: "discharge", label: "Hospital Discharge" },
    { value: "informed-consent", label: "Informed Consent" },
  ];

  const languages = [
    { value: "spanish", label: "Spanish" },
    { value: "mandarin", label: "Mandarin" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "russian", label: "Russian" },
  ];

  const generateScenario = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate practice scenarios",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    if (!isPremium) {
      toast({
        title: "Premium feature",
        description: "Upgrade to premium to access AI-generated voice practice",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScenario(true);
    try {
      const { data, error } = await supabase.functions.invoke('practice-scenario', {
        body: { 
          scenarioType, 
          targetLanguage,
          difficulty: settings.difficulty,
          providerAccent: settings.providerAccent,
        }
      });

      if (error) throw error;
      
      setGeneratedScenario(data.scenario);
      toast({
        title: "Scenario ready",
        description: "Click Start to begin voice practice",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Scenario generation error:', error);
      }
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate scenario",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const startPractice = () => {
    if (!generatedScenario) {
      toast({
        title: "No scenario",
        description: "Generate a scenario first",
        variant: "destructive",
      });
      return;
    }

    setIsActive(true);
    setShowTranscript(false);
    // Simulate audio level changes
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 100);
    }, 100);

    toast({
      title: "Practice started",
      description: "Speak naturally. Transcript will be shown after you stop.",
    });

    return () => clearInterval(interval);
  };

  const stopPractice = () => {
    setIsActive(false);
    setAudioLevel(0);
    setShowTranscript(true);
    // Mock transcript for demo
    setTranscript("This is where your practice transcript would appear...");
    toast({
      title: "Practice ended",
      description: "Review your performance below",
    });
  };

  return (
    <div className="space-y-6">
      <PracticeSettingsComponent 
        onSettingsChange={setSettings} 
        currentSettings={settings}
      />

      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Scenario Type</label>
              <Select value={scenarioType} onValueChange={setScenarioType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateScenario}
            disabled={isGeneratingScenario}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isGeneratingScenario ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Scenario...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Generate Voice Practice Scenario
              </>
            )}
          </Button>

          {generatedScenario && !isActive && !showTranscript && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2 text-foreground">Scenario Ready</h3>
              <p className="text-sm text-muted-foreground mb-4">Click Start to begin live voice practice</p>
            </Card>
          )}

          {/* Voice Practice Interface */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="flex flex-col items-center justify-center space-y-8">
              {/* Audio Visualizer */}
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div 
                  className={`absolute inset-0 rounded-full border-4 transition-all duration-100 ${
                    isActive ? 'border-primary' : 'border-muted'
                  }`}
                  style={{
                    transform: `scale(${1 + (audioLevel / 200)})`,
                    opacity: 0.6,
                  }}
                />
                <div 
                  className={`absolute inset-4 rounded-full border-4 transition-all duration-100 ${
                    isActive ? 'border-primary' : 'border-muted'
                  }`}
                  style={{
                    transform: `scale(${1 + (audioLevel / 150)})`,
                    opacity: 0.4,
                  }}
                />
                <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-primary animate-pulse' : 'bg-muted'
                }`}>
                  {isActive ? (
                    <Volume2 className="w-16 h-16 text-primary-foreground" />
                  ) : (
                    <Mic className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Status Text */}
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">
                  {isActive ? "Listening..." : "Ready to Practice"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive ? "Speak naturally and interpret in real-time" : "Click Start to begin"}
                </p>
              </div>

              {/* Control Button */}
              <Button
                onClick={isActive ? stopPractice : startPractice}
                disabled={!generatedScenario && !isActive}
                variant={isActive ? "destructive" : "default"}
                size="lg"
                className="w-48"
              >
                {isActive ? (
                  <>
                    <StopCircle className="w-5 h-5 mr-2" />
                    Stop Practice
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Transcript (shown after practice ends) */}
          {showTranscript && transcript && (
            <Card className="p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Practice Transcript</h3>
              <div className="prose prose-sm max-w-none text-foreground mb-6">
                <pre 
                  className="whitespace-pre-wrap font-sans text-sm"
                  dangerouslySetInnerHTML={{ __html: sanitizeAIContent(transcript) }}
                />
              </div>

              {/* Feedback Preview with Fade */}
              <div className="relative">
                <div className="bg-gradient-to-b from-card to-transparent pb-32 overflow-hidden">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Analysis</h3>
                  <div className="prose prose-sm max-w-none text-foreground">
                    <pre 
                      className="whitespace-pre-wrap font-sans text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeAIContent(sampleFeedbackPreview) }}
                    />
                  </div>
                </div>
                
                {/* Fade Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card pointer-events-none" />
                
                {/* CTA Button */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center p-8 bg-gradient-to-t from-card via-card/95 to-transparent">
                  <Button size="lg" className="mb-4">
                    <Crown className="w-5 h-5 mr-2" />
                    Upgrade to Premium for Full Report
                  </Button>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    Get comprehensive AI analysis with detailed coaching plans based on IMIA, NBCMI, and professional standards
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">Premium Voice Practice:</strong> Live AI role-play with realistic provider and patient voices, adjustable accents and difficulty, automatic transcription, and comprehensive performance feedback based on professional interpreting standards.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};