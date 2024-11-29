import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { soundManager } from '@/lib/utils/sound'
import { useAuth } from '@/lib/context/AuthContext'
import { progressService } from '@/lib/services/progress-service'
import { LevelUpNotification } from '@/components/notifications/LevelUpNotification'
import type { VocabularyItem, Lesson } from '@/types/lesson'
import type { UserProgress } from '@/types/progress'

interface HangmanPracticeProps {
  vocabulary: VocabularyItem[]
  lesson: Lesson
}

const SPECIAL_CHARACTERS = [
  'ç',
  'ğ',
  'ı',
  'ö',
  'ş',
  'ü',
] as const

export const HangmanPractice = ({ vocabulary, lesson }: HangmanPracticeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [letters, setLetters] = useState<string[]>([])
  const [showAnswer, setShowAnswer] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null)
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number
    gemsEarned: number
  } | null>(null)
  const [practiceStartTime] = useState<number>(Date.now())

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { user } = useAuth()
  const currentItem = vocabulary[currentIndex]
  const wordSegments = currentItem.answer.split(' ')

  // Add a ref to track input position
  const inputPosition = useRef(0)

  useEffect(() => {
    if (user) {
      loadUserProgress()
    }
  }, [user])

  useEffect(() => {
    setLetters(Array(currentItem.answer.length).fill(''))
    setShowAnswer(false)
    setIsCorrect(false)
    inputPosition.current = 0
    
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    }, 0)
  }, [currentItem.answer])

  const loadUserProgress = async () => {
    if (!user) return
    try {
      const progress = await progressService.getUserProgress(user.uid)
      setUserProgress(progress)
    } catch (error) {
      console.error('Error loading user progress:', error)
    }
  }

  const updateProgress = async (isCorrect: boolean) => {
    if (!user || !currentItem) return
    
    try {
      await progressService.updateVocabularyProgress(
        user.uid,
        lesson.id,
        currentItem.id || `${currentIndex}`,
        isCorrect,
        Math.round((Date.now() - practiceStartTime) / 1000)
      )
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const handleNext = async () => {
    try {
      // Clear letters first
      setLetters(Array(currentItem.answer.length).fill(''))
      
      // Then update index
      setCurrentIndex(prev => prev < vocabulary.length - 1 ? prev + 1 : 0)

      // Reset states
      setShowAnswer(false)
      setIsCorrect(false)
      inputPosition.current = 0

      // Handle progress updates in the background
      Promise.all([
        updateProgress(isCorrect),
        progressService.updateQuestProgress(user!.uid, 'words', 1),
        progressService.addXP(user!.uid, isCorrect ? 10 : 1),
        progressService.getUserProgress(user!.uid).then(newProgress => {
          if (userProgress && newProgress && 
              newProgress.xp.level > userProgress.xp.level) {
            setLevelUpInfo({
              level: newProgress.xp.level,
              gemsEarned: newProgress.xp.level * 5
            })
            soundManager.play('levelUp')
          }
        })
      ]).catch(error => {
        console.error('Error updating progress:', error)
      })
    } catch (error) {
      console.error('Error in handleNext:', error)
    }
  }

  // Modify the global keyboard listener to only handle next
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      // Only handle Enter for next when answer is shown and not focused on input
      if (e.key === 'Enter' && showAnswer && !(e.target instanceof HTMLInputElement)) {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [showAnswer])

  const checkWord = () => {
    const attempt = letters.join('').toLowerCase()
    const isAnswerCorrect = attempt === currentItem.answer.toLowerCase()
    setIsCorrect(isAnswerCorrect)
    setShowAnswer(true)
    soundManager.play(isAnswerCorrect ? 'correct' : 'incorrect')
  }

  // Add helper function to check if word is complete
  const isWordComplete = () => {
    const totalLength = currentItem.answer
      .split('')
      .filter(char => char !== ' ')
      .length
    
    const filledLetters = letters.filter(letter => letter).length
    return filledLetters === totalLength
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Use new helper function
      if (!showAnswer && isWordComplete()) {
        checkWord()
      } else if (showAnswer) {
        handleNext()
      }
      return
    }

    if (e.key === 'Backspace') {
      if (!letters[index]) {
        e.preventDefault()
        // Only move back if we're not at the first input
        if (index > 0) {
          // Clear previous letter
          setLetters(prev => {
            const newLetters = [...prev]
            newLetters[index - 1] = ''
            return newLetters
          })
          // Move focus back
          inputRefs.current[index - 1]?.focus()
          inputPosition.current = index - 1
        }
      }
    }
  }

  const handleInputChange = (index: number, value: string) => {
    if (!value) {
      // Don't do anything on empty value - let handleKeyDown handle backspace
      return
    }

    const letter = value.slice(-1)
    setLetters(prev => {
      const newLetters = [...prev]
      newLetters[index] = letter
      return newLetters
    })

    // Update position ref
    inputPosition.current = index

    // Move to next input if available
    if (index < currentItem.answer.length - 1) {
      inputRefs.current[index + 1]?.focus()
      inputPosition.current = index + 1
    }
  }

  const insertSpecialCharacter = (char: string) => {
    const currentPos = inputPosition.current
    if (currentPos < currentItem.answer.length && !showAnswer) {
      // Update letter at current position
      setLetters(prev => {
        const newLetters = [...prev]
        newLetters[currentPos] = char
        return newLetters
      })

      // Move to next position if available
      if (currentPos < currentItem.answer.length - 1) {
        inputRefs.current[currentPos + 1]?.focus()
        inputPosition.current = currentPos + 1
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-6 p-6">
        {/* Question */}
        <div className="text-center space-y-2">
          <p className="text-xl font-medium">
            {currentItem.question}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            translated into Turkish is
          </p>
        </div>

        {/* Word Input */}
        <div className="flex flex-wrap gap-6 justify-center">
          {wordSegments.map((segment, segmentIndex) => (
            <div key={segmentIndex} className="flex gap-1">
              {segment.split('').map((_, letterIndex) => {
                const globalIndex = wordSegments
                  .slice(0, segmentIndex)
                  .reduce((acc, seg) => acc + seg.length, 0) + letterIndex
                
                return (
                  <div 
                    key={`${segmentIndex}-${letterIndex}`} 
                    className="relative w-10 pb-2"
                  >
                    <input
                      ref={el => {
                        if (el) inputRefs.current[globalIndex] = el
                      }}
                      type="text"
                      maxLength={1}
                      value={letters[globalIndex] || ''}
                      onChange={(e) => handleInputChange(globalIndex, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, globalIndex)}
                      className={cn(
                        "w-full text-center text-2xl font-bold bg-transparent",
                        "focus:outline-none",
                        "dark:text-white",
                        "mb-1"
                      )}
                      aria-label={`Letter ${globalIndex + 1} of ${currentItem.answer.length}`}
                      disabled={showAnswer}
                    />
                    <div className={cn(
                      "absolute bottom-0 left-0 right-0 h-1",
                      "bg-gray-300 dark:bg-gray-600",
                      showAnswer && (
                        letters[globalIndex]?.toLowerCase() === segment[letterIndex]?.toLowerCase()
                          ? "bg-green-500 dark:bg-green-500"
                          : "bg-red-500 dark:bg-red-500"
                      )
                    )} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Special Characters */}
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {SPECIAL_CHARACTERS.map((char) => (
            <Button
              key={char}
              variant="outline"
              onClick={() => insertSpecialCharacter(char)}
              className="w-12 h-12 text-xl font-medium rounded-md"
              disabled={showAnswer}
            >
              {char}
            </Button>
          ))}
        </div>

        {/* Answer Status */}
        {showAnswer && (
          <div
            className={cn(
              "text-center p-4 rounded-lg",
              isCorrect 
                ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            )}
          >
            {isCorrect ? (
              <p className="font-medium text-lg">Correct!</p>
            ) : (
              <p className="text-sm mt-1">
                The correct answer is: {currentItem.answer}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={checkWord}
            className="w-[140px]"
            disabled={showAnswer || !isWordComplete()}
          >
            Check Answer
          </Button>
          <Button
            onClick={handleNext}
            className="w-[140px]"
            disabled={!showAnswer}
          >
            Next
          </Button>
        </div>
      </div>

      {levelUpInfo && (
        <LevelUpNotification
          level={levelUpInfo.level}
          gemsEarned={levelUpInfo.gemsEarned}
          onClose={() => setLevelUpInfo(null)}
        />
      )}
    </div>
  )
} 