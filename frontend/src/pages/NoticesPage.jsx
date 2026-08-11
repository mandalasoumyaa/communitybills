import React, { useState } from 'react';
import { MessageSquare, Plus, Calendar, User, Trash2 } from 'lucide-react';

export default function NoticesPage({ addLog }) {
  const [notices, setNotices] = useState([
    {
      id: 1,
      title: "Annual General Body Meeting",
      content: "All residents are requested to attend the Annual General Body Meeting scheduled for Sunday, August 10th at 10:00 AM in the Clubhouse.",
      date: "2026-08-04",
      postedBy: "Management Office"
    },
    {
      id: 2,
      title: "Water Supply Interruption",
      content: "Please note that there will be a temporary interruption in water supply on Friday, August 7th from 2:00 PM to 5:00 PM due to scheduled pipeline maintenance.",
      date: "2026-08-03",
      postedBy: "Maintenance Team"
    },
    {
      id: 3,
      title: "Independence Day Celebration",
      content: "Flag hoisting ceremony will be held near the main gate at 9:00 AM on August 15th, followed by cultural events and snacks.",
      date: "2026-08-01",
      postedBy: "Cultural Committee"
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', postedBy: 'Management Office' });

  const handleAddNotice = (e) => {
    e.preventDefault();
    const notice = {
      id: Date.now(),
      title: newNotice.title,
      content: newNotice.content,
      date: new Date().toISOString().split('T')[0],
      postedBy: newNotice.postedBy
    };
    setNotices([notice, ...notices]);
    setShowAddModal(false);
    setNewNotice({ title: '', content: '', postedBy: 'Management Office' });
    if (addLog) addLog(`New notice "${notice.title}" posted`, 'add');
  };

  const handleDeleteNotice = (id, title) => {
    if (window.confirm(`Are you sure you want to delete the notice "${title}"?`)) {
      setNotices(notices.filter(n => n.id !== id));
      if (addLog) addLog(`Notice "${title}" deleted`, 'vacant');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Community Notices</h3>
          <p className="text-slate-550 text-xs mt-0.5">Post and manage announcements for residents</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          Add Notice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3 hover:shadow-md transition duration-200 relative">
            <button
              onClick={() => handleDeleteNotice(notice.id, notice.title)}
              className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-50 rounded-xl transition"
              title="Delete Notice"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800">{notice.title}</h4>
                <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {notice.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {notice.postedBy}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {notice.content}
            </p>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-md w-full shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Post New Notice</h3>
              <p className="text-slate-400 text-xs">Announce important updates to the community</p>
            </div>
            <form onSubmit={handleAddNotice} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maintenance Announcement"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Notice Content</label>
                <textarea
                  required
                  placeholder="Type the message for residents here..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600 h-28 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Posted By</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cultural Committee"
                  value={newNotice.postedBy}
                  onChange={(e) => setNewNotice({ ...newNotice, postedBy: e.target.value })}
                  className="w-full p-2 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-100 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
