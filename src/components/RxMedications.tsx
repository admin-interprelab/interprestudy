import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search, Loader2, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MedicationEntry {
  id: string;
  medication_name: string;
  direct_translation: string;
  generic_names?: string[];
  brand_names?: string[];
  target_language: string;
  image_url?: string;
  alternative_names?: string[];
}

export const RxMedications = () => {
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMedication, setNewMedication] = useState({
    medication_name: '',
    target_language: 'spanish',
  });
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const isPremium = userRole === 'premium' || userRole === 'admin';

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('rx_medications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: "Error",
        description: "Failed to load medications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async () => {
    if (!newMedication.medication_name) {
      toast({
        title: "Missing information",
        description: "Please provide medication name",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-medication', {
        body: {
          medicationName: newMedication.medication_name,
          targetLanguage: newMedication.target_language,
          includePremiumInfo: isPremium,
        },
      });

      if (error) throw error;

      const { error: insertError } = await supabase
        .from('rx_medications')
        .insert([{
          ...data,
          user_id: user?.id,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Medication added to your reference",
      });

      setNewMedication({
        medication_name: '',
        target_language: 'spanish',
      });
      setDialogOpen(false);
      fetchMedications();
    } catch (error) {
      console.error('Error adding medication:', error);
      toast({
        title: "Error",
        description: "Failed to add medication",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rx_medications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Medication removed",
      });
      fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "Error",
        description: "Failed to delete medication",
        variant: "destructive",
      });
    }
  };

  const filteredMedications = medications.filter(med =>
    med.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.direct_translation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-12">Loading medications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Rx Medication Reference</h2>
          <p className="text-muted-foreground">Quick access to medication translations and alternatives</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medication Reference</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="medication">Medication Name *</Label>
                <Input
                  id="medication"
                  value={newMedication.medication_name}
                  onChange={(e) => setNewMedication({ ...newMedication, medication_name: e.target.value })}
                  placeholder="e.g., Tylenol"
                />
              </div>
              <div>
                <Label htmlFor="language">Target Language</Label>
                <Select 
                  value={newMedication.target_language}
                  onValueChange={(value) => setNewMedication({ ...newMedication, target_language: value })}
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
              <Button onClick={addMedication} className="w-full" disabled={searching}>
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Add Medication'
                )}
              </Button>
              {!isPremium && (
                <p className="text-xs text-muted-foreground">
                  <Crown className="w-3 h-3 inline mr-1" />
                  Upgrade to Premium for images, generic names, and brand alternatives
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search medications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredMedications.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No medications in your reference</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Medication
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMedications.map((med) => (
            <Card key={med.id} className="p-4">
              <div className="flex gap-4">
                {isPremium && med.image_url && (
                  <div className="flex-shrink-0 w-24 h-24">
                    <img 
                      src={med.image_url} 
                      alt={med.medication_name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">{med.medication_name}</h3>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteMedication(med.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Translation ({med.target_language}):
                  </p>
                  <p className="text-base font-medium text-foreground mb-3">
                    {med.direct_translation}
                  </p>
                  
                  {isPremium && (
                    <>
                      {med.generic_names && med.generic_names.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Generic Names:</p>
                          <div className="flex flex-wrap gap-1">
                            {med.generic_names.map((name, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-foreground">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {med.brand_names && med.brand_names.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Brand Names:</p>
                          <div className="flex flex-wrap gap-1">
                            {med.brand_names.map((name, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {med.alternative_names && med.alternative_names.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Also Known As:</p>
                          <div className="flex flex-wrap gap-1">
                            {med.alternative_names.map((name, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 rounded-full bg-accent/20 text-foreground">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-muted-foreground">
          <strong className="text-primary">Premium Features:</strong> Access medication images, comprehensive generic and brand name alternatives, and international naming variations to avoid critical miscommunication in healthcare settings.
        </p>
      </Card>
    </div>
  );
};