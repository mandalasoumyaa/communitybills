import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  Users,
  UserCheck,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Phone,
  DollarSign,
  AlertCircle,
  Wrench,
  Plus,
  Trash2,
  Edit3,
  Search,
  Bell,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Settings,
  FileText,
  Filter,
  Droplet,
  LayoutGrid,
  Check,
  TrendingUp,
  ShoppingBag,
  Menu
} from 'lucide-react';
import * as api from './services/communityApi';
import CommunityPage from './pages/CommunityPage';
import TowersPage from './pages/TowersPage';
import FlatsPage from './pages/FlatsPage';
import AddFlatPage from './pages/AddFlatPage';
import AmenitiesPage from './pages/AmenitiesPage';
import BillingFinancePage from './pages/BillingFinancePage';
import MaintenancePage from './pages/MaintenancePage';
import VisitorsPage from './pages/VisitorsPage';
import NoticesPage from './pages/NoticesPage';
import SettingsPage from './pages/SettingsPage';
import ProcurementPage from './pages/ProcurementPage';
import CommunitiesListPage from './pages/CommunitiesListPage';
import { Coins } from 'lucide-react';
import initialWaterReadings from './water_readings.json';

function App() {
  const [activeTab, setActiveTab] = useState('communities');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentCommunityId, setCurrentCommunityId] = useState(1);
  const [communityOverview, setCommunityOverview] = useState(null);
  const [communitiesList, setCommunitiesList] = useState([]);
  const [showAddCommunityModal, setShowAddCommunityModal] = useState(false);
  const [addImagePreview, setAddImagePreview] = useState(null);
  const [addImageFileName, setAddImageFileName] = useState('');
  const [addUploadError, setAddUploadError] = useState('');
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editImageFileName, setEditImageFileName] = useState('');
  const [editUploadError, setEditUploadError] = useState('');
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    type: 'Gated Community',
    address: '',
    total_area: '',
    established_on: '',
    manager_name: '',
    manager_phone: ''
  });
  const [towersOverview, setTowersOverview] = useState([]);
  const [towersList, setTowersList] = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [flatsList, setFlatsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [flatFilter, setFlatFilter] = useState('All');

  // Amenities States
  const [amenitySearch, setAmenitySearch] = useState('');
  const [amenityCategory, setAmenityCategory] = useState('All');
  const [amenityStatus, setAmenityStatus] = useState('All');
  const [showAddAmenityModal, setShowAddAmenityModal] = useState(false);
  const [newAmenity, setNewAmenity] = useState({ name: '', category: 'Recreation', status: 'Active', bookings_count: 0, description: '' });
  const [amenities, setAmenities] = useState([
    { id: 1, name: "Club House", category: "Recreation", status: "Active", bookings_count: 0, description: "Spacious clubhouse for events and gatherings.", image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&auto=format&fit=crop&q=60" },
    { id: 2, name: "Swimming Pool", category: "Recreation", status: "Active", bookings_count: 0, description: "Well maintained swimming pool.", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400&auto=format&fit=crop&q=60" },
    { id: 3, name: "Gym", category: "Fitness", status: "Active", bookings_count: 0, description: "Fully equipped gymnasium.", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=60" },
    { id: 4, name: "Children's Play Area", category: "Recreation", status: "Active", bookings_count: 0, description: "Safe and fun play area for children.", image: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&auto=format&fit=crop&q=60" },
    { id: 5, name: "Indoor Games", category: "Recreation", status: "Active", bookings_count: 0, description: "Indoor games like table tennis, carrom, chess.", image: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&auto=format&fit=crop&q=60" },
    { id: 6, name: "Basketball Court", category: "Sports", status: "Active", bookings_count: 0, description: "Full size basketball court.", image: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=400&auto=format&fit=crop&q=60" },
    { id: 7, name: "Tennis Court", category: "Sports", status: "Maintenance", bookings_count: 0, description: "Tennis court under maintenance.", image: "https://images.unsplash.com/photo-1595435064219-c7802907d4b6?w=400&auto=format&fit=crop&q=60" },
    { id: 8, name: "Yoga & Meditation Room", category: "Wellness", status: "Active", bookings_count: 0, description: "Peaceful space for yoga and meditation.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=60" },
    { id: 9, name: "Party Lawn", category: "Recreation", status: "Active", bookings_count: 0, description: "Large lawn for parties and celebrations.", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&auto=format&fit=crop&q=60" },
    { id: 10, name: "Visitor Parking", category: "Parking", status: "Active", bookings_count: 0, description: "Designated parking for visitors.", image: "https://images.unsplash.com/photo-1506521788723-85811181d374?w=400&auto=format&fit=crop&q=60" },
    { id: 11, name: "Library", category: "Recreation", status: "Maintenance", bookings_count: 0, description: "Community library for residents.", image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&auto=format&fit=crop&q=60" },
    { id: 12, name: "Multipurpose Hall", category: "Recreation", status: "Active", bookings_count: 0, description: "Ideal for meetings, events and more.", image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&auto=format&fit=crop&q=60" }
  ]);

  // Dialog States
  const [showAddTowerModal, setShowAddTowerModal] = useState(false);
  const [showAddFlatModal, setShowAddFlatModal] = useState(false);
  const [showEditFlatModal, setShowEditFlatModal] = useState(false);
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false);

  // Form States
  const [newTower, setNewTower] = useState({ name: '', flats_per_floor: 4, floor_count: 10, blocks_count: 1, lifts_count: 2 });
  const [newFlat, setNewFlat] = useState({ number: '', tower_id: '', status: 'Vacant', resident_name: '', resident_phone: '', occupants_count: 0 });
  const [editingFlat, setEditingFlat] = useState(null);
  const [editingCommunity, setEditingCommunity] = useState(null);

  // Recent Updates Activity Log (seeding some initially)
  const [updatesLog, setUpdatesLog] = useState([
    { id: 1, text: "Flat A-101 in Tower A marked as occupied", time: "10:30 AM", type: "occupied" },
    { id: 2, text: "Flat B-204 in Tower B marked as vacant", time: "Yesterday", type: "vacant" },
    { id: 3, text: "New flat C-302 in Tower C added", time: "16 May 2024", type: "add" }
  ]);

  // Billing & Finance States
  const [allFlats, setAllFlats] = useState([]);
  const [billingExpanded, setBillingExpanded] = useState(false);
  const [expenses, setExpenses] = useState([
    { id: 1, title: 'Security Guard Salaries', amount: 3200, category: 'Staff Salary', date: '2026-08-01', notes: 'August 2026 payroll for 4 guards' },
    { id: 2, title: 'Main Lift Repair (Tower B)', amount: 450, category: 'Repairs', date: '2026-08-03', notes: 'Fixed pulley and cable tension' },
    { id: 3, title: 'Community Park Electricity', amount: 890, category: 'Electricity', date: '2026-07-28', notes: 'July usage bill' },
    { id: 4, title: 'Water Tanker Supply', amount: 1200, category: 'Water Maintenance', date: '2026-07-15', notes: 'Emergency tankers due to main line leakage' },
    { id: 5, title: 'Common Area Cleaning Services', amount: 750, category: 'Cleaning', date: '2026-07-31', notes: 'Monthly janitorial agency invoice' }
  ]);
  const [waterBills, setWaterBills] = useState(initialWaterReadings);
  const [paymentsList, setPaymentsList] = useState([]);

  useEffect(() => {
    // Disable mouse wheel scroll auto-increment/decrement
    const handleWheel = (e) => {
      if (document.activeElement && document.activeElement.type === 'number') {
        e.preventDefault();
      }
    };

    // Disable ArrowUp/ArrowDown keys and restrict input characters
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.type === 'number') {
        // Prevent up/down arrow keys
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          return;
        }

        // Allowed editing/navigation keys and numbers
        const allowedKeys = [
          'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];

        // Allow copy/paste/select actions
        if (e.ctrlKey || e.metaKey) {
          return;
        }

        if (!allowedKeys.includes(e.key)) {
          e.preventDefault();
          return;
        }

        // Limit to 2 decimal places
        if (e.key === '.') {
          if (activeEl.value.includes('.')) {
            e.preventDefault();
            return;
          }
        }

        // If typing a digit, verify decimal limit
        if (/^[0-9]$/.test(e.key)) {
          const parts = activeEl.value.split('.');
          if (parts.length > 1 && parts[1].length >= 2) {
            const selectionStart = activeEl.selectionStart;
            const decimalIndex = activeEl.value.indexOf('.');
            if (selectionStart > decimalIndex) {
              e.preventDefault();
            }
          }
        }
      }
    };

    // Handle paste event
    const handlePaste = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.type === 'number') {
        const text = (e.clipboardData || window.clipboardData).getData('text');
        if (!/^\d+(\.\d{1,2})?$/.test(text)) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  useEffect(() => {
    if (['manage-expenses', 'calculate-water-bill', 'billing-payments', 'monthly-expenses', 'total-amount', 'billing-reports'].includes(activeTab)) {
      setBillingExpanded(true);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [currentCommunityId]);

  const loadData = async (communityId = currentCommunityId) => {
    try {
      const overview = await api.fetchOverview(communityId);
      setCommunityOverview(overview);

      try {
        const allComms = await api.fetchCommunities();
        setCommunitiesList(allComms);
      } catch (err) {
        console.error("Error fetching all communities", err);
      }

      const towersOver = await api.fetchTowersOverview(communityId);
      setTowersOverview(towersOver);

      const towers = await api.fetchTowers(communityId);
      setTowersList(towers);
      
      let currentFlats = [];
      if (towers.length > 0) {
        setSelectedTowerId(towers[0].id);
        const flats = await api.fetchFlats(towers[0].id);
        setFlatsList(flats);
        currentFlats = flats;
      }

      // Fetch all flats across all towers to support global billing operations
      const allFlatsTemp = [];
      for (const tower of towers) {
        const flats = await api.fetchFlats(tower.id);
        allFlatsTemp.push(...flats);
      }
      setAllFlats(allFlatsTemp);

      // Initialize payments ledger if empty
      setPaymentsList(prevPayments => {
        if (prevPayments.length > 0) return prevPayments;
        
        const initialPayments = [];
        allFlatsTemp.forEach((flat, idx) => {
          // Maintenance bill for current month
          initialPayments.push({
            id: Date.now() + idx * 1000 + 1,
            flatId: flat.id,
            flatNumber: flat.number,
            billType: 'Maintenance',
            month: '2026-08',
            amount: 120.00,
            status: idx % 3 === 0 ? 'Unpaid' : 'Paid',
            amountPaid: idx % 3 === 0 ? 0 : 120.00,
            paymentMethod: idx % 3 === 0 ? '' : 'UPI',
            reference: idx % 3 === 0 ? '' : `TXN${100000 + idx}`,
            datePaid: idx % 3 === 0 ? '' : '2026-08-02'
          });

          // Water bill
          if (idx % 2 === 0) {
            const waterAmount = 35.50 + (idx * 2.2);
            initialPayments.push({
              id: Date.now() + idx * 1000 + 2,
              flatId: flat.id,
              flatNumber: flat.number,
              billType: 'Water',
              month: '2026-08',
              amount: waterAmount,
              status: idx % 4 === 0 ? 'Unpaid' : 'Paid',
              amountPaid: idx % 4 === 0 ? 0 : waterAmount,
              paymentMethod: idx % 4 === 0 ? '' : 'Cash',
              reference: '',
              datePaid: idx % 4 === 0 ? '' : '2026-08-03'
            });
          }
        });
        return initialPayments;
      });

    } catch (err) {
      console.error("Error loading data", err);
    }
  };

  const handleTowerChange = async (towerId) => {
    setSelectedTowerId(towerId);
    try {
      const flats = await api.fetchFlats(towerId);
      setFlatsList(flats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTower = async (e) => {
    e.preventDefault();
    try {
      await api.addTower({ ...newTower, community_id: currentCommunityId });
      setShowAddTowerModal(false);
      setNewTower({ name: '', flats_per_floor: 4, floor_count: 10, blocks_count: 1, lifts_count: 2 });
      await loadData();
      addLog(`New Tower ${newTower.name} added successfully`, 'add');
    } catch (err) {
      alert("Error adding tower");
    }
  };

  const handleAddFlat = async (e) => {
    e.preventDefault();
    try {
      const towerId = parseInt(newFlat.tower_id || selectedTowerId || (towersList[0]?.id));
      if (!towerId) {
        alert("Please select or create a tower first.");
        return;
      }
      await api.addFlat({
        ...newFlat,
        tower_id: towerId,
        occupants_count: newFlat.status === 'Occupied' ? parseInt(newFlat.occupants_count || 0) : 0
      });
      setShowAddFlatModal(false);
      setNewFlat({ number: '', tower_id: '', status: 'Vacant', resident_name: '', resident_phone: '', occupants_count: 0 });
      await loadData();
      if (selectedTowerId === towerId) {
        handleTowerChange(towerId);
      }
      addLog(`Flat ${newFlat.number} added to database`, 'add');
    } catch (err) {
      alert("Error adding flat");
    }
  };

  const handleEditFlat = (flat) => {
    setEditingFlat(flat);
    setShowEditFlatModal(true);
  };

  const handleUpdateFlat = async (e) => {
    e.preventDefault();
    try {
      await api.updateFlat(editingFlat.id, {
        number: editingFlat.number,
        status: editingFlat.status,
        resident_name: editingFlat.status === 'Occupied' ? editingFlat.resident_name : '',
        resident_phone: editingFlat.status === 'Occupied' ? editingFlat.resident_phone : '',
        occupants_count: editingFlat.status === 'Occupied' ? parseInt(editingFlat.occupants_count) : 0
      });
      setShowEditFlatModal(false);
      setEditingFlat(null);
      await loadData();
      handleTowerChange(selectedTowerId);
      addLog(`Flat ${editingFlat.number} status/resident details updated`, editingFlat.status === 'Occupied' ? 'occupied' : 'vacant');
    } catch (err) {
      alert("Error updating flat");
    }
  };

  const handleDeleteFlat = async (flatId, flatNumber) => {
    if (!window.confirm(`Are you sure you want to delete flat ${flatNumber}?`)) return;
    try {
      await api.deleteFlat(flatId);
      await loadData();
      handleTowerChange(selectedTowerId);
      addLog(`Flat ${flatNumber} deleted from system`, 'vacant');
    } catch (err) {
      alert("Error deleting flat");
    }
  };

  const handleEditCommunity = () => {
    if (!communityOverview) return;
    setEditingCommunity({
      name: communityOverview.name,
      address: communityOverview.address,
      total_area: communityOverview.total_area,
      established_on: communityOverview.established_on,
      manager_name: communityOverview.manager_name,
      manager_phone: communityOverview.manager_phone
    });
    const savedImg = localStorage.getItem(`community_image_${currentCommunityId}`);
    setEditImagePreview(savedImg || null);
    setEditImageFileName(savedImg ? 'Previously uploaded image' : '');
    setEditUploadError('');
    setShowEditCommunityModal(true);
  };

  const handleUpdateCommunity = async (e) => {
    e.preventDefault();
    try {
      await api.updateCommunity(currentCommunityId, editingCommunity);
      if (editImagePreview) {
        localStorage.setItem(`community_image_${currentCommunityId}`, editImagePreview);
      } else {
        localStorage.removeItem(`community_image_${currentCommunityId}`);
      }
      setShowEditCommunityModal(false);
      setEditingCommunity(null);
      setEditImagePreview(null);
      setEditImageFileName('');
      setEditUploadError('');
      await loadData();
      addLog("Community details updated", "add");
    } catch (err) {
      alert("Error updating community details");
    }
  };

  const handleAddCommunitySubmit = async (e) => {
    e.preventDefault();
    try {
      const added = await api.addCommunity(newCommunity);
      if (addImagePreview) {
        localStorage.setItem(`community_image_${added.id}`, addImagePreview);
      }
      setShowAddCommunityModal(false);
      setAddImagePreview(null);
      setAddImageFileName('');
      setAddUploadError('');
      setNewCommunity({
        name: '',
        type: 'Gated Community',
        address: '',
        total_area: '',
        established_on: '',
        manager_name: '',
        manager_phone: ''
      });
      addLog(`New Community ${added.name} registered`, 'add');
      setCurrentCommunityId(added.id);
    } catch (err) {
      alert("Error registering community");
    }
  };

  const handleDeleteCommunity = async (communityId, name) => {
    if (communitiesList.length <= 1) {
      alert("Cannot delete the only registered community. Please add another community first.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete community "${name}"? This will delete all its towers, flats, and records.`)) return;

    try {
      await api.deleteCommunity(communityId);
      addLog(`Community "${name}" deleted`, 'vacant');
      
      // If we deleted the currently active community, switch to another one
      if (communityId === currentCommunityId) {
        const remaining = communitiesList.find(c => c.id !== communityId);
        if (remaining) {
          setCurrentCommunityId(remaining.id);
        }
      } else {
        await loadData();
      }
    } catch (err) {
      alert("Error deleting community");
    }
  };

  const addLog = (text, type) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setUpdatesLog(prev => [
      { id: Date.now(), text, time, type },
      ...prev.slice(0, 4)
    ]);
  };

  const handleAddAmenity = (e) => {
    e.preventDefault();
    const id = amenities.length + 1;
    const placeholderImages = [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=400&auto=format&fit=crop&q=60"
    ];
    const image = placeholderImages[id % placeholderImages.length];

    setAmenities(prev => [
      ...prev,
      {
        id,
        name: newAmenity.name,
        category: newAmenity.category,
        status: newAmenity.status,
        bookings_count: 0,
        description: newAmenity.description || `Community ${newAmenity.name.toLowerCase()} facility.`,
        image
      }
    ]);
    setShowAddAmenityModal(false);
    setNewAmenity({ name: '', category: 'Recreation', status: 'Active', bookings_count: 0, description: '' });
    addLog(`New Amenity ${newAmenity.name} added to portal`, 'add');
  };

  const filteredAmenities = amenities.filter(amenity => {
    const matchesSearch = amenity.name.toLowerCase().includes(amenitySearch.toLowerCase()) ||
      amenity.description.toLowerCase().includes(amenitySearch.toLowerCase());
    const matchesCategory = amenityCategory === 'All' || amenity.category === amenityCategory;
    const matchesStatus = amenityStatus === 'All' || amenity.status === amenityStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredFlats = flatsList.filter(flat => {
    const matchesSearch = flat.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flat.resident_name && flat.resident_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = flatFilter === 'All' || flat.status === flatFilter;
    return matchesSearch && matchesStatus;
  });

  if (!communityOverview) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading Community Portal...</p>
        </div>
      </div>
    );
  }

  // Ring/Pie details
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const occupiedOffset = circumference - (communityOverview.occupancy_rate / 100) * circumference;

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64 p-4' : 'w-16 py-4 px-2'} bg-white border-r border-slate-100 flex flex-col justify-between transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-6`}>
              {isSidebarOpen ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-[#6366f1] rounded-xl">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{communityOverview.name}</h2>
                      <span className="text-xs text-slate-400 font-medium truncate max-w-[120px] block">{communityOverview.type}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors duration-200"
                    title="Collapse sidebar"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors duration-200"
                  title="Expand sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
            </div>
            <nav className="space-y-1">
              {[
                { id: 'communities', label: 'Communities', icon: Building2 },
                { id: 'towers', label: 'Towers', icon: Home },
                { id: 'flats', label: 'Flats', icon: Users },
                { id: 'visitors', label: 'Visitors', icon: ShieldCheck },
                { id: 'amenities', label: 'Amenities', icon: Bell },
                { id: 'billing-finance', label: 'Billing & Finance', icon: Coins },
                { id: 'procurement', label: 'Procurement', icon: ShoppingBag },
                { id: 'maintenance', label: 'Maintenance', icon: Wrench },
                { id: 'notices', label: 'Notices', icon: MessageSquare },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                const isFlatsActive = item.id === 'flats' && ['flats', 'add-flat', 'bulk-upload'].includes(activeTab);
                const isCommunitiesActive = item.id === 'communities' && ['communities', 'community'].includes(activeTab);
                const isActive = activeTab === item.id || isFlatsActive || isCommunitiesActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center ${isSidebarOpen ? 'gap-3.5 px-4 py-3 justify-start' : 'justify-center p-3'} rounded-xl font-medium text-sm transition-all duration-200 ${isActive
                      ? 'bg-indigo-50 text-[#6366f1]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Card */}
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3 px-1' : 'justify-center'} pt-4 border-t border-slate-100`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold" title="Admin User">
              A
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-800 text-sm truncate">Admin User</h4>
                <span className="text-xs text-slate-400 truncate block">Administrator</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800 capitalize">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Pages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* COMMUNITIES LIST PAGE */}
          {activeTab === 'communities' && (
            <CommunitiesListPage
              communitiesList={communitiesList}
              setCurrentCommunityId={setCurrentCommunityId}
              setActiveTab={setActiveTab}
              setShowAddCommunityModal={setShowAddCommunityModal}
              handleDeleteCommunity={handleDeleteCommunity}
            />
          )}

          {/* COMMUNITY PAGE */}
          {activeTab === 'community' && (
            <CommunityPage
              communityOverview={communityOverview}
              handleEditCommunity={handleEditCommunity}
              setShowAddTowerModal={setShowAddTowerModal}
              setShowAddFlatModal={setShowAddFlatModal}
              setActiveTab={setActiveTab}
              setShowAddCommunityModal={setShowAddCommunityModal}
              communitiesList={communitiesList}
              setCurrentCommunityId={setCurrentCommunityId}
              handleDeleteCommunity={handleDeleteCommunity}
            />
          )}

          {/* TOWERS PAGE */}
          {activeTab === 'towers' && (
            <TowersPage
              towersOverview={towersOverview}
              communityOverview={communityOverview}
              setShowAddTowerModal={setShowAddTowerModal}
              loadData={loadData}
              addLog={addLog}
            />
          )}

          {/* FLATS PAGES */}
          {activeTab === 'flats' && (
            <FlatsPage
              towersList={towersList}
              selectedTowerId={selectedTowerId}
              handleTowerChange={handleTowerChange}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              flatFilter={flatFilter}
              setFlatFilter={setFlatFilter}
              filteredFlats={filteredFlats}
              handleEditFlat={handleEditFlat}
              handleDeleteFlat={handleDeleteFlat}
              setShowAddFlatModal={setShowAddFlatModal}
              towersOverview={towersOverview}
              updatesLog={updatesLog}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'add-flat' && (
            <AddFlatPage
              towersList={towersList}
              selectedTowerId={selectedTowerId}
              loadData={loadData}
              handleTowerChange={handleTowerChange}
              addLog={(txt) => addLog(txt, 'add')}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === 'bulk-upload' && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Bulk Upload Flats</h2>
              <p className="text-slate-400 text-sm">Upload a CSV or Excel spreadsheet containing resident registry to import flats in bulk.</p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 hover:border-indigo-400 transition cursor-pointer">
                Click or drag & drop files here to upload
              </div>
            </div>
          )}

          {/* AMENITIES PAGE */}
          {activeTab === 'amenities' && (
            <AmenitiesPage
              amenities={amenities}
              filteredAmenities={filteredAmenities}
              amenitySearch={amenitySearch}
              setAmenitySearch={setAmenitySearch}
              amenityCategory={amenityCategory}
              setAmenityCategory={setAmenityCategory}
              amenityStatus={amenityStatus}
              setAmenityStatus={setAmenityStatus}
              setAmenities={setAmenities}
              setShowAddAmenityModal={setShowAddAmenityModal}
              addLog={addLog}
            />
          )}

          {/* BILLING & FINANCE MAIN PAGE */}
          {activeTab === 'billing-finance' && (
            <BillingFinancePage
              towersList={towersList}
              flatsList={allFlats}
              expenses={expenses}
              setExpenses={setExpenses}
              waterBills={waterBills}
              setWaterBills={setWaterBills}
              paymentsList={paymentsList}
              setPaymentsList={setPaymentsList}
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}

          {/* MAINTENANCE PAGE */}
          {activeTab === 'maintenance' && (
            <MaintenancePage
              expenses={expenses}
              setExpenses={setExpenses}
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}

          {/* VISITORS PAGE */}
          {activeTab === 'visitors' && (
            <VisitorsPage
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}

          {/* PROCUREMENT PAGE */}
          {activeTab === 'procurement' && (
            <ProcurementPage
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}

          {/* NOTICES PAGE */}
          {activeTab === 'notices' && (
            <NoticesPage
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}

          {/* SETTINGS PAGE */}
          {activeTab === 'settings' && (
            <SettingsPage
              communityOverview={communityOverview}
              addLog={(txt) => addLog(txt, 'add')}
            />
          )}
        </div>
      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* Add Tower Modal */}
      {showAddTowerModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Tower</h3>
              <p className="text-slate-400 text-xs">Register a new residential tower in this community</p>
            </div>
            <form onSubmit={handleAddTower} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Tower Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower E"
                  value={newTower.name}
                  onChange={(e) => setNewTower({ ...newTower, name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Flats (Per Floor)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTower.flats_per_floor}
                    onChange={(e) => setNewTower({ ...newTower, flats_per_floor: parseInt(e.target.value) })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Floors</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTower.floor_count}
                    onChange={(e) => setNewTower({ ...newTower, floor_count: parseInt(e.target.value) })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Blocks</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTower.blocks_count}
                    onChange={(e) => setNewTower({ ...newTower, blocks_count: parseInt(e.target.value) })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Lifts</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newTower.lifts_count}
                    onChange={(e) => setNewTower({ ...newTower, lifts_count: parseInt(e.target.value) })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddTowerModal(false)}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Add Tower
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {showAddFlatModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Flat</h3>
              <p className="text-slate-400 text-xs">Create a new flat profile within a specific tower</p>
            </div>
            <form onSubmit={handleAddFlat} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Tower</label>
                  <select
                    value={newFlat.tower_id || selectedTowerId || (towersList[0]?.id || '')}
                    onChange={(e) => setNewFlat({ ...newFlat, tower_id: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                  >
                    {towersList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Flat Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={newFlat.number}
                    onChange={(e) => setNewFlat({ ...newFlat, number: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Occupancy Status</label>
                <select
                  value={newFlat.status}
                  onChange={(e) => setNewFlat({ ...newFlat, status: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>

              {newFlat.status === 'Occupied' && (
                <div className="space-y-4 border-t border-slate-50 pt-4 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Resident Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={newFlat.resident_name}
                      onChange={(e) => setNewFlat({ ...newFlat, resident_name: e.target.value })}
                      className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 99887 76655"
                        value={newFlat.resident_phone}
                        onChange={(e) => setNewFlat({ ...newFlat, resident_phone: e.target.value })}
                        className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1.5">Occupants Count</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newFlat.occupants_count}
                        onChange={(e) => setNewFlat({ ...newFlat, occupants_count: e.target.value })}
                        className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddFlatModal(false)}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Add Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Flat Modal */}
      {showEditFlatModal && editingFlat && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Update Flat Info</h3>
              <p className="text-slate-400 text-xs">Modify flat details, vacancy status, or resident registration</p>
            </div>
            <form onSubmit={handleUpdateFlat} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Flat Number</label>
                <input
                  type="text"
                  required
                  value={editingFlat.number}
                  onChange={(e) => setEditingFlat({ ...editingFlat, number: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-slate-50"
                  disabled
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Occupancy Status</label>
                <select
                  value={editingFlat.status}
                  onChange={(e) => setEditingFlat({ ...editingFlat, status: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                </select>
              </div>

              {editingFlat.status === 'Occupied' && (
                <div className="space-y-4 border-t border-slate-50 pt-4 mt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">Resident Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={editingFlat.resident_name || ''}
                      onChange={(e) => setEditingFlat({ ...editingFlat, resident_name: e.target.value })}
                      className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 99887 76655"
                        value={editingFlat.resident_phone || ''}
                        onChange={(e) => setEditingFlat({ ...editingFlat, resident_phone: e.target.value })}
                        className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1.5">Occupants Count</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={editingFlat.occupants_count}
                        onChange={(e) => setEditingFlat({ ...editingFlat, occupants_count: e.target.value })}
                        className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditFlatModal(false);
                    setEditingFlat(null);
                  }}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditCommunityModal && editingCommunity && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Community Profile</h3>
              <p className="text-slate-400 text-xs">Update community info, address, and manager contact details</p>
            </div>
            <form onSubmit={handleUpdateCommunity} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Community Name</label>
                <input
                  type="text"
                  required
                  value={editingCommunity.name}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Community Image</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!validTypes.includes(file.type)) {
                        setEditUploadError('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setEditUploadError('File is too large. Maximum size is 5 MB.');
                        return;
                      }
                      setEditUploadError('');
                      setEditImageFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => setEditImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center space-y-2"
                  onClick={() => document.getElementById('edit-comm-img-file')?.click()}
                >
                  <input
                    id="edit-comm-img-file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!validTypes.includes(file.type)) {
                          setEditUploadError('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setEditUploadError('File is too large. Maximum size is 5 MB.');
                          return;
                        }
                        setEditUploadError('');
                        setEditImageFileName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => setEditImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {editImagePreview ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="relative h-28 w-full max-w-[200px] rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white">
                        <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditImagePreview(null);
                            setEditImageFileName('');
                            setEditUploadError('');
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm text-[10px] h-5 w-5 flex items-center justify-center font-bold"
                        >
                          ×
                        </button>
                      </div>
                      <span className="text-slate-500 text-[10px] font-semibold truncate max-w-xs block">{editImageFileName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-blue-600 font-bold text-xs block hover:underline">Upload Image</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Drag & drop or click to upload (max 5MB)</span>
                      <span className="text-[10px] text-slate-400 italic block mt-1">"No Community Image Selected"</span>
                    </div>
                  )}
                </div>
                {editUploadError && <p className="text-rose-500 text-[10px] font-semibold mt-1">{editUploadError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
                <input
                  type="text"
                  required
                  value={editingCommunity.address}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, address: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Total Area</label>
                  <input
                    type="text"
                    required
                    value={editingCommunity.total_area}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, total_area: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Established On</label>
                  <input
                    type="text"
                    required
                    value={editingCommunity.established_on}
                    onChange={(e) => setEditingCommunity({ ...editingCommunity, established_on: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Manager Name</label>
                <input
                  type="text"
                  required
                  value={editingCommunity.manager_name}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, manager_name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Manager Phone</label>
                <input
                  type="text"
                  required
                  value={editingCommunity.manager_phone}
                  onChange={(e) => setEditingCommunity({ ...editingCommunity, manager_phone: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCommunityModal(false);
                    setEditingCommunity(null);
                  }}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Amenity Modal */}
      {showAddAmenityModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Amenity</h3>
              <p className="text-slate-400 text-xs">Register a new facility or amenity in the community portal</p>
            </div>
            <form onSubmit={handleAddAmenity} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Amenity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Club House"
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Category</label>
                  <select
                    value={newAmenity.category}
                    onChange={(e) => setNewAmenity({ ...newAmenity, category: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Recreation">Recreation</option>
                    <option value="Fitness">Fitness</option>
                    <option value="Sports">Sports</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Parking">Parking</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Status</label>
                  <select
                    value={newAmenity.status}
                    onChange={(e) => setNewAmenity({ ...newAmenity, status: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Description</label>
                <textarea
                  placeholder="Provide a brief description of this facility..."
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity({ ...newAmenity, description: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600 h-24 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddAmenityModal(false)}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Add Amenity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Community Modal */}
      {showAddCommunityModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Add New Community</h3>
              <p className="text-slate-400 text-xs">Register a new community profile in the portal</p>
            </div>
            <form onSubmit={handleAddCommunitySubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Community Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greenfield Residency"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Community Image</label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      const file = e.dataTransfer.files[0];
                      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                      if (!validTypes.includes(file.type)) {
                        setAddUploadError('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setAddUploadError('File is too large. Maximum size is 5 MB.');
                        return;
                      }
                      setAddUploadError('');
                      setAddImageFileName(file.name);
                      const reader = new FileReader();
                      reader.onloadend = () => setAddImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col items-center justify-center space-y-2"
                  onClick={() => document.getElementById('add-comm-img-file')?.click()}
                >
                  <input
                    id="add-comm-img-file"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!validTypes.includes(file.type)) {
                          setAddUploadError('Unsupported format. Please upload JPG, JPEG, PNG, or WEBP.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setAddUploadError('File is too large. Maximum size is 5 MB.');
                          return;
                        }
                        setAddUploadError('');
                        setAddImageFileName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => setAddImagePreview(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {addImagePreview ? (
                    <div className="space-y-2 w-full flex flex-col items-center">
                      <div className="relative h-28 w-full max-w-[200px] rounded-lg overflow-hidden border border-slate-100 shadow-sm bg-white">
                        <img src={addImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddImagePreview(null);
                            setAddImageFileName('');
                            setAddUploadError('');
                          }}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm text-[10px] h-5 w-5 flex items-center justify-center font-bold"
                        >
                          ×
                        </button>
                      </div>
                      <span className="text-slate-500 text-[10px] font-semibold truncate max-w-xs block">{addImageFileName}</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-blue-600 font-bold text-xs block hover:underline">Upload Image</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Drag & drop or click to upload (max 5MB)</span>
                      <span className="text-[10px] text-slate-400 italic block mt-1">"No Community Image Selected"</span>
                    </div>
                  )}
                </div>
                {addUploadError && <p className="text-rose-500 text-[10px] font-semibold mt-1">{addUploadError}</p>}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 45, Gurgaon"
                  value={newCommunity.address}
                  onChange={(e) => setNewCommunity({ ...newCommunity, address: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Total Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 150,000 sq ft"
                    value={newCommunity.total_area}
                    onChange={(e) => setNewCommunity({ ...newCommunity, total_area: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">Established On</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2024-01-01"
                    value={newCommunity.established_on}
                    onChange={(e) => setNewCommunity({ ...newCommunity, established_on: e.target.value })}
                    className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Manager Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newCommunity.manager_name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, manager_name: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Manager Phone</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={newCommunity.manager_phone}
                  onChange={(e) => setNewCommunity({ ...newCommunity, manager_phone: e.target.value })}
                  className="w-full p-3 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCommunityModal(false);
                  }}
                  className="px-5 py-2.5 border border-slate-150 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Register Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
