import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface PlateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (plate: string) => void;
}

export default function PlateScannerModal({ isOpen, onClose, onScan }: PlateScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [worker, setWorker] = useState<Tesseract.Worker | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Initialize Tesseract Worker
  useEffect(() => {
    let active = true;
    const initTesseract = async () => {
      try {
        const newWorker = await Tesseract.createWorker('eng', 1, {
          logger: m => console.log(m)
        });
        if (active) {
          await newWorker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
          });
          setWorker(newWorker);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("Failed to init Tesseract", err);
        if (active) setError("Erreur d'initialisation de l'OCR.");
      }
    };
    if (isOpen) {
      initTesseract();
    }
    return () => {
      active = false;
      if (worker) {
        worker.terminate();
      }
    };
  }, [isOpen]);

  // Start Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isOpen && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch(err => {
        console.error("Camera error", err);
        setError("Impossible d'accéder à l'appareil photo.");
      });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  // Scanning loop
  useEffect(() => {
    if (!isOpen || isInitializing || error || !worker) return;

    const scanFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract image data
      const imageData = canvas.toDataURL('image/png');

      try {
        const { data: { text } } = await worker.recognize(imageData);
        console.log("OCR Extracted Text:", text);

        // Regex for French license plates (e.g. AB-123-CD or AB 123 CD or AB123CD)
        const plateRegex = /([A-Z]{2})[-\s]?([0-9]{3})[-\s]?([A-Z]{2})/i;
        const match = text.match(plateRegex);
        
        if (match) {
          const formattedPlate = `${match[1].toUpperCase()}-${match[2]}-${match[3].toUpperCase()}`;
          onScan(formattedPlate);
          onClose(); // Stop scanning once found
        }
      } catch (err) {
        console.error("OCR Error", err);
      }
    };

    // Run every 1000ms
    intervalRef.current = window.setInterval(scanFrame, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, isInitializing, error, worker, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'black', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={20} /> Scanner OCR
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}><X size={32} /></button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
        />
        
        {/* Targeting Box */}
        <div style={{ 
          position: 'absolute', 
          width: '80%', 
          maxWidth: 400, 
          height: 100, 
          border: '3px solid var(--accent)', 
          borderRadius: 8, 
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ 
            width: '100%', 
            height: 2, 
            background: 'var(--accent)', 
            boxShadow: '0 0 15px var(--accent)', 
            position: 'absolute', 
            top: 0, 
            animation: 'scan 2s infinite linear' 
          }} />
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }` }} />

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {isInitializing && !error && (
          <div style={{ position: 'absolute', bottom: 40, background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: 20, color: 'white', fontSize: 14 }}>
            Chargement du moteur OCR...
          </div>
        )}

        {error && (
          <div style={{ position: 'absolute', bottom: 40, background: 'var(--red)', padding: '8px 16px', borderRadius: 20, color: 'white', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!isInitializing && !error && (
          <div style={{ position: 'absolute', bottom: 40, background: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: 20, color: 'white', fontSize: 14 }}>
            Visez la plaque d'immatriculation
          </div>
        )}
      </div>
    </div>
  );
}
