import { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ConsultationChat } from "@/components/ConsultationChat";
import { GlossarySearch } from "@/components/GlossarySearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("consultation");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Hero />
        
        <div className="mt-12 max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="consultation" className="text-lg">
                Ethics Consultation
              </TabsTrigger>
              <TabsTrigger value="glossary" className="text-lg">
                Terminology Glossary
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="consultation" className="mt-0">
              <ConsultationChat />
            </TabsContent>
            
            <TabsContent value="glossary" className="mt-0">
              <GlossarySearch />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
