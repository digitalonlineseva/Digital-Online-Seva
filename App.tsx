
import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ServiceForm from './components/ServiceForm';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import RegistrationForm from './components/RegistrationForm';
import ForgetPassword from './components/ForgetPassword';
import ChatAssistant from './components/ChatAssistant';
import Receipt from './components/Receipt';
import WalletView from './components/WalletView';
import ProfileView from './components/ProfileView';
import PolicyView from './components/PolicyView';
import DownloadCenter from './components/DownloadCenter';
import { ViewState, Service, Application, FormData, User, Transaction, AppNotification } from './types';
import { SERVICES as INITIAL_SERVICES } from './constants';
import { ApiService } from './services/apiService';

const DEFAULT_ADMIN: User = { 
  id: '1', 
  username: 'admin', 
  role: 'admin', 
  fullName: 'Amit Kumar', 
  status: 'Active', 
  walletBalance: 0, 
  transactions: [] 
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingApplication, setEditingApplication] = useState<Application | null>(null);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<Application | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const [services, setServices] = useState<Service[]>(() => {
    const saved = localStorage.getItem('dos_services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [applications, setApplications] = useState<Application[]>([]);
  
  // Initialize with default admin to ensure login works even during initial load
  const [retailers, setRetailers] = useState<User[]>(() => {
    const saved = localStorage.getItem('dos_retailers');
    const parsed: User[] = saved ? JSON.parse(saved) : [];
    const hasAdmin = parsed.some(r => r.role === 'admin' && r.username.toLowerCase() === 'admin');
    return hasAdmin ? parsed : [DEFAULT_ADMIN, ...parsed];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastSubmittedApp, setLastSubmittedApp] = useState<Application | null>(null);

  // 1. Critical Initial Load - Fetch everything from Cloud Sheet
  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true);
      
      try {
        if (ApiService.isConfigured()) {
          const [cloudApps, cloudRetailers] = await Promise.all([
            ApiService.getAllApplications(),
            ApiService.getAllRetailers()
          ]);
          
          // Merge logic: ensure admin always exists
          let finalRetailers = cloudRetailers;
          const hasAdmin = finalRetailers.some(r => r.role === 'admin' && r.username.toLowerCase() === 'admin');
          if (!hasAdmin) {
            finalRetailers = [DEFAULT_ADMIN, ...finalRetailers];
          }
          
          setRetailers(finalRetailers);
          if (cloudApps.length > 0) setApplications(cloudApps);
        } else {
          // Local fallback
          const savedApps = localStorage.getItem('dos_applications');
          const savedRetailers = localStorage.getItem('dos_retailers');
          if (savedApps) setApplications(JSON.parse(savedApps));
          if (savedRetailers) {
            const parsed: User[] = JSON.parse(savedRetailers);
            const hasAdmin = parsed.some(r => r.role === 'admin' && r.username.toLowerCase() === 'admin');
            setRetailers(hasAdmin ? parsed : [DEFAULT_ADMIN, ...parsed]);
          }
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsSyncing(false);
      }
    };
    initData();
  }, []);

  // 2. Real-Time Polling for Admin
  useEffect(() => {
    let interval: any;
    if (currentUser?.role === 'admin') {
      interval = setInterval(async () => {
        try {
          const [freshApps, freshRetailers] = await Promise.all([
            ApiService.getAllApplications(),
            ApiService.getAllRetailers()
          ]);
          
          if (freshApps.length > 0) setApplications(prev => JSON.stringify(prev) !== JSON.stringify(freshApps) ? freshApps : prev);
          
          if (freshRetailers.length > 0) {
            let finalRetailers = freshRetailers;
            const hasAdmin = finalRetailers.some(r => r.role === 'admin' && r.username.toLowerCase() === 'admin');
            if (!hasAdmin) finalRetailers = [DEFAULT_ADMIN, ...finalRetailers];
            setRetailers(prev => JSON.stringify(prev) !== JSON.stringify(finalRetailers) ? finalRetailers : prev);
          }
        } catch (e) {
          console.warn("Polling failed", e);
        }
      }, 20000); 
    }
    return () => clearInterval(interval);
  }, [currentUser]);

  // Sync to LocalStorage for offline speed
  useEffect(() => { localStorage.setItem('dos_applications', JSON.stringify(applications)); }, [applications]);
  useEffect(() => { localStorage.setItem('dos_retailers', JSON.stringify(retailers)); }, [retailers]);
  useEffect(() => { localStorage.setItem('dos_services', JSON.stringify(services)); }, [services]);

  const calculateFinalPrice = (originalPrice: number) => {
    if (!currentUser) return originalPrice;
    if (currentUser.role === 'admin') return 0;
    if (currentUser.role === 'retailer') return Math.round(originalPrice * 0.9);
    return originalPrice;
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setIsSyncing(true);
    setRetailers(prev => prev.map(r => r.id === updatedUser.id ? updatedUser : r));
    if (currentUser?.id === updatedUser.id) setCurrentUser(updatedUser);
    await ApiService.updateRetailer(updatedUser);
    setIsSyncing(false);
  };

  const handleWalletTransaction = (userId: string, transaction: Transaction) => {
    const target = retailers.find(r => r.id === userId);
    if (!target) return;

    let balanceChange = 0;
    if (transaction.status === 'Success') {
      if (transaction.type === 'Credit') balanceChange = transaction.amount;
      if (transaction.type === 'Debit' || transaction.type === 'Withdrawal') balanceChange = -transaction.amount;
    }

    const updatedUser: User = {
      ...target,
      walletBalance: target.walletBalance + balanceChange,
      transactions: [transaction, ...(target.transactions || [])]
    };
    handleUpdateUser(updatedUser);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = e => reject(e);
    });
  };

  const handleFormSubmit = async (data: FormData, payMethod: 'Wallet' | 'UPI') => {
    setIsSyncing(true);
    try {
      const [doc, ph, sig] = await Promise.all([
        data.document ? fileToBase64(data.document) : Promise.resolve(editingApplication?.documentUrl || ''),
        data.photo ? fileToBase64(data.photo) : Promise.resolve(editingApplication?.photoUrl || ''),
        data.signature ? fileToBase64(data.signature) : Promise.resolve(editingApplication?.signatureUrl || '')
      ]);

      const finalPrice = calculateFinalPrice(selectedService?.price || 0);
      
      if (currentUser?.role === 'retailer' && payMethod === 'Wallet') {
        if (currentUser.walletBalance < finalPrice) {
          alert("Insufficient Wallet Balance!");
          setIsSyncing(false);
          return;
        }
        handleWalletTransaction(currentUser.id, {
          id: 'DEBIT-' + Date.now().toString(36).toUpperCase(),
          type: 'Debit',
          amount: finalPrice,
          description: `Service Fee: ${selectedService?.title}`,
          date: new Date().toLocaleString(),
          status: 'Success'
        });
      }
      
      const newApp: Application = {
        id: editingApplication?.id || 'DOS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        serviceId: selectedService?.id || 'unknown',
        serviceName: selectedService?.title || 'Service',
        fullName: data.fullName,
        motherName: data.motherName,
        dob: data.dob,
        fatherName: data.fatherName,
        mobileNumber: data.mobileNumber,
        status: editingApplication?.status || 'Pending',
        amountPaid: finalPrice,
        userId: currentUser?.id,
        submittedAt: new Date().toLocaleString(),
        documentName: data.document?.name || 'identity_doc.pdf',
        documentUrl: doc as string,
        photoUrl: ph as string,
        signatureUrl: sig as string,
        addressInfo: { state: data.state, village: data.village, anchal: data.anchal, block: data.block },
        landInfo: { district: data.district, mauja: data.mauja, halka: data.halka, anchal: data.anchal },
        paymentMethod: payMethod
      };

      await ApiService.saveApplication(newApp);

      if (editingApplication) {
        setApplications(prev => prev.map(a => a.id === newApp.id ? newApp : a));
        setEditingApplication(null);
        setView('admin');
      } else {
        setApplications(prev => [newApp, ...prev]);
        setLastSubmittedApp(newApp);
        setView('receipt');
      }
      setSelectedService(null);
    } catch (e) {
      alert("Submission error. Please check your cloud configuration.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAdminStatusUpdate = async (id: string, st: any, file?: File, rem?: string) => {
    setIsSyncing(true);
    let base64File = undefined;
    if (file) base64File = await fileToBase64(file);
    await ApiService.updateStatus(id, st, rem, base64File);
    
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: st, remark: rem || a.remark, processedDocumentUrl: base64File || a.processedDocumentUrl } : a));
    setIsSyncing(false);
  };

  const handleRetailerRegister = async (newUser: User) => {
    setIsSyncing(true);
    await ApiService.saveRetailer(newUser);
    setRetailers(prev => [...prev, newUser]);
    setIsSyncing(false);
    setView('login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {isSyncing && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-600 z-[200] animate-pulse"></div>
      )}
      <Navigation 
        currentView={view} setView={setView} currentUser={currentUser} 
        onLogout={() => { setCurrentUser(null); setView('home'); }} 
        notifications={notifications} onMarkAsRead={(id) => {}}
      />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        {view === 'home' && (
          <div className="space-y-12 animate-in fade-in">
             <div className="text-center space-y-6 max-w-4xl mx-auto">
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-6xl">Digital Seva <span className="text-blue-600">Portal</span></h1>
                <p className="text-slate-600 font-bold text-lg">Official Cloud-Connected Service Gateway for Citizens and Retailers.</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((s) => (
                  <div key={s.id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col group">
                    <div className="flex justify-between mb-6">
                      <div className={`${s.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg`}><i className={s.icon}></i></div>
                      <p className="text-xl font-black text-slate-800">₹{calculateFinalPrice(s.price)}</p>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                    <p className="text-slate-500 text-sm flex-grow mb-8">{s.description}</p>
                    <button onClick={() => { setSelectedService(s); setView('form'); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-blue-600 transition-colors">Apply Now</button>
                  </div>
                ))}
             </div>
          </div>
        )}
        {view === 'admin' && currentUser && (
          <AdminPanel 
            applications={applications} registeredRetailers={retailers} services={services} 
            onAddService={(s) => setServices(prev => [...prev, s])} 
            onUpdateService={(s) => setServices(prev => prev.map(old => old.id === s.id ? s : old))} 
            onDeleteService={(id) => setServices(prev => prev.filter(s => s.id !== id))} 
            onUpdateStatus={handleAdminStatusUpdate}
            onUpdateApplication={(u) => { setApplications(prev => prev.map(a => a.id === u.id ? u : a)); ApiService.saveApplication(u); }}
            onUpdateRetailerStatus={(id, st) => {
              const u = retailers.find(r => r.id === id);
              if(u) handleUpdateUser({...u, status: st});
            }} 
            onAssignTask={(appId, retId) => {
              const r = retailers.find(x => x.id === retId);
              const app = applications.find(a => a.id === appId);
              if(app) {
                const updated = {...app, assignedToId: retId, assignedToName: r?.fullName};
                setApplications(prev => prev.map(a => a.id === appId ? updated : a));
                ApiService.saveApplication(updated);
              }
            }}
            onEditApplicationData={(a) => { setEditingApplication(a); setSelectedService(services.find(s => s.id === a.serviceId) || null); setView('form'); }}
            onAddRetailer={(r) => { setRetailers(prev => [...prev, r]); ApiService.saveRetailer(r); }} 
            onApproveWalletTx={(uId, txId) => {
              const u = retailers.find(x => x.id === uId);
              if (!u) return;
              const tx = u.transactions?.find(t => t.id === txId);
              if (!tx) return;
              const updatedTxs = u.transactions?.map(t => t.id === txId ? { ...t, status: 'Success' as const } : t) || [];
              handleUpdateUser({...u, walletBalance: u.walletBalance + tx.amount, transactions: updatedTxs});
            }}
            onRejectWalletTx={(uId, txId) => {
              const u = retailers.find(x => x.id === uId);
              if(u) handleUpdateUser({...u, transactions: u.transactions?.map(t => t.id === txId ? {...t, status: 'Rejected' as const} : t)});
            }}
            onUpdateRetailer={handleUpdateUser}
            onDeleteRetailer={(id) => setRetailers(prev => prev.filter(r => r.id !== id))}
            currentUser={currentUser} onLogout={() => { setCurrentUser(null); setView('home'); }} 
          />
        )}
        {view === 'status' && (
          <div className="max-w-2xl mx-auto py-12">
            {!searchResult ? (
              <div className="text-center space-y-8 animate-in fade-in">
                <h2 className="text-3xl font-extrabold text-slate-900">Track Application</h2>
                <div className="flex gap-2 p-2 bg-white rounded-3xl shadow-xl border">
                  <input type="text" placeholder="Ref ID (e.g. DOS-XXXXXX)" className="flex-1 px-6 py-4 rounded-2xl border-none outline-none font-mono font-bold" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                  <button onClick={async () => { 
                    setIsSyncing(true);
                    const cloudApps = await ApiService.getAllApplications();
                    const normalizedSearch = searchId.trim().toUpperCase();
                    const r = cloudApps.find(a => a.id.toUpperCase() === normalizedSearch); 
                    if(r) { setSearchResult(r); setSearchError(false); } else { setSearchError(true); }
                    setIsSyncing(false);
                  }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold">Check Cloud</button>
                </div>
                {searchError && <p className="text-red-500 font-bold">No application found.</p>}
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
                 <div className="text-center"><h3 className="text-4xl font-black text-slate-900">{searchResult.status}</h3></div>
                 <button onClick={() => { setSearchResult(null); setSearchId(''); }} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest">Back</button>
              </div>
            )}
          </div>
        )}
        {view === 'form' && selectedService && <ServiceForm service={selectedService} onSubmit={handleFormSubmit} onCancel={() => setView('home')} currentUser={currentUser} initialData={editingApplication || undefined} />}
        {view === 'login' && <Login onLogin={(u) => { setCurrentUser(u); setView(u.role === 'admin' ? 'admin' : 'home'); }} onCancel={() => setView('home')} registeredRetailers={retailers} setView={setView} />}
        {view === 'register' && <RegistrationForm onRegister={handleRetailerRegister} onCancel={() => setView('login')} />}
        {view === 'wallet' && currentUser && <WalletView user={currentUser} onTransactionRequest={(tx) => handleWalletTransaction(currentUser.id, tx)} />}
        {view === 'receipt' && lastSubmittedApp && <Receipt application={lastSubmittedApp} onClose={() => setView('home')} />}
        {view === 'profile' && currentUser && <ProfileView user={currentUser} onUpdateProfile={handleUpdateUser} />}
        {view === 'policy' && <PolicyView />}
        {view === 'download' && <DownloadCenter applications={applications} />}
      </main>
      <Footer setView={setView} />
      <ChatAssistant />
    </div>
  );
};

export default App;
