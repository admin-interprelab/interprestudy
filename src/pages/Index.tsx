import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ConsultationChat } from "@/components/ConsultationChat";
import { GlossarySearch } from "@/components/GlossarySearch";
import { PersonalizedGlossary } from "@/components/PersonalizedGlossary";
import { PracticeMode } from "@/components/PracticeMode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageSquare, Sparkles, Target } from "lucide-react";

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
                <MessageSquare className="w-4 h-4 mr-2" />
                Code of Ethics
              </TabsTrigger>
              <TabsTrigger 
                value="glossary" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Glossary
              </TabsTrigger>
              <TabsTrigger 
                value="my-terms" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Target className="w-4 h-4 mr-2" />
                My Terms
              </TabsTrigger>
              <TabsTrigger 
                value="practice" 
                className="h-14 text-sm lg:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Practice
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "ethics" && (
              <TabsContent value="ethics" className="mt-0">
                <ConsultationChat />
              </TabsContent>
            )}
            
            {activeTab === "glossary" && (
              <TabsContent value="glossary" className="mt-0">
                <GlossarySearch />
              </TabsContent>
            )}
            
            {activeTab === "my-terms" && (
              <TabsContent value="my-terms" className="mt-0">
                <PersonalizedGlossary />
              </TabsContent>
            )}
            
            {activeTab === "practice" && (
              <TabsContent value="practice" className="mt-0">
                <PracticeMode />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
