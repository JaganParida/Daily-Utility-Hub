import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WordCounter from './pages/tools/WordCounter';
import UuidGenerator from './pages/tools/UuidGenerator';
import PasswordGenerator from './pages/tools/PasswordGenerator';
import CaseConverter from './pages/tools/CaseConverter';
import FontConverter from './pages/tools/FontConverter';
import HashGenerator from './pages/tools/HashGenerator';
import LoremIpsum from './pages/tools/LoremIpsum';
import TextLineEditor from './pages/tools/TextLineEditor';
import FindAndReplace from './pages/tools/FindAndReplace';
import JwtDecoder from './pages/tools/JwtDecoder';
import RegexTester from './pages/tools/RegexTester';
import ColorPicker from './pages/tools/ColorPicker';
import GradientGenerator from './pages/tools/GradientGenerator';
import ImageCompressor from './pages/tools/ImageCompressor';
import ImageResizer from './pages/tools/ImageResizer';
import ImageCropper from './pages/tools/ImageCropper';
import ImageConverter from './pages/tools/ImageConverter';
import ImageCollage from './pages/tools/ImageCollage';
import ImageToPdf from './pages/tools/ImageToPdf';

// New Dev Tools
import ApiKeyGenerator from './pages/tools/ApiKeyGenerator';
import JsonFormatter from './pages/tools/JsonFormatter';
import Base64Converter from './pages/tools/Base64Converter';
import UrlConverter from './pages/tools/UrlConverter';
import BcryptGenerator from './pages/tools/BcryptGenerator';
import CronParser from './pages/tools/CronParser';

// New PDF Tools
import PdfMerge from './pages/tools/PdfMerge';
import PdfSplit from './pages/tools/PdfSplit';
import PdfWatermark from './pages/tools/PdfWatermark';
import PdfLock from './pages/tools/PdfLock';
import PdfUnlock from './pages/tools/PdfUnlock';
import PdfMetadata from './pages/tools/PdfMetadata';
import PdfToText from './pages/tools/PdfToText';
import PdfEdit from './pages/tools/PdfEdit';
import PdfConverter from './pages/tools/PdfConverter';

// Student & Docs Tools
import CodeToImage from './pages/tools/CodeToImage';
import ImageToText from './pages/tools/ImageToText';
import TextDiff from './pages/tools/TextDiff';
import MarkdownEditor from './pages/tools/MarkdownEditor';

// Finance & Productivity Tools
import EmiCalculator from './pages/tools/EmiCalculator';
import SipCalculator from './pages/tools/SipCalculator';
import GstCalculator from './pages/tools/GstCalculator';
import TaxCalculator from './pages/tools/TaxCalculator';

// Developer & Data Tools
import EncoderDecoder from './pages/tools/EncoderDecoder';

// File Management & Sharing Tools
import TempShare from './pages/tools/TempShare';
import BatchRenamer from './pages/tools/BatchRenamer';
import ZipArchiver from './pages/tools/ZipArchiver';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="tools/word-counter" element={<WordCounter />} />
          <Route path="tools/uuid-generator" element={<UuidGenerator />} />
          <Route path="tools/password-generator" element={<PasswordGenerator />} />
          <Route path="tools/case-converter" element={<CaseConverter />} />
          <Route path="tools/font-converter" element={<FontConverter />} />
          <Route path="tools/hash-generator" element={<HashGenerator />} />
          <Route path="tools/lorem-ipsum" element={<LoremIpsum />} />
          <Route path="tools/text-line-editor" element={<TextLineEditor />} />
          <Route path="tools/find-replace" element={<FindAndReplace />} />
          <Route path="tools/jwt-decoder" element={<JwtDecoder />} />
          <Route path="tools/regex-tester" element={<RegexTester />} />
          <Route path="tools/color-picker" element={<ColorPicker />} />
          <Route path="tools/gradient-generator" element={<GradientGenerator />} />
          <Route path="tools/image-compressor" element={<ImageCompressor />} />
          <Route path="tools/image-resizer" element={<ImageResizer />} />
          <Route path="tools/image-cropper" element={<ImageCropper />} />
          <Route path="tools/image-converter" element={<ImageConverter />} />
          <Route path="tools/image-collage" element={<ImageCollage />} />
          <Route path="tools/image-to-pdf" element={<ImageToPdf />} />
          
          {/* New Dev Tools Routes */}
          <Route path="tools/api-key-generator" element={<ApiKeyGenerator />} />
          <Route path="tools/json-formatter" element={<JsonFormatter />} />
          <Route path="tools/base64-converter" element={<Base64Converter />} />
          <Route path="tools/url-converter" element={<UrlConverter />} />
          <Route path="tools/bcrypt-generator" element={<BcryptGenerator />} />
          <Route path="tools/cron-parser" element={<CronParser />} />

          {/* New PDF Tools Routes */}
          <Route path="tools/pdf-merge" element={<PdfMerge />} />
          <Route path="tools/pdf-split" element={<PdfSplit />} />
          <Route path="tools/pdf-watermark" element={<PdfWatermark />} />
          <Route path="tools/pdf-lock" element={<PdfLock />} />
          <Route path="tools/pdf-unlock" element={<PdfUnlock />} />
          <Route path="tools/pdf-metadata" element={<PdfMetadata />} />
          <Route path="tools/pdf-to-text" element={<PdfToText />} />
          <Route path="tools/pdf-edit" element={<PdfEdit />} />
          <Route path="tools/pdf-converter" element={<PdfConverter />} />

          {/* Student & Docs Tools Routes */}
          <Route path="tools/code-to-image" element={<CodeToImage />} />
          <Route path="tools/image-to-text" element={<ImageToText />} />
          <Route path="tools/text-diff" element={<TextDiff />} />
          <Route path="tools/markdown-editor" element={<MarkdownEditor />} />

          {/* Finance & Productivity Tools Routes */}
          <Route path="tools/emi-calculator" element={<EmiCalculator />} />
          <Route path="tools/sip-calculator" element={<SipCalculator />} />
          <Route path="tools/gst-calculator" element={<GstCalculator />} />
          <Route path="tools/tax-calculator" element={<TaxCalculator />} />

          {/* Developer & Data Tools */}
          <Route path="tools/encoder-decoder" element={<EncoderDecoder />} />

          {/* File Management & Sharing Tools Routes */}
          <Route path="tools/temp-share" element={<TempShare />} />
          <Route path="tools/batch-renamer" element={<BatchRenamer />} />
          <Route path="tools/zip-archiver" element={<ZipArchiver />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

import RouteTracker from './components/RouteTracker';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } }} />
      <RouteTracker />
      <AnimatedRoutes />
    </Router>
  );
}
export default App;
