import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MessageInputProps {
  connectionId: string;
  userId: string;
  onSendMessage: (content: string, attachmentData?: {
    url: string;
    name: string;
    type: string;
  }) => Promise<void>;
  sending: boolean;
}

export const MessageInput = ({
  connectionId,
  userId,
  onSendMessage,
  sending,
}: MessageInputProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${connectionId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      name: file.name,
      type: file.type,
    };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || sending || uploading) return;

    setUploading(true);
    
    try {
      let attachmentData;
      
      if (selectedFile) {
        attachmentData = await uploadFile(selectedFile);
      }

      await onSendMessage(newMessage.trim(), attachmentData);
      
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const isDisabled = sending || uploading;

  return (
    <form onSubmit={handleSend} className="p-4 border-t">
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-md">
          <Paperclip className="w-4 h-4" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeFile}
            disabled={isDisabled}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isDisabled}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isDisabled}
        />
        
        <Button
          type="submit"
          disabled={(!newMessage.trim() && !selectedFile) || isDisabled}
        >
          {sending || uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </form>
  );
};
