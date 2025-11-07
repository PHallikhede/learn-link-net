import { useEffect, useRef } from "react";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const downloadAttachment = (url: string, name: string) => {
    window.open(url, '_blank');
  };

  const isImage = (type?: string) => {
    return type?.startsWith('image/');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUserId ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.sender_id === currentUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content && <p className="text-sm">{message.content}</p>}
              
              {message.attachment_url && (
                <div className="mt-2">
                  {isImage(message.attachment_type) ? (
                    <img 
                      src={message.attachment_url} 
                      alt={message.attachment_name}
                      className="max-w-full rounded cursor-pointer"
                      onClick={() => downloadAttachment(message.attachment_url!, message.attachment_name!)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAttachment(message.attachment_url!, message.attachment_name!)}
                      className="gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-xs truncate max-w-[150px]">
                        {message.attachment_name}
                      </span>
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
              
              <p
                className={`text-xs mt-1 ${
                  message.sender_id === currentUserId
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
