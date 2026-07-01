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
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } }} />
      <AnimatedRoutes />
    </Router>
  );
}
export default App;
