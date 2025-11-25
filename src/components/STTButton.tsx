import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useSttProvider } from '../contexts/SttProviderContext';

interface STTButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Componente reutilizable para Speech-to-Text
 * Permite grabar audio y transcribirlo usando la API /api/stt
 */
export const STTButton: React.FC<STTButtonProps> = ({ 
  onTranscription, 
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { provider } = useSttProvider();

  const startRecording = async () => {
    try {
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Crear MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Evento cuando se recibe un chunk de audio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Evento cuando se detiene la grabación
      mediaRecorder.onstop = async () => {
        try {
          setIsProcessing(true);
          
          // Detener el stream
          stream.getTracks().forEach(track => track.stop());
          
          // Crear blob del audio
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorder.mimeType || 'audio/webm' 
          });

          // Enviar a la API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');

          const query = new URLSearchParams({ provider }).toString();
          const response = await fetch(`${API_BASE_URL}/stt?${query}`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            let errorMessage = 'Error transcribiendo audio';
            try {
              const errorData = await response.json();
              errorMessage = errorData?.error || errorMessage;
              if (errorData?.details) {
                errorMessage += `: ${errorData.details}`;
              }
            } catch (e) {
              // Si no se puede parsear el error, usar el mensaje por defecto
            }
            throw new Error(errorMessage);
          }

          const data = await response.json();
          const transcribedText = typeof data?.text === 'string' 
            ? data.text 
            : JSON.stringify(data);

          // Llamar al callback con el texto transcrito
          if (transcribedText && transcribedText.trim()) {
            onTranscription(transcribedText);
          }
        } catch (error) {
          console.error('Error en STT:', error);
          alert(error instanceof Error ? error.message : 'Error transcribiendo audio');
        } finally {
          setIsProcessing(false);
        }
      };

      // Iniciar grabación
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 
        rounded-lg text-sm font-medium
        transition-colors
        ${isRecording 
          ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300' 
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300'
        }
        ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      title={isRecording ? 'Detener grabación' : isProcessing ? 'Procesando...' : 'Grabar con voz'}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : isRecording ? (
        <>
          <MicOff className="w-4 h-4" />
          <span>Detener</span>
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          <span>Voz</span>
        </>
      )}
    </button>
  );
};

export default STTButton;

