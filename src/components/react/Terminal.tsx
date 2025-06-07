import { useState, useEffect, useRef } from 'react';
// import { FaRegFolderClosed } from 'react-icons/fa6';
import { Config } from '../../config/Config';
import DraggableWindow from './DraggableWindow';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatHistory = {
  messages: Message[];
  input: string;
};

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Customize these placeholder messages for the input field
const PLACEHOLDER_MESSAGES = [
  'Type your question...',
  'What are your skills?',
  'Where are you located?',
  'What projects have you worked on?',
];

export default function Terminal({ isOpen, onClose }: TerminalProps) {
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    messages: [],
    input: '',
  });
  const [isTyping, setIsTyping] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    // const divsss = document.getElementById("hola-mundo")
    // divsss?.classList.add("hidden")

    let timeout: NodeJS.Timeout;
    const currentMessage = PLACEHOLDER_MESSAGES[currentPlaceholderIndex];

    const animatePlaceholder = () => {
      if (isDeleting) {
        if (placeholder.length === 0) {
          setIsDeleting(false);
          setCurrentPlaceholderIndex(
            (prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length
          );
          timeout = setTimeout(animatePlaceholder, 400);
        } else {
          setPlaceholder((prev) => prev.slice(0, -1));
          timeout = setTimeout(animatePlaceholder, 80);
        }
      } else {
        if (placeholder.length === currentMessage.length) {
          timeout = setTimeout(() => setIsDeleting(true), 1500);
        } else {
          setPlaceholder(currentMessage.slice(0, placeholder.length + 1));
          timeout = setTimeout(animatePlaceholder, 120);
        }
      }
    };

    timeout = setTimeout(animatePlaceholder, 100);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, currentPlaceholderIndex]);

  // Customize this welcome message with your information
  const welcomeMessage = `Welcome to My Portfolio

Name: ${Config.name}
Role: ${Config.role}
Contact: ${Config.contact.email}
GitHub: ${Config.social.github}

Ask me anything!
`;

  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Customize the system prompt with your personal information
  const systemPrompt = `IMPORTANT: You ARE ${Config.name} themselves. You must always speak in first-person ("I", "my", "me"). Never refer to "${Config.name}" in third-person.
CURRENT DATE: ${formattedDate} - Always use this exact date when discussing the current date/year.

Example responses:
Q: "What's your background?"
A: "I'm a ${Config.role} with a focus for ${Config.roleFocus}"

Core details about me:
- I'm a ${Config.role}
- My email is ${Config.contact.email}

My technical expertise:
${Config.skills.map(skill => `- ${skill}`).join('\n')}

Response rules:
1. ALWAYS use first-person (I, me, my)
2. Never say "${Config.name}" or refer to myself in third-person
3. Keep responses concise and professional
4. Use markdown formatting when appropriate
5. Maintain a friendly, conversational tone

If a question is unrelated to my work or portfolio, say: "That's outside my area of expertise. Feel free to email me at ${Config.contact.email} and we can discuss further!"`;

  useEffect(() => {
    setChatHistory((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'assistant', content: welcomeMessage },
      ],
    }));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollTo({top:messagesEndRef.current?.scrollHeight, behavior:"smooth"});
  }, [chatHistory.messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatHistory((prev) => ({ ...prev, input: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = chatHistory.input.trim();

    if (!userInput) return;

    setChatHistory((prev) => ({
      messages: [...prev.messages, { role: 'user', content: userInput }],
      input: '',
    }));

    setIsTyping(true);

    // await new Promise (resolve => setTimeout(resolve, 10000));
    
    try {
      const response = await fetch('https://simple-api-groq.vercel.app/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.messages,
            { role: 'user', content: userInput },
          ],
        }),
      });

      console.log("Recibiendo: ", response.ok)

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      setChatHistory((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'assistant', content: data.message },
        ],
      }));
    } catch (error) {
      setChatHistory((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            role: 'assistant',
            content: `I'm having trouble processing that. Please email me at ${Config.contact.email}`,
          },
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <DraggableWindow
      title={`${Config.website} ⸺ zsh`}
      onClose={onClose}
      initialPosition={{ 
        x: Math.floor(window.innerWidth * 0.1), 
        y: Math.floor(window.innerHeight * 0.1 + 20) 
      }}
      initialSize={{ width: 500, height: 300 }}
      className="bg-black/90 backdrop-blur-sm"
    >
      <div className='p-1 text-gray-200 font-mono text-sm h-full flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-y-auto rounded-lg p-1 ' ref={messagesEndRef}>
          {chatHistory.messages.map((msg, index) => (
            <div key={index} className='mb-2'>
              {msg.role === 'user' ? (
                <div className='flex items-start space-x-2'>
                  <span className='text-black dark:text-blue-800 font-bold'>{'>'}</span>
                  <pre className='whitespace-pre-wrap'>{msg.content}</pre>
                </div>
              ) : (
                <div className='flex items-start space-x-2'>
                  <span className='text-blue-800 font-bold'></span>
                  <pre className='whitespace-pre-wrap'>{msg.content}</pre>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className='flex items-center space-x-1'>
              <div className='w-2 h-2 bg-black dark:bg-blue-800 rounded-full animate-bounce' style={{ animationDelay: '0ms' }}></div>
              <div className='w-2 h-2 bg-black dark:bg-blue-800 rounded-full animate-bounce' style={{ animationDelay: '150ms' }}></div>
              <div className='w-2 h-2 bg-black dark:bg-blue-800 rounded-full animate-bounce' style={{ animationDelay: '300ms' }}></div>
            </div>
          )}
          {/* <div ref={messagesEndRef} /> */}
        </div>
        <form onSubmit={handleSubmit} className='mt-2 rounded-lg p-2'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
            <span className='whitespace-nowrap text-blue-400 font-bold'> root {'>'}</span>
            <input
              type='text'
              value={chatHistory.input}
              onChange={handleInputChange}
              className='w-full sm:flex-1 bg-transparent outline-none text-white placeholder-gray-400'
              placeholder={placeholder}
            />
          </div>
        </form>
      </div>
    </DraggableWindow>
  );
}
