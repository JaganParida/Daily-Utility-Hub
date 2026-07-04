import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Core Pages (Lazy loaded)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PinnedTools = lazy(() => import('./pages/PinnedTools'));
const RecentTools = lazy(() => import('./pages/RecentTools'));
const Profile = lazy(() => import('./pages/Profile'));
const Home = lazy(() => import('./pages/Home'));

// Auth Pages (Lazy loaded)
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));

// Image Tools (Lazy loaded)
const ImageCompressor = lazy(() => import('./pages/tools/ImageCompressor'));
const ImageResizer = lazy(() => import('./pages/tools/ImageResizer'));
const ImageCropper = lazy(() => import('./pages/tools/ImageCropper'));
const ImageConverter = lazy(() => import('./pages/tools/ImageConverter'));
const ImageCollage = lazy(() => import('./pages/tools/ImageCollage'));
const ImageToPdf = lazy(() => import('./pages/tools/ImageToPdf'));
const ImageWatermark = lazy(() => import('./pages/tools/ImageWatermark'));
const ImageColorExtractor = lazy(() => import('./pages/tools/ImageColorExtractor'));
const WordCounter = lazy(() => import('./pages/tools/WordCounter'));
const VoiceHelper = lazy(() => import('./pages/tools/VoiceHelper'));
const AudioVideoTranscriber = lazy(() => import('./pages/tools/AudioVideoTranscriber'));
const UuidGenerator = lazy(() => import('./pages/tools/UuidGenerator'));
const PasswordGenerator = lazy(() => import('./pages/tools/PasswordGenerator'));
const CaseConverter = lazy(() => import('./pages/tools/CaseConverter'));
const FontConverter = lazy(() => import('./pages/tools/FontConverter'));
const HashGenerator = lazy(() => import('./pages/tools/HashGenerator'));
const LoremIpsum = lazy(() => import('./pages/tools/LoremIpsum'));
const TextLineEditor = lazy(() => import('./pages/tools/TextLineEditor'));
const FindAndReplace = lazy(() => import('./pages/tools/FindAndReplace'));

// Developer Tools (Lazy loaded)
const JwtDecoder = lazy(() => import('./pages/tools/JwtDecoder'));
const RegexTester = lazy(() => import('./pages/tools/RegexTester'));
const ColorPicker = lazy(() => import('./pages/tools/ColorPicker'));
const GradientGenerator = lazy(() => import('./pages/tools/GradientGenerator'));
const ApiKeyGenerator = lazy(() => import('./pages/tools/ApiKeyGenerator'));
const JsonFormatter = lazy(() => import('./pages/tools/JsonFormatter'));
const Base64Converter = lazy(() => import('./pages/tools/Base64Converter'));
const UrlConverter = lazy(() => import('./pages/tools/UrlConverter'));
const BcryptGenerator = lazy(() => import('./pages/tools/BcryptGenerator'));
const CronParser = lazy(() => import('./pages/tools/CronParser'));
const EncoderDecoder = lazy(() => import('./pages/tools/EncoderDecoder'));
const HtmlPreviewer = lazy(() => import('./pages/tools/HtmlPreviewer'));
const MarkdownPreviewer = lazy(() => import('./pages/tools/MarkdownPreviewer'));
const TypeConverter = lazy(() => import('./pages/tools/TypeConverter'));

// PDF Tools (Lazy loaded)
const PdfEdit = lazy(() => import('./pages/tools/PdfEdit'));
const PdfConverter = lazy(() => import('./pages/tools/PdfConverter'));
const PdfMerge = lazy(() => import('./pages/tools/PdfMerge'));
const PdfSplit = lazy(() => import('./pages/tools/PdfSplit'));
const PdfWatermark = lazy(() => import('./pages/tools/PdfWatermark'));
const PdfLock = lazy(() => import('./pages/tools/PdfLock'));
const PdfUnlock = lazy(() => import('./pages/tools/PdfUnlock'));
const PdfMetadata = lazy(() => import('./pages/tools/PdfMetadata'));
const PdfToText = lazy(() => import('./pages/tools/PdfToText'));
const PdfCompressor = lazy(() => import('./pages/tools/PdfCompressor'));
const PdfOrganizer = lazy(() => import('./pages/tools/PdfOrganizer'));
const PdfAudioReader = lazy(() => import('./pages/tools/PdfAudioReader'));

// Student & Docs Tools (Lazy loaded)
const ReadmeGenerator = lazy(() => import('./pages/tools/ReadmeGenerator'));
const CodeToImage = lazy(() => import('./pages/tools/CodeToImage'));
const ImageToText = lazy(() => import('./pages/tools/ImageToText'));
const TextDiff = lazy(() => import('./pages/tools/TextDiff'));
const MarkdownEditor = lazy(() => import('./pages/tools/MarkdownEditor'));
const TextAnalyzer = lazy(() => import('./pages/tools/TextAnalyzer'));
const CitationGenerator = lazy(() => import('./pages/tools/CitationGenerator'));
const PomodoroHub = lazy(() => import('./pages/tools/PomodoroHub'));
const HtmlSandbox = lazy(() => import('./pages/tools/HtmlSandbox'));
const DevProfileGenerator = lazy(() => import('./pages/tools/DevProfileGenerator'));

// Finance & Productivity (Lazy loaded)
const EmiCalculator = lazy(() => import('./pages/tools/EmiCalculator'));
const SipCalculator = lazy(() => import('./pages/tools/SipCalculator'));
const GstCalculator = lazy(() => import('./pages/tools/GstCalculator'));
const TaxCalculator = lazy(() => import('./pages/tools/TaxCalculator'));

// File Management Tools (Lazy loaded)
const TempShare = lazy(() => import('./pages/tools/TempShare'));
const BatchRenamer = lazy(() => import('./pages/tools/BatchRenamer'));
const ZipArchiver = lazy(() => import('./pages/tools/ZipArchiver'));
const FileVault = lazy(() => import('./pages/tools/FileVault'));

// Word & Docs Tools (Lazy loaded)
const DocxConverter = lazy(() => import('./pages/tools/DocxConverter'));
const DocTemplateBuilder = lazy(() => import('./pages/tools/DocTemplateBuilder'));
const GrammarChecker = lazy(() => import('./pages/tools/GrammarChecker'));
const DocMetadataCleaner = lazy(() => import('./pages/tools/DocMetadataCleaner'));
const SimilarityChecker = lazy(() => import('./pages/tools/SimilarityChecker'));
const BatchFindReplace = lazy(() => import('./pages/tools/BatchFindReplace'));
const AcademicFormatChecker = lazy(() => import('./pages/tools/AcademicFormatChecker'));
const HtmlToDocx = lazy(() => import('./pages/tools/HtmlToDocx'));

// Excel & Sheets Tools (Lazy loaded)
const SheetConverter = lazy(() => import('./pages/tools/SheetConverter'));
const FormulaHelper = lazy(() => import('./pages/tools/FormulaHelper'));
const DataCleaner = lazy(() => import('./pages/tools/DataCleaner'));
const PivotTableBuilder = lazy(() => import('./pages/tools/PivotTableBuilder'));
const ExcelMergeSplit = lazy(() => import('./pages/tools/ExcelMergeSplit'));
const CsvSqlRunner = lazy(() => import('./pages/tools/CsvSqlRunner'));
const TestDataGenerator = lazy(() => import('./pages/tools/TestDataGenerator'));
const AmortizationScheduler = lazy(() => import('./pages/tools/AmortizationScheduler'));

// PowerPoint & Slides Tools (Lazy loaded)
const MdToSlides = lazy(() => import('./pages/tools/MdToSlides'));
const HtmlPresentation = lazy(() => import('./pages/tools/HtmlPresentation'));
const PrompterTimer = lazy(() => import('./pages/tools/PrompterTimer'));
const PptToPdf = lazy(() => import('./pages/tools/PptToPdf'));
const PptPaletteGenerator = lazy(() => import('./pages/tools/PptPaletteGenerator'));
const PresentationRemote = lazy(() => import('./pages/tools/PresentationRemote'));
const SlideMockup = lazy(() => import('./pages/tools/SlideMockup'));
const PptxMetadataEditor = lazy(() => import('./pages/tools/PptxMetadataEditor'));

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
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
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/tools/html-previewer/sandbox" element={<HtmlSandbox />} />

          {/* App Pages (With Sidebar & Topbar) */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pinned" element={<PinnedTools />} />
            <Route path="/recent" element={<RecentTools />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/tools/word-counter" element={<WordCounter />} />
            <Route path="/tools/voice-helper" element={<VoiceHelper />} />
            <Route path="/tools/audio-video-transcriber" element={<AudioVideoTranscriber />} />
            <Route path="/tools/uuid-generator" element={<UuidGenerator />} />
            <Route path="/tools/password-generator" element={<PasswordGenerator />} />
            <Route path="/tools/case-converter" element={<CaseConverter />} />
            <Route path="/tools/font-converter" element={<FontConverter />} />
            <Route path="/tools/hash-generator" element={<HashGenerator />} />
            <Route path="/tools/lorem-ipsum" element={<LoremIpsum />} />
            <Route path="/tools/text-line-editor" element={<TextLineEditor />} />
            <Route path="/tools/find-replace" element={<FindAndReplace />} />
            <Route path="/tools/jwt-decoder" element={<JwtDecoder />} />
            <Route path="/tools/regex-tester" element={<RegexTester />} />
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
            <Route path="/tools/api-key-generator" element={<ApiKeyGenerator />} />
            <Route path="/tools/json-formatter" element={<JsonFormatter />} />
            <Route path="/tools/base64-converter" element={<Base64Converter />} />
            <Route path="/tools/url-converter" element={<UrlConverter />} />
            <Route path="/tools/bcrypt-generator" element={<BcryptGenerator />} />
            <Route path="/tools/cron-parser" element={<CronParser />} />
            <Route path="/tools/html-previewer" element={<HtmlPreviewer />} />
            <Route path="/tools/markdown-previewer" element={<MarkdownPreviewer />} />
            <Route path="/tools/type-converter" element={<TypeConverter />} />

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
      </Router>
    </AuthProvider>
  );
}

export default App;
