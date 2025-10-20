import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface PracticeSettingsProps {
  onSettingsChange: (settings: PracticeSettings) => void;
  currentSettings: PracticeSettings;
}

export interface PracticeSettings {
  difficulty: string;
  providerAccent: string;
  voiceEnabled: boolean;
}

export const PracticeSettingsComponent = ({ onSettingsChange, currentSettings }: PracticeSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const difficulties = [
    { value: "beginner", label: "Beginner - Simple terms, slow pace" },
    { value: "intermediate", label: "Intermediate - Standard medical terminology" },
    { value: "advanced", label: "Advanced - Complex cases, rapid fire" },
  ];

  const accents = [
    { value: "american", label: "American English" },
    { value: "indian", label: "Indian English" },
    { value: "african", label: "African English" },
    { value: "british", label: "British English" },
    { value: "australian", label: "Australian English" },
  ];

  const handleDifficultyChange = (value: string) => {
    onSettingsChange({ ...currentSettings, difficulty: value });
  };

  const handleAccentChange = (value: string) => {
    onSettingsChange({ ...currentSettings, providerAccent: value });
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-4"
      >
        <Settings className="w-4 h-4 mr-2" />
        Practice Settings
      </Button>

      {isOpen && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border">
          <div className="space-y-4">
            <div>
              <Label htmlFor="difficulty" className="text-sm font-medium mb-2 block">
                Difficulty Level
              </Label>
              <Select value={currentSettings.difficulty} onValueChange={handleDifficultyChange}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="accent" className="text-sm font-medium mb-2 block">
                Provider Accent
              </Label>
              <Select value={currentSettings.providerAccent} onValueChange={handleAccentChange}>
                <SelectTrigger id="accent">
                  <SelectValue placeholder="Select accent" />
                </SelectTrigger>
                <SelectContent>
                  {accents.map((accent) => (
                    <SelectItem key={accent.value} value={accent.value}>
                      {accent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Voice interaction and advanced AI scenarios are premium features.
                Current settings will be applied to your next practice session.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
