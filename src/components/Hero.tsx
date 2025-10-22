import { BookOpen, MessageSquare, Shield, Sparkles, Target, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
export const Hero = () => {
  const {
    userRole
  } = useAuth();
  const isPremium = userRole === 'premium' || userRole === 'admin';
  return <div className="text-center space-y-8 py-8">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isPremium && <Badge className="bg-gradient-premium border-none text-white">
              <Crown className="w-3 h-3 mr-1" />
              Premium Active
            </Badge>}
        </div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-indigo-950 md:text-4xl">
          Professional Medical Interpreter Assistant
        </h1>
        <p className="text-base text-muted-foreground max-w-2xl mx-auto">
          Master ethics, expand your vocabulary, and practice real-world scenarios
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all hover:-translate-y-1">
          <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2 text-foreground">Ethics Guidance</h3>
          <p className="text-xs text-muted-foreground">
            IMIA, CCHI, NBCMI, NCIHC standards
          </p>
        </div>

        <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all hover:-translate-y-1">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h3 className="font-semibold mb-2 text-foreground">Terminology</h3>
          <p className="text-xs text-muted-foreground">
            Searchable glossary with AI translations
          </p>
        </div>

        <div className="p-5 rounded-lg border border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all hover:-translate-y-1">
          <Target className="w-10 h-10 mx-auto mb-3 text-secondary" />
          <h3 className="font-semibold mb-2 text-foreground">Personal Library</h3>
          <p className="text-xs text-muted-foreground">
            Build your custom glossary
          </p>
        </div>

        <div className="p-5 rounded-lg border-2 border-accent/30 bg-gradient-to-br from-card/80 to-accent/5 backdrop-blur-sm hover:shadow-premium transition-all hover:-translate-y-1">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-accent" />
          <h3 className="font-semibold mb-2 text-foreground flex items-center justify-center gap-1">
            Practice Mode
            {!isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
          </h3>
          <p className="text-xs text-muted-foreground">
            AI scenarios with performance feedback
          </p>
        </div>
      </div>
    </div>;
};