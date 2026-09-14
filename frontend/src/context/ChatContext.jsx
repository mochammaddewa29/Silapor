import React, { createContext, useState, useContext, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeReportId, setActiveReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});

  // Fetch reports when user logs in
  useEffect(() => {
    if (!user) {
      setReports([]);
      setUnreadCounts({});
      setLatestMessages({});
      return;
    }

    const loadReports = async () => {
      try {
        const data = await reportsAPI.getAll();
        // For admin we might want to only show reports that have chats or just limit to recent ones.
        // For now, we show active reports (not Selesai/Ditolak) or reports that they interacted with.
        const activeReports = (data.reports || []).filter(r => r.status !== 'Selesai' && r.status !== 'Ditolak');
        setReports(activeReports);
      } catch (err) {
        console.error('Failed to load reports for chat context:', err);
      }
    };

    loadReports();
  }, [user]);

  // Listen to individual reports' comments to track latest message and unread count
  useEffect(() => {
    if (!user || reports.length === 0) return;

    const unsubscribes = [];

    reports.forEach((report) => {
      const q = query(
        collection(db, `reports/${report.id}/comments`),
        orderBy('created_at', 'asc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => doc.data());
        if (comments.length > 0) {
          const lastComment = comments[comments.length - 1];
          
          setLatestMessages(prev => ({
            ...prev,
            [report.id]: lastComment
          }));

          // Simple unread logic: if the last comment is not by the current user and not currently viewing
          if (String(lastComment.user_id) !== String(user.id)) {
            setUnreadCounts(prev => {
              // Only increment if we haven't seen it in the current session
              // (Since we don't store read status in DB for this simple version)
              const currentUnread = prev[report.id] || 0;
              return {
                ...prev,
                [report.id]: currentUnread + 1 
              };
            });
          }
        }
      }, (error) => {
        console.error("Error listening to comments for report", report.id, error);
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [reports, user]);

  // Clear unread when viewing a chat
  useEffect(() => {
    if (activeReportId && isChatOpen) {
      setUnreadCounts(prev => ({
        ...prev,
        [activeReportId]: 0
      }));
    }
  }, [activeReportId, isChatOpen, latestMessages]);

  const openChat = (reportId = null) => {
    if (reportId) {
      setActiveReportId(reportId);
    }
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // Convert unread counts object to a total number, avoiding NaNs
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + (b > 0 ? 1 : 0), 0);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        activeReportId,
        reports,
        latestMessages,
        unreadCounts,
        totalUnread,
        openChat,
        closeChat,
        toggleChat,
        setActiveReportId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
