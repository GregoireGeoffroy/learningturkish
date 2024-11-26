"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { lessonService } from '@/lib/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, X } from 'lucide-react';
import type { Lesson, VocabularyItem } from '@/types/lesson';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Form state
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(1);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([
    { question: '', answer: '' }
  ]);

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

  const resetForm = () => {
    setEditingLessonId(null);
    setTitle('');
    setDescription('');
    setOrder(lessons.length + 1);
    setVocabulary([{ question: '', answer: '' }]);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Filter out empty vocabulary items
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
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Order</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value))}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            min={1}
            required
          />
        </div>

        {/* Vocabulary Items */}
        <div className="space-y-4">
          <label className="block text-sm font-medium mb-1">Vocabulary</label>
          {vocabulary.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={item.question}
                onChange={(e) => handleVocabularyChange(index, 'question', e.target.value)}
                placeholder="Question (e.g., house)"
                className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
              <input
                type="text"
                value={item.answer}
                onChange={(e) => handleVocabularyChange(index, 'answer', e.target.value)}
                placeholder="Answer (e.g., ev)"
                className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                required
              />
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleRemoveVocabularyItem(index)}
                disabled={vocabulary.length === 1}
              >
                <X size={20} />
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

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-2">
          <Button type="submit">
            {editingLessonId ? 'Update Lesson' : 'Create Lesson'}
          </Button>
          {editingLessonId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel Edit
            </Button>
          )}
        </div>
      </form>

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
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {lesson.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Order: {lesson.order}
                    </p>
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
                <div className="mt-2">
                  <h4 className="font-medium text-sm mb-2">Vocabulary:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lesson.vocabulary.map((item, index) => (
                      <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        {item.question} → {item.answer}
                      </div>
                    ))}
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