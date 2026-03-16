import { useState, useRef, useCallback } from 'react';
import { authenticatedFetch } from '@/lib/api/authenticatedFetch';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

interface UseVoiceChatOptions {
  criminalGender?: 'male' | 'female';
  onTranscript: (text: string) => void;
}

export function useVoiceChat({ criminalGender = 'male', onTranscript }: UseVoiceChatOptions) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isVoiceModeOn, setIsVoiceModeOn] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('audio/webm;codecs=opus');
  const cancelledRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AC();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const toggleVoiceMode = useCallback((on: boolean) => {
    if (on) ensureAudioContext();
    setIsVoiceModeOn(on);
  }, [ensureAudioContext]);

  const startRecording = useCallback(async () => {
    if (voiceState !== 'idle') return;
    ensureAudioContext();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4';
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      cancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        if (cancelledRef.current) {
          chunksRef.current = [];
          setVoiceState('idle');
          return;
        }

        setVoiceState('processing');

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode(...chunk);
        }
        const audioBase64 = btoa(binary);
        const encoding = mimeType.startsWith('audio/mp4') ? 'MP3' : 'WEBM_OPUS';

        try {
          const res = await authenticatedFetch('/api/stt', {
            method: 'POST',
            body: JSON.stringify({ audioBase64, encoding }),
          });
          const { transcript } = await res.json();
          if (transcript?.trim()) {
            onTranscript(transcript.trim());
          }
        } catch (err) {
          console.error('STT error:', err);
        } finally {
          setVoiceState('idle');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setVoiceState('recording');
    } catch {
      alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。');
    }
  }, [voiceState, onTranscript, ensureAudioContext]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const speakText = useCallback(async (text: string) => {
    // isVoiceModeOn のチェックは呼び出し側で行う（stale closure 回避）
    setVoiceState('speaking');

    try {
      const res = await authenticatedFetch('/api/tts', {
        method: 'POST',
        body: JSON.stringify({ text, gender: criminalGender }),
      });
      const { audioBase64 } = await res.json();

      // AudioContext経由で再生（iOSでの複数async後の再生に対応）
      if (audioContextRef.current) {
        const binaryStr = atob(audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        try {
          const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
          const source = audioContextRef.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => {
            audioSourceRef.current = null;
            setVoiceState('idle');
          };
          audioSourceRef.current?.stop();
          audioSourceRef.current = source;
          source.start(0);
          return;
        } catch (decodeErr) {
          console.error('AudioContext decode failed, falling back to Audio element:', decodeErr);
        }
      }

      // フォールバック: HTMLAudioElement
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      audioElementRef.current = audio;
      audio.onended = () => { audioElementRef.current = null; setVoiceState('idle'); };
      audio.onerror = () => { audioElementRef.current = null; setVoiceState('idle'); };
      audio.play().catch(() => setVoiceState('idle'));
    } catch (err) {
      console.error('TTS error:', err);
      setVoiceState('idle');
    }
  }, [criminalGender]);

  const stopSpeaking = useCallback(() => {
    audioSourceRef.current?.stop();
    audioSourceRef.current = null;
    audioElementRef.current?.pause();
    audioElementRef.current = null;
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    isVoiceModeOn,
    setIsVoiceModeOn: toggleVoiceMode,
    startRecording,
    stopRecording,
    cancelRecording,
    speakText,
    stopSpeaking,
  };
}
