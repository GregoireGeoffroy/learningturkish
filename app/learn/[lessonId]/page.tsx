"use client";

import { use } from 'react';
import { LessonContent } from './lesson-content';

export default function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const resolvedParams = use(params);
  return <LessonContent lessonId={resolvedParams.lessonId} />;
} 