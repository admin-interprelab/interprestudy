import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Play, RotateCcw, Timer, Trophy, Lightbulb, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";

interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string;
  translation?: string;
}

interface CrosswordWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
}

interface CellData {
  letter: string;
  userInput: string;
  number?: number;
  isBlocked: boolean;
}

export const CrosswordPuzzle = () => {
  const [glossaryEntries, setGlossaryEntries] = useState<GlossaryEntry[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [crosswordWords, setCrosswordWords] = useState<CrosswordWord[]>([]);
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const gridSize = 15;

  useEffect(() => {
    if (user) {
      fetchGlossaryEntries();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const fetchGlossaryEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('personalized_glossary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGlossaryEntries(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load your glossary",
        variant: "destructive",
      });
    }
  };

  const toggleWordSelection = (id: string) => {
    setSelectedWords(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const selectRandomWords = () => {
    const count = Math.min(10, glossaryEntries.length);
    const shuffled = [...glossaryEntries].sort(() => 0.5 - Math.random());
    const randomIds = shuffled.slice(0, count).map(e => e.id);
    setSelectedWords(randomIds);
    toast({
      title: "Random words selected",
      description: `Selected ${count} words for your puzzle`,
    });
  };

  const getDifficultyHint = (definition: string, term: string): string => {
    switch (difficulty) {
      case 'easy':
        return definition;
      case 'medium':
        return definition.split('.')[0] + '...';
      case 'hard':
        return `${term.length} letters - ${definition.split(' ').slice(0, 3).join(' ')}...`;
      default:
        return definition;
    }
  };

  const generateCrossword = () => {
    if (selectedWords.length < 3) {
      toast({
        title: "Not enough words",
        description: "Please select at least 3 words",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    const selectedEntries = glossaryEntries.filter(e => selectedWords.includes(e.id));
    const words = selectedEntries
      .map(e => e.term.toUpperCase().replace(/[^A-Z]/g, ''))
      .filter(w => w.length >= 3 && w.length <= 12);

    if (words.length < 3) {
      toast({
        title: "Invalid words",
        description: "Need at least 3 valid words (3-12 letters)",
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    // Simple crossword generation algorithm
    const newGrid: CellData[][] = Array(gridSize).fill(null).map(() =>
      Array(gridSize).fill(null).map(() => ({
        letter: '',
        userInput: '',
        isBlocked: true,
      }))
    );

    const placedWords: CrosswordWord[] = [];
    let wordNumber = 1;

    // Place first word horizontally in the middle
    const firstWord = words[0];
    const firstEntry = selectedEntries[0];
    const startCol = Math.floor((gridSize - firstWord.length) / 2);
    const startRow = Math.floor(gridSize / 2);

    for (let i = 0; i < firstWord.length; i++) {
      newGrid[startRow][startCol + i] = {
        letter: firstWord[i],
        userInput: '',
        number: i === 0 ? wordNumber : undefined,
        isBlocked: false,
      };
    }

    placedWords.push({
      word: firstWord,
      clue: getDifficultyHint(firstEntry.definition, firstEntry.term),
      row: startRow,
      col: startCol,
      direction: 'across',
      number: wordNumber++,
    });

    // Try to place remaining words
    for (let i = 1; i < Math.min(words.length, 8); i++) {
      const word = words[i];
      const entry = selectedEntries[i];
      let placed = false;

      // Try to find intersections with placed words
      for (const placedWord of placedWords) {
        for (let j = 0; j < word.length && !placed; j++) {
          for (let k = 0; k < placedWord.word.length && !placed; k++) {
            if (word[j] === placedWord.word[k]) {
              let newRow, newCol;
              
              if (placedWord.direction === 'across') {
                // Try placing vertically
                newRow = placedWord.row - j;
                newCol = placedWord.col + k;
                
                if (canPlaceWord(newGrid, word, newRow, newCol, 'down')) {
                  placeWord(newGrid, word, newRow, newCol, 'down', wordNumber);
                  placedWords.push({
                    word,
                    clue: getDifficultyHint(entry.definition, entry.term),
                    row: newRow,
                    col: newCol,
                    direction: 'down',
                    number: wordNumber++,
                  });
                  placed = true;
                }
              } else {
                // Try placing horizontally
                newRow = placedWord.row + k;
                newCol = placedWord.col - j;
                
                if (canPlaceWord(newGrid, word, newRow, newCol, 'across')) {
                  placeWord(newGrid, word, newRow, newCol, 'across', wordNumber);
                  placedWords.push({
                    word,
                    clue: getDifficultyHint(entry.definition, entry.term),
                    row: newRow,
                    col: newCol,
                    direction: 'across',
                    number: wordNumber++,
                  });
                  placed = true;
                }
              }
            }
          }
        }
      }
    }

    setGrid(newGrid);
    setCrosswordWords(placedWords);
    setIsGenerating(false);
    setIsPlaying(true);
    setCompletedWords(new Set());
    startTimer();
    
    toast({
      title: "Puzzle ready!",
      description: `Generated crossword with ${placedWords.length} words`,
    });
  };

  const canPlaceWord = (
    grid: CellData[][],
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down'
  ): boolean => {
    if (row < 0 || col < 0) return false;

    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;

      if (r >= gridSize || c >= gridSize) return false;

      const cell = grid[r][c];
      if (!cell.isBlocked && cell.letter !== word[i]) return false;
    }

    return true;
  };

  const placeWord = (
    grid: CellData[][],
    word: string,
    row: number,
    col: number,
    direction: 'across' | 'down',
    number: number
  ) => {
    for (let i = 0; i < word.length; i++) {
      const r = direction === 'down' ? row + i : row;
      const c = direction === 'across' ? col + i : col;

      grid[r][c] = {
        letter: word[i],
        userInput: grid[r][c].userInput || '',
        number: i === 0 ? number : grid[r][c].number,
        isBlocked: false,
      };
    }
  };

  const startTimer = () => {
    setTimeElapsed(0);
    const interval = window.setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const resetPuzzle = () => {
    stopTimer();
    setIsPlaying(false);
    setGrid([]);
    setCrosswordWords([]);
    setSelectedWords([]);
    setTimeElapsed(0);
    setCompletedWords(new Set());
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    if (!isPlaying) return;

    const newGrid = [...grid];
    newGrid[row][col] = {
      ...newGrid[row][col],
      userInput: value.toUpperCase().slice(0, 1),
    };
    setGrid(newGrid);

    // Check if any words are completed
    checkCompletedWords(newGrid);
  };

  const checkCompletedWords = (currentGrid: CellData[][]) => {
    const newCompleted = new Set<number>();
    
    crosswordWords.forEach(wordData => {
      let isComplete = true;
      for (let i = 0; i < wordData.word.length; i++) {
        const r = wordData.direction === 'down' ? wordData.row + i : wordData.row;
        const c = wordData.direction === 'across' ? wordData.col + i : wordData.col;
        
        if (currentGrid[r][c].userInput !== wordData.word[i]) {
          isComplete = false;
          break;
        }
      }
      
      if (isComplete) {
        newCompleted.add(wordData.number);
      }
    });

    setCompletedWords(newCompleted);

    // Check if puzzle is complete
    if (newCompleted.size === crosswordWords.length && crosswordWords.length > 0) {
      stopTimer();
      toast({
        title: "Congratulations!",
        description: `Puzzle completed in ${formatTime(timeElapsed)}!`,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    const cellSize = 10;
    const startX = 20;
    const startY = 30;
    
    // Title
    pdf.setFontSize(16);
    pdf.text("Medical Terminology Crossword", 20, 20);
    pdf.setFontSize(10);
    pdf.text(`Difficulty: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`, 20, 26);
    
    // Draw grid
    pdf.setFontSize(8);
    grid.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        if (!cell.isBlocked) {
          const x = startX + colIdx * cellSize;
          const y = startY + rowIdx * cellSize;
          
          // Draw cell border
          pdf.rect(x, y, cellSize, cellSize);
          
          // Draw number if exists
          if (cell.number) {
            pdf.setFontSize(6);
            pdf.text(cell.number.toString(), x + 1, y + 3);
          }
        }
      });
    });
    
    // Add clues on a new page
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Clues", 20, 20);
    
    let yPos = 30;
    
    // Across clues
    pdf.setFontSize(12);
    pdf.text("Across", 20, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    
    crosswordWords
      .filter(w => w.direction === 'across')
      .forEach(w => {
        const lines = pdf.splitTextToSize(`${w.number}. ${w.clue}`, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 2;
        
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
      });
    
    yPos += 5;
    
    // Down clues
    pdf.setFontSize(12);
    pdf.text("Down", 20, yPos);
    yPos += 8;
    pdf.setFontSize(9);
    
    crosswordWords
      .filter(w => w.direction === 'down')
      .forEach(w => {
        const lines = pdf.splitTextToSize(`${w.number}. ${w.clue}`, 170);
        pdf.text(lines, 20, yPos);
        yPos += lines.length * 5 + 2;
        
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
      });
    
    // Save PDF
    pdf.save(`crossword-puzzle-${difficulty}-${Date.now()}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your crossword puzzle has been exported successfully",
    });
  };

  if (!user) {
    return (
      <Card className="p-6 bg-card/80 backdrop-blur border-2 border-primary/20">
        <p className="text-center text-muted-foreground">Sign in to create crossword puzzles</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/80 backdrop-blur border-2 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Medical Terminology Crossword
          </h3>
          <div className="flex items-center gap-3">
            {isPlaying && crosswordWords.length > 0 && (
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
            {isPlaying && (
              <Badge variant="secondary" className="flex items-center gap-2 text-lg px-4 py-2">
                <Timer className="w-4 h-4" />
                {formatTime(timeElapsed)}
              </Badge>
            )}
          </div>
        </div>

        {!isPlaying && (
          <>
            <div className="space-y-4 mb-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy - Full definitions</SelectItem>
                      <SelectItem value="medium">Medium - Partial hints</SelectItem>
                      <SelectItem value="hard">Hard - Minimal clues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={selectRandomWords} variant="outline">
                  Random Selection
                </Button>
              </div>

              <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                <Label className="mb-2 block">Select Words (min. 3)</Label>
                {glossaryEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Add terms to your glossary to create puzzles
                  </p>
                ) : (
                  <div className="space-y-2">
                    {glossaryEntries.map(entry => (
                      <div key={entry.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedWords.includes(entry.id)}
                          onCheckedChange={() => toggleWordSelection(entry.id)}
                          id={entry.id}
                        />
                        <label
                          htmlFor={entry.id}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {entry.term} - {entry.definition.slice(0, 50)}...
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={generateCrossword}
                disabled={isGenerating || selectedWords.length < 3}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Generate Crossword
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {isPlaying && crosswordWords.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setShowHints(!showHints)} variant="outline" size="sm">
                <Lightbulb className="w-4 h-4 mr-2" />
                {showHints ? 'Hide' : 'Show'} Clues
              </Button>
              <Button onClick={resetPuzzle} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="inline-block border-2 border-primary/30 rounded-lg p-2 bg-background/50">
                  {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex">
                      {row.map((cell, colIdx) => (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className="relative w-8 h-8 border border-border"
                        >
                          {!cell.isBlocked && (
                            <>
                              {cell.number && (
                                <span className="absolute top-0 left-0.5 text-[8px] font-bold text-primary">
                                  {cell.number}
                                </span>
                              )}
                              <Input
                                value={cell.userInput}
                                onChange={(e) => handleCellInput(rowIdx, colIdx, e.target.value)}
                                className="w-full h-full text-center text-sm font-bold p-0 border-0 bg-background"
                                maxLength={1}
                              />
                            </>
                          )}
                          {cell.isBlocked && (
                            <div className="w-full h-full bg-muted" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {showHints && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Across</h4>
                    <div className="space-y-2">
                      {crosswordWords
                        .filter(w => w.direction === 'across')
                        .map(w => (
                          <div
                            key={w.number}
                            className={`text-sm ${
                              completedWords.has(w.number)
                                ? 'text-primary line-through'
                                : 'text-foreground'
                            }`}
                          >
                            <span className="font-bold">{w.number}.</span> {w.clue}
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Down</h4>
                    <div className="space-y-2">
                      {crosswordWords
                        .filter(w => w.direction === 'down')
                        .map(w => (
                          <div
                            key={w.number}
                            className={`text-sm ${
                              completedWords.has(w.number)
                                ? 'text-primary line-through'
                                : 'text-foreground'
                            }`}
                          >
                            <span className="font-bold">{w.number}.</span> {w.clue}
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-semibold">
                      Progress: {completedWords.size}/{crosswordWords.length} words
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
