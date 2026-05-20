import { useState, useEffect } from 'react';

interface TypingAnimationProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  delayBetween?: number;
}

export default function TypingAnimation({
  phrases,
  typingSpeed = 80,
  deletingSpeed = 40,
  delayBetween = 2000,
}: TypingAnimationProps) {
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const currentFullPhrase = phrases[currentPhraseIdx];

    if (isDeleting) {
      timer = setTimeout(() => {
        setDisplayedText((prev) => prev.slice(0, -1));
      }, deletingSpeed);
    } else {
      timer = setTimeout(() => {
        setDisplayedText(currentFullPhrase.slice(0, displayedText.length + 1));
      }, typingSpeed);
    }

    // Logic transitions
    if (!isDeleting && displayedText === currentFullPhrase) {
      // Pause before starting deletion
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, delayBetween);
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentPhraseIdx((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIdx, phrases, typingSpeed, deletingSpeed, delayBetween]);

  return (
    <span className="inline-flex items-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 font-bold">
      {displayedText}
      <span className="w-[3px] h-[1.1em] ml-1 bg-cyan-400 animate-pulse inline-block" />
    </span>
  );
}
