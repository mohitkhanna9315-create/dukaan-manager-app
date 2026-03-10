/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit2, 
  Search, 
  Package, 
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  X,
  Save,
  Store,
  History,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  BookOpen,
  UserPlus,
  Phone,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Settings,
  UserCircle,
  Moon,
  Sun,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  Mic,
  Download,
  Share2,
  FileText,
  Database,
  Languages,
  Calendar,
  Activity,
  TrendingUp,
  FileDown,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, Category, Unit, HistoryItem, Customer, Transaction } from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

const CATEGORIES: Category[] = ['Rashan', 'Sabzi', 'Doodh', 'Masala', 'Other'];
const UNITS: Unit[] = ['kg', 'gm', 'Litre', 'Quantity'];

const TRANSLATIONS = {
  hi: {
    inventory: 'Maal (Stock)',
    history: 'Hisaab-Kitab',
    khata: 'Khata',
    search: 'Samaan dhoondhein...',
    add_item: 'Naya Samaan',
    low_stock: 'Kam Maal',
    net_hisaab: 'Net Hisaab',
    daily_sales: 'Aaj ki Bikri',
    most_selling: 'Sabse Zyada Bikne Wala',
    pending_udhaar: 'Market ka Udhaar',
    business_health: 'Business Health',
    order_list: 'Mangwane Wala Maal',
    download_report: 'Report Download',
    backup: 'Backup Lein',
    language: 'English',
    expiry: 'Expiry Date',
    share: 'Hisaab Share',
    whatsapp: 'WhatsApp Reminder',
    total_lena: 'Total Lena',
    total_dena: 'Total Dena',
    balance: 'Baqaya',
    stock: 'Stock',
    price: 'Keemat',
    category: 'Category',
    unit: 'Unit',
    save: 'Save Karein',
    cancel: 'Cancel',
    edit_shop: 'Dukaan Edit',
    logout: 'Logout',
    account: 'Account Settings',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    delete_customer: 'Customer Delete',
    install_app: 'App Install Karein'
  },
  en: {
    inventory: 'Inventory',
    history: 'History',
    khata: 'Khata',
    search: 'Search items...',
    add_item: 'New Item',
    low_stock: 'Low Stock',
    net_hisaab: 'Net Balance',
    daily_sales: 'Daily Sales',
    most_selling: 'Most Selling',
    pending_udhaar: 'Pending Udhaar',
    business_health: 'Business Health',
    order_list: 'Order List',
    download_report: 'Download Report',
    backup: 'Backup Data',
    language: 'Hindi',
    expiry: 'Expiry Date',
    share: 'Share Hisab',
    whatsapp: 'WhatsApp Reminder',
    total_lena: 'Total Lena',
    total_dena: 'Total Dena',
    balance: 'Balance',
    stock: 'Stock',
    price: 'Price',
    category: 'Category',
    unit: 'Unit',
    save: 'Save',
    cancel: 'Cancel',
    delete_customer: 'Delete Customer',
    edit_shop: 'Edit Shop',
    logout: 'Logout',
    account: 'Account Settings',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    install_app: 'Install App'
  }
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authFormData, setAuthFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // --- Inventory State ---
  const [products, setProducts] = useState<Product[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'history' | 'khata'>('inventory');
  const [isSyncing, setIsSyncing] = useState(false);
  const [formError, setFormError] = useState('');

  // Khata State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState<Transaction[]>([]);
  const [transactionType, setTransactionType] = useState<'GAVE' | 'GOT'>('GAVE');
  const [isSellOnUdhaarModalOpen, setIsSellOnUdhaarModalOpen] = useState(false);
  const [productToSell, setProductToSell] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Rashan' as Category,
    price: '',
    quantity: '',
    unit: 'Quantity' as Unit,
    expiryDate: ''
  });

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: ''
  });

  // --- UI State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [shopName, setShopName] = useState(() => localStorage.getItem('shopName') || 'Dukaan Manager');
  const [isShopNameModalOpen, setIsShopNameModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState(shopName);
  const [language, setLanguage] = useState<'en' | 'hi'>(() => (localStorage.getItem('language') as 'en' | 'hi') || 'hi');
  const [isListening, setIsListening] = useState(false);
  const [isBusinessHealthOpen, setIsBusinessHealthOpen] = useState(false);
  const [isOrderListPageOpen, setIsOrderListPageOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const t = (key: keyof typeof TRANSLATIONS['hi']) => TRANSLATIONS[language][key] || key;

  // --- Language Effect ---
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // --- PWA Effect ---
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setToast({ message: 'App install ho rahi hai!', type: 'success' });
    }
    setDeferredPrompt(null);
    setIsMenuOpen(false);
  };

  // --- Theme Effect ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- Click Outside Effect ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [transactionFormData, setTransactionFormData] = useState({
    amount: '',
    description: ''
  });

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Safety timeout for syncing
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isSyncing) {
      timeout = setTimeout(() => {
        setIsSyncing(false);
        setFormError("Operation timeout ho gaya. Check karein ki internet chal raha hai.");
      }, 30000); // 30 seconds
    }
    return () => clearTimeout(timeout);
  }, [isSyncing]);

  // --- Firestore Listener ---
  useEffect(() => {
    if (!user) {
      setProducts(null);
      setHistory([]);
      return;
    }

    // Products Listener
    const productsQuery = query(
      collection(db, 'products'),
      where('ownerId', '==', user.uid)
    );
    const unsubProducts = onSnapshot(productsQuery, 
      (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Product[];
        setProducts(productsData);
      },
      (error) => {
        console.error("Products listener failed:", error);
        setProducts([]);
      }
    );

    // History Listener
    const historyQuery = query(
      collection(db, 'history'),
      where('ownerId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    const unsubHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp
        };
      }) as HistoryItem[];
      setHistory(historyData);
    });

    // Customers Listener
    const customersQuery = query(
      collection(db, 'customers'),
      where('ownerId', '==', user.uid),
      orderBy('name', 'asc')
    );
    const unsubCustomers = onSnapshot(customersQuery, 
      (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Customer[];
        setCustomers(customersData);
      },
      (error) => {
        console.error("Customers listener failed:", error);
        if (error.message.includes('index')) {
          setFormError("Firestore Index missing hai. Console mein link par click karke index banayein.");
        } else {
          setFormError("Data load nahi ho raha. Permissions check karein.");
        }
        setCustomers([]); // Set to empty to stop loading spinner
      }
    );

    return () => {
      unsubProducts();
      unsubHistory();
      unsubCustomers();
    };
  }, [user]);

  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsCustomerModalOpen(false);
    setIsTransactionModalOpen(false);
    setIsHistoryModalOpen(false);
    setIsSellOnUdhaarModalOpen(false);
    setIsSyncing(false);
    setFormError('');
  };

  const openCustomerModal = () => {
    setFormError('');
    setCustomerFormData({ name: '', phone: '' });
    setIsCustomerModalOpen(true);
  };

  // --- Auth Handlers ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, authFormData.email, authFormData.password);
      } else {
        await createUserWithEmailAndPassword(auth, authFormData.email, authFormData.password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => signOut(auth);

  // --- Transaction History Listener ---
  useEffect(() => {
    if (!user || !selectedCustomer || !isHistoryModalOpen) {
      setCustomerTransactions([]);
      return;
    }

    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('customerId', '==', selectedCustomer.id),
      where('ownerId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Transaction[];
      setCustomerTransactions(transData);
    });

    return () => unsubscribe();
  }, [user, selectedCustomer, isHistoryModalOpen]);

  // --- Inventory Handlers ---
  const handleOpenModal = (product?: Product) => {
    setFormError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category as Category,
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        unit: product.unit || 'Quantity',
        expiryDate: product.expiryDate || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: 'Rashan', price: '', quantity: '', unit: 'Quantity', expiryDate: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSyncing(true);
    setFormError('');

    const productId = editingProduct?.id || doc(collection(db, 'products')).id;
    const newProduct: Omit<Product, 'id'> = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      unit: formData.unit,
      ownerId: user.uid,
      expiryDate: formData.expiryDate
    };

    try {
      // Optimistic UI: Close modal and reset form immediately
      setIsModalOpen(false);
      setToast({ message: editingProduct ? 'Samaan update ho gaya!' : 'Naya samaan add ho gaya!', type: 'success' });
      const currentFormData = { ...formData };
      const currentEditingProduct = editingProduct;
      
      setFormData({ name: '', category: 'Rashan', price: '', quantity: '', unit: 'Quantity', expiryDate: '' });
      setEditingProduct(null);
      setIsSyncing(false);

      // Background Firebase operations
      const savePromise = setDoc(doc(db, 'products', productId), newProduct);
      
      savePromise.then(() => {
        addDoc(collection(db, 'history'), {
          productId,
          productName: newProduct.name,
          action: currentEditingProduct ? 'EDIT' : 'CREATE',
          amount: newProduct.quantity,
          unit: newProduct.unit,
          timestamp: Date.now(),
          ownerId: user.uid
        }).catch(err => console.error("History log failed", err));
      }).catch(err => {
        console.error("Submit failed", err);
        setToast({ message: 'Samaan save karne mein galti hui. Check internet.', type: 'error' });
      });

    } catch (err: any) {
      console.error("Submit failed", err);
      setFormError(err.message || 'Samaan save karne mein galti hui.');
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !products) return;
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      await addDoc(collection(db, 'history'), {
        productId: id,
        productName: product.name,
        action: 'DELETE',
        timestamp: Date.now(),
        ownerId: user.uid
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const updateStock = async (id: string, delta: number) => {
    if (!user || !products) return;
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newQty = Math.max(0, product.quantity + delta);
    
    try {
      await updateDoc(doc(db, 'products', id), { quantity: newQty });
      await addDoc(collection(db, 'history'), {
        productId: id,
        productName: product.name,
        action: delta > 0 ? 'ADD' : 'REMOVE',
        amount: Math.abs(delta),
        unit: product.unit,
        timestamp: Date.now(),
        ownerId: user.uid,
        priceAtTime: product.price
      });
    } catch (err) {
      console.error("Update stock failed", err);
    }
  };

  // --- Khata Handlers ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSyncing(true);
    setFormError('');

    try {
      // Optimistic UI
      setIsCustomerModalOpen(false);
      setToast({ message: 'Naya customer add ho gaya!', type: 'success' });
      setCustomerFormData({ name: '', phone: '' });
      setIsSyncing(false);

      // Background Firebase operation
      addDoc(collection(db, 'customers'), {
        name: customerFormData.name,
        phone: customerFormData.phone,
        balance: 0,
        ownerId: user.uid,
        lastTransaction: Date.now()
      }).catch(err => {
        console.error("Add customer failed", err);
        setToast({ message: 'Customer add nahi ho paya. Check internet.', type: 'error' });
      });

    } catch (err: any) {
      console.error("Add customer failed", err);
      setFormError(err.message || 'Customer add karne mein galti hui.');
      setIsSyncing(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!user) return;
    
    try {
      setToast({ message: 'Customer delete ho raha hai...', type: 'success' });
      await deleteDoc(doc(db, 'customers', id));
      setToast({ message: 'Customer delete ho gaya!', type: 'success' });
      setCustomerToDelete(null);
    } catch (err) {
      console.error("Delete customer failed", err);
      setToast({ message: 'Galti hui delete karne mein.', type: 'error' });
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCustomer) return;
    setIsSyncing(true);
    setFormError('');

    const amount = parseFloat(transactionFormData.amount);
    const newBalance = transactionType === 'GAVE' 
      ? selectedCustomer.balance + amount 
      : selectedCustomer.balance - amount;

    try {
      // Optimistic UI
      setIsTransactionModalOpen(false);
      setToast({ message: 'Hisaab update ho gaya!', type: 'success' });
      setTransactionFormData({ amount: '', description: '' });
      setIsSyncing(false);

      // Background Firebase operations
      const transPromise = addDoc(collection(db, 'transactions'), {
        customerId: selectedCustomer.id,
        amount,
        type: transactionType,
        description: transactionFormData.description || (transactionType === 'GAVE' ? 'Udhaar Diya' : 'Paise Liye'),
        timestamp: Date.now(),
        ownerId: user.uid
      });

      const balancePromise = updateDoc(doc(db, 'customers', selectedCustomer.id), {
        balance: newBalance,
        lastTransaction: Date.now()
      });

      Promise.all([transPromise, balancePromise]).catch(err => {
        console.error("Transaction failed", err);
        setToast({ message: 'Transaction fail ho gayi. Check internet.', type: 'error' });
      });

    } catch (err: any) {
      console.error("Transaction failed", err);
      setFormError(err.message || 'Transaction fail ho gayi.');
      setIsSyncing(false);
    }
  };

  const handleSellOnUdhaar = async (customer: Customer) => {
    if (!user || !productToSell) return;
    setIsSyncing(true);
    setFormError('');

    try {
      // Optimistic UI
      setIsSellOnUdhaarModalOpen(false);
      setProductToSell(null);
      setToast({ message: 'Udhaar sale successful!', type: 'success' });
      setIsSyncing(false);

      // Background Firebase operations
      const newQty = Math.max(0, productToSell.quantity - 1);
      const stockPromise = updateDoc(doc(db, 'products', productToSell.id), { quantity: newQty });

      const transPromise = addDoc(collection(db, 'transactions'), {
        customerId: customer.id,
        amount: productToSell.price,
        type: 'GAVE',
        description: `${productToSell.name} (Udhaar Sale)`,
        timestamp: Date.now(),
        ownerId: user.uid
      });

      const balancePromise = updateDoc(doc(db, 'customers', customer.id), {
        balance: customer.balance + productToSell.price,
        lastTransaction: Date.now()
      });

      const historyPromise = addDoc(collection(db, 'history'), {
        productId: productToSell.id,
        productName: productToSell.name,
        action: 'REMOVE',
        amount: 1,
        unit: productToSell.unit,
        timestamp: Date.now(),
        ownerId: user.uid,
        priceAtTime: productToSell.price
      });

      Promise.all([stockPromise, transPromise, balancePromise, historyPromise]).catch(err => {
        console.error("Sell on udhaar failed", err);
        setToast({ message: 'Udhaar sale fail ho gayi. Check internet.', type: 'error' });
      });

    } catch (err: any) {
      console.error("Sell on udhaar failed", err);
      setFormError(err.message || 'Udhaar sale fail ho gayi.');
      setIsSyncing(false);
    }
  };

  // --- Filtered Data ---
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  // --- Business Analytics ---
  const analytics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const todaySales = history
      .filter(h => h.action === 'REMOVE' && h.timestamp >= todayTimestamp)
      .reduce((acc, h) => acc + (h.amount || 0) * (h.priceAtTime || 0), 0);

    const itemCounts: Record<string, number> = {};
    history
      .filter(h => h.action === 'REMOVE')
      .forEach(h => {
        itemCounts[h.productName] = (itemCounts[h.productName] || 0) + (h.amount || 0);
      });

    const mostSellingItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const expiringSoon = products?.filter(p => {
      if (!p.expiryDate) return false;
      const expDate = new Date(p.expiryDate);
      return expDate > today && expDate <= thirtyDaysFromNow;
    }) || [];

    return { todaySales, mostSellingItem, expiringSoon };
  }, [history, products]);

  // --- PDF Generation ---
  const generateMonthlyReport = () => {
    const doc = new jsPDF();
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    doc.setFontSize(20);
    doc.text(`${shopName} - Monthly Report`, 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${now.toLocaleString()}`, 14, 30);
    doc.text(`Month: ${monthYear}`, 14, 38);

    const tableData = history.map(h => [
      new Date(h.timestamp).toLocaleString(),
      h.productName,
      h.action,
      `${h.amount || 0} ${h.unit || ''}`,
      h.priceAtTime ? `₹${h.priceAtTime}` : '-'
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Item', 'Action', 'Qty', 'Price']],
      body: tableData,
    });

    // Add Customer Balances Section
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(16);
    doc.text('Customer Balances (Udhaar)', 14, finalY + 15);
    
    const customerData = customers?.map(c => [
      c.name,
      c.phone,
      c.balance > 0 ? `₹${c.balance} (Udhaar)` : c.balance < 0 ? `₹${Math.abs(c.balance)} (Advance)` : '₹0'
    ]) || [];

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Customer', 'Phone', 'Balance']],
      body: customerData,
    });

    doc.save(`${shopName}_Report_${monthYear}.pdf`);
  };

  const shareCustomerHisab = (customer: Customer) => {
    const message = `Hello ${customer.name}, aapka ₹${Math.abs(customer.balance).toLocaleString()} ka udhaar baaki hai ${shopName} par. Kripya bhugtan karein.`;
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- Voice Search ---
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Aapka browser voice search support nahi karta.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // --- Backup & Restore ---
  const downloadBackup = () => {
    const data = {
      products,
      customers,
      history,
      shopName,
      language,
      isDarkMode
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shopName}_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lowStockCount = products ? products.filter(p => p.quantity < 5).length : 0;
  const totalLena = customers ? customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0) : 0;
  const totalDena = customers ? customers.reduce((acc, c) => acc + (c.balance < 0 ? Math.abs(c.balance) : 0), 0) : 0;
  const netBalance = totalLena - totalDena;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-200">
              <Store className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-800">Dukaan Manager</h1>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Login karke apna stock manage karein' : 'Naya account banayein'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={authFormData.email}
                  onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  value={authFormData.password}
                  onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Login Karein' : 'Signup Karein')}
            </button>
          </form>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isLogin ? 'Naya account banayein (Signup)' : 'Purana account hai? Login karein'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
          >
            <div className={`p-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-indigo-600 dark:bg-indigo-900 text-white p-6 rounded-b-[2.5rem] shadow-lg shadow-indigo-100 dark:shadow-none sticky top-0 z-30 transition-colors">
        <div className="max-w-4xl mx-auto flex justify-between items-center relative">
          <div className="flex items-center gap-4">
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-all active:scale-95"
              >
                <Store size={24} />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-3 w-64 glass rounded-2xl overflow-hidden z-50 text-slate-800 dark:text-white"
                  >
                    {/* User Info Section */}
                    <div className="p-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                          <UserCircle size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{user.email.split('@')[0]}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setIsDarkMode(!isDarkMode);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                          </div>
                          <span className="font-medium">{isDarkMode ? t('light_mode') : t('dark_mode')}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-6' : 'left-1'}`} />
                        </div>
                      </button>

                      <button 
                        onClick={() => {
                          setLanguage(language === 'hi' ? 'en' : 'hi');
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                      >
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <Languages size={18} />
                        </div>
                        <span className="font-medium">{t('language')}</span>
                      </button>

                      <button 
                        onClick={() => {
                          downloadBackup();
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                      >
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Database size={18} />
                        </div>
                        <span className="font-medium">{t('backup')}</span>
                      </button>

                      <button 
                        onClick={() => {
                          setIsShopNameModalOpen(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                      >
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Settings size={18} />
                        </div>
                        <span className="font-medium">{t('edit_shop')}</span>
                      </button>

                      {deferredPrompt && (
                        <button 
                          onClick={handleInstallApp}
                          className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl transition-colors"
                        >
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                            <Download size={18} />
                          </div>
                          <span className="font-medium">{t('install_app')}</span>
                        </button>
                      )}

                      <div className="h-px bg-slate-200/50 dark:bg-slate-700/50 my-2 mx-3" />

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-2xl transition-colors"
                      >
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <LogOut size={18} />
                        </div>
                        <span className="font-bold">{t('logout')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{shopName}</h1>
              <div className="flex items-center gap-2">
                <p className="text-indigo-100 text-xs">{user.email}</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Quick Summary Bar */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setIsBusinessHealthOpen(!isBusinessHealthOpen)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all active:scale-95 ${
              isBusinessHealthOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${isBusinessHealthOpen ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
              <Activity size={16} />
            </div>
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 ${isBusinessHealthOpen ? 'text-white/60' : 'opacity-60'}`}>{t('business_health')}</p>
              <p className="text-sm font-black leading-none">{t('daily_sales')}: ₹{analytics.todaySales.toLocaleString()}</p>
            </div>
          </button>

          <button 
            onClick={() => setIsOrderListPageOpen(true)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-all active:scale-95 ${
              lowStockCount > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400' : 
              'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${
              lowStockCount > 0 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{t('low_stock')}</p>
              <p className="text-sm font-black leading-none">{lowStockCount} Items</p>
            </div>
          </button>

          <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-sm transition-colors ${
            netBalance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400' : 
            netBalance < 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
            'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            <div className={`p-1.5 rounded-lg ${
              netBalance > 0 ? 'bg-red-100 dark:bg-red-900/40' : 
              netBalance < 0 ? 'bg-emerald-100 dark:bg-emerald-900/40' : 
              'bg-slate-100 dark:bg-slate-800'
            }`}>
              {netBalance > 0 ? <ArrowUpRight size={16} /> : 
               netBalance < 0 ? <ArrowDownLeft size={16} /> : 
               <CheckCircle2 size={16} />}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">{t('net_hisaab')}</p>
              <p className="text-sm font-black leading-none flex items-center">
                <IndianRupee size={14} />
                {Math.abs(netBalance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Business Health Section */}
        <AnimatePresence>
          {isBusinessHealthOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {analytics.expiringSoon.length > 0 && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg animate-pulse">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider">Critical Alert: Expiry Pass Hai!</p>
                    <p className="text-[11px] text-red-600 dark:text-red-500 font-medium">
                      {analytics.expiringSoon.length} items agle 30 din mein expire hone wale hain. Check karein!
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setActiveTab('inventory');
                      setSearchQuery('expiry'); // A simple way to trigger a filter if I implement it, or just scroll
                    }}
                    className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow-sm"
                  >
                    Check Karein
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={16} />
                    <h3 className="text-xs font-bold">{t('daily_sales')}</h3>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">₹{analytics.todaySales.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Aaj ki total bikri</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <ShoppingCart size={16} />
                    <h3 className="text-xs font-bold">{t('most_selling')}</h3>
                  </div>
                  <p className="text-base font-black text-slate-800 dark:text-white truncate">{analytics.mostSellingItem}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Sabse zyada bikne wala samaan</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <IndianRupee size={16} />
                    <h3 className="text-xs font-bold">{t('pending_udhaar')}</h3>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-white">₹{totalLena.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Market se lene baaki paise</p>
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <button 
                  onClick={generateMonthlyReport}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-md active:scale-95"
                >
                  <FileDown size={14} />
                  {t('download_report')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl transition-colors">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Package size={16} />
            {t('inventory')}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <History size={16} />
            {t('history')}
          </button>
          <button 
            onClick={() => setActiveTab('khata')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'khata' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={16} />
            {t('khata')}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Search & Add Section */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="text"
                    placeholder={t('search')}
                    className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    onClick={startVoiceSearch}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                      isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                </div>
                <button 
                  onClick={() => handleOpenModal()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <Plus size={20} />
                  {t('add_item')}
                </button>
              </div>

              {/* Product List */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                  <Package size={16} />
                  Samaan ki List ({filteredProducts.length})
                </h2>
                
                {products === null ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-3 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Data load ho raha hai...</p>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                      <Package size={24} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Koi samaan nahi mila. Naya samaan add karein!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((product) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={product.id}
                          className={`bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border-l-4 transition-all ${
                            product.quantity < 5 ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-indigo-500'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {product.category}
                              </span>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{product.name}</h3>
                              <div className="flex items-center gap-2">
                                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">₹{product.price}</p>
                                {product.expiryDate && (
                                  <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    new Date(product.expiryDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000
                                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                  }`}>
                                    <Calendar size={8} />
                                    Exp: {new Date(product.expiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  setProductToSell(product);
                                  setIsSellOnUdhaarModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                title="Sell on Udhaar"
                              >
                                <ShoppingCart size={16} />
                              </button>
                              <button 
                                onClick={() => handleOpenModal(product)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateStock(product.id, -1)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm active:scale-90 transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <div className="text-center min-w-[60px]">
                                <p className="text-xs font-black text-slate-800 dark:text-white leading-none">{product.quantity}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{product.unit}</p>
                              </div>
                              <button 
                                onClick={() => updateStock(product.id, 1)}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm active:scale-90 transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Total Value</p>
                              <p className="text-xs font-black text-slate-800 dark:text-white">₹{(product.price * product.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Clock size={16} />
                  Hisaab-Kitab (Recent Activity)
                </h2>
              </div>
              
              <div className="grid gap-2">
                {history.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                      <Clock size={24} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Abhi tak koi activity nahi hui hai.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${
                          item.action === 'ADD' || item.action === 'CREATE' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 
                          item.action === 'REMOVE' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
                          'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}>
                          {item.action === 'ADD' || item.action === 'CREATE' ? <Plus size={14} /> : 
                           item.action === 'REMOVE' ? <Minus size={14} /> : 
                           <Edit2 size={14} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{item.productName}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {new Date(item.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${
                          item.action === 'ADD' || item.action === 'CREATE' ? 'text-emerald-600' : 
                          item.action === 'REMOVE' ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {item.action === 'ADD' || item.action === 'CREATE' ? '+' : 
                           item.action === 'REMOVE' ? '-' : ''} {item.amount || 0} {item.unit}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">{item.action}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'khata' && (
            <motion.div
              key="khata"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Khata Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Total Lena */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('total_lena')}</p>
                    <h2 className="text-lg font-black text-red-600 dark:text-red-500 flex items-center gap-1">
                      <IndianRupee size={16} />
                      {totalLena.toLocaleString()}
                    </h2>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-xl text-red-600 dark:text-red-400">
                    <ArrowUpRight size={16} />
                  </div>
                </div>

                {/* Total Dena */}
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('total_dena')}</p>
                    <h2 className="text-lg font-black text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                      <IndianRupee size={16} />
                      {totalDena.toLocaleString()}
                    </h2>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <ArrowDownLeft size={16} />
                  </div>
                </div>

                {/* Net Hisaab */}
                <div className={`p-3.5 rounded-2xl shadow-sm border flex items-center justify-between transition-colors ${
                  netBalance > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' : 
                  netBalance < 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' : 
                  'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                }`}>
                  <div className="space-y-1">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${
                      netBalance > 0 ? 'text-red-400 dark:text-red-500' : 
                      netBalance < 0 ? 'text-emerald-400 dark:text-emerald-500' : 
                      'text-slate-400 dark:text-slate-500'
                    }`}>{t('net_hisaab')}</p>
                    <h2 className={`text-lg font-black flex items-center gap-1 ${
                      netBalance > 0 ? 'text-red-700 dark:text-red-400' : 
                      netBalance < 0 ? 'text-emerald-700 dark:text-emerald-400' : 
                      'text-slate-700 dark:text-white'
                    }`}>
                      <IndianRupee size={16} />
                      {Math.abs(netBalance).toLocaleString()}
                    </h2>
                  </div>
                  <div className={`p-2 rounded-xl ${
                    netBalance > 0 ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' : 
                    netBalance < 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' : 
                    'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {netBalance > 0 ? <ArrowUpRight size={16} /> : 
                     netBalance < 0 ? <ArrowDownLeft size={16} /> : 
                     <CheckCircle2 size={16} />}
                  </div>
                </div>
              </div>

              {/* Search & Add Customer */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    placeholder="Customer ka naam ya phone..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={openCustomerModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <UserPlus size={20} />
                  Naya Customer
                </button>
              </div>

              {/* Customer List */}
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 px-1">
                  <User size={16} />
                  Customers ({filteredCustomers.length})
                </h2>

                {customers === null ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center space-y-3 shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Customers load ho rahe hain...</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                      <User size={24} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Koi customer nahi mila. Naya customer add karein!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredCustomers.map((customer) => (
                      <div key={customer.id} className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 dark:text-white">{customer.name}</h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Phone size={10} />
                                {customer.phone}
                              </p>
                            </div>
                          </div>
                            <div className="flex items-start gap-2">
                              <div className="text-right">
                                <p className={`text-base font-black ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  ₹{Math.abs(customer.balance).toLocaleString()}
                                </p>
                                <p className="text-[9px] font-bold uppercase text-slate-400">
                                  {customer.balance > 0 ? 'Dena hai' : customer.balance < 0 ? 'Advance' : 'Hisaab Saaf'}
                                </p>
                              </div>
                              
                              {customerToDelete === customer.id ? (
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomer(customer.id);
                                    }}
                                    className="p-1.5 bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase animate-pulse"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomerToDelete(null);
                                    }}
                                    className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[8px] font-bold uppercase"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomerToDelete(customer.id);
                                  }}
                                  className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                  title={t('delete_customer')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          <button 
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setTransactionType('GAVE');
                              setIsTransactionModalOpen(true);
                            }}
                            className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                          >
                            <ArrowUp size={14} />
                            <span className="text-[7px] uppercase">Maine Diye</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setTransactionType('GOT');
                              setIsTransactionModalOpen(true);
                            }}
                            className="bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                          >
                            <ArrowDown size={14} />
                            <span className="text-[7px] uppercase">Maine Liye</span>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setIsHistoryModalOpen(true);
                            }}
                            className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                          >
                            <History size={14} />
                            <span className="text-[7px] uppercase">History</span>
                          </button>
                          <button 
                            onClick={() => shareCustomerHisab(customer)}
                            className="bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                          >
                            <Share2 size={14} />
                            <span className="text-[7px] uppercase">Share</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal for Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllModals}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {editingProduct ? 'Samaan Edit Karein' : 'Naya Samaan Add Karein'}
                  </h2>
                  <button 
                    onClick={closeAllModals}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('inventory')} Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Jaise: Aashirvaad Atta"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('category')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({...formData, category: cat})}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            formData.category === cat 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('price')} (₹)</label>
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('stock')}</label>
                      <input 
                        required
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('unit')}</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value as Unit})}
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">{t('expiry')}</label>
                      <input 
                        type="date"
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-800 dark:text-white"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSyncing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 mt-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSyncing ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {isSyncing ? 'Saving...' : (editingProduct ? t('save') : t('save'))}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Add Customer */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllModals}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Naya Customer Jodein</h2>
                <button onClick={closeAllModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Customer ka Naam</label>
                  <input 
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-white"
                    placeholder="Jaise: Rahul Kumar"
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-white"
                    placeholder="9876543210"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSyncing ? 'Saving...' : 'Customer Save Karein'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Transaction History */}
      <AnimatePresence>
        {isHistoryModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllModals}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Transaction History</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedCustomer.name}</p>
                </div>
                <button onClick={closeAllModals} className="text-slate-400 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2.5 custom-scrollbar">
                {customerTransactions.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="bg-slate-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
                      <History size={24} />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Abhi tak koi transaction nahi hui hai.</p>
                  </div>
                ) : (
                  customerTransactions.map((trans) => (
                    <div key={trans.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${trans.type === 'GAVE' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                          {trans.type === 'GAVE' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                            {trans.description || (trans.type === 'GAVE' ? 'Udhaar Diya' : 'Paise Mile')}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                            {new Date(trans.timestamp).toLocaleString('en-IN', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black ${trans.type === 'GAVE' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {trans.type === 'GAVE' ? '-' : '+'} ₹{trans.amount.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {trans.type === 'GAVE' ? 'Udhaar' : 'Received'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 text-white p-3 rounded-xl">
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Current Balance</p>
                  <div className="text-right">
                    <p className={`text-lg font-black ${selectedCustomer.balance > 0 ? 'text-red-400' : selectedCustomer.balance < 0 ? 'text-emerald-400' : 'text-white'}`}>
                      ₹{Math.abs(selectedCustomer.balance).toLocaleString()}
                    </p>
                    <p className="text-[9px] font-bold uppercase opacity-70">
                      {selectedCustomer.balance > 0 ? 'Dena hai' : selectedCustomer.balance < 0 ? 'Advance' : 'Hisaab Saaf'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Transaction (Lena/Dena) */}
      <AnimatePresence>
        {isTransactionModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllModals}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {transactionType === 'GAVE' ? 'Udhaar Diya' : 'Paise Mile'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Customer: {selectedCustomer.name}</p>
                </div>
                <button onClick={closeAllModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/30 flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <form onSubmit={handleTransaction} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Amount (₹)</label>
                  <input 
                    required
                    type="number"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xl font-black text-slate-800 dark:text-white"
                    placeholder="0.00"
                    value={transactionFormData.amount}
                    onChange={(e) => setTransactionFormData({...transactionFormData, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Description (Optional)</label>
                  <input 
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800 dark:text-white"
                    placeholder="Jaise: Ration ka udhaar"
                    value={transactionFormData.description}
                    onChange={(e) => setTransactionFormData({...transactionFormData, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSyncing}
                  className={`w-full py-3.5 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                    transactionType === 'GAVE' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isSyncing ? 'Saving...' : 'Entry Confirm Karein'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for Sell on Udhaar (Customer Selection) */}
      <AnimatePresence>
        {isSellOnUdhaarModalOpen && productToSell && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAllModals}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Udhaar Par Bechein</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Samaan: {productToSell.name} (₹{productToSell.price})</p>
                </div>
                <button onClick={closeAllModals} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2 mb-4">
                  <AlertTriangle size={14} />
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Customer Chunein:</p>
                {customers && customers.length > 0 ? (
                  <div className="grid gap-2">
                    {customers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => handleSellOnUdhaar(customer)}
                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-100 dark:border-slate-800 rounded-xl transition-all group"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{customer.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{customer.phone}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 dark:group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pehle customer add karein.</p>
                    <button 
                      onClick={() => {
                        setIsSellOnUdhaarModalOpen(false);
                        openCustomerModal();
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold text-sm"
                    >
                      + Naya Customer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order List Modal */}
      <AnimatePresence>
        {isOrderListPageOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOrderListPageOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
                    <AlertTriangle size={18} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('order_list')}</h2>
                </div>
                <button onClick={() => setIsOrderListPageOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                {products && products.filter(p => p.quantity < 5).length > 0 ? (
                  <div className="grid gap-3">
                    {products.filter(p => p.quantity < 5).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{product.name}</p>
                          <p className="text-xs text-slate-400">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-red-600 dark:text-red-400">{product.quantity} {product.unit} baaki</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Mangwana hai</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Saara stock full hai!</p>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => {
                  const list = products?.filter(p => p.quantity < 5).map(p => `- ${p.name} (${p.quantity} ${p.unit} left)`).join('\n');
                  const message = `Order List:\n${list}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Share2 size={20} />
                WhatsApp par bhejein
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shop Profile Modal */}
      <AnimatePresence>
        {isShopNameModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShopNameModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Shop Profile</h2>
                <button onClick={() => setIsShopNameModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X /></button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500 dark:text-slate-400 ml-1">Dukaan ka Naam</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="Dukaan ka naam likhein..."
                  />
                </div>

                <button 
                  onClick={() => {
                    setShopName(newShopName);
                    localStorage.setItem('shopName', newShopName);
                    setIsShopNameModalOpen(false);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Save Karein
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Summary for Mobile */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/30 shadow-2xl rounded-3xl p-4 flex justify-around items-center z-40 sm:hidden transition-colors">
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Total Items</p>
          <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{products ? products.length : 0}</p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Total Value</p>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            ₹{products ? products.reduce((acc, p) => acc + (p.price * p.quantity), 0).toLocaleString() : 0}
          </p>
        </div>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <div className="text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Low Stock</p>
          <p className="text-lg font-black text-red-600 dark:text-red-400">{lowStockCount}</p>
        </div>
      </div>
    </div>
  );
}
