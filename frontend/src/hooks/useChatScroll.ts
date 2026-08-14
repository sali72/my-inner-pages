import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';

export function useChatScroll(messages: ChatMessage[]) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const initialRender = useRef(true);
  const userScrolledUp = useRef(false);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      return;
    }
    if (!userScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const onScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
      userScrolledUp.current = !isAtBottom;
      setShowScrollButton(!isAtBottom && messages.length > 0);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    userScrolledUp.current = false;
    setShowScrollButton(false);
  }, []);

  const resetScrollLock = useCallback(() => {
    userScrolledUp.current = false;
  }, []);

  return {
    messagesEndRef,
    showScrollButton,
    scrollToBottom,
    resetScrollLock,
  };
}
