import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, StopCircle, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PracticeSettingsComponent, PracticeSettings } from "./PracticeSettings";

const detailedFeedback = `Alright, let's review your performance using the sandwich method.

**Strengths:**

* **Professional Introduction:** You began with a clear, concise, and professional introduction, including your name, ID, and the assurance of confidentiality. This is a strong start that builds trust and sets a professional tone.
* **Clarification Requests:** You appropriately requested clarifications when needed, demonstrating your commitment to accuracy and your understanding of the interpreter's role in ensuring clear communication. This proactive approach is commendable.
* **Direct Communication Management:** You effectively managed the communication flow by reminding both parties to speak directly to you, which is essential for accurate interpretation.
* **Courtesy and Professionalism:** Your polite and respectful tone throughout the interaction, using phrases like "please" and "thank you," contributes to a positive communication environment.

**Areas for Improvement with Coaching Plan:**

* **Terminology Precision:** You struggled with the medication names, specifically "Keppra" (levetiracetam). While you attempted to clarify, the repeated mispronunciations and attempts at phonetic spelling could have caused confusion.
    * **Coaching:**
        * **Medical Terminology Review:** Focus on creating a personal glossary of common medication names, paying close attention to pronunciation and spelling. InterpreBot can provide targeted pronunciation practice.
        * **Mock Pharmacy Scenarios:** Practice interpreting mock conversations involving medication names and dosages.

* **Accuracy and Completeness:** There were instances where information was slightly altered or omitted, such as paraphrasing the doctor's questions about the medication dosages instead of interpreting verbatim.
    * **Coaching:**
        * **Consecutive Interpreting Drills:** Practice consecutive interpreting exercises with Interpabot, focusing on accurately conveying each phrase spoken.
        * **Note-Taking Practice:** If allowed in your setting, develop your note-taking skills to aid in retaining and delivering more complete information.

* **Managing Confusion:** You encountered a situation where both parties were confused about the medication type (liquid vs. pill). While you tried to resolve it, the extended back-and-forth could have been managed more efficiently.
    * **Coaching:**
        * **Clarification Strategies:** Practice different clarification techniques, such as summarizing the confusion and asking targeted questions to pinpoint the source of discrepancy.
        * **Cultural Awareness Training:** Be mindful of potential cultural differences in medication administration practices that might contribute to confusion.

**Positive Reinforcement & Encouragement:**

Your overall performance demonstrates a good grasp of interpreting fundamentals. You displayed a professional attitude, managed the flow of communication well, and showed initiative in seeking clarification. By focusing on improving terminology precision, ensuring accuracy and completeness, and refining your strategies for managing confusion, you will enhance your interpreting skills and provide exceptional service to patients and providers. Keep practicing, and you'll continue to grow as a skilled medical interpreter. Your dedication is evident, and your potential is great.`;

export const PracticeMode = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [scenarioType, setScenarioType] = useState("consultation");
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [feedback, setFeedback] = useState("");
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [generatedScenario, setGeneratedScenario] = useState("");
  const [settings, setSettings] = useState<PracticeSettings>({
    difficulty: "intermediate",
    providerAccent: "american",
    voiceEnabled: false,
  });
  const { toast } = useToast();
  const { user, userRole } = useAuth();

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
        title: "Authentication required",
        description: "Please sign in to generate practice scenarios",
        variant: "destructive",
      });
      return;
    }

    if (userRole !== 'premium' && userRole !== 'admin') {
      toast({
        title: "Premium feature",
        description: "Upgrade to premium to access AI-generated practice scenarios",
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
        title: "Scenario generated",
        description: "Your custom practice scenario is ready",
      });
    } catch (error) {
      console.error('Scenario generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate scenario",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    toast({
      title: "Recording started",
      description: "Begin your interpretation practice",
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast({
      title: "Recording stopped",
      description: "Processing your practice session...",
    });
  };

  const submitForEvaluation = async () => {
    if (!transcript.trim()) {
      toast({
        title: "No transcript",
        description: "Please record or type your practice session first",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to get performance evaluation",
        variant: "destructive",
      });
      return;
    }

    if (userRole !== 'premium' && userRole !== 'admin') {
      // Show sample feedback for free users
      setFeedback(detailedFeedback);
      toast({
        title: "Sample feedback",
        description: "Upgrade to premium for personalized AI evaluation",
      });
      return;
    }

    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-performance', {
        body: { 
          transcript, 
          scenarioType, 
          targetLanguage 
        }
      });

      if (error) throw error;

      setFeedback(data.feedback);
      toast({
        title: "Evaluation complete",
        description: `Score: ${data.score}/100`,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation failed",
        description: error instanceof Error ? error.message : "Failed to evaluate performance",
        variant: "destructive",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div>
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

          <div className="mt-6">
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
                  Generate AI Practice Scenario
                </>
              )}
            </Button>
          </div>

          {generatedScenario && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2 text-foreground">Practice Scenario</h3>
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm">{generatedScenario}</pre>
              </div>
            </Card>
          )}

          <div className="mt-6">
            <label className="text-sm font-medium mb-2 block">Practice Transcript</label>
            <Textarea
              placeholder="Type or record your interpretation practice here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px]"
            />
          </div>

          <div className="flex flex-wrap gap-4 mt-6">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              className="flex-1 md:flex-none"
            >
              {isRecording ? (
                <>
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Recording
                </>
              )}
            </Button>

            <Button
              onClick={submitForEvaluation}
              disabled={!transcript.trim() || isEvaluating}
              className="flex-1 md:flex-none bg-primary hover:bg-primary/90"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit for Evaluation
                </>
              )}
            </Button>
          </div>

          {feedback && (
            <Card className="mt-6 p-6 bg-card border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Performance Feedback</h3>
              <div className="prose prose-sm max-w-none text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{feedback}</pre>
              </div>
            </Card>
          )}

          <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-primary">Premium Features:</strong> AI-generated custom scenarios with adjustable difficulty and provider accents, voice recording with real-time AI role-play (doctor and patient), and detailed performance feedback based on IMIA, CCHI, NBCMI, NCIHC, CLAS standards, and CHIA guidelines.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
