import { useState } from 'react';
import { FileText, Download, RefreshCw, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import DropzoneComponent from '../../components/DropzoneComponent';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

const ImageToPdf = () => {
  const [images, setImages] = useState([]); // Array of { file, url }
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState('p'); // 'p' for portrait, 'l' for landscape
  const [pageSize, setPageSize] = useState('a4');

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    const newImages = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const newImgs = [...prev];
      URL.revokeObjectURL(newImgs[index].url);
      newImgs.splice(index, 1);
      return newImgs;
    });
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const newImgs = [...prev];
      const temp = newImgs[index - 1];
      newImgs[index - 1] = newImgs[index];
      newImgs[index] = temp;
      return newImgs;
    });
  };

  const moveDown = (index) => {
    if (index === images.length - 1) return;
    setImages(prev => {
      const newImgs = [...prev];
      const temp = newImgs[index + 1];
      newImgs[index + 1] = newImgs[index];
      newImgs[index] = temp;
      return newImgs;
    });
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF(pdfOrientation, 'mm', pageSize);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < images.length; i++) {
        const { url, file } = images[i];
        
        // Wait for image to load to get dimensions
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = url;
        });

        if (i > 0) {
          doc.addPage();
        }

        // Calculate scaling to fit page while maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const pageRatio = pageWidth / pageHeight;
        
        let finalWidth = pageWidth;
        let finalHeight = pageHeight;
        
        if (imgRatio > pageRatio) {
          finalHeight = pageWidth / imgRatio;
        } else {
          finalWidth = pageHeight * imgRatio;
        }

        // Center on page
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        const imgType = file.type === 'image/png' ? 'PNG' : 'JPEG';
        doc.addImage(img, imgType, x, y, finalWidth, finalHeight);
      }

      doc.save('converted_images.pdf');
      toast.success('PDF Generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const clear = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-red-500/10 text-red-500 rounded-lg shadow-sm">
          <FileText size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Image to PDF</h1>
          <p className="text-muted-foreground mt-1 text-sm">Convert multiple images into a single multi-page PDF document locally.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        <DropzoneComponent 
          onFilesAccepted={handleFilesAccepted} 
          accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }} 
          maxFiles={50}
          title="Drag & drop multiple images"
        />

        {images.length > 0 && (
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
               <div>
                 <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Settings</h3>
               </div>
               <div className="flex gap-4">
                 <select 
                   value={pageSize}
                   onChange={(e) => setPageSize(e.target.value)}
                   className="p-2 bg-background border border-border rounded-md text-sm font-medium"
                 >
                   <option value="a4">A4</option>
                   <option value="letter">Letter</option>
                   <option value="legal">Legal</option>
                 </select>
                 <select 
                   value={pdfOrientation}
                   onChange={(e) => setPdfOrientation(e.target.value)}
                   className="p-2 bg-background border border-border rounded-md text-sm font-medium"
                 >
                   <option value="p">Portrait</option>
                   <option value="l">Landscape</option>
                 </select>
               </div>
            </div>

            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Pages ({images.length})</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {images.map((img, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-muted/50 p-3 rounded-xl border border-border">
                  <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <img src={img.url} className="w-16 h-16 object-cover rounded-lg border border-border/50 shadow-sm" />
                  <div className="flex-1 truncate">
                    <p className="font-medium text-sm text-foreground truncate">{img.file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveDown(idx)}
                      disabled={idx === images.length - 1}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <div className="w-px h-6 bg-border mx-1"></div>
                    <button 
                      onClick={() => removeImage(idx)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-border">
              <button 
                onClick={clear}
                className="px-6 py-2.5 bg-background border border-border text-foreground font-medium rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} /> Clear All
              </button>
              <button 
                onClick={generatePDF}
                disabled={isGenerating}
                className="px-8 py-2.5 bg-red-500 text-white font-medium rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 shadow-sm shadow-red-500/20 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Download size={18} />}
                Generate PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageToPdf;
