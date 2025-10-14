import { BookOpen, Languages, Award, Shield } from "lucide-react";

export const Hero = () => {
  const features = [
    {
      icon: Shield,
      title: "Ethics Guidance",
      description: "Consult on IMIA, CCHI, NBCMI, NCIHC, CLAS, and CHIA standards",
    },
    {
      icon: Languages,
      title: "Multi-Language Support",
      description: "Get terminology translated into your target language",
    },
    {
      icon: BookOpen,
      title: "Comprehensive Glossary",
      description: "Access medical terms with definitions and pronunciations",
    },
    {
      icon: Award,
      title: "All Career Stages",
      description: "Resources for beginners to experienced professionals",
    },
  ];

  return (
    <section className="text-center py-12">
      <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
        Your AI-Powered Ethics & Terminology Guide
      </h2>
      <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
        Clarify ethical dilemmas, simplify confusing content, and access comprehensive medical terminology resources—all in one place.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
