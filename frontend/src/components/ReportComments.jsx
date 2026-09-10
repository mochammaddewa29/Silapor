import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { reportsAPI } from '../services/api';

const ReportComments = ({ reportId, currentUser, isPublic = false }) => {
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize and listen to Firebase Firestore
  useEffect(() => {
    if (!reportId) return;

    // Load initial data
    if (isPublic) {
      reportsAPI.getPublicComments(reportId)
        .then((data) => setComments(data))
        .catch(console.error);
    } else {
      reportsAPI.getComments(reportId)
        .then((data) => setComments(data))
        .catch(console.error);
    }

    // Set up Real-time listener for this specific report's comments
    const q = query(
      collection(db, `reports/${reportId}/comments`),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const realTimeComments = snapshot.docs.map(doc => doc.data());
      if (realTimeComments.length > 0) {
        setComments(realTimeComments);
      }
    }, (error) => {
      console.error("Error listening to comments:", error);
    });

    return () => unsubscribe();
  }, [reportId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isPublic) {
        await reportsAPI.addPublicComment(reportId, newMessage);
      } else {
        await reportsAPI.addComment(reportId, newMessage);
      }
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send comment:', err);
      alert('Gagal mengirim pesan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-96 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 mt-4">
      <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Live Chat Tiket
        </h3>
        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
          Real-time Secured
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
            <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Belum ada percakapan.</p>
            <p>Mulai diskusi tentang aduan ini!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMe = String(comment.user_id) === String(currentUser?.id);
            const isAdmin = comment.role === 'admin';
            
            return (
              <div key={comment.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[85%]">
                  {!isMe && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${isAdmin ? 'bg-indigo-600' : 'bg-gray-500'}`}>
                      {comment.sender_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {comment.sender_name} {isAdmin && <span className="text-indigo-600 font-semibold">(Admin)</span>}
                    </span>
                    
                    <div className={`px-4 py-2 rounded-2xl shadow-sm relative ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{comment.message}</p>
                      <span className={`text-[10px] mt-1 block text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="bg-white border-t p-3">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan balasan..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-900"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 w-10 h-10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportComments;
