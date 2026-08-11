import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  PlusCircle
} from 'lucide-react';
import * as api from '../services/communityApi';

export default function AddFlatPage({ 
  towersList = [], 
  selectedTowerId, 
  loadData, 
  handleTowerChange,
  addLog, 
  setActiveTab 
}) {
  // 1. Basic Fields
  const [towerId, setTowerId] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [occupancyStatus, setOccupancyStatus] = useState('Occupied');

  // 2. Owner Details
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [whoIsStaying, setWhoIsStaying] = useState('Owner'); // 'Owner' or 'Tenant'

  // 3. Tenant Details
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [tenantAadhaar, setTenantAadhaar] = useState('');
  const [tenantIdProof, setTenantIdProof] = useState('');

  // 4. Vehicle Details
  const [vehicles, setVehicles] = useState([]);

  // 5. Maintenance Details
  const [maintenanceRemarks, setMaintenanceRemarks] = useState('');
  const [expectedAvailableDate, setExpectedAvailableDate] = useState('');

  // Initialize tower
  useEffect(() => {
    if (selectedTowerId) {
      setTowerId(selectedTowerId.toString());
    } else if (towersList.length > 0) {
      setTowerId(towersList[0].id.toString());
    }
  }, [selectedTowerId, towersList]);

  // Stepper logic
  const handleSetVehicleCount = (count) => {
    const newCount = Math.max(0, count);
    if (newCount > vehicles.length) {
      const added = Array.from({ length: newCount - vehicles.length }, () => ({
        name: '',
        type: 'Car',
        number: ''
      }));
      setVehicles([...vehicles, ...added]);
    } else if (newCount < vehicles.length) {
      setVehicles(vehicles.slice(0, newCount));
    }
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { name: '', type: 'Car', number: '' }]);
  };

  const handleDeleteVehicle = (index) => {
    setVehicles(vehicles.filter((_, idx) => idx !== index));
  };

  const handleVehicleChange = (index, field, value) => {
    const updated = [...vehicles];
    updated[index][field] = value;
    setVehicles(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!towerId) {
      alert('Please select a Tower.');
      return;
    }

    try {
      const payload = {
        number: flatNumber,
        status: occupancyStatus,
        tower_id: parseInt(towerId),
        resident_name: null,
        resident_phone: null,
        occupants_count: 0
      };

      if (occupancyStatus === 'Occupied') {
        payload.resident_name = whoIsStaying === 'Owner' ? ownerName : tenantName;
        payload.resident_phone = whoIsStaying === 'Owner' ? ownerPhone : tenantPhone;
        payload.occupants_count = whoIsStaying === 'Owner' ? 1 : 2;

        payload.owner = {
          name: ownerName,
          phone: ownerPhone
        };

        if (whoIsStaying === 'Tenant') {
          payload.tenant = {
            name: tenantName,
            phone: tenantPhone,
            email: tenantEmail,
            move_in_date: moveInDate,
            aadhaar: tenantAadhaar,
            id_proof: tenantIdProof
          };
        }

        if (vehicles.length > 0) {
          payload.vehicles = vehicles;
        }
      } else if (occupancyStatus === 'Under Maintenance') {
        payload.maintenance_remarks = maintenanceRemarks;
        payload.expected_available_date = expectedAvailableDate;
      }

      // Check if flat already exists in the selected tower
      const existingFlats = await api.fetchFlats(parseInt(towerId));
      const existingFlat = existingFlats.find(
        f => f.number && f.number.trim().toLowerCase() === flatNumber.trim().toLowerCase()
      );

      if (existingFlat) {
        await api.updateFlat(existingFlat.id, payload);
        addLog(`Flat ${flatNumber} updated successfully`, 'update');
      } else {
        await api.addFlat(payload);
        addLog(`Flat ${flatNumber} added successfully`, 'add');
      }

      if (loadData) await loadData();
      if (handleTowerChange) {
        await handleTowerChange(parseInt(towerId));
      }
      setActiveTab('flats');
    } catch (err) {
      alert(err.message || 'Failed to save flat');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Breadcrumbs & Title */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span className="cursor-pointer hover:text-indigo-600" onClick={() => setActiveTab('flats')}>Flats</span>
            <span>&gt;</span>
            <span className="text-slate-600">Add New Flat</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Add New Flat</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Layout Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* Row 1: Tower & Flat Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">Tower *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">
                  <Building2 size={16} />
                </span>
                <select
                  required
                  value={towerId}
                  onChange={(e) => setTowerId(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
                >
                  <option value="" disabled>Select Tower</option>
                  {towersList.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">Flat Number *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">
                  <Building2 size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. A-101"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Occupancy Status */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Occupancy Status *</label>
            <select
              value={occupancyStatus}
              onChange={(e) => setOccupancyStatus(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-white"
            >
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
              <option value="Under Maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* SECTION: Occupied fields */}
          {occupancyStatus === 'Occupied' && (
            <div className="space-y-6 border-t border-slate-100 pt-6">
              
              {/* Owner Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Owner Name *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required={occupancyStatus === 'Occupied'}
                      placeholder="Mr. Rahul Sharma"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-2">Owner Phone Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      required={occupancyStatus === 'Occupied'}
                      placeholder="9876543210"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Who is Staying? */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-3">Who is Staying? *</label>
                <div className="flex gap-6 items-center">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="whoIsStaying"
                      value="Owner"
                      checked={whoIsStaying === 'Owner'}
                      onChange={() => setWhoIsStaying('Owner')}
                      className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                    />
                    Owner
                  </label>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="whoIsStaying"
                      value="Tenant"
                      checked={whoIsStaying === 'Tenant'}
                      onChange={() => setWhoIsStaying('Tenant')}
                      className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                    />
                    Tenant
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Select Tenant if the flat is rented out.</p>
              </div>

              {/* SECTION: Tenant Details (with expand/collapse transition) */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  whoIsStaying === 'Tenant' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-2 pb-2 border-b border-indigo-100/30">
                    <User className="text-indigo-600 h-5 w-5" />
                    <h3 className="font-bold text-indigo-950 text-sm">Tenant Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Tenant Name *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <User size={16} />
                        </span>
                        <input
                          type="text"
                          required={occupancyStatus === 'Occupied' && whoIsStaying === 'Tenant'}
                          placeholder="Enter tenant name"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Tenant Phone Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <Phone size={16} />
                        </span>
                        <input
                          type="text"
                          required={occupancyStatus === 'Occupied' && whoIsStaying === 'Tenant'}
                          placeholder="Enter tenant phone number"
                          value={tenantPhone}
                          onChange={(e) => setTenantPhone(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Tenant Email</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <Mail size={16} />
                        </span>
                        <input
                          type="email"
                          placeholder="Enter tenant email"
                          value={tenantEmail}
                          onChange={(e) => setTenantEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Move-in Date *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <Calendar size={16} />
                        </span>
                        <input
                          type="date"
                          required={occupancyStatus === 'Occupied' && whoIsStaying === 'Tenant'}
                          value={moveInDate}
                          onChange={(e) => setMoveInDate(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Tenant Aadhaar Number (Optional)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <FileText size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="12-digit Aadhaar Number"
                          value={tenantAadhaar}
                          onChange={(e) => setTenantAadhaar(e.target.value)}
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Tenant ID Proof Upload (Optional)</label>
                      <input
                        type="file"
                        onChange={(e) => setTenantIdProof(e.target.files[0]?.name || '')}
                        className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: Vehicle Details */}
              <div className="space-y-4 border-t border-slate-100 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">Number of Vehicles</span>
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleSetVehicleCount(vehicles.length - 1)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-r border-slate-200 transition"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 bg-white text-sm font-bold text-slate-800 w-12 text-center">
                      {vehicles.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetVehicleCount(vehicles.length + 1)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold border-l border-slate-200 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {vehicles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicles.map((veh, index) => (
                      <div key={index} className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 space-y-3 relative group">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs font-bold text-indigo-600">Vehicle {index + 1}</span>
                          {vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVehicle(index)}
                              className="text-slate-400 hover:text-rose-500 transition p-1"
                              title="Delete vehicle"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Vehicle Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Honda Civic"
                              value={veh.name}
                              onChange={(e) => handleVehicleChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:ring-1"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Vehicle Type *</label>
                            <select
                              value={veh.type}
                              onChange={(e) => handleVehicleChange(index, 'type', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white focus:ring-1"
                            >
                              <option value="Car">Car (4-Wheeler)</option>
                              <option value="Bike">Bike (2-Wheeler)</option>
                              <option value="Bicycle">Bicycle</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Vehicle Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. TS09AB1234"
                              value={veh.number}
                              onChange={(e) => handleVehicleChange(index, 'number', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 bg-white rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:ring-1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddVehicle}
                  className="w-full py-2.5 border border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 hover:bg-indigo-50/40 text-indigo-600 hover:text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={14} />
                  Add Another Vehicle
                </button>
              </div>

            </div>
          )}

          {/* SECTION: Under Maintenance fields */}
          {occupancyStatus === 'Under Maintenance' && (
            <div className="space-y-6 border-t border-slate-100 pt-6">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Maintenance Remarks</label>
                <textarea
                  placeholder="Describe maintenance works e.g. painting, bathroom leaks repair..."
                  value={maintenanceRemarks}
                  onChange={(e) => setMaintenanceRemarks(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-28"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Expected Available Date</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400">
                    <Calendar size={16} />
                  </span>
                  <input
                    type="date"
                    value={expectedAvailableDate}
                    onChange={(e) => setExpectedAvailableDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Buttons Row */}
        <div className="flex gap-4 justify-end pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('flats')}
            className="px-6 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle size={16} />
            Update Flat
          </button>
        </div>
      </form>
    </div>
  );
}
