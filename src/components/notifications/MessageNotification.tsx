import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "@/components/ui/icon";
import { messagesStore, Message } from "@/store/messagesStore";
import { useNavigate } from "react-router-dom";
import { getSoundSettings } from "@/components/dashboard/DashboardSettingsSection";

interface NotificationItem extends Message {
  chatName: string;
}

const createNotificationSound = () => {
  const settings = getSoundSettings();
  if (!settings.messageNotifications) return;
  
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export const MessageNotification = ({ userEmail }: { userEmail: string }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let lastMessageCount = messagesStore.getTotalUnreadCount(userEmail);

    const checkNewMessages = () => {
      const currentCount = messagesStore.getTotalUnreadCount(userEmail);
      
      if (currentCount > lastMessageCount) {
        const chats = messagesStore.getUserChats(userEmail);
        const newMessages: NotificationItem[] = [];

        chats.forEach(chat => {
          const messages = messagesStore.getMessages(chat.id);
          const unreadMessages = messages.filter(m => !m.read && m.senderId !== userEmail);
          
          unreadMessages.forEach(msg => {
            const isAlreadyShown = notifications.some(n => n.id === msg.id);
            if (!isAlreadyShown) {
              newMessages.push({
                ...msg,
                chatName: chat.recommenderEmail === userEmail ? chat.tenantName : chat.recommenderName,
              });
            }
          });
        });

        if (newMessages.length > 0) {
          try {
            createNotificationSound();
          } catch (err) {
            console.log('Audio play failed:', err);
          }
          
          setNotifications(prev => [...prev, ...newMessages]);
          
          newMessages.forEach(msg => {
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== msg.id));
            }, 5000);
          });
        }
      }

      lastMessageCount = currentCount;
    };

    const unsubscribe = messagesStore.subscribe(checkNewMessages);
    return unsubscribe;
  }, [userEmail, notifications]);

  const handleNotificationClick = (notification: NotificationItem) => {
    navigate('/dashboard', { state: { activeSection: 'messages', chatId: notification.chatId } });
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
  };

  const handleClose = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className="bg-white border-2 border-primary rounded-lg shadow-2xl p-4 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="MessageSquare" size={20} className="text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-foreground text-sm truncate">
                    {notification.chatName}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose(notification.id);
                    }}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
                {notification.photos && notification.photos.length > 0 ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Icon name="Image" size={14} />
                    <span>Фото ({notification.photos.length})</span>
                    {notification.text && <span className="ml-1">· {notification.text}</span>}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.text}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};