import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Users, Search } from "lucide-react";
import { PersonalizedGlossary } from "./PersonalizedGlossary";
import { GlossarySearch } from "./GlossarySearch";
import { Card } from "./ui/card";

export const TerminologyHub = () => {
  const [activeTab, setActiveTab] = useState("search");

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
        <div className="flex items-start gap-4">
          <BookOpen className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold mb-2">Terminology Consultation Hub</h3>
            <p className="text-sm text-muted-foreground">
              Search medical terminology with AI-powered definitions, manage your personal glossary, 
              and view recently referenced terms from the community.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="personal">
            <BookOpen className="w-4 h-4 mr-2" />
            My Glossary
          </TabsTrigger>
          <TabsTrigger value="community">
            <Users className="w-4 h-4 mr-2" />
            Recent Terms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-6">
          <GlossarySearch />
        </TabsContent>

        <TabsContent value="personal" className="mt-6">
          <PersonalizedGlossary />
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Community Terms Feed</h3>
            <p className="text-muted-foreground">
              View recently referenced medical terms from other interpreters. This feature helps you 
              stay updated with commonly searched terminology and trending medical vocabulary.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Coming soon...
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};