import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, BookOpen, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const EthicsConsultation = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome! I'm your AI guide for Healthcare Interpreter Ethics and Standards of Practice. I'm here to help you understand the IMIA, NBCMI, NCIHC, CCHI, and CLAS standards. Ask me anything about the Code of Ethics, or request a quiz to test your knowledge!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"consultation" | "quiz">("consultation");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to consult the ethics guide",
        variant: "destructive",
      });
      window.location.href = '/auth';
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('consult-ethics', {
        body: { 
          message: input,
          conversationHistory: messages,
          mode: activeMode,
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Ethics consultation error:', error);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startQuiz = () => {
    setActiveMode("quiz");
    const quizMessage: Message = {
      role: "assistant",
      content: "Great! Let's test your knowledge of interpreter ethics and standards. I'll ask you questions based on IMIA, NBCMI, and other professional standards. Type 'start' to begin the quiz, or ask for a specific topic!",
    };
    setMessages((prev) => [...prev, quizMessage]);
  };

  const backToConsultation = () => {
    setActiveMode("consultation");
    const consultMessage: Message = {
      role: "assistant",
      content: "Back to consultation mode. Ask me anything about the Code of Ethics and Standards of Practice for Healthcare Interpreters.",
    };
    setMessages((prev) => [...prev, consultMessage]);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
        <div className="flex items-start gap-4">
          <BookOpen className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold mb-2">Code of Ethics & Standards Instructor</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive guidance on IMIA, NBCMI, NCIHC, CCHI, and CLAS standards. Ask questions about ethics, 
              professional conduct, or request a quiz to test your understanding.
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeMode} onValueChange={(v) => setActiveMode(v as "consultation" | "quiz")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultation" onClick={backToConsultation}>
            <BookOpen className="w-4 h-4 mr-2" />
            Consultation
          </TabsTrigger>
          <TabsTrigger value="quiz" onClick={startQuiz}>
            <HelpCircle className="w-4 h-4 mr-2" />
            Quiz Mode
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="flex flex-col h-[600px] bg-card/50 backdrop-blur-sm">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-lg p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-secondary-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={activeMode === "quiz" ? "Type your answer or 'start' to begin..." : "Ask about ethics, standards, or specific scenarios..."}
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};