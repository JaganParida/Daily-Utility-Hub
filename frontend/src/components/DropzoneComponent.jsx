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
        style={{ borderRadius: 16 }}
        {...getRootProps()}
        className={`relative w-full h-full min-h-[170px] flex-1 p-8 md:p-12 border-2 border-dashed rounded-2xl transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragReject ? 'border-rose-500 bg-rose-500/10' : 
            isDragActive ? 'border-indigo-500 bg-indigo-500/15 scale-[1.01] shadow-2xl shadow-indigo-500/20' : 
            'border-[#23273c] bg-[#111420]/60 hover:bg-[#141722] hover:border-indigo-500/60 shadow-lg'
          }`}
      >
        <input {...getInputProps()} />
        
        {/* Glow & Scanline effect */}
        <div className={`absolute inset-0 bg-indigo-500/5 blur-2xl transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />

        <motion.div layout className="relative z-10">
          <motion.div layout="position" className={`mx-auto w-14 h-14 mb-3.5 flex items-center justify-center rounded-2xl transition-transform duration-300 shadow-md ${isDragActive ? 'bg-indigo-600 text-white scale-110' : 'bg-[#181b28] border border-[#262b40] text-indigo-400'}`}>
            <UploadCloud size={28} />
          </motion.div>
          
          <motion.h3 layout="position" className="text-base font-bold text-white mb-1">
            {isDragActive ? 'Drop files to stage!' : title}
          </motion.h3>
          <motion.p layout="position" className="text-xs text-slate-400 font-medium">
            {subtitle} • Max {Math.round(maxSize / 1024 / 1024)}MB
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Selected Files Preview */}
      {value && value.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Selected Files ({value.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {value.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 bg-[#0f1118] border border-[#1e2235] rounded-xl shadow-md"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                      <FileIcon size={16} />
                    </div>
                    <div className="overflow-hidden min-w-0">
                      <p className="text-xs font-bold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(file);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
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
