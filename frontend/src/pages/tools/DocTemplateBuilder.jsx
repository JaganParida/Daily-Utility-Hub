import { useState } from 'react';
import { Layers, Download, Plus, Trash2, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';

const TEMPLATES = [
  { id: 'resume', name: 'Professional Resume', desc: 'Sleek software engineer resume layout.' },
  { id: 'nda', name: 'Mutual NDA Agreement', desc: 'Standard non-disclosure legal document.' },
  { id: 'proposal', name: 'Business Project Proposal', desc: 'Professional pitch and pricing deck.' }
];

const DocTemplateBuilder = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('resume');
  
  // Resume state
  const [resumeData, setResumeData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    skills: 'React, Node.js, Go, Docker',
    experience: 'Senior Developer at Tech Labs (2022-Present)\n- Built scalable APIs\n- Managed a team of 4 engineer developers.'
  });

  // NDA state
  const [ndaData, setNdaData] = useState({
    partyA: 'Acme Corporations Inc.',
    partyB: 'DevConsultants Ltd.',
    effectiveDate: 'October 12, 2024',
    jurisdiction: 'State of California'
  });

  // Proposal state
  const [proposalData, setProposalData] = useState({
    clientName: 'Megacorp International',
    projectName: 'Cloud Migration Strategy',
    scope: 'Migrate legacy local SQL databases and APIs to microservices in AWS.',
    budget: '$50,000'
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    
    if (selectedTemplate === 'resume') {
      doc.setFontSize(22);
      doc.text(resumeData.name, 15, 20);
      doc.setFontSize(12);
      doc.text(`Email: ${resumeData.email}`, 15, 28);
      doc.line(15, 32, 195, 32);
      
      doc.setFontSize(14);
      doc.text("Skills & Technologies", 15, 42);
      doc.setFontSize(11);
      doc.text(resumeData.skills, 15, 48);

      doc.setFontSize(14);
      doc.text("Work History & Experience", 15, 62);
      doc.setFontSize(11);
      const splitExp = doc.splitTextToSize(resumeData.experience, 180);
      doc.text(splitExp, 15, 68);
    } 
    else if (selectedTemplate === 'nda') {
      doc.setFontSize(18);
      doc.text("Mutual Non-Disclosure Agreement", 15, 20);
      doc.line(15, 25, 195, 25);
      
      doc.setFontSize(11);
      const text = `This Agreement is entered into on ${ndaData.effectiveDate} by and between ${ndaData.partyA} ("Disclosing Party") and ${ndaData.partyB} ("Receiving Party").\n\n1. Purpose\nParties wish to explore a business relationship in which proprietary data will be shared.\n\n2. Governing Law\nThis NDA shall be governed under the jurisdiction of the ${ndaData.jurisdiction}.\n\nSignature Party A: __________________\n\nSignature Party B: __________________`;
      const splitText = doc.splitTextToSize(text, 180);
      doc.text(splitText, 15, 35);
    } 
    else {
      doc.setFontSize(20);
      doc.text("Business Project Proposal", 15, 20);
      doc.setFontSize(12);
      doc.text(`Client: ${proposalData.clientName}`, 15, 28);
      doc.line(15, 32, 195, 32);

      doc.setFontSize(14);
      doc.text(`Project Name: ${proposalData.projectName}`, 15, 42);
      doc.setFontSize(11);
      doc.text("Project Scope:", 15, 52);
      const splitScope = doc.splitTextToSize(proposalData.scope, 180);
      doc.text(splitScope, 15, 58);
      
      doc.setFontSize(12);
      doc.text(`Estimated Investment Budget: ${proposalData.budget}`, 15, 100);
    }

    doc.save(`${selectedTemplate}_document.pdf`);
    toast.success('Document template exported as PDF!');
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 md:px-8">
      <div className="mb-6 flex items-start gap-4 shrink-0">
        <div className="p-2 bg-primary/10 text-primary rounded-md shadow-sm">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Interactive Document Builder</h1>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">Compile formal legal documents, proposals, and portfolios, with live previews and high-res PDF downloads.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        
        {/* Editor Form */}
        <div className="w-full lg:w-[480px] shrink-0 space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Document Template</label>
            <div className="grid grid-cols-3 gap-2 bg-background border border-border p-1 rounded-xl">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`text-xs py-2 px-1 font-bold rounded-lg transition-all truncate ${selectedTemplate === t.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.name.split(' ')[1] || t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Document Content</h3>
            
            {/* Form Fields: Resume */}
            {selectedTemplate === 'resume' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.name}
                    onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Skills & Frameworks</label>
                  <input
                    type="text"
                    value={resumeData.skills}
                    onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Professional Experience</label>
                  <textarea
                    value={resumeData.experience}
                    onChange={(e) => setResumeData({ ...resumeData, experience: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-y"
                  />
                </div>
              </div>
            )}

            {/* Form Fields: NDA */}
            {selectedTemplate === 'nda' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Disclosing Party (Party A)</label>
                  <input
                    type="text"
                    value={ndaData.partyA}
                    onChange={(e) => setNdaData({ ...ndaData, partyA: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Receiving Party (Party B)</label>
                  <input
                    type="text"
                    value={ndaData.partyB}
                    onChange={(e) => setNdaData({ ...ndaData, partyB: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Effective Date</label>
                  <input
                    type="text"
                    value={ndaData.effectiveDate}
                    onChange={(e) => setNdaData({ ...ndaData, effectiveDate: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Governing Law Jurisdiction</label>
                  <input
                    type="text"
                    value={ndaData.jurisdiction}
                    onChange={(e) => setNdaData({ ...ndaData, jurisdiction: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Form Fields: Proposal */}
            {selectedTemplate === 'proposal' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Client Name</label>
                  <input
                    type="text"
                    value={proposalData.clientName}
                    onChange={(e) => setProposalData({ ...proposalData, clientName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Project Title Name</label>
                  <input
                    type="text"
                    value={proposalData.projectName}
                    onChange={(e) => setProposalData({ ...proposalData, projectName: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Project Scope & Details</label>
                  <textarea
                    value={proposalData.scope}
                    onChange={(e) => setProposalData({ ...proposalData, scope: e.target.value })}
                    rows={4}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wider">Budget Estimate</label>
                  <input
                    type="text"
                    value={proposalData.budget}
                    onChange={(e) => setProposalData({ ...proposalData, budget: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={exportPDF}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Download Template PDF
            </button>
          </div>
        </div>

        {/* Live paper preview */}
        <div className="flex-1 w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm uppercase tracking-wider">
              <Eye size={16} className="text-primary" />
              Live Proposal / NDA Preview
            </h2>
          </div>

          <div className="flex-1 p-6 md:p-12 bg-neutral-900 flex justify-center items-center overflow-auto custom-scrollbar">
            <div className="w-full max-w-2xl aspect-[1/1.4] bg-white text-slate-800 shadow-2xl rounded-sm border border-slate-200 relative shrink-0">
              <div className="absolute inset-0 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col font-serif">
              {selectedTemplate === 'resume' && (
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">{resumeData.name}</h1>
                  <p className="text-sm text-indigo-600 font-semibold mt-1">Email: {resumeData.email}</p>
                  <div className="w-full h-0.5 bg-slate-200 my-6" />
                  
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">Technical Skills</h3>
                  <p className="text-sm text-slate-700 leading-relaxed mb-6">{resumeData.skills}</p>

                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">Experience & Projects</h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{resumeData.experience}</p>
                </div>
              )}

              {selectedTemplate === 'nda' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-slate-900 text-center tracking-tight uppercase">Mutual Non-Disclosure Agreement</h1>
                  <div className="w-12 h-1 bg-indigo-600 mx-auto my-4" />
                  
                  <p className="text-sm text-slate-700 leading-relaxed mt-6">
                    This Non-Disclosure Agreement (the "Agreement") is entered into and made effective as of <strong>{ndaData.effectiveDate}</strong>, by and between <strong>{ndaData.partyA}</strong> ("Disclosing Party") and <strong>{ndaData.partyB}</strong> ("Receiving Party").
                  </p>
                  
                  <h3 className="text-base font-bold text-slate-900 mt-6">1. Confidentiality Scope</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    The receiving party agrees to hold all disclosed trade secrets, source code, and commercial strategies in strict confidence and shall not disclose them to any third party without consent.
                  </p>

                  <h3 className="text-base font-bold text-slate-900 mt-6">2. Governing Jurisdiction</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    This agreement is governed by the laws and regulations of the <strong>{ndaData.jurisdiction}</strong>.
                  </p>
                </div>
              )}

              {selectedTemplate === 'proposal' && (
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Business Pitch Proposal</span>
                  <h1 className="text-3xl font-black text-slate-900 mt-2 mb-1">{proposalData.projectName}</h1>
                  <p className="text-sm text-slate-400">Prepared for: {proposalData.clientName}</p>
                  
                  <div className="w-full h-0.5 bg-slate-200 my-6" />
                  
                  <h3 className="text-base font-bold text-slate-900 mb-2">Project Scope & Deliverables</h3>
                  <p className="text-sm text-slate-700 leading-relaxed mb-6">{proposalData.scope}</p>

                  <h3 className="text-base font-bold text-slate-900 mb-1">Financial Investment</h3>
                  <p className="text-xl font-bold text-indigo-600">{proposalData.budget}</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocTemplateBuilder;
