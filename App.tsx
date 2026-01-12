
import React, { useState, useEffect, useCallback } from 'react';
import { Shipment, AppView, DocumentChecklistItem } from './types';
import { DOC_DEFINITIONS, PEMEX_DOCS, HAZMAT_DOCS, ICONS } from './constants';
import { generateShipmentReport, askAssistant } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Form State
  const [newShipment, setNewShipment] = useState<Partial<Shipment>>({
    productName: '',
    quantity: '',
    destination: '',
    shipDate: '',
    customerName: '',
    isPemex: false,
    isHazmat: false,
  });

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId);

  const handleCreateShipment = async () => {
    if (!newShipment.productName || !newShipment.shipDate) return;

    setIsGenerating(true);
    const baseDocs = [...DOC_DEFINITIONS];
    if (newShipment.isPemex) baseDocs.push(...PEMEX_DOCS);
    if (newShipment.isHazmat) baseDocs.push(...HAZMAT_DOCS);

    const checklist: DocumentChecklistItem[] = baseDocs.map(d => ({
      ...d,
      isCompleted: false,
    }));

    const shipment: Shipment = {
      id: Date.now().toString(),
      productName: newShipment.productName!,
      quantity: newShipment.quantity || 'TBD',
      destination: newShipment.destination || 'TBD',
      shipDate: newShipment.shipDate!,
      customerName: newShipment.customerName || 'TBD',
      isPemex: !!newShipment.isPemex,
      isHazmat: !!newShipment.isHazmat,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      documentChecklist: checklist,
    };

    // Generate AI Report
    const report = await generateShipmentReport(shipment);
    shipment.aiReport = report;

    setShipments(prev => [shipment, ...prev]);
    setSelectedShipmentId(shipment.id);
    setView(AppView.SHIPMENT_DETAIL);
    setIsGenerating(false);
    
    // Reset form
    setNewShipment({
      productName: '',
      quantity: '',
      destination: '',
      shipDate: '',
      customerName: '',
      isPemex: false,
      isHazmat: false,
    });
  };

  const toggleDocStatus = (shipmentId: string, docName: string) => {
    setShipments(prev => prev.map(s => {
      if (s.id === shipmentId) {
        const newChecklist = s.documentChecklist.map(d => 
          d.name === docName ? { ...d, isCompleted: !d.isCompleted } : d
        );
        const allCompleted = newChecklist.every(d => d.isCompleted);
        return { 
          ...s, 
          documentChecklist: newChecklist,
          status: allCompleted ? 'ready' : 'in-progress'
        };
      }
      return s;
    }));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    const response = await askAssistant(userMsg, selectedShipment || undefined);
    setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
            <div className="bg-red-600 p-2 rounded shadow">
              <ICONS.Shipment />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Texas American Trade Inc.</h1>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Documentation Assistant</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <button onClick={() => setView(AppView.DASHBOARD)} className={`${view === AppView.DASHBOARD ? 'text-red-500' : 'hover:text-red-400'}`}>Dashboard</button>
            <button onClick={() => setView(AppView.CHAT)} className={`${view === AppView.CHAT ? 'text-red-500' : 'hover:text-red-400'}`}>AI Chat</button>
          </nav>
          <button 
            onClick={() => setView(AppView.CREATE_SHIPMENT)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-md transition-all active:scale-95"
          >
            <ICONS.Add />
            <span className="ml-2">New Shipment</span>
          </button>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8">
        {view === AppView.DASHBOARD && (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Shipment Dashboard</h2>
                <p className="text-slate-500">Track documentation for active USA → Mexico exports.</p>
              </div>
              <div className="text-sm font-medium text-slate-400">
                {shipments.length} Active Shipments
              </div>
            </div>

            {shipments.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <ICONS.Shipment />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">No shipments found</h3>
                <p className="text-slate-500 mb-6">Start by creating your first shipment documentation checklist.</p>
                <button 
                  onClick={() => setView(AppView.CREATE_SHIPMENT)}
                  className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
                >
                  Create Shipment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shipments.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => { setSelectedShipmentId(s.id); setView(AppView.SHIPMENT_DETAIL); }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-red-100 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                        s.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {s.status.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(s.shipDate).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-red-600 transition-colors">{s.productName}</h4>
                    <p className="text-sm text-slate-500 mb-4">{s.customerName} • {s.destination}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {s.isPemex && <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">PEMEX</span>}
                      {s.isHazmat && <span className="text-[10px] bg-red-50 px-2 py-1 rounded text-red-600 font-bold">HAZMAT</span>}
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(s.documentChecklist.filter(d => d.isCompleted).length / s.documentChecklist.length) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>{s.documentChecklist.filter(d => d.isCompleted).length}/{s.documentChecklist.length} Docs Ready</span>
                      <span>{Math.round((s.documentChecklist.filter(d => d.isCompleted).length / s.documentChecklist.length) * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === AppView.CREATE_SHIPMENT && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">New Shipment Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    value={newShipment.productName}
                    onChange={e => setNewShipment({...newShipment, productName: e.target.value})}
                    placeholder="e.g., Corrosion Inhibitor T-22"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity</label>
                  <input 
                    type="text" 
                    value={newShipment.quantity}
                    onChange={e => setNewShipment({...newShipment, quantity: e.target.value})}
                    placeholder="e.g., 20 Drums (4,000kg)"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Customer Name (for RFC)</label>
                <input 
                  type="text" 
                  value={newShipment.customerName}
                  onChange={e => setNewShipment({...newShipment, customerName: e.target.value})}
                  placeholder="e.g., Halliburton de Mexico"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Destination (City, State MX)</label>
                  <input 
                    type="text" 
                    value={newShipment.destination}
                    onChange={e => setNewShipment({...newShipment, destination: e.target.value})}
                    placeholder="e.g., Paraíso, Tabasco"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Ship Date</label>
                  <input 
                    type="date" 
                    value={newShipment.shipDate}
                    onChange={e => setNewShipment({...newShipment, shipDate: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newShipment.isPemex}
                    onChange={e => setNewShipment({...newShipment, isPemex: e.target.checked})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <div className="ml-3">
                    <span className="block font-bold text-slate-800">PEMEX Delivery</span>
                    <span className="text-xs text-slate-500">Requires Gate Pass & REPSE</span>
                  </div>
                </label>
                <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={newShipment.isHazmat}
                    onChange={e => setNewShipment({...newShipment, isHazmat: e.target.checked})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <div className="ml-3">
                    <span className="block font-bold text-slate-800">Hazmat Goods</span>
                    <span className="text-xs text-slate-500">Special declarations required</span>
                  </div>
                </label>
              </div>

              <div className="pt-6">
                <button 
                  disabled={isGenerating || !newShipment.productName || !newShipment.shipDate}
                  onClick={handleCreateShipment}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating Compliance Requirements...
                    </>
                  ) : 'Generate Documentation Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === AppView.SHIPMENT_DETAIL && selectedShipment && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 text-white p-6">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="text-xs flex items-center text-slate-400 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Back to Dashboard
                    </button>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-red-600 px-2 py-1 rounded">Active Shipment</span>
                  </div>
                  <h2 className="text-3xl font-bold">{selectedShipment.productName}</h2>
                  <p className="text-slate-400">{selectedShipment.customerName} • {selectedShipment.destination}</p>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Quantity</span>
                    <p className="font-semibold text-slate-800">{selectedShipment.quantity}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Ship Date</span>
                    <p className="font-semibold text-slate-800">{new Date(selectedShipment.shipDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hazmat</span>
                    <p className={`font-semibold ${selectedShipment.isHazmat ? 'text-red-600' : 'text-slate-800'}`}>{selectedShipment.isHazmat ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">PEMEX</span>
                    <p className="font-semibold text-slate-800">{selectedShipment.isPemex ? 'Yes' : 'No'}</p>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <div className="bg-red-50 p-1.5 rounded mr-2 text-red-600">
                      <ICONS.Check />
                    </div>
                    Document Completion Tracking
                  </h3>
                  <div className="space-y-2">
                    {selectedShipment.documentChecklist.map((doc, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          doc.isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'
                        }`}
                      >
                        <div className="flex items-start">
                          <button 
                            onClick={() => toggleDocStatus(selectedShipment.id, doc.name)}
                            className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                              doc.isCompleted ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-slate-300'
                            }`}
                          >
                            {doc.isCompleted && <ICONS.Check />}
                          </button>
                          <div className="ml-4">
                            <h4 className={`font-bold leading-tight ${doc.isCompleted ? 'text-green-800' : 'text-slate-800'}`}>{doc.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Prepared by: <span className="font-semibold text-slate-700">{doc.preparer}</span></p>
                            <p className="text-xs text-slate-400 mt-1">{doc.description}</p>
                          </div>
                        </div>
                        {!doc.isCompleted && (
                          <div className="hidden sm:block">
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 uppercase">Pending</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                  <div className="bg-slate-200 p-1.5 rounded mr-2 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Assistant Analysis
                </h3>
                {selectedShipment.aiReport ? (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-inner whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-mono overflow-y-auto max-h-[600px]">
                    {selectedShipment.aiReport}
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                )}
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-xs text-red-700 flex items-start">
                    <span className="mr-2"><ICONS.Alert /></span>
                    Review the report above for specific deadlines and critical Mexican regulatory requirements.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Ask Documentation Question</h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">AI Support</span>
                </div>
                <div className="p-4 space-y-4">
                  <div className="max-h-48 overflow-y-auto text-sm space-y-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">Ask about specific documents, SAT codes, or PEMEX procedures.</p>
                    ) : (
                      chatMessages.map((m, i) => (
                        <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-slate-100 ml-4' : 'bg-red-50 border border-red-100 mr-4'}`}>
                          <p className={`text-[10px] font-bold uppercase mb-1 ${m.role === 'user' ? 'text-slate-500' : 'text-red-600'}`}>{m.role}</p>
                          <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleChatSubmit} className="flex space-x-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask the assistant..."
                      className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    />
                    <button type="submit" className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.CHAT && (
          <div className="max-w-4xl mx-auto h-[70vh] flex flex-col bg-white rounded-2xl shadow-lg border overflow-hidden">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-red-600 p-2 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-bold text-xl">General Documentation Help</h2>
                  <p className="text-xs text-slate-400">Ask about any USA-Mexico trade document requirements.</p>
                </div>
              </div>
              <button 
                onClick={() => setChatMessages([])} 
                className="text-xs font-bold uppercase text-slate-400 hover:text-white"
              >
                Clear History
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Knowledge Base Active</h3>
                  <p className="text-slate-500 max-w-sm">I am fluent in English and Spanish. Ask me anything about TATI's shipping processes, USMCA rules, or PEMEX delivery protocols.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left max-w-lg w-full">
                    <button onClick={() => setChatInput("What is a Carta Porte and why is it needed?")} className="p-3 bg-white border rounded-xl text-xs hover:border-red-500 transition-colors">"What is a Carta Porte?"</button>
                    <button onClick={() => setChatInput("Which documents does TATI prepare vs the Broker?")} className="p-3 bg-white border rounded-xl text-xs hover:border-red-500 transition-colors">"Preparer Responsibilities"</button>
                    <button onClick={() => setChatInput("What information is required for a Commercial Invoice?")} className="p-3 bg-white border rounded-xl text-xs hover:border-red-500 transition-colors">"Invoice Requirements"</button>
                    <button onClick={() => setChatInput("List requirements for PEMEX delivery.")} className="p-3 bg-white border rounded-xl text-xs hover:border-red-500 transition-colors">"PEMEX Protocols"</button>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}>
                      <span className={`text-[10px] font-bold uppercase mb-2 block ${msg.role === 'user' ? 'text-slate-400' : 'text-red-600'}`}>
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={handleChatSubmit} className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Type your message in English or Spanish..."
                  className="w-full pl-6 pr-16 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-slate-800"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-2 bottom-2 bg-red-600 text-white px-6 rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-12 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h5 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">Texas American Trade Inc.</h5>
            <p className="text-slate-500 leading-relaxed">
              5075 Westheimer Suite 799W<br />
              Houston, Texas<br />
              +1 (832) 238 1103<br />
              www.texasamericantrade.com
            </p>
          </div>
          <div>
            <h5 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">Quick Support</h5>
            <ul className="text-slate-500 space-y-2">
              <li>• USMCA Compliance</li>
              <li>• SAT Product Coding</li>
              <li>• PEMEX Gate Access</li>
              <li>• Hazmat SCT Protocols</li>
            </ul>
          </div>
          <div className="text-slate-500">
            <h5 className="font-bold text-slate-900 mb-4 uppercase tracking-widest text-xs">Compliance Disclaimer</h5>
            <p className="leading-relaxed italic">
              All documentation generated should be verified by the assigned Mexican customs broker before border crossing. TATI is not responsible for border delays caused by carrier information discrepancies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
