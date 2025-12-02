import { useState, useEffect } from 'react';

const TextType = ({
  text = [],
  as: Component = 'span',
  typingSpeed = 100,
  pauseDuration = 2000,
  deletingSpeed = 50,
  loop = true,
  showCursor = true,
  cursorCharacter = '|',
  hideCursorWhileTyping = false,
  className = '',
  cursorClassName = '',
  style = {}
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showCursorState, setShowCursorState] = useState(true);

  useEffect(() => {
    if (text.length === 0) return;

    const currentWord = text[currentIndex];
    
    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting && displayText === currentWord) {
      setIsPaused(true);
      return;
    }

    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentIndex((prev) => (loop ? (prev + 1) % text.length : Math.min(prev + 1, text.length - 1)));
      return;
    }

    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(() => {
      setDisplayText((prev) => {
        if (isDeleting) {
          return currentWord.substring(0, prev.length - 1);
        } else {
          return currentWord.substring(0, prev.length + 1);
        }
      });
    }, speed);

    return () => clearTimeout(timer);
  }, [displayText, currentIndex, isDeleting, isPaused, text, typingSpeed, deletingSpeed, pauseDuration, loop]);

  // Cursor blink effect
  useEffect(() => {
    if (!showCursor) return;
    
    const cursorTimer = setInterval(() => {
      setShowCursorState((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorTimer);
  }, [showCursor]);

  const shouldShowCursor = showCursor && (!hideCursorWhileTyping || isDeleting || isPaused);

  return (
    <Component className={className} style={style}>
      {displayText}
      {shouldShowCursor && (
        <span 
          className={cursorClassName}
          style={{ 
            opacity: showCursorState ? 1 : 0,
            ...style
          }}
        >
          {cursorCharacter}
        </span>
      )}
    </Component>
  );
};

export default TextType;
