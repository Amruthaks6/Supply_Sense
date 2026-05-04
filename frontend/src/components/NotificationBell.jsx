import React, { useState, useEffect } from 'react';
import { Bell, X, Info, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = JSON.parse(localStorage.getItem('supply_sense_user') || '{}');

    useEffect(() => {
        fetchNotifications();

        if (user.id) {
            socket.emit('join-user-room', `user_${user.id}`);
            socket.on('notification', (notif) => {
                setNotifications(prev => [notif, ...prev]);
                setUnreadCount(prev => prev + 1);
                // Optional: Play sound or show toast
            });
        }

        return () => {
            socket.off('notification');
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/notifications');
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error('Failed to fetch notifications');
        }
    };

    const markAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await axios.post('http://localhost:5000/api/notifications/mark-read');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        } catch (err) {
            console.error('Failed to mark as read');
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) markAsRead();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Success': return <CheckCircle className="text-green-500 w-4 h-4" />;
            case 'Warning': return <AlertTriangle className="text-amber-500 w-4 h-4" />;
            case 'Message': return <MessageSquare className="text-emerald-500 w-4 h-4" />;
            default: return <Info className="text-blue-500 w-4 h-4" />;
        }
    };

    return (
        <div className="relative">
            <button 
                onClick={toggleOpen}
                className="p-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all relative"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[70] overflow-hidden"
                        >
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 italic text-sm">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    notifications.map((n, i) => {
                                        const dateObj = new Date(n.createdAt || Date.now());
                                        const formattedDate = isNaN(dateObj.getTime()) ? 'Just now' : dateObj.toLocaleString();
                                        
                                        return (
                                            <div key={i} className={`p-4 border-b border-gray-50 flex gap-3 transition-colors ${!n.isRead ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}>
                                                <div className="mt-1 flex-shrink-0">{getIcon(n.type)}</div>
                                                <div>
                                                    <p className="text-sm text-gray-800 leading-tight">{n.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 font-medium">{formattedDate}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            <div className="px-4 py-2 bg-gray-50 text-center">
                                <button className="text-xs font-bold text-primary-600 hover:underline">View All</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
