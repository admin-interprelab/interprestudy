import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  phonetic?: string;
}

// Sample glossary data - in production, this would come from a database
const sampleTerms: GlossaryTerm[] = [
  {
    term: "Confidentiality",
    definition: "The ethical principle requiring interpreters to keep all information learned during an assignment private and not to disclose it to unauthorized parties.",
    category: "Ethics",
    phonetic: "kon-fi-den-shee-al-i-tee",
  },
  {
    term: "Accuracy",
    definition: "The principle that interpreters must convey the meaning of the source language message faithfully and completely without additions, omissions, or alterations.",
    category: "Ethics",
    phonetic: "ak-yur-uh-see",
  },
  {
    term: "Impartiality",
    definition: "The requirement that interpreters remain neutral and objective, without allowing personal beliefs or relationships to influence their interpretation.",
    category: "Ethics",
    phonetic: "im-par-shee-al-i-tee",
  },
  {
    term: "Cultural Broker",
    definition: "An interpreter who helps bridge cultural gaps and explains cultural practices when necessary for effective communication, while maintaining professional boundaries.",
    category: "Role",
    phonetic: "kul-chur-uhl broh-ker",
  },
];

export const GlossarySearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const languages = [
    { value: "spanish", label: "Spanish" },
    { value: "mandarin", label: "Mandarin" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "russian", label: "Russian" },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "ethics", label: "Ethics" },
    { value: "role", label: "Role & Responsibilities" },
    { value: "medical", label: "Medical Terminology" },
  ];

  const filteredTerms = sampleTerms.filter((term) => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         term.definition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || 
                           term.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const speakPhonetic = (phonetic: string) => {
    const utterance = new SpeechSynthesisUtterance(phonetic);
    utterance.rate = 0.7;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terminology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Target Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No terms found. Try adjusting your search or filters.
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
  );
};
