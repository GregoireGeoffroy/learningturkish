"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { lessonService } from '@/lib/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, X, Loader2 } from 'lucide-react';
import type { Lesson, VocabularyItem } from '@/types/lesson';
import { Textarea } from '@/components/ui/textarea';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Form state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState<number>(1);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([
    { question: '', answer: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkVocabulary, setBulkVocabulary] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const fetchedLessons = await lessonService.getAllLessons();
      setLessons(fetchedLessons);
      if (!editingLessonId) {
        setOrder(fetchedLessons.length + 1);
      }
    } catch (error) {
      setError('Failed to load lessons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingLessonId(null);
    setTitle('');
    setDescription('');
    setOrder(lessons.length + 1);
    setVocabulary([{ question: '', answer: '' }]);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id ?? null);
    setTitle(lesson.title);
    setDescription(lesson.description);
    setOrder(lesson.order);
    setVocabulary(lesson.vocabulary);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }

    try {
      await lessonService.deleteLesson(id);
      await loadLessons();
    } catch (error) {
      setError('Failed to delete lesson');
      console.error(error);
    }
  };

  const handleAddVocabularyItem = () => {
    setVocabulary([...vocabulary, { question: '', answer: '' }]);
  };

  const handleVocabularyChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newVocabulary = [...vocabulary];
    newVocabulary[index] = { ...newVocabulary[index], [field]: value };
    setVocabulary(newVocabulary);
  };

  const handleRemoveVocabularyItem = (index: number) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  const handleBulkVocabularySubmit = () => {
    const pairs = bulkVocabulary
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const separators = ['→', '->'];
        let [question, answer] = ['', ''];
        
        for (const separator of separators) {
          if (line.includes(separator)) {
            [question, answer] = line.split(separator).map(s => s.trim());
            break;
          }
        }

        return question && answer ? { question, answer } : null;
      })
      .filter((item): item is VocabularyItem => item !== null);

    if (pairs.length > 0) {
      setVocabulary(pairs);
      setShowBulkInput(false);
      setBulkVocabulary('');
    } else {
      setError('No valid vocabulary pairs found. Please use format: question → answer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const filteredVocabulary = vocabulary.filter(
        item => item.question.trim() !== '' && item.answer.trim() !== ''
      );

      const lessonData = {
        title,
        description,
        order,
        vocabulary: filteredVocabulary,
      };

      if (editingLessonId) {
        await lessonService.updateLesson(editingLessonId, lessonData);
      } else {
        await lessonService.createLesson(lessonData);
      }

      resetForm();
      await loadLessons();
    } catch (error) {
      setError(`Failed to ${editingLessonId ? 'update' : 'create'} lesson`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {editingLessonId ? 'Edit Lesson' : 'Create New Lesson'}
      </h1>

      {/* Add/Edit Lesson Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                value={order.toString()}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                min={1}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[150px] p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
              placeholder="Enter a detailed description of the lesson..."
              required
            />
          </div>
        </div>

        {/* Vocabulary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium">Vocabulary</label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBulkInput(!showBulkInput)}
            >
              {showBulkInput ? 'Single Entry Mode' : 'Bulk Entry Mode'}
            </Button>
          </div>

          {showBulkInput ? (
            <div className="space-y-4">
              <Textarea
                value={bulkVocabulary}
                onChange={(e) => setBulkVocabulary(e.target.value)}
                className="w-full min-h-[200px]"
                placeholder="Enter vocabulary pairs (one per line)&#10;Format: question → answer&#10;Example:&#10;house → ev&#10;cat → kedi"
              />
              <Button type="button" onClick={handleBulkVocabularySubmit}>
                Convert to Vocabulary Items
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {vocabulary.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => handleVocabularyChange(index, 'question', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Question"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.answer}
                      onChange={(e) => handleVocabularyChange(index, 'answer', e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                      placeholder="Answer"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveVocabularyItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVocabularyItem}
              >
                Add Vocabulary Item
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingLessonId ? 'Update Lesson' : 'Create Lesson'}
          </Button>
          {editingLessonId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

      {/* Preview Section */}
      {(title || description || vocabulary.length > 0) && (
        <div className="mb-8 p-4 border rounded-lg dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <div className="space-y-2">
            <h3 className="font-medium">{title || 'Untitled Lesson'}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description || 'No description'}</p>
            {vocabulary.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">Vocabulary Items:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {vocabulary.map((item, index) => (
                    <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {item.question} → {item.answer}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Lessons</h2>
        {loading ? (
          <p>Loading lessons...</p>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="border rounded p-4 dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-500">
                      {lesson.order}.
                    </span>
                    <h3 className="font-semibold">{lesson.title}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(lesson)}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(lesson.id!)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 