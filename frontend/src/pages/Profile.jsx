import { useState } from 'react';
import { User, Mail, FileText, Camera, Save, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('Passwords do not match');
    if (pwdForm.newPwd.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPwd(true);
    try {
      await updateProfile({ password: pwdForm.newPwd });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      toast.success('Password changed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const roleLabel = { admin: '👑 Admin', manager: '📋 Manager', 'team-member': '💻 Team Member' };
  const roleColor = { admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', manager: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', 'team-member': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-surface-500 mt-1">Manage your personal information and credentials</p>
      </div>

      {/* Avatar & Overview */}
      <div className="card p-6 flex items-center gap-6">
        <div className="relative">
          <img
            src={form.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=6366f1&color=fff&size=128`}
            alt={user?.name}
            className="w-20 h-20 rounded-2xl object-cover border-4 border-brand-100 dark:border-brand-900/40"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors">
            <Camera size={13} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">{user?.name}</h2>
          <p className="text-surface-500 text-sm">{user?.email}</p>
          <span className={`badge mt-2 ${roleColor[user?.role]}`}>{roleLabel[user?.role]}</span>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6">
        <h2 className="section-title mb-5">Personal Information</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required />
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input className="input pl-9 opacity-60 cursor-not-allowed" value={user?.email} readOnly title="Email cannot be changed" />
            </div>
            <p className="text-xs text-surface-400 mt-1">Email address cannot be changed.</p>
          </div>
          <div>
            <label className="label">Avatar URL</label>
            <input className="input" value={form.avatar} onChange={e => setForm({ ...form, avatar: e.target.value })} placeholder="https://example.com/your-photo.jpg" />
            <p className="text-xs text-surface-400 mt-1">Paste an image URL or use a service like Gravatar.</p>
          </div>
          <div>
            <label className="label">Bio</label>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-surface-400" />
              <textarea className="input pl-9 resize-none" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell your team about yourself..." />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="section-title mb-5 flex items-center gap-2"><Key size={18} /> Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} className="input pr-10" value={pwdForm.newPwd}
                onChange={e => setPwdForm({ ...pwdForm, newPwd: e.target.value })} placeholder="Min 6 characters" required minLength={6} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Repeat new password" required />
          </div>
          <button type="submit" disabled={savingPwd} className="btn-primary">
            <Key size={16} />
            {savingPwd ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
