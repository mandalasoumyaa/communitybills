import React, { useState } from 'react';
import { Settings, Shield, Bell, Key, RefreshCw } from 'lucide-react';

export default function SettingsPage({ communityOverview, addLog }) {
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    smsAlerts: false,
    autoApproveVisitors: false,
    requireWaterTankerApproval: true
  });

  const handleToggle = (key) => {
    const updated = !preferences[key];
    setPreferences({ ...preferences, [key]: updated });
    if (addLog) addLog(`Setting changed: ${key.replace(/([A-Z])/g, ' $1')} is now ${updated ? 'Enabled' : 'Disabled'}`, 'add');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Portal Settings</h3>
        <p className="text-slate-550 text-xs mt-0.5">Manage community configurations and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: General Configuration */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-indigo-500" />
                Notification Preferences
              </h4>
              <p className="text-slate-400 text-xs">Configure resident notification updates</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-semibold text-sm text-slate-800 block">Email Alerts for Invoices</span>
                  <span className="text-xs text-slate-400">Send PDF bills to residents automatically upon generation</span>
                </div>
                <button
                  onClick={() => handleToggle('emailAlerts')}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${preferences.emailAlerts ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${preferences.emailAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-50">
                <div>
                  <span className="font-semibold text-sm text-slate-800 block">SMS Alerts for Announcements</span>
                  <span className="text-xs text-slate-400">Send urgent notices directly to resident mobile numbers</span>
                </div>
                <button
                  onClick={() => handleToggle('smsAlerts')}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${preferences.smsAlerts ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${preferences.smsAlerts ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-indigo-500" />
                Security & Visitors
              </h4>
              <p className="text-slate-400 text-xs">Configure gate passes and security rules</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-semibold text-sm text-slate-800 block">Auto-Approve Pre-Invited Guests</span>
                  <span className="text-xs text-slate-400">Allow visitors with invite codes without security check</span>
                </div>
                <button
                  onClick={() => handleToggle('autoApproveVisitors')}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${preferences.autoApproveVisitors ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${preferences.autoApproveVisitors ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-50">
                <div>
                  <span className="font-semibold text-sm text-slate-800 block">Manager Approval for Tankers</span>
                  <span className="text-xs text-slate-400">Require supervisor verification before recording water tankers</span>
                </div>
                <button
                  onClick={() => handleToggle('requireWaterTankerApproval')}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${preferences.requireWaterTankerApproval ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${preferences.requireWaterTankerApproval ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Info & System Details */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-indigo-500" />
              Active Profile
            </h4>
            <div className="space-y-3 pt-1 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Community Name</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">{communityOverview?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Portal Version</span>
                <span className="font-semibold text-slate-800 block">v1.4.0 (Stable)</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold uppercase">Database Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
