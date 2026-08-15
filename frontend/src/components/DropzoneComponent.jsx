import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'react-router-dom';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DropzoneComponent = ({
  onFilesAccepted,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  title = "Drag & drop files here",
  subtitle = "or click to select files",
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
        style={{ borderRadius: 16 }}
        {...getRootProps()}
        className={`relative w-full h-full min-h-[160px] flex-1 p-8 md:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragReject ? 'border-rose-500 bg-rose-500/10' : 
            isDragActive ? 'border-[#00a884] bg-[#00a884]/20 scale-[1.01] shadow-lg shadow-[#00a884]/20' : 
            'border-[#2a3942] bg-[#202c33] hover:bg-[#222e35] hover:border-[#00a884] shadow-xs'
          }`}
      >
        <input {...getInputProps()} />
        
        {/* Glow effect on drag */}
        <div className={`absolute inset-0 bg-[#00a884]/10 blur-2xl transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />

        <motion.div layout className="relative z-10">
          <motion.div layout="position" className={`mx-auto w-14 h-14 mb-3.5 flex items-center justify-center rounded-2xl transition-transform duration-300 shadow-xs ${isDragActive ? 'bg-[#00a884] text-white scale-110' : 'bg-[#111b21] border border-[#2a3942] text-[#00a884]'}`}>
            <UploadCloud size={28} />
          </motion.div>
          
          <motion.h3 layout="position" className="text-base font-black text-[#e9edef] mb-1">
            {isDragActive ? 'Drop your files now!' : title}
          </motion.h3>
          <motion.p layout="position" className="text-xs text-[#8696a0] font-medium">
            {subtitle} (Max {Math.round(maxSize / 1024 / 1024)}MB)
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Selected Files Preview */}
      {value && value.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider mb-3">Selected Files ({value.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {value.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 bg-[#111b21] border border-[#222d34] rounded-xl shadow-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-[#00a884]/15 border border-[#00a884]/30 text-[#00a884] flex items-center justify-center shrink-0">
                      <FileIcon size={16} />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-bold text-[#e9edef] truncate">{file.name}</p>
                      <p className="text-[10px] text-[#8696a0] font-medium">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(file);
                      }}
                      className="p-1.5 text-[#8696a0] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <X size={14} />
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
