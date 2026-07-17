import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        return window.location.reload();
      }
      throw error;
    }
  });


// Core Pages (Lazy loaded)
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'));
const PinnedTools = lazyWithRetry(() => import('./pages/PinnedTools'));
const RecentTools = lazyWithRetry(() => import('./pages/RecentTools'));
const Profile = lazyWithRetry(() => import('./pages/Profile'));
const SearchPage = lazyWithRetry(() => import('./pages/Search'));
const Favorites = lazyWithRetry(() => import('./pages/Favorites'));

// Auth Pages (Lazy loaded)
const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));
const ForgotPassword = lazyWithRetry(() => import('./pages/auth/ForgotPassword'));

// Image Tools (Lazy loaded)
const ImageCompressor = lazyWithRetry(() => import('./pages/tools/ImageCompressor'));
const ImageResizer = lazyWithRetry(() => import('./pages/tools/ImageResizer'));
const ImageCropper = lazyWithRetry(() => import('./pages/tools/ImageCropper'));
const ImageConverter = lazyWithRetry(() => import('./pages/tools/ImageConverter'));
const ImageCollage = lazyWithRetry(() => import('./pages/tools/ImageCollage'));
const ImageToPdf = lazyWithRetry(() => import('./pages/tools/ImageToPdf'));
const ImageWatermark = lazyWithRetry(() => import('./pages/tools/ImageWatermark'));
const ImageColorExtractor = lazyWithRetry(() => import('./pages/tools/ImageColorExtractor'));
const WordCounter = lazyWithRetry(() => import('./pages/tools/WordCounter'));
const VoiceHelper = lazyWithRetry(() => import('./pages/tools/VoiceHelper'));
const AudioVideoTranscriber = lazyWithRetry(() => import('./pages/tools/AudioVideoTranscriber'));
const UuidGenerator = lazyWithRetry(() => import('./pages/tools/UuidGenerator'));
const PasswordGenerator = lazyWithRetry(() => import('./pages/tools/PasswordGenerator'));
const CaseConverter = lazyWithRetry(() => import('./pages/tools/CaseConverter'));
const FontConverter = lazyWithRetry(() => import('./pages/tools/FontConverter'));
const HashGenerator = lazyWithRetry(() => import('./pages/tools/HashGenerator'));
const LoremIpsum = lazyWithRetry(() => import('./pages/tools/LoremIpsum'));
const TextLineEditor = lazyWithRetry(() => import('./pages/tools/TextLineEditor'));
const FindAndReplace = lazyWithRetry(() => import('./pages/tools/FindAndReplace'));

// Developer Tools (Lazy loaded)
const JwtDecoder = lazyWithRetry(() => import('./pages/tools/JwtDecoder'));
const RegexTester = lazyWithRetry(() => import('./pages/tools/RegexTester'));
const ColorPicker = lazyWithRetry(() => import('./pages/tools/ColorPicker'));
const GradientGenerator = lazyWithRetry(() => import('./pages/tools/GradientGenerator'));
const JwtSecretGenerator = lazyWithRetry(() => import('./pages/tools/JwtSecretGenerator'));
const JsonFormatter = lazyWithRetry(() => import('./pages/tools/JsonFormatter'));
const Base64Converter = lazyWithRetry(() => import('./pages/tools/Base64Converter'));
const UrlConverter = lazyWithRetry(() => import('./pages/tools/UrlConverter'));

const CronParser = lazyWithRetry(() => import('./pages/tools/CronParser'));
const EncoderDecoder = lazyWithRetry(() => import('./pages/tools/EncoderDecoder'));
const HtmlPreviewer = lazyWithRetry(() => import('./pages/tools/HtmlPreviewer'));
const MarkdownPreviewer = lazyWithRetry(() => import('./pages/tools/MarkdownPreviewer'));
const TypeConverter = lazyWithRetry(() => import('./pages/tools/TypeConverter'));
const GoogleSearchBuilder = lazyWithRetry(() => import('./pages/tools/GoogleSearchBuilder'));
const AiImageToMarkdown = lazyWithRetry(() => import('./pages/tools/AiImageToMarkdown'));
const AiPdfToMarkdown = lazyWithRetry(() => import('./pages/tools/AiPdfToMarkdown'));
const AiCodePlayground = lazyWithRetry(() => import('./pages/tools/AiCodePlayground'));

// PDF Tools (Lazy loaded)
const PdfEdit = lazyWithRetry(() => import('./pages/tools/PdfEdit'));
const PdfConverter = lazyWithRetry(() => import('./pages/tools/PdfConverter'));
const PdfMerge = lazyWithRetry(() => import('./pages/tools/PdfMerge'));
const PdfSplit = lazyWithRetry(() => import('./pages/tools/PdfSplit'));
const PdfWatermark = lazyWithRetry(() => import('./pages/tools/PdfWatermark'));
const PdfLock = lazyWithRetry(() => import('./pages/tools/PdfLock'));
const PdfUnlock = lazyWithRetry(() => import('./pages/tools/PdfUnlock'));
const PdfMetadata = lazyWithRetry(() => import('./pages/tools/PdfMetadata'));
const PdfToText = lazyWithRetry(() => import('./pages/tools/PdfToText'));
const PdfCompressor = lazyWithRetry(() => import('./pages/tools/PdfCompressor'));
const PdfOrganizer = lazyWithRetry(() => import('./pages/tools/PdfOrganizer'));
const PdfAudioReader = lazyWithRetry(() => import('./pages/tools/PdfAudioReader'));

// Student & Docs Tools (Lazy loaded)
const ReadmeGenerator = lazyWithRetry(() => import('./pages/tools/ReadmeGenerator'));
const CodeToImage = lazyWithRetry(() => import('./pages/tools/CodeToImage'));
const ImageToText = lazyWithRetry(() => import('./pages/tools/ImageToText'));
const TextDiff = lazyWithRetry(() => import('./pages/tools/TextDiff'));
const MarkdownEditor = lazyWithRetry(() => import('./pages/tools/MarkdownEditor'));
const TextAnalyzer = lazyWithRetry(() => import('./pages/tools/TextAnalyzer'));
const CitationGenerator = lazyWithRetry(() => import('./pages/tools/CitationGenerator'));
const PomodoroHub = lazyWithRetry(() => import('./pages/tools/PomodoroHub'));
const HtmlSandbox = lazyWithRetry(() => import('./pages/tools/HtmlSandbox'));
const DevProfileGenerator = lazyWithRetry(() => import('./pages/tools/DevProfileGenerator'));

// Finance & Productivity (Lazy loaded)
const EmiCalculator = lazyWithRetry(() => import('./pages/tools/EmiCalculator'));
const SipCalculator = lazyWithRetry(() => import('./pages/tools/SipCalculator'));
const GstCalculator = lazyWithRetry(() => import('./pages/tools/GstCalculator'));
const TaxCalculator = lazyWithRetry(() => import('./pages/tools/TaxCalculator'));

// File Management Tools (Lazy loaded)
const TempShare = lazyWithRetry(() => import('./pages/tools/TempShare'));
const TempShareDownload = lazyWithRetry(() => import('./pages/tools/TempShareDownload'));
const BatchRenamer = lazyWithRetry(() => import('./pages/tools/BatchRenamer'));
const ZipArchiver = lazyWithRetry(() => import('./pages/tools/ZipArchiver'));
const FileVault = lazyWithRetry(() => import('./pages/tools/FileVault'));

// Word & Docs Tools (Lazy loaded)
const DocxConverter = lazyWithRetry(() => import('./pages/tools/DocxConverter'));
const DocTemplateBuilder = lazyWithRetry(() => import('./pages/tools/DocTemplateBuilder'));
const GrammarChecker = lazyWithRetry(() => import('./pages/tools/GrammarChecker'));
const DocMetadataCleaner = lazyWithRetry(() => import('./pages/tools/DocMetadataCleaner'));
const SimilarityChecker = lazyWithRetry(() => import('./pages/tools/SimilarityChecker'));
const BatchFindReplace = lazyWithRetry(() => import('./pages/tools/BatchFindReplace'));
const AcademicFormatChecker = lazyWithRetry(() => import('./pages/tools/AcademicFormatChecker'));
const HtmlToDocx = lazyWithRetry(() => import('./pages/tools/HtmlToDocx'));

// Excel & Sheets Tools (Lazy loaded)
const SheetConverter = lazyWithRetry(() => import('./pages/tools/SheetConverter'));
const FormulaHelper = lazyWithRetry(() => import('./pages/tools/FormulaHelper'));
const DataCleaner = lazyWithRetry(() => import('./pages/tools/DataCleaner'));
const PivotTableBuilder = lazyWithRetry(() => import('./pages/tools/PivotTableBuilder'));
const ExcelMergeSplit = lazyWithRetry(() => import('./pages/tools/ExcelMergeSplit'));
const CsvSqlRunner = lazyWithRetry(() => import('./pages/tools/CsvSqlRunner'));
const TestDataGenerator = lazyWithRetry(() => import('./pages/tools/TestDataGenerator'));
const AmortizationScheduler = lazyWithRetry(() => import('./pages/tools/AmortizationScheduler'));

// PowerPoint & Slides Tools (Lazy loaded)
const MdToSlides = lazyWithRetry(() => import('./pages/tools/MdToSlides'));
const HtmlPresentation = lazyWithRetry(() => import('./pages/tools/HtmlPresentation'));
const PrompterTimer = lazyWithRetry(() => import('./pages/tools/PrompterTimer'));
const PptToPdf = lazyWithRetry(() => import('./pages/tools/PptToPdf'));
const PptPaletteGenerator = lazyWithRetry(() => import('./pages/tools/PptPaletteGenerator'));
const PresentationRemote = lazyWithRetry(() => import('./pages/tools/PresentationRemote'));
const SlideMockup = lazyWithRetry(() => import('./pages/tools/SlideMockup'));
const PptxMetadataEditor = lazyWithRetry(() => import('./pages/tools/PptxMetadataEditor'));

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
};

const GuestLockRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/?authGate=true" replace />;
};

// Premium loader spinner shown while lazy routes are streaming
const PageLoader = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-pulse">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl border border-primary/30 flex items-center justify-center shadow-lg">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-2">Loading Workspace...</p>
    </div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Pages (No Sidebar) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tools/html-previewer/sandbox" element={<HtmlSandbox />} />

          {/* App Pages (With Sidebar & Topbar) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/pinned" element={<PinnedTools />} />
            <Route path="/recent" element={<RecentTools />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/tools/word-counter" element={<WordCounter />} />
            <Route path="/tools/voice-helper" element={<VoiceHelper />} />
            <Route path="/tools/audio-video-transcriber" element={<GuestLockRoute><AudioVideoTranscriber /></GuestLockRoute>} />
            <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
            <Route path="/tools/password-generator" element={<PasswordGenerator />} />
            <Route path="/tools/case-converter" element={<CaseConverter />} />
            <Route path="/tools/font-converter" element={<FontConverter />} />
            <Route path="/tools/hash-generator" element={<HashGenerator />} />
            <Route path="/tools/lorem-ipsum" element={<LoremIpsum />} />
            <Route path="/tools/text-line-editor" element={<TextLineEditor />} />
            <Route path="/tools/find-replace" element={<FindAndReplace />} />
            <Route path="/tools/jwt-decoder" element={<JwtDecoder />} />
            <Route path="/tools/regex-tester" element={<GuestLockRoute><RegexTester /></GuestLockRoute>} />
            <Route path="/tools/color-picker" element={<ColorPicker />} />
            <Route path="/tools/gradient-generator" element={<GradientGenerator />} />
            <Route path="/tools/image-compressor" element={<ImageCompressor />} />
            <Route path="/tools/image-resizer" element={<ImageResizer />} />
            <Route path="/tools/image-cropper" element={<ImageCropper />} />
            <Route path="/tools/image-converter" element={<ImageConverter />} />
            <Route path="/tools/image-collage" element={<ImageCollage />} />
            <Route path="/tools/image-to-pdf" element={<ImageToPdf />} />
            <Route path="/tools/image-watermark" element={<ImageWatermark />} />
            <Route path="/tools/image-color-extractor" element={<ImageColorExtractor />} />
            
            {/* New Dev Tools Routes */}
            <Route path="/tools/jwt-secret-generator" element={<JwtSecretGenerator />} />
            <Route path="/tools/json-formatter" element={<JsonFormatter />} />
            <Route path="/tools/base64-converter" element={<Base64Converter />} />
            <Route path="/tools/url-converter" element={<UrlConverter />} />

            <Route path="/tools/cron-parser" element={<GuestLockRoute><CronParser /></GuestLockRoute>} />
            <Route path="/tools/html-previewer" element={<HtmlPreviewer />} />
            <Route path="/tools/markdown-previewer" element={<MarkdownPreviewer />} />
            <Route path="/tools/type-converter" element={<TypeConverter />} />
            <Route path="/tools/google-search-builder" element={<GuestLockRoute><GoogleSearchBuilder /></GuestLockRoute>} />
            <Route path="/tools/ai-image-to-markdown" element={<GuestLockRoute><AiImageToMarkdown /></GuestLockRoute>} />
            <Route path="/tools/ai-pdf-to-markdown" element={<GuestLockRoute><AiPdfToMarkdown /></GuestLockRoute>} />
            <Route path="/tools/ai-code-playground" element={<GuestLockRoute><AiCodePlayground /></GuestLockRoute>} />

            {/* New PDF Tools Routes */}
            <Route path="/tools/pdf-merge" element={<PdfMerge />} />
            <Route path="/tools/pdf-split" element={<PdfSplit />} />
            <Route path="/tools/pdf-watermark" element={<PdfWatermark />} />
            <Route path="/tools/pdf-lock" element={<PdfLock />} />
            <Route path="/tools/pdf-unlock" element={<PdfUnlock />} />
            <Route path="/tools/pdf-metadata" element={<PdfMetadata />} />
            <Route path="/tools/pdf-to-text" element={<PdfToText />} />
            <Route path="/tools/pdf-edit" element={<PdfEdit />} />
            <Route path="/tools/pdf-converter" element={<PdfConverter />} />
            <Route path="/tools/pdf-compressor" element={<PdfCompressor />} />
            <Route path="/tools/pdf-organizer" element={<PdfOrganizer />} />
            <Route path="/tools/pdf-audio-reader" element={<PdfAudioReader />} />

            {/* Student & Docs Tools Routes */}
            <Route path="/tools/readme-generator" element={<ReadmeGenerator />} />
            <Route path="/tools/code-to-image" element={<CodeToImage />} />
            <Route path="/tools/image-to-text" element={<ImageToText />} />
            <Route path="/tools/text-diff" element={<TextDiff />} />
            <Route path="/tools/markdown-editor" element={<MarkdownEditor />} />
            <Route path="/tools/text-analyzer" element={<TextAnalyzer />} />
            <Route path="/tools/citation-generator" element={<CitationGenerator />} />
            <Route path="/tools/pomodoro-hub" element={<PomodoroHub />} />
            <Route path="/tools/developer-profile" element={<DevProfileGenerator />} />

            {/* Finance & Productivity Tools Routes */}
            <Route path="/tools/emi-calculator" element={<EmiCalculator />} />
            <Route path="/tools/sip-calculator" element={<SipCalculator />} />
            <Route path="/tools/gst-calculator" element={<GstCalculator />} />
            <Route path="/tools/tax-calculator" element={<TaxCalculator />} />

            {/* Developer & Data Tools */}
            <Route path="/tools/encoder-decoder" element={<EncoderDecoder />} />

            {/* File & Storage Tools */}
            <Route path="/tools/temp-share" element={<TempShare />} />
            <Route path="/tools/temp-share/download/:id" element={<TempShareDownload />} />
            <Route path="/tools/batch-renamer" element={<BatchRenamer />} />
            <Route path="/tools/zip-archiver" element={<ZipArchiver />} />
            <Route path="/tools/file-vault" element={<FileVault />} />

            {/* Word & Docs Tools Routes */}
            <Route path="/tools/docx-converter" element={<DocxConverter />} />
            <Route path="/tools/doc-template-builder" element={<DocTemplateBuilder />} />
            <Route path="/tools/grammar-checker" element={<GrammarChecker />} />
            <Route path="/tools/doc-metadata-cleaner" element={<DocMetadataCleaner />} />
            <Route path="/tools/similarity-checker" element={<SimilarityChecker />} />
            <Route path="/tools/batch-find-replace" element={<BatchFindReplace />} />
            <Route path="/tools/academic-format-checker" element={<AcademicFormatChecker />} />
            <Route path="/tools/html-to-docx" element={<HtmlToDocx />} />

            {/* Excel & Sheets Tools Routes */}
            <Route path="/tools/sheet-converter" element={<SheetConverter />} />
            <Route path="/tools/formula-helper" element={<FormulaHelper />} />
            <Route path="/tools/data-cleaner" element={<DataCleaner />} />
            <Route path="/tools/pivot-table-builder" element={<PivotTableBuilder />} />
            <Route path="/tools/excel-merge-split" element={<ExcelMergeSplit />} />
            <Route path="/tools/csv-sql-runner" element={<CsvSqlRunner />} />
            <Route path="/tools/test-data-generator" element={<TestDataGenerator />} />
            <Route path="/tools/amortization-scheduler" element={<AmortizationScheduler />} />

            {/* PowerPoint & Slides Tools Routes */}
            <Route path="/tools/md-to-slides" element={<MdToSlides />} />
            <Route path="/tools/html-presentation" element={<HtmlPresentation />} />
            <Route path="/tools/prompter-timer" element={<PrompterTimer />} />
            <Route path="/tools/ppt-to-pdf" element={<PptToPdf />} />
            <Route path="/tools/ppt-palette-generator" element={<PptPaletteGenerator />} />
            <Route path="/tools/presentation-remote" element={<PresentationRemote />} />
            <Route path="/tools/slide-mockup" element={<SlideMockup />} />
            <Route path="/tools/pptx-metadata-editor" element={<PptxMetadataEditor />} />
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

import RouteTracker from './components/RouteTracker';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' } }} />
        <RouteTracker />
        <AnimatedRoutes />
        <Analytics />
      </Router>
    </AuthProvider>
  );
}

export default App;
