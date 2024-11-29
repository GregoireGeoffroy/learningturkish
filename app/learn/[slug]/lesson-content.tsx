"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Book, GraduationCap, Brain } from 'lucide-react';
import { lessonService } from '@/lib/services/lesson-service';
import { HangmanPractice } from '@/components/practice/HangmanPractice';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lesson } from '@/types/lesson';

const VocabularyTable = ({ vocabulary }: { vocabulary: Lesson['vocabulary'] }) => {
  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-700">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              English
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Turkish
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {vocabulary.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.question}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleSpeak(item.answer)}
                  className="text-sm text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left w-full"
                  aria-label={`Speak ${item.answer}`}
                >
                  {item.answer}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export function LessonContent({ slug }: { slug: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadLesson = async () => {
      try {
        // First try to get lesson by slug
        const fetchedLesson = await lessonService.getLessonBySlug(slug);
        if (!fetchedLesson) {
          // Fallback to ID if slug not found (for backward compatibility)
          const lessonById = await lessonService.getLesson(slug);
          if (!lessonById) {
            setError('Lesson not found');
            return;
          }
          setLesson(lessonById);
        } else {
          setLesson(fetchedLesson);
        }
      } catch (error) {
        setError('Failed to load lesson');
        console.error('Error loading lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="bg-red-50 dark:bg-red-900/50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription className="text-red-500">
              {error || 'Lesson not found'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Lessons
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{lesson.title}</CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">
                <Book className="mr-2 h-4 w-4" />
                Lesson Content
              </TabsTrigger>
              <TabsTrigger value="vocabulary">
                <GraduationCap className="mr-2 h-4 w-4" />
                Vocabulary
              </TabsTrigger>
              <TabsTrigger value="practice">
                <Brain className="mr-2 h-4 w-4" />
                Practice
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <Card>
                <CardContent className="prose dark:prose-invert max-w-none p-6">
                  <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vocabulary">
              <Card>
                <CardContent className="p-6">
                  <ScrollArea className="h-[400px]">
                    <VocabularyTable vocabulary={lesson.vocabulary} />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practice">
              <HangmanPractice 
                vocabulary={lesson.vocabulary} 
                lesson={lesson}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 