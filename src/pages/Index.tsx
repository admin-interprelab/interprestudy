import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { EthicsConsultation } from "@/components/EthicsConsultation";
import { TerminologyHub } from "@/components/TerminologyHub";
import { VoicePracticeMode } from "@/components/VoicePracticeMode";
import { RxMedications } from "@/components/RxMedications";
import { CrosswordPuzzle } from "@/components/CrosswordPuzzle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Scale, Sparkles, Pill } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("ethics");
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        
        <div className="mt-12 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto p-2 bg-card/80 border-2 border-primary/20">
              <TabsTrigger 
                value="ethics" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Scale className="w-4 h-4 mr-2" />
                Ethics & Standards
              </TabsTrigger>
              <TabsTrigger 
                value="terminology" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Terminology
              </TabsTrigger>
              <TabsTrigger 
                value="medications" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Pill className="w-4 h-4 mr-2" />
                Rx Reference
              </TabsTrigger>
              <TabsTrigger 
                value="practice" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Practice
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ethics" className="mt-0">
              <EthicsConsultation />
            </TabsContent>
            
            <TabsContent value="terminology" className="mt-0">
              <TerminologyHub />
            </TabsContent>
            
            <TabsContent value="medications" className="mt-0">
              <RxMedications />
            </TabsContent>
            
            <TabsContent value="practice" className="mt-0">
              <div className="space-y-6">
                <VoicePracticeMode />
                <CrosswordPuzzle />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
