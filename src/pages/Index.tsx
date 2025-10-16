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
  const [activeTab, setActiveTab] = useState("consultation");
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        
        <div className="mt-12 max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8 h-auto p-1">
              <TabsTrigger value="consultation" className="text-sm lg:text-base py-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Ethics Chat
              </TabsTrigger>
              <TabsTrigger value="glossary" className="text-sm lg:text-base py-3">
                <BookOpen className="w-4 h-4 mr-2" />
                Glossary
              </TabsTrigger>
              <TabsTrigger value="personal" className="text-sm lg:text-base py-3">
                <Target className="w-4 h-4 mr-2" />
                My Terms
              </TabsTrigger>
              <TabsTrigger value="practice" className="text-sm lg:text-base py-3">
                <Sparkles className="w-4 h-4 mr-2" />
                Practice
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultation" className="mt-0">
              <ConsultationChat />
            </TabsContent>
            
            <TabsContent value="glossary" className="mt-0">
              <GlossarySearch />
            </TabsContent>
            
            <TabsContent value="personal" className="mt-0">
              <PersonalizedGlossary />
            </TabsContent>
            
            <TabsContent value="practice" className="mt-0">
              <PracticeMode />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
