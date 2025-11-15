import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Bot, User, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sanitizeAIContent } from "@/lib/sanitize";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const sampleScenarios = [
  {
    id: 1,
    title: "IMIA Standard: Accuracy",
    description: "The provider uses medical jargon the patient doesn't understand. How do you maintain accuracy while ensuring comprehension?",
    guidance: "Interpret the exact words, then ask the provider to clarify or simplify if the patient indicates confusion. Never alter the message to make it 'easier' without provider input.",
  },
  {
    id: 2,
    title: "CCHI Protocol: Confidentiality",
    description: "A family member asks you about the patient's diagnosis in the waiting room after the appointment.",
    guidance: "Politely explain: 'I cannot discuss any information from the appointment. Please speak directly with the healthcare provider or the patient.' Maintain absolute confidentiality.",
  },
  {
    id: 3,
    title: "NBCMI Ethics: Impartiality",
    description: "You're interpreting for a neighbor you know personally. The neighbor asks you to advocate for a specific treatment.",
    guidance: "Disclose the relationship to all parties immediately. If there's any conflict of interest, recuse yourself. Never advocate—only interpret.",
  },
  {
    id: 4,
    title: "NCIHC Standard: Scope of Practice",
    description: "The doctor asks you to help the patient fill out insurance paperwork while they see another patient.",
    guidance: "Politely decline: 'I'm happy to interpret if you need to explain the forms to the patient, but completing paperwork is outside my role as an interpreter.'",
  },
  {
    id: 5,
    title: "CLAS Standards: Cultural Mediation",
    description: "A patient from a culture that values indirect communication seems reluctant to express pain directly. The provider appears frustrated.",
    guidance: "Alert both parties to the potential cultural difference affecting communication: 'Doctor, I notice the patient may be expressing discomfort indirectly, which is common in their culture. Would you like me to interpret your question in a way that might help them respond more comfortably?'",
  },
  {
    id: 6,
    title: "CHIA Guidelines: Professional Boundaries",
    description: "After several appointments, the patient offers you a substantial gift and invites you to a family gathering.",
    guidance: "Politely decline: 'Thank you for your kindness, but I cannot accept gifts or attend personal events as it would compromise my professional role. I'm here to serve you as an interpreter.'",
  },
];

export const ConsultationChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState<string>("");
  const [showScenarios, setShowScenarios] = useState(true);
  const { user } = useAuth();

  const organizations = [
    { value: "all", label: "All Standards" },
    { value: "IMIA", label: "IMIA" },
    { value: "CCHI", label: "CCHI" },
    { value: "NBCMI", label: "NBCMI" },
    { value: "NCIHC", label: "NCIHC" },
    { value: "CLAS", label: "CLAS" },
    { value: "CHIA", label: "CHIA" },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!user) {
      toast.error("Please sign in to chat with the ethics assistant");
      window.location.href = '/auth';
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowScenarios(false);

    try {
      const { data, error } = await supabase.functions.invoke("consult-ethics", {
        body: {
          messages: updatedMessages,
          organization: organization === "all" ? null : organization,
        },
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error calling edge function:", error);
        }
        toast.error("Failed to get response. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error:", error);
      }
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScenarioClick = (scenario: typeof sampleScenarios[0]) => {
    setInput(`${scenario.title}\n\n${scenario.description}\n\nWhat's the best approach based on professional standards?`);
  };

  return (
    <Card className="p-4 md:p-6 bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
      <div className="mb-4">
        <label className="text-sm font-medium text-foreground mb-2 block">
          Focus on specific standards (optional)
        </label>
        <Select value={organization} onValueChange={setOrganization}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="All Standards" />
          </SelectTrigger>
          <SelectContent>
            {organizations.map((org) => (
              <SelectItem key={org.value} value={org.value}>
                {org.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto rounded-lg bg-muted/50 backdrop-blur-sm p-4 border-2 border-primary/10">
        {messages.length === 0 ? (
          <div className="flex flex-col h-full">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <Bot className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Code of Ethics & Standards of Practice
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Ask me about medical interpreter ethics, standards, or any challenging situations. I'm here to help clarify based on IMIA, CCHI, NBCMI, NCIHC, CLAS, and CHIA guidelines.
              </p>
            </div>

            {showScenarios && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <BookOpen className="h-4 w-4" />
                  Common Ethics Scenarios
                </div>
                <div className="grid gap-2">
                  {sampleScenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className="p-3 cursor-pointer hover:bg-primary/5 transition-colors border-border"
                      onClick={() => handleScenarioClick(scenario)}
                    >
                      <h4 className="font-semibold text-sm text-foreground mb-1">
                        {scenario.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {scenario.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              <div
                className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                  message.role === "assistant"
                    ? "bg-card border border-border"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p 
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeAIContent(message.content) }}
                />
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-card border border-border">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about ethics standards, specific scenarios, or guidelines..."
          className="flex-1 min-h-[80px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="self-end"
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  );
};
