import React, { createContext, useState, useContext, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeUserId, setActiveUserId] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});

  // Fetch users if Admin
  useEffect(() => {
    if (!user) {
      setChatUsers([]);
      setUnreadCounts({});
      setLatestMessages({});
      return;
    }

    if (isAdmin) {
      const loadUsers = async () => {
        try {
          const users = await chatAPI.getUsers();
          setChatUsers(users || []);
        } catch (err) {
          console.error('Failed to load users for chat context:', err);
        }
      };
      
      // Initial load
      loadUsers();

      // Poll every 10 seconds for new users/latest message changes
      const intervalId = setInterval(() => {
        loadUsers();
      }, 10000);

      return () => clearInterval(intervalId);
    } else {
      // If regular user, their only "chat user" is themselves (Admin responds to them)
      setChatUsers([{ id: user.id, full_name: 'Admin Support' }]);
      // Immediately set their active chat to themselves
      setActiveUserId(user.id);
    }
  }, [user, isAdmin]);

  // Listen to messages for unread counts and latest messages
  useEffect(() => {
    if (!user || chatUsers.length === 0) return;

    const unsubscribes = [];

    chatUsers.forEach((chatUser) => {
      const targetUserId = isAdmin ? chatUser.id : user.id;

      const q = query(
        collection(db, `direct_chats/${targetUserId}/messages`),
        orderBy('created_at', 'asc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        if (messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          
          setLatestMessages(prev => ({
            ...prev,
            [targetUserId]: lastMsg
          }));

          // Unread logic: if the last message is not by the current logged-in user
          if (String(lastMsg.sender_id) !== String(user.id)) {
            setUnreadCounts(prev => {
              const currentUnread = prev[targetUserId] || 0;
              return {
                ...prev,
                [targetUserId]: currentUnread + 1 
              };
            });
          }
        }
      }, (error) => {
        console.error("Error listening to direct chats for user", targetUserId, error);
      });

      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [chatUsers, user, isAdmin]);

  // Clear unread when viewing a chat
  useEffect(() => {
    if (activeUserId && isChatOpen) {
      setUnreadCounts(prev => ({
        ...prev,
        [activeUserId]: 0
      }));
    }
  }, [activeUserId, isChatOpen, latestMessages]);

  const openChat = (userId = null) => {
    if (userId) {
      setActiveUserId(userId);
    } else if (!isAdmin && user) {
      setActiveUserId(user.id);
    }
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    if (!isChatOpen && !isAdmin && user) {
      setActiveUserId(user.id);
    }
    setIsChatOpen(!isChatOpen);
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + (b > 0 ? 1 : 0), 0);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        activeUserId,
        chatUsers,
        latestMessages,
        unreadCounts,
        totalUnread,
        openChat,
        closeChat,
        toggleChat,
        setActiveUserId
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
