import React, { useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  LinearProgress, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  IconButton 
} from '@mui/material';
import { FiUploadCloud, FiCpu, FiCamera, FiX } from 'react-icons/fi';
import { expenseService } from '../services/api';

// Helper to convert base64 data URL to File object
const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type:mime});
};

export default function ReceiptUpload({ onUploadSuccess, onOcrExtract, setOcrLoading, children }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    setUploadProgress(10);
    
    try {
      const response = await expenseService.uploadReceipt(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploading(false);
      setUploadedUrl(response.url);
      if (onUploadSuccess) {
        onUploadSuccess(response.url);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const triggerOcr = async () => {
    setOcrLoading(true);
    try {
      // Call OCR endpoint
      const mockOcrResult = await expenseService.extractOcr(uploadedUrl || '/uploads/simulated-receipt.pdf');
      onOcrExtract(mockOcrResult);
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraOpen(true);
    setCameraError(false);
    setPhotoData(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Failed to acquire camera", err);
      setCameraError(true);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  };

  // Capture Photo from video stream
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoData(dataUrl);
      
      // Stop the camera feed
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  // Use captured photo to upload
  const usePhoto = async () => {
    stopCamera();
    if (!photoData) return;

    setUploading(true);
    setUploadProgress(10);
    setFileName('Captured_Receipt.jpg');

    try {
      // Convert base64 dataUrl to File object and upload
      const file = dataURLtoFile(photoData, 'captured-receipt.jpg');
      const response = await expenseService.uploadReceipt(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploading(false);
      setUploadedUrl(response.url);
      if (onUploadSuccess) {
        onUploadSuccess(response.url);
      }
    } catch (err) {
      console.error("Camera upload failed", err);
      setUploading(false);
    }
  };

  // Simulation fallback trigger if camera is unavailable
  const simulateCapture = async () => {
    stopCamera();
    setUploading(true);
    setUploadProgress(10);
    setFileName('Simulated_Photo_Receipt.jpg');

    try {
      // Create a dummy 1x1 pixel image file to simulate camera upload
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(0, 0, 1, 1);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const file = dataURLtoFile(dataUrl, 'simulated-photo.jpg');
      
      const response = await expenseService.uploadReceipt(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploading(false);
      setUploadedUrl(response.url);
      if (onUploadSuccess) {
        onUploadSuccess(response.url);
      }
    } catch (err) {
      console.error("Simulated camera upload failed", err);
      setUploading(false);
    }
  };

  return (
    <Box className="premium-card" sx={{ mb: 3 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>
          Upload Bill / Receipt <span style={{ color: '#64748B', fontWeight: 500 }}>(Optional)</span>
        </Typography>
      </Box>

      {/* Grid container for 70/30 split */}
      <Grid container spacing={3}>
        {/* Left Side: 70% Upload Area */}
        <Grid item xs={12} md={8.4}>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden-file-input"
            style={{ display: 'none' }}
            onChange={handleChange}
            accept=".png,.jpg,.jpeg,.pdf"
          />

          <Box
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            sx={{
              border: dragActive ? '2px dashed #2563EB' : '2px dashed #E2E8F0',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              bgcolor: dragActive ? '#EFF6FF' : '#FCFDFE',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                borderColor: '#2563EB',
                bgcolor: '#EFF6FF'
              }
            }}
          >
            <FiUploadCloud size={38} style={{ color: '#2563EB', marginBottom: '12px' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
              Drag & drop your file here
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
              or
            </Typography>
            <Button
              variant="outlined"
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                px: 3.5,
                py: 0.75,
                fontWeight: 600,
                color: '#2563EB',
                borderColor: '#E2E8F0',
                bgcolor: '#FFFFFF',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                '&:hover': {
                  borderColor: '#2563EB',
                  bgcolor: '#EFF6FF'
                }
              }}
            >
              Browse Files
            </Button>
            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 2 }}>
              Supports: JPG, PNG, PDF (Max 5MB)
            </Typography>
          </Box>

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                Uploading {fileName}... {uploadProgress}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 6 }} />
            </Box>
          )}

          {!uploading && fileName && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#10B981', fontWeight: 600 }}>
              ✓ {fileName} uploaded successfully!
            </Typography>
          )}
        </Grid>

        {/* Right Side: 30% Quick Upload Options */}
        <Grid item xs={12} md={3.6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'none', letterSpacing: '0.02em', mb: -0.5 }}>
            Quick Upload Options
          </Typography>
          

          {/* Take Photo Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={startCamera}
            sx={{
              borderRadius: '16px',
              textTransform: 'none',
              py: 1.5,
              px: 2,
              borderColor: '#E2E8F0',
              color: '#0F172A',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              justifyContent: 'flex-start',
              '&:hover': {
                borderColor: '#8B5CF6',
                bgcolor: 'rgba(139, 92, 246, 0.04)',
              }
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                bgcolor: '#F5F3FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 1.5,
                flexShrink: 0
              }}
            >
              <FiCamera style={{ color: '#8B5CF6' }} size={18} />
            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.85rem', display: 'block', mb: 0.2 }}>
                Take Photo
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                Capture bill using camera
              </Typography>
            </Box>
          </Button>
        </Grid>
      </Grid>

      {/* Camera Capture Dialog */}
      <Dialog 
        open={cameraOpen} 
        onClose={stopCamera}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
            Capture Receipt / Bill
          </Typography>
          <IconButton onClick={stopCamera} size="small">
            <FiX size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#000000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', position: 'relative' }}>
          {cameraError ? (
            <Box sx={{ p: 4, textAlign: 'center', color: '#FFFFFF' }}>
              <FiCamera size={44} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <Typography variant="body2" sx={{ mb: 2 }}>
                Camera access not available or permission denied.
              </Typography>
              <Button 
                variant="contained" 
                onClick={simulateCapture}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  bgcolor: '#2563EB',
                  '&:hover': { bgcolor: '#1D4ED8' }
                }}
              >
                Simulate Camera Capture
              </Button>
            </Box>
          ) : !photoData ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              <Button 
                variant="contained"
                onClick={capturePhoto}
                sx={{
                  position: 'absolute',
                  bottom: 20,
                  borderRadius: '50%',
                  width: 56,
                  height: 56,
                  minWidth: 0,
                  bgcolor: '#FFFFFF',
                  color: '#0F172A',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  '&:hover': { bgcolor: '#F1F5F9' }
                }}
              >
                <FiCamera size={24} />
              </Button>
            </>
          ) : (
            <img 
              src={photoData} 
              alt="Captured" 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          {photoData ? (
            <>
              <Button 
                onClick={startCamera} 
                sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
              >
                Retake
              </Button>
              <Button 
                variant="contained" 
                onClick={usePhoto}
                sx={{
                  borderRadius: '10px',
                  textTransform: 'none',
                  bgcolor: '#2563EB',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': { bgcolor: '#1D4ED8' }
                }}
              >
                Use Photo
              </Button>
            </>
          ) : (
            <Button 
              onClick={stopCamera} 
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600 }}
            >
              Cancel
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {children}
    </Box>
  );
}
