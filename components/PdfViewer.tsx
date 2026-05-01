import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File | string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ file }) => {
  const [numPages, setNumPages] = useState<number>();
  const [width, setWidth] = useState<number>(800);

  useEffect(() => {
    // Responsive width based on container
    const handleResize = () => {
      const parentWidth = window.innerWidth;
      // Subtract modal paddings and margins
      setWidth(Math.min(parentWidth - 64, 1000));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  return (
    <div className="w-full h-full overflow-auto hide-scrollbar flex flex-col items-center py-6 bg-slate-500/10">
      <Document 
        file={file} 
        onLoadSuccess={onDocumentLoadSuccess} 
        className="flex flex-col gap-6"
        loading={
          <div className="flex flex-col items-center gap-3 p-10">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Đang tải PDF...</p>
          </div>
        }
      >
        {numPages && Array.from(new Array(numPages), (el, index) => (
          <Page 
            key={`page_${index + 1}`} 
            pageNumber={index + 1} 
            renderTextLayer={false} 
            renderAnnotationLayer={false} 
            className="shadow-xl rounded-lg overflow-hidden bg-white" 
            width={width}
          />
        ))}
      </Document>
    </div>
  );
};
