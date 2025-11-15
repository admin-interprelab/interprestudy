import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Volume2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AddTermDialog } from "./AddTermDialog";
import { sanitizeAIContent } from "@/lib/sanitize";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  phonetic?: string;
}

// Medical terminology - frequently referenced by users
const sampleTerms: GlossaryTerm[] = [
  {
    term: "Hypertension",
    definition: "High blood pressure; a condition where the force of blood against artery walls is consistently too high, requiring medical management.",
    category: "Medical",
    phonetic: "hahy-per-ten-shuhn",
  },
  {
    term: "Anticoagulant",
    definition: "A medication that prevents blood clot formation; commonly called blood thinners. Examples include warfarin and heparin.",
    category: "Medical",
    phonetic: "an-tee-koh-ag-yuh-luhnt",
  },
  {
    term: "Diabetes Mellitus",
    definition: "A metabolic disorder characterized by high blood sugar levels due to insufficient insulin production or insulin resistance.",
    category: "Medical",
    phonetic: "dahy-uh-bee-teez mel-i-tuhs",
  },
  {
    term: "Myocardial Infarction",
    definition: "Heart attack; occurs when blood flow to part of the heart muscle is blocked, causing tissue damage or death.",
    category: "Medical",
    phonetic: "mahy-uh-kahr-dee-uhl in-fahrk-shuhn",
  },
  {
    term: "Chronic Obstructive Pulmonary Disease",
    definition: "COPD; a progressive lung disease that makes breathing difficult, often caused by smoking or long-term exposure to irritants.",
    category: "Medical",
    phonetic: "kron-ik uhb-struhk-tiv puhl-muh-ner-ee dih-zeez",
  },
  {
    term: "Anaphylaxis",
    definition: "A severe, potentially life-threatening allergic reaction requiring immediate emergency treatment with epinephrine.",
    category: "Medical",
    phonetic: "an-uh-fuh-lak-sis",
  },
  {
    term: "Informed Consent",
    definition: "A patient's voluntary agreement to a medical procedure after being fully informed of risks, benefits, and alternatives.",
    category: "Medical",
    phonetic: "in-fawrmd kuhn-sent",
  },
  {
    term: "Dysphagia",
    definition: "Difficulty swallowing; can be caused by various conditions affecting the throat or esophagus.",
    category: "Medical",
    phonetic: "dis-fey-jee-uh",
  },
];

export const GlossarySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [isSearching, setIsSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<string>("");
  const [aiImageUrl, setAiImageUrl] = useState<string>("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "mandarin", label: "Mandarin" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "russian", label: "Russian" },
  ];


  const handleAISearch = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use AI search",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a term to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-terminology-search', {
        body: { 
          searchTerm, 
          targetLanguage
        }
      });

      if (error) throw error;
      
      setAiSearchResults(data.result);
      setAiImageUrl(data.imageUrl || "");
      toast({
        title: "AI Search Complete",
        description: "Advanced terminology consultation retrieved",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('AI search error:', error);
      }
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search terminology",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addToPersonalGlossary = async (term: GlossaryTerm) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add terms to your glossary",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('personalized_glossary')
        .insert({
          user_id: user.id,
          term: term.term,
          definition: term.definition,
          category: term.category,
          phonetic: term.phonetic,
          target_language: targetLanguage,
        });

      if (error) throw error;

      toast({
        title: "Added to My Terms",
        description: `${term.term} has been added to your personal glossary`,
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Add to glossary error:', error);
      }
      toast({
        title: "Failed to add term",
        description: error instanceof Error ? error.message : "Could not add to personal glossary",
        variant: "destructive",
      });
    }
  };

  const filteredTerms = sampleTerms.filter((term) => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const speakPhonetic = (phonetic: string) => {
    const utterance = new SpeechSynthesisUtterance(phonetic);
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      <AddTermDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        userId={user?.id || ''}
        onTermAdded={() => {
          toast({
            title: "Success",
            description: "Term added to your glossary",
          });
        }}
      />
      
      <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
              <Input
                placeholder="Search medical terminology (AI-powered)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
                className="pl-11 h-12 text-base border-2 border-primary/30 focus:border-primary shadow-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleAISearch} 
                disabled={isSearching}
                className="bg-primary hover:bg-primary/90 h-12 text-base font-semibold shadow-md flex-1 sm:flex-none"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    AI Search
                  </>
                )}
              </Button>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="flex-1 h-12 border-2 border-primary/30">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 border-primary/30">
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {aiSearchResults && (
          <Card className="p-6 mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              AI Consultation Results
            </h3>
            <div className="space-y-4">
              {aiImageUrl && (
                <div className="rounded-lg overflow-hidden border border-border shadow-md">
                  <img 
                    src={aiImageUrl} 
                    alt="Medical term illustration" 
                    className="w-full h-auto max-h-64 object-contain bg-white"
                  />
                </div>
              )}
              <div className="bg-card/80 backdrop-blur rounded-lg p-4 border border-border">
                <pre 
                  className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeAIContent(aiSearchResults) }}
                />
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No terms found. Try adjusting your search or use AI Search for advanced consultation.
              </p>
            </div>
          ) : (
            filteredTerms.map((term, index) => (
              <Card key={index} className="p-4 border-border hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {term.term}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {term.category}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (!user) {
                            toast({
                              title: "Authentication required",
                              description: "Please sign in to add terms",
                              variant: "destructive",
                            });
                            return;
                          }
                          setAddDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0 ml-auto"
                        title="Add to My Terms"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {term.phonetic && (
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-sm text-muted-foreground italic">
                          {term.phonetic}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => speakPhonetic(term.phonetic!)}
                          className="h-6 w-6 p-0"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-foreground leading-relaxed">
                      {term.definition}
                    </p>
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Translation ({targetLanguage}):
                      </p>
                      <p className="text-sm text-foreground italic">
                        {/* In production, this would call a translation API */}
                        [Translation would appear here]
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </>
  );
};
