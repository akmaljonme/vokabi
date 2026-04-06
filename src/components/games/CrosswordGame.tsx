import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAIGameQuestions } from '@/hooks/useAIGameQuestions';
import confetti from 'canvas-confetti';

type ClueData = { word: string; clue: string; direction: 'across' | 'down'; row: number; col: number };

const defaultClues: ClueData[] = [
  { word: 'APPLE', clue: 'A common fruit', direction: 'across', row: 0, col: 0 },
  { word: 'PLANE', clue: 'Flies in the sky', direction: 'down', row: 0, col: 2 },
  { word: 'LAMP', clue: 'Gives light', direction: 'across', row: 2, col: 1 },
  { word: 'EAR', clue: 'Used for hearing', direction: 'down', row: 0, col: 4 },
];

export const CrosswordGame = ({ onBack }: { onBack: () => void }) => {
  const gridSize = 7;
  const [grid, setGrid] = useState<string[][]>(Array(gridSize).fill(null).map(() => Array(gridSize).fill('')));
  const [answers, setAnswers] = useState<string[][]>(Array(gridSize).fill(null).map(() => Array(gridSize).fill('')));
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    defaultClues.forEach(({ word, direction, row, col }) => {
      for (let i = 0; i < word.length; i++) {
        if (direction === 'across') newGrid[row][col + i] = word[i];
        else newGrid[row + i][col] = word[i];
      }
    });
    setGrid(newGrid);
    setAnswers(Array(gridSize).fill(null).map(() => Array(gridSize).fill('')));
    setSolved(false);
  }, []);

  const handleInput = (r: number, c: number, val: string) => {
    if (!grid[r][c]) return;
    const newAns = answers.map(row => [...row]);
    newAns[r][c] = val.toUpperCase().slice(-1);
    setAnswers(newAns);
    let allCorrect = true;
    for (let i = 0; i < gridSize; i++)
      for (let j = 0; j < gridSize; j++)
        if (grid[i][j] && newAns[i][j] !== grid[i][j]) allCorrect = false;
    if (allCorrect && grid.some(row => row.some(c => c))) {
      setSolved(true);
      setScore(100);
      confetti({ particleCount: 120, spread: 70 });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-2xl font-bold">🧩 Crossword Puzzle</h2>
        {solved && <span className="ml-auto text-primary font-bold flex items-center gap-1"><Trophy className="w-4 h-4" /> {score} XP</span>}
      </div>

      <div className="grid gap-0.5 mb-6 mx-auto w-fit">
        {Array(gridSize).fill(0).map((_, r) => (
          <div key={r} className="flex gap-0.5">
            {Array(gridSize).fill(0).map((_, c) => (
              <div key={c} className={`w-10 h-10 ${grid[r]?.[c] ? 'border-2 border-border bg-card' : 'bg-transparent'} flex items-center justify-center`}>
                {grid[r]?.[c] && (
                  <input
                    className={`w-full h-full text-center font-bold text-lg bg-transparent outline-none ${answers[r][c] === grid[r][c] ? 'text-primary' : 'text-foreground'}`}
                    maxLength={1}
                    value={answers[r][c]}
                    onChange={(e) => handleInput(r, c, e.target.value)}
                    disabled={solved}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-sm">Clues:</h3>
        {defaultClues.map((clue, i) => (
          <p key={i} className="text-sm text-muted-foreground">
            <span className="font-bold">{clue.direction === 'across' ? '→' : '↓'}</span> {clue.clue} ({clue.word.length} letters)
          </p>
        ))}
      </div>
    </motion.div>
  );
};
