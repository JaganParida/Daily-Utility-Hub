import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'react-router-dom';
import { UploadCloud, X, File as FileIcon, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DropzoneComponent = ({
  onFilesAccepted,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  title = "Drag & drop files to process",
  subtitle = "or click to browse your device",
  value = [], // Array of File objects
  onRemove,
  className = "",
}) => {
  const location = useLocation();

  useEffect(() => {
    const initialFile = location.state?.initialFile;
    if (initialFile) {
      onFilesAccepted([initialFile]);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ file, errors }) => {
        toast.error(`${file.name}: ${errors[0].message}`);
      });
    }

    if (acceptedFiles.length > 0) {
      onFilesAccepted(acceptedFiles);
    }
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  });

  return (
    <motion.div layout className={`w-full flex flex-col ${className}`}>
      <motion.div
        layout
        style={{ borderRadius: 18 }}
        {...getRootProps()}
        className={`relative w-full min-h-[190px] p-6 sm:p-10 border-2 border-dashed rounded-2xl transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragReject ? 'border-[#ea4335] bg-[#fce8e6]' : 
            isDragActive ? 'border-[#1a73e8] bg-[#e8f0fe] scale-[1.01] shadow-md' : 
            'border-[#c2d7fb] bg-[#ffffff] hover:border-[#1a73e8] hover:bg-[#f8fbff] shadow-xs'
          }`}
      >
        <input {...getInputProps()} />
        
        {/* Subtle Google accent glow */}
        <div className={`absolute inset-0 bg-[#1a73e8]/5 blur-xl transition-opacity duration-300 pointer-events-none ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />

        <motion.div layout className="relative z-10 flex flex-col items-center">
          <motion.div 
            layout="position" 
            className={`w-14 h-14 mb-3.5 flex items-center justify-center rounded-2xl transition-transform duration-300 shadow-2xs ${
              isDragActive 
                ? 'bg-[#1a73e8] text-white scale-110' 
                : 'bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] group-hover:scale-105'
            }`}
          >
            <UploadCloud size={28} />
          </motion.div>
          
          <motion.h3 layout="position" className="text-base sm:text-lg font-bold text-[#202124] mb-1">
            {isDragActive ? 'Drop files to process instantly!' : title}
          </motion.h3>
          <motion.p layout="position" className="text-xs sm:text-sm text-[#5f6368] font-normal max-w-sm leading-relaxed">
            {subtitle} • <span className="font-semibold text-[#1a73e8]">Max {Math.round(maxSize / 1024 / 1024)}MB</span>
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Selected Files Preview */}
      {value && value.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5f6368] flex items-center gap-1.5">
              <span>Selected Files</span>
              <span className="px-2 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] text-[11px] font-bold border border-[#d2e3fc]">
                {value.length}
              </span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {value.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 bg-white border border-[#dadce0] rounded-xl shadow-2xs hover:border-[#1a73e8] transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#e8f0fe] border border-[#d2e3fc] text-[#1a73e8] flex items-center justify-center shrink-0">
                      <FileIcon size={18} />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-bold text-[#202124] truncate" title={file.name}>{file.name}</p>
                      <p className="text-[11px] text-[#5f6368] font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(file);
                      }}
                      title="Remove file"
                      className="p-1.5 text-[#5f6368] hover:text-[#ea4335] hover:bg-[#fce8e6] rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DropzoneComponent;
