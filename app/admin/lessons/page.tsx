"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { lessonService } from '@/lib/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Loader2, Book, Settings, Users } from 'lucide-react';
import type { Lesson, VocabularyItem } from '@/types/lesson';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formatDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}:${month}:${day}`;
};

const VocabularyForm = ({ 
  vocabulary, 
  setVocabulary 
}: { 
  vocabulary: VocabularyItem[], 
  setVocabulary: (items: VocabularyItem[]) => void 
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);

  const handleAdd = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setVocabulary([
        ...vocabulary,
        { question: newQuestion.trim(), answer: newAnswer.trim() }
      ]);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const handleBulkAdd = () => {
    const newItems = bulkInput
      .split('\n')
      .map(line => {
        const [question, answer] = line.split(':').map(s => s.trim());
        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is VocabularyItem => item !== null);

    if (newItems.length > 0) {
      setVocabulary([...vocabulary, ...newItems]);
      setBulkInput('');
      setShowBulkInput(false);
    }
  };

  const handleDelete = (index: number) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowBulkInput(!showBulkInput)}
        >
          {showBulkInput ? 'Single Entry' : 'Bulk Import'}
        </Button>
      </div>

      {showBulkInput ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Bulk Import (one pair per line, format: "english: turkish")
            </label>
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="dog: köpek&#10;cat: kedi&#10;bird: kuş"
              className="min-h-[200px] font-mono"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleBulkAdd}
              disabled={!bulkInput.trim()}
            >
              Add All
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">English</label>
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter English word/phrase"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Turkish</label>
            <Input
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Enter Turkish translation"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!newQuestion.trim() || !newAnswer.trim()}
          >
            Add
          </Button>
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>English</TableHead>
              <TableHead>Turkish</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vocabulary.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.question}</TableCell>
                <TableCell>{item.answer}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Form state
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const fetchedLessons = await lessonService.getAllLessons();
      setLessons(fetchedLessons);
    } catch (error) {
      setError('Failed to load lessons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setVocabulary(lesson.vocabulary);
    setIsEditing(true);
  };

  const handleNewLesson = () => {
    setEditingLesson({
      title: '',
      content: '',
      difficulty: 'beginner',
      category: 'general',
      vocabulary: []
    });
    setVocabulary([]);
    setIsEditing(false);
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      await lessonService.deleteLesson(lessonId);
      loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      setError('Failed to delete lesson');
    }
  };

  const LessonForm = () => {
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      
      const lessonData = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        difficulty: formData.get('difficulty') as Lesson['difficulty'],
        category: formData.get('category') as string,
        vocabulary: vocabulary
      };

      try {
        if (isEditing && editingLesson?.id) {
          await lessonService.updateLesson(editingLesson.id, lessonData);
        } else {
          await lessonService.createLesson(lessonData);
        }

        // Reset form and reload lessons
        setEditingLesson(null);
        setVocabulary([]);
        setIsEditing(false);
        
        // Force a refresh of the lessons list
        await loadLessons();
      } catch (error) {
        console.error('Error saving lesson:', error);
      }
    };

    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Lesson' : 'Create New Lesson'}</CardTitle>
          <CardDescription>
            {isEditing ? 'Update the lesson details below.' : 'Fill in the lesson details below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                name="title"
                defaultValue={editingLesson?.title || ''}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <Textarea
                name="content"
                defaultValue={editingLesson?.content || ''}
                className="min-h-[400px] resize-y"
                placeholder="Enter lesson content here..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  defaultValue={editingLesson?.difficulty || 'beginner'}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Input
                  name="category"
                  defaultValue={editingLesson?.category || ''}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">Vocabulary</label>
              <VocabularyForm 
                vocabulary={vocabulary}
                setVocabulary={setVocabulary}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingLesson(null);
                  setVocabulary([]);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={vocabulary.length === 0}
              >
                {isEditing ? 'Update Lesson' : 'Create Lesson'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>Please log in to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lessons">
            <Book className="h-4 w-4 mr-2" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Manage Lessons</h1>
              {!editingLesson && (
                <Button onClick={handleNewLesson}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lesson
                </Button>
              )}
            </div>

            {editingLesson && <LessonForm />}

            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Existing Lessons</CardTitle>
                  <CardDescription>
                    Manage your Turkish language lessons here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Words</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lessons.map((lesson) => (
                          <TableRow key={lesson.id}>
                            <TableCell>{lesson.title}</TableCell>
                            <TableCell>
                              <Badge variant={
                                lesson.difficulty === 'beginner' ? 'default' :
                                lesson.difficulty === 'intermediate' ? 'secondary' :
                                'outline'
                              }>
                                {lesson.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell>{lesson.vocabulary.length}</TableCell>
                            <TableCell>{lesson.category}</TableCell>
                            <TableCell>{formatDate(lesson.createdAt)}</TableCell>
                            <TableCell>{formatDate(lesson.updatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(lesson)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(lesson.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* User management content */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure application settings.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Settings content */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 