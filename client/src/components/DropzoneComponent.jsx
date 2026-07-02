import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
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
        {...getRootProps()}
        className={`relative w-full h-full min-h-[160px] flex-1 p-8 md:p-12 border-2 border-dashed rounded-2xl transition-colors duration-300 ease-out cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden
          ${isDragReject ? 'border-red-500 bg-red-500/10' : 
            isDragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 
            'border-border bg-card/50 hover:bg-muted hover:border-primary/50'
          }`}
      >
        <input {...getInputProps()} />
        
        {/* Glow effect on drag */}
        <div className={`absolute inset-0 bg-primary/5 blur-3xl transition-opacity duration-300 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10">
          <div className={`mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full transition-transform duration-300 ${isDragActive ? 'bg-primary text-primary-foreground scale-110' : 'bg-muted text-muted-foreground'}`}>
            <UploadCloud size={32} />
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {isDragActive ? 'Drop the files now!' : title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {subtitle} (Max size: {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
      </motion.div>

      {/* Selected Files Preview */}
      {value && value.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Selected Files ({value.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {value.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                      <FileIcon size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {onRemove && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(file);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                    >
                      <X size={16} />
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
