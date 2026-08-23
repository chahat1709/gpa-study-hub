import React, { useState, useEffect } from 'react';
import { decryptText } from '../services/encryptionService';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';

interface EncryptedMessageProps {
  content: string;
  chatId: string;
  isMe: boolean;
  isEncrypted?: boolean;
  isAI?: boolean;
}

const EncryptedMessage: React.FC<EncryptedMessageProps> = ({
  content,
  chatId,
  isMe,
  isEncrypted = true,
  isAI,
}) => {
  const [displayText, setDisplayText] = useState<string>(isEncrypted ? '••••••••' : content);
  const [isDecrypting, setIsDecrypting] = useState(isEncrypted);

  useEffect(() => {
    if (!isEncrypted) {
      setDisplayText(content);
      setIsDecrypting(false);
      return;
    }

    let isMounted = true;

    const runDecryption = async () => {
      // 1. Decrypt content first
      const result = await decryptText(content, chatId);

      // 2. Small visual delay for "Local Hardware Decryption" simulation
      await new Promise(r => setTimeout(r, 450));

      if (isMounted) {
        setDisplayText(result);
        setIsDecrypting(false);
      }
    };

    runDecryption();
    return () => {
      isMounted = false;
    };
  }, [content, chatId, isEncrypted]);

  return (
    <div className="relative group min-w-[80px]">
      <div
        className={`transition-all duration-300 ${isDecrypting ? 'opacity-40 blur-[1px]' : 'opacity-100 blur-0'}`}
      >
        <p
          className={`leading-relaxed whitespace-pre-wrap font-sans text-sm ${isDecrypting ? 'font-mono' : ''}`}
        >
          {displayText}
        </p>
      </div>

      <div
        className={`flex items-center gap-1.5 mt-2 transition-opacity duration-300 ${isDecrypting ? 'opacity-40' : 'opacity-30 group-hover:opacity-100'}`}
      >
        {isDecrypting ? (
          <div className="flex items-center gap-1">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">Secure Link...</span>
          </div>
        ) : isEncrypted ? (
          <>
            <ShieldCheck className={`w-3 h-3 ${isMe ? 'text-indigo-200' : 'text-emerald-500'}`} />
            <span className="text-[10px] uppercase font-bold tracking-tighter">
              Hardware Verified E2EE
            </span>
          </>
        ) : (
          <div className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 opacity-50" />
            <span className="text-[10px] uppercase font-bold tracking-tighter">System Tunnel</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EncryptedMessage;
