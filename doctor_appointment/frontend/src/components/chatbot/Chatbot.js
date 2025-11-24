import React, { useState, useEffect, useRef } from 'react';
import { IoChatbubbleEllipsesSharp, IoSend } from 'react-icons/io5';
import './Chatbot.css';
import axios from 'axios'; // Ensure axios is imported

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChatbot = () => {
        setIsOpen(!isOpen);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (input.trim() === '') return;

        const userMessage = { type: 'user', text: input };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setInput('');
        setIsLoading(true);

        // Capture the input message here, as `input` will be cleared before the async call
        const currentInputMessage = input;

        try {
            // Prepare chat history for the backend
            // Note: Your backend doesn't seem to use chatHistory for RAG context,
            // but if it did, you'd send it like this.
            const chatHistoryForLLM = messages.map(msg => ({
                type: msg.type,
                text: msg.text
            }));

            // --- CORRECTED AXIOS CALL ---
            const response = await axios.post('/chat', {
                // Axios automatically sets Content-Type: application/json
                // and stringifies the data if it's an object.
                message: currentInputMessage, // Pass the message directly as part of the data object
                chatHistory: chatHistoryForLLM // If your backend expects chat history
            });
            // --- END CORRECTED AXIOS CALL ---

            // Axios responses are already parsed into .data
            const data = response.data; // Axios response object has a .data property

            setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: data.reply }]);
        } catch (error) {
            console.error('Error sending message:', error);
            // More specific error message if backend returns one
            const errorMessage = error.response && error.response.data && error.response.data.error
                                 ? error.response.data.error
                                 : 'Sorry, something went wrong. Please try again.';
            setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-toggle-button" onClick={toggleChatbot}>
                <IoChatbubbleEllipsesSharp size={30} />
            </div>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <h3>Virtual Assistant</h3>
                        <button className="close-button" onClick={toggleChatbot}>X</button>
                    </div>
                    <div className="chatbot-messages">
                        {messages.length === 0 && (
                            <div className="welcome-message">
                                <p>Hi there! How can I help you today?</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.type}`}>
                                <p>{msg.text}</p>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message bot loading">
                                <p>...</p>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            placeholder="Type your question..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button onClick={handleSend} disabled={isLoading}>
                            <IoSend />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chatbot;