import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, CheckCircle, XCircle, AlertCircle, Sparkles, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const PracticeMode = () => {
  const [scenarioType, setScenarioType] = useState('medical-consultation');
  const [targetLanguage, setTargetLanguage] = useState('spanish');
  const [transcript, setTranscript] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { userRole } = useAuth();
  const { toast } = useToast();

  const isPremium = userRole === 'premium' || userRole === 'admin';

  const scenarios = [
    { value: 'medical-consultation', label: 'Medical Consultation' },
    { value: 'emergency-room', label: 'Emergency Room' },
    { value: 'mental-health', label: 'Mental Health Session' },
    { value: 'informed-consent', label: 'Informed Consent' },
    { value: 'discharge-instructions', label: 'Discharge Instructions' },
  ];

  const evaluateSession = async () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Premium to access practice mode with AI feedback",
        variant: "destructive",
      });
      return;
    }

    if (!transcript.trim()) {
      toast({
        title: "No transcript",
        description: "Please provide a transcript to evaluate",
        variant: "destructive",
      });
      return;
    }

    setEvaluating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('evaluate-performance', {
        body: {
          transcript,
          scenarioType,
          targetLanguage,
        },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Evaluation complete",
        description: `Score: ${data.score}/100`,
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      toast({
        title: "Evaluation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Practice Mode
            {!isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
          </h2>
          <p className="text-muted-foreground">Simulate real scenarios and get AI-powered feedback</p>
        </div>
        {!isPremium && (
          <Badge variant="secondary" className="bg-gradient-premium">
            Premium Feature
          </Badge>
        )}
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scenario Type</label>
              <Select value={scenarioType} onValueChange={setScenarioType}>
                <SelectTrigger>
                  <SelectValue />
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
              <label className="block text-sm font-medium mb-2">Target Language</label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="mandarin">Mandarin</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="russian">Russian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Session Transcript or Notes
            </label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Enter your interpretation session transcript here. Include both English and target language content, noting any challenges or decisions you made during the interpretation..."
              rows={10}
              className="font-mono text-sm"
              disabled={!isPremium}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={evaluateSession}
              disabled={evaluating || !isPremium}
              className="flex-1"
            >
              {evaluating ? (
                <>Evaluating...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Feedback
                </>
              )}
            </Button>
            {!isPremium && (
              <Button variant="outline" className="bg-gradient-premium border-none">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>
      </Card>

      {result && (
        <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            Performance Evaluation
            <div className={`ml-auto text-3xl font-bold ${
              result.score >= 80 ? 'text-green-500' : 
              result.score >= 60 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {result.score}/100
            </div>
          </h3>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-foreground">{result.feedback}</div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setResult(null)}>
              Start New Session
            </Button>
          </div>
        </Card>
      )}

      {!isPremium && (
        <Card className="p-6 bg-gradient-premium border-none text-white">
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Unlock Premium Features
          </h3>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              AI-powered role-play scenarios
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Personalized glossary with translations
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Performance tracking and analytics
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Detailed ethics feedback
            </li>
          </ul>
          <Button className="bg-white text-primary hover:bg-white/90">
            Upgrade Now
          </Button>
        </Card>
      )}
    </div>
  );
};