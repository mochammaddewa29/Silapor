import React from 'react';
import { useChat } from '../context/ChatContext';
import { MessageCircle, X, ChevronLeft, Headset } from 'lucide-react';
import DirectChatBox from './DirectChatBox';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';

const GlobalChatWidget = () => {
  const { 
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
  } = useChat();
  
  const { user, isAdmin } = useAuth();

  // If user is not logged in, don't render the chat widget
  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] flex flex-col items-end">
      
      {/* Floating Action Button (Only show when chat is closed) */}
      {!isChatOpen && (
        <button
          onClick={toggleChat}
          className="relative flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl shadow-blue-500/40 transition-transform hover:scale-110 active:scale-95"
        >
          <MessageCircle className="w-7 h-7" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white border-2 border-white shadow-sm">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Widget */}
      <div 
        className={`transition-all duration-300 origin-bottom-right bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl overflow-hidden flex flex-col ${
          isChatOpen ? 'opacity-100 scale-100 h-[500px] w-[340px] sm:w-[380px]' : 'opacity-0 scale-95 h-0 w-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2">
            {isAdmin && activeUserId && (
              <button
                onClick={() => setActiveUserId(null)}
                className="p-1 -ml-1.5 hover:bg-blue-700 rounded-full transition-colors"
                title="Kembali ke Daftar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {!isAdmin && (
              <Headset className="w-5 h-5" />
            )}
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                {activeUserId ? (isAdmin ? chatUsers.find(u => u.id === activeUserId)?.full_name || 'Live Chat' : 'Admin Support') : 'Daftar Pesan Masuk'}
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </div>
              </h3>
              {isAdmin && activeUserId && (
                <span className="text-[10px] font-mono text-blue-100 block">
                  {(() => {
                    const uname = chatUsers.find(u => u.id === activeUserId)?.username || 'user';
                    return uname.includes('@') ? uname : `@${uname}`;
                  })()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={closeChat}
              className="p-1 hover:bg-blue-700 rounded-full transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-800">
          {isAdmin && !activeUserId ? (
            /* --- ADMIN: LIST VIEW --- */
            chatUsers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Belum Ada Percakapan</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Belum ada pengguna yang menghubungi Anda.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {[...chatUsers]
                    .sort((a, b) => {
                      const timeA = latestMessages[a.id] ? new Date(latestMessages[a.id].created_at).getTime() : 0;
                      const timeB = latestMessages[b.id] ? new Date(latestMessages[b.id].created_at).getTime() : 0;
                      return timeB - timeA;
                    })
                    .map(chatUser => {
                      const unread = unreadCounts[chatUser.id] || 0;
                      const latestMsg = latestMessages[chatUser.id];
                    
                    return (
                      <button
                        key={chatUser.id}
                        onClick={() => openChat(chatUser.id)}
                        className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-start gap-3 relative ${
                          unread > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        {/* Avatar/Icon */}
                        <div className="relative shrink-0">
                          {chatUser.photo_url ? (
                            <img src={chatUser.photo_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold bg-indigo-500`}>
                              {chatUser.full_name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {unread > 0 && (
                            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white dark:border-gray-800"></span>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h4 className={`text-sm truncate pr-2 ${unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-200'}`}>
                              {chatUser.full_name}
                            </h4>
                            <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                              {latestMsg ? formatDate(latestMsg.created_at) : ''}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${unread > 0 ? 'font-medium text-gray-800 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {latestMsg ? (
                              <>
                                {String(latestMsg.sender_id) === String(user.id) ? 'Anda: ' : ''}
                                {latestMsg.message}
                              </>
                            ) : (
                              chatUser.latest_message || 'Mulai percakapan baru.'
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            /* --- CHAT VIEW (Admin and User) --- */
            <DirectChatBox 
              targetUserId={activeUserId} 
              currentUser={user} 
              className="h-full flex flex-col" 
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default GlobalChatWidget;
