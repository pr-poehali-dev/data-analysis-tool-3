import { useState, useEffect } from "react";
import { ImageViewer } from "@/components/ui/image-viewer";
import { UserProfileModal } from "./UserProfileModal";
import { ReviewModal } from "./ReviewModal";
import { EscrowModal } from "./EscrowModal";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { ChatInput } from "./ChatInput";
import { recommendationsStore } from "@/store/recommendationsStore";
import { requestsStore } from "@/store/requestsStore";
import { Chat, Message, messagesStore } from "@/store/messagesStore";
import { escrowStore } from "@/store/escrowStore";
import { authStore } from "@/store/authStore";
import funcUrls from "../../../../backend/func2url.json";

interface ChatWindowProps {
  chat: Chat;
  currentUserEmail: string;
  currentUserName: string;
  currentUserPhoto?: string;
}

export const ChatWindow = ({ chat, currentUserEmail, currentUserName, currentUserPhoto }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showViewer, setShowViewer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [hasActiveEscrow, setHasActiveEscrow] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState<string | undefined>();
  const [escrowAmount, setEscrowAmount] = useState<number | undefined>();
  const [escrowTransactionId, setEscrowTransactionId] = useState<string | undefined>();
  const [hasReview, setHasReview] = useState(false);

  const isRecommender = chat.recommenderEmail === currentUserEmail;
  const isTenant = chat.tenantEmail === currentUserEmail;
  const otherUserName = isRecommender ? chat.tenantName : chat.recommenderName;
  const otherUserPhoto = isRecommender ? chat.tenantPhoto : chat.recommenderPhoto;
  const otherUserEmail = isRecommender ? chat.tenantEmail : chat.recommenderEmail;
  const otherUserVkLink = isRecommender ? chat.tenantVkLink : chat.recommenderVkLink;

  useEffect(() => {
    if (chat.requestId) {
      requestsStore.fetchRequestById(chat.requestId);
    }
  }, [chat.requestId]);

  useEffect(() => {
    const checkReview = async () => {
      try {
        const res = await fetch(`${(funcUrls as Record<string, string>)['reviews']}?chat_id=${chat.id}`, { headers: authStore.getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const reviews = data.reviews || [];
          setHasReview(reviews.some((r: { reviewer_email: string }) => r.reviewer_email === currentUserEmail));
        }
      } catch { /* ignore */ }
    };
    checkReview();
  }, [chat.id, currentUserEmail]);

  useEffect(() => {
    const checkEscrow = async () => {
      const data = await escrowStore.getEscrowStatusForChat(chat.id);
      setHasActiveEscrow(data.hasActive);
      setEscrowStatus(data.status);
      setEscrowAmount(data.commissionAmount);
      setEscrowTransactionId(data.transactionId);
    };
    checkEscrow();
    const unsubscribe = escrowStore.subscribe(() => checkEscrow());
    return () => unsubscribe();
  }, [chat.id]);

  useEffect(() => {
    const loadMessages = () => {
      const chatMessages = messagesStore.getMessages(chat.id);
      setMessages(chatMessages);
      
      const typing = messagesStore.getTypingUsers(chat.id, currentUserEmail);
      setTypingUsers(typing);
    };

    const init = async () => {
      await messagesStore.fetchMessages(chat.id);
      loadMessages();
    };
    init();

    loadMessages();
    messagesStore.markChatAsRead(chat.id, currentUserEmail);

    const cleanupInterval = setInterval(() => {
      messagesStore.cleanupOldTypingStatuses();
      const currentMessages = messagesStore.getMessages(chat.id);
      const lastMessage = currentMessages[currentMessages.length - 1];
      messagesStore.fetchMessages(chat.id, lastMessage?.id);
      loadMessages();
    }, 2000);

    const unsubscribe = messagesStore.subscribe(loadMessages);
    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [chat.id, currentUserEmail]);

  const handleOpenViewer = (photos: string[], index: number) => {
    setViewerImages(photos);
    setViewerIndex(index);
    setShowViewer(true);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        chat={chat}
        isTenant={isTenant}
        otherUserName={otherUserName}
        otherUserPhoto={otherUserPhoto}
        hasActiveEscrow={hasActiveEscrow}
        escrowStatus={escrowStatus}
        escrowAmount={escrowAmount}
        escrowTransactionId={escrowTransactionId}
        onEscrowChanged={async () => {
          const data = await escrowStore.getEscrowStatusForChat(chat.id);
          setHasActiveEscrow(data.hasActive);
          setEscrowStatus(data.status);
          setEscrowAmount(data.commissionAmount);
          setEscrowTransactionId(data.transactionId);
        }}
        hasReview={hasReview}
        onShowProfile={() => setShowProfileModal(true)}
        onShowReview={() => setShowReviewModal(true)}
        onShowEscrow={() => setShowEscrowModal(true)}
      />

      <MessagesList
        messages={messages}
        currentUserEmail={currentUserEmail}
        typingUsers={typingUsers}
        onOpenViewer={handleOpenViewer}
      />

      <ChatInput
        chatId={chat.id}
        currentUserEmail={currentUserEmail}
        currentUserName={currentUserName}
        currentUserPhoto={currentUserPhoto}
      />

      {showViewer && (
        <ImageViewer
          images={viewerImages}
          currentIndex={viewerIndex}
          onClose={() => setShowViewer(false)}
          onNext={() => setViewerIndex((viewerIndex + 1) % viewerImages.length)}
          onPrev={() => setViewerIndex((viewerIndex - 1 + viewerImages.length) % viewerImages.length)}
        />
      )}

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={{
          name: otherUserName,
          email: otherUserEmail,
          photo: otherUserPhoto,
          vkLink: otherUserVkLink,
        }}
      />

      {showReviewModal && (
        <ReviewModal
          chatId={chat.id}
          recommendationId={chat.recommendationId}
          reviewerEmail={currentUserEmail}
          reviewerName={currentUserName}
          revieweeEmail={otherUserEmail}
          revieweeName={otherUserName}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setHasReview(true);
          }}
        />
      )}

      <EscrowModal
        isOpen={showEscrowModal}
        onClose={() => setShowEscrowModal(false)}
        rentAmount={recommendationsStore.getRecommendationById(chat.recommendationId)?.propertyData.rent || '0'}
        rewardAmount={requestsStore.getRequestById(chat.requestId)?.reward || '0'}
        chatId={chat.id}
        recommendationId={chat.recommendationId}
        requestName={chat.requestName}
        tenantEmail={chat.tenantEmail}
        tenantName={chat.tenantName}
        recommenderEmail={chat.recommenderEmail}
        recommenderName={chat.recommenderName}
      />
    </div>
  );
};