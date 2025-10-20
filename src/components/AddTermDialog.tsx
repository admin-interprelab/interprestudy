import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onTermAdded: () => void;
}

export const AddTermDialog = ({ open, onOpenChange, userId, onTermAdded }: AddTermDialogProps) => {
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [category, setCategory] = useState("medical");
  const [targetLanguage, setTargetLanguage] = useState("spanish");
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "mandarin", label: "Mandarin" },
    { value: "arabic", label: "Arabic" },
    { value: "french", label: "French" },
    { value: "russian", label: "Russian" },
  ];

  const categories = [
    { value: "medical", label: "Medical Terminology" },
    { value: "ethics", label: "Ethics" },
    { value: "role", label: "Role & Responsibilities" },
    { value: "anatomy", label: "Anatomy" },
    { value: "pharmacology", label: "Pharmacology" },
  ];

  useEffect(() => {
    if (term.length > 2) {
      const debounceTimer = setTimeout(() => {
        fetchTermDetails();
      }, 800);
      return () => clearTimeout(debounceTimer);
    }
  }, [term, targetLanguage]);

  const fetchTermDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('advanced-terminology-search', {
        body: { 
          searchTerm: term, 
          targetLanguage,
          category: category !== 'all' ? category : null
        }
      });

      if (error) throw error;
      
      // Parse the AI response to extract fields
      const result = data.result;
      
      // Simple parsing logic - in production, you'd want more robust parsing
      const defMatch = result.match(/definition[:\s]+([^\n]+)/i);
      const phoneticMatch = result.match(/phonetic[:\s]+([^\n]+)/i);
      const transMatch = result.match(/translation[:\s]+([^\n]+)/i);
      
      if (defMatch) setDefinition(defMatch[1].trim());
      if (phoneticMatch) setPhonetic(phoneticMatch[1].trim());
      if (transMatch) setTranslation(transMatch[1].trim());
      
    } catch (error) {
      console.error('Error fetching term details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!term) return;
    
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-term-image', {
        body: { term, definition }
      });

      if (error) throw error;
      
      setImageUrl(data.imageUrl);
      setShowImage(true);
      
      toast({
        title: "Image generated",
        description: "Visual reference created successfully",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Image generation failed",
        description: error instanceof Error ? error.message : "Could not generate image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!term || !definition) {
      toast({
        title: "Required fields missing",
        description: "Please provide at least a term and definition",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('personalized_glossary')
        .insert({
          user_id: userId,
          term,
          definition,
          category,
          phonetic,
          target_language: targetLanguage,
          translation,
        });

      if (error) throw error;

      toast({
        title: "Term added",
        description: `${term} has been added to your glossary`,
      });
      
      // Reset form
      setTerm("");
      setDefinition("");
      setPhonetic("");
      setTranslation("");
      setImageUrl("");
      setShowImage(false);
      
      onTermAdded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving term:', error);
      toast({
        title: "Failed to save term",
        description: error instanceof Error ? error.message : "Could not save to glossary",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Term</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="term">Term *</Label>
            <Input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Enter medical term..."
            />
            {isLoading && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching details...
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <Label htmlFor="language">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phonetic">Phonetic Pronunciation</Label>
            <Input
              id="phonetic"
              value={phonetic}
              onChange={(e) => setPhonetic(e.target.value)}
              placeholder="e.g., hahy-per-ten-shuhn"
            />
          </div>

          <div>
            <Label htmlFor="definition">Definition *</Label>
            <Textarea
              id="definition"
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              placeholder="Enter definition..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="translation">Translation</Label>
            <Textarea
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Translation will appear here..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Visual Reference</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateImage}
                disabled={isGeneratingImage || !term}
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
            
            {showImage && imageUrl && (
              <div className="relative border rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                  onClick={() => setShowImage(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <img 
                  src={imageUrl} 
                  alt={term}
                  className="w-full h-48 object-contain rounded"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Term"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
