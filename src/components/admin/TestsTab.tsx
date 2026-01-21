import { useState } from 'react';
import { Plus, Edit, Trash2, FileText, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Placeholder component for tests management
// Full implementation would include CRUD operations for tests/questions

export const TestsTab = () => {
  const [selectedLevel, setSelectedLevel] = useState('A1');

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const mockTests = [
    { id: 1, title: 'Reading Comprehension Mock 1', skill: 'reading', questions: 20, level: 'A1' },
    { id: 2, title: 'Listening Practice Mock 1', skill: 'listening', questions: 15, level: 'A1' },
    { id: 3, title: 'Reading Comprehension Mock 2', skill: 'reading', questions: 20, level: 'A1' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tests Management</h2>
          <p className="text-muted-foreground">Create and manage mock tests</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Test
        </Button>
      </div>

      {/* Level Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              selectedLevel === level
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {level} Level
          </button>
        ))}
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTests.map((test) => (
          <Card key={test.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  test.skill === 'reading' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                }`}>
                  {test.skill === 'reading' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Headphones className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{test.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {test.questions} questions • {test.skill}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}

        {/* Add New Card */}
        <Card className="p-4 border-dashed flex items-center justify-center min-h-[120px] cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="text-center">
            <Plus className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Add New Test</p>
          </div>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <h3 className="font-semibold text-primary mb-2">Coming Soon: Full Test Builder</h3>
        <p className="text-sm text-muted-foreground">
          The complete test creation interface with question types (multiple choice, true/false, fill-in-blank), 
          audio upload for listening tests, reading passages, and more is under development.
        </p>
      </div>
    </div>
  );
};
