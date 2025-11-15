import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Languages, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  phonetic?: string;
  target_language: string;
  translation?: string;
}

export const PersonalizedGlossary = () => {
  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    term: '',
    definition: '',
    category: '',
    phonetic: '',
    target_language: 'spanish',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const isPremium = userRole === 'premium' || userRole === 'admin';

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('personalized_glossary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching glossary:', error);
      }
      toast({
        title: "Error",
        description: "Failed to load your glossary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEntry = async () => {
    if (!newEntry.term || !newEntry.definition) {
      toast({
        title: "Missing information",
        description: "Please provide both term and definition",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('personalized_glossary')
        .insert([{
          ...newEntry,
          user_id: user?.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Term added to your glossary",
      });

      setNewEntry({
        term: '',
        definition: '',
        category: '',
        phonetic: '',
        target_language: 'spanish',
      });
      setDialogOpen(false);
      fetchEntries();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error adding entry:', error);
      }
      toast({
        title: "Error",
        description: "Failed to add term",
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personalized_glossary')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Term removed from glossary",
      });
      fetchEntries();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting entry:', error);
      }
      toast({
        title: "Error",
        description: "Failed to delete term",
        variant: "destructive",
      });
    }
  };

  const translateEntry = async (entry: GlossaryEntry) => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Premium to access AI translations",
        variant: "destructive",
      });
      return;
    }

    setTranslating(entry.id);
    try {
      const { data, error } = await supabase.functions.invoke('translate-term', {
        body: {
          term: entry.term,
          definition: entry.definition,
          targetLanguage: entry.target_language,
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('personalized_glossary')
        .update({ translation: data.translation })
        .eq('id', entry.id);

      if (updateError) throw updateError;

      toast({
        title: "Translation complete",
        description: "Translation has been saved",
      });
      fetchEntries();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Translation error:', error);
      }
      toast({
        title: "Translation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setTranslating(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading your glossary...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Personal Glossary</h2>
          <p className="text-muted-foreground">Build your custom terminology library</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Term</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="term">Term *</Label>
                <Input
                  id="term"
                  value={newEntry.term}
                  onChange={(e) => setNewEntry({ ...newEntry, term: e.target.value })}
                  placeholder="e.g., Informed Consent"
                />
              </div>
              <div>
                <Label htmlFor="definition">Definition *</Label>
                <Textarea
                  id="definition"
                  value={newEntry.definition}
                  onChange={(e) => setNewEntry({ ...newEntry, definition: e.target.value })}
                  placeholder="Definition..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  placeholder="e.g., Ethics"
                />
              </div>
              <div>
                <Label htmlFor="phonetic">Phonetic</Label>
                <Input
                  id="phonetic"
                  value={newEntry.phonetic}
                  onChange={(e) => setNewEntry({ ...newEntry, phonetic: e.target.value })}
                  placeholder="e.g., in-formd kon-sent"
                />
              </div>
              <div>
                <Label htmlFor="language">Target Language</Label>
                <Select 
                  value={newEntry.target_language}
                  onValueChange={(value) => setNewEntry({ ...newEntry, target_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spanish">Spanish</SelectItem>
                    <SelectItem value="mandarin">Mandarin</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                    <SelectItem value="russian">Russian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addEntry} className="w-full">Add to Glossary</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Your personal glossary is empty</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Term
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{entry.term}</h3>
                    {entry.category && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {entry.category}
                      </span>
                    )}
                  </div>
                  {entry.phonetic && (
                    <p className="text-sm text-muted-foreground italic mb-2">{entry.phonetic}</p>
                  )}
                  <p className="text-sm text-foreground mb-3">{entry.definition}</p>
                  {entry.translation && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Translation ({entry.target_language}):
                      </p>
                      <p className="text-sm text-foreground italic">{entry.translation}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => translateEntry(entry)}
                    disabled={translating === entry.id || !!entry.translation}
                  >
                    {translating === entry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Languages className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};