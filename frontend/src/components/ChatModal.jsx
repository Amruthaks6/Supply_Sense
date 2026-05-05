import React, { useState, useEffect, useRef } from 'react';
import API_URL from '../api/config';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, User, Phone } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io(`${API_URL}`);

const ChatModal = ({ isOpen, onClose, donationId, senderName, receiverName, receiverPhone, foodName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  const cleanSender = senderName?.trim().toLowerCase() || 'user';
  const cleanReceiver = receiverName?.trim().toLowerCase() || 'user';
  const room = `chat_${donationId}_${[cleanSender, cleanReceiver].sort().join('_')}`;

  useEffect(() => {
    if (!isOpen) return;

    // Join room
    socket.emit('join-chat', room);

    // Fetch history
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/messages/${donationId}`, {
          params: { sender: senderName, receiver: receiverName }
        });
        setMessages(res.data);
      } catch (err) {
        console.error('History error:', err);
      }
    };
    fetchHistory();

    // Listen for new messages
    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('new-message');
    };
  }, [isOpen, donationId, senderName, receiverName, room]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const data = {
      donationId,
      senderName,
      receiverName,
      message: newMessage,
      createdAt: new Date().toISOString()
    };

    socket.emit('send-message', data);
    setNewMessage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col h-[80vh] sm:h-[600px]"
          >
            {/* Header */}
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{receiverName}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest">Re: {foodName}</p>
                    {receiverPhone && (
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                        <Phone size={10} /> {receiverPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm italic">No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.senderName === senderName;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm ${
                      isMe 
                        ? 'bg-emerald-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      <p>{msg.message}</p>
                      <p className={`text-[9px] mt-1 text-right opacity-60`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatModal;
