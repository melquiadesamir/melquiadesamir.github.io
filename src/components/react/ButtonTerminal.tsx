import { useState, useEffect } from "react";
import Terminal from "./Terminal";

const messages = [
    "Hola, Como estas?", 
    "Quieres saber mas de lo que esta pasando?"
]

export default function ButtonTerminal() {
    const [isOpen, setIsOpen] = useState(false)

    const [currentMessage, setCurrentMessage] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)
    const [messageIndex, setMessageIndex] = useState(0)

    useEffect(() => {
        if (currentIndex < messages[messageIndex].length){
            const timeout = setTimeout(()=>{
                setCurrentMessage(prev => prev + messages[messageIndex][currentIndex])
                setCurrentIndex(prev => prev + 1)
            }, 100)

            return () => clearTimeout(timeout)
        } else {

            const timeout = setTimeout(()=>{
                setCurrentMessage("")
                setCurrentIndex(0)
                setMessageIndex(prev => (prev + 1) % messages.length)
            }, 2000)
            return () => clearTimeout(timeout)
        }
        
    }, [currentIndex, messageIndex]);

    return (
        <>
     
        <Terminal isOpen={isOpen} onClose={()=>{
            setIsOpen(false)
        }}/>
        <div onClick={()=>{setIsOpen(true)}}>
            {currentMessage} <span className="animate-pulse">|</span>
        </div>
        </>
    );
}