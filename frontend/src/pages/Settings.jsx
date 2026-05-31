import { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, Palette, Monitor, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ToggleSwitch = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Settings = () => {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const [notifSettings, setNotifSettings] = useState({ taskAssigned: true, taskUpdated: true, projectUpdated: true, deadlineReminder: true });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const roleColor = { admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', manager: 'bg-brand-100 text-brand-700', 'team-member': 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title flex items-center gap-2"><SettingsIcon size={24} /> Settings</h1>
        <p className="text-surface-500 mt-1">Customize your experience and preferences</p>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-5">
        <h2 className="section-title flex items-center gap-2"><Palette size={18} /> Appearance</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            {dark ? <Moon size={18} className="text-brand-400" /> : <Sun size={18} className="text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Dark Mode</p>
              <p className="text-xs text-surface-500">Switch between light and dark theme</p>
            </div>
          </div>
          <ToggleSwitch checked={dark} onChange={toggle} />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <Monitor size={18} className="text-surface-500" />
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">System Theme</p>
              <p className="text-xs text-surface-500">Follow system dark/light preference</p>
            </div>
          </div>
          <ToggleSwitch checked={false} onChange={() => toast('Coming soon!', { icon: '🛠️' })} />
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><Bell size={18} /> Notification Preferences</h2>
        {[
          { key: 'taskAssigned', label: 'Task Assigned', desc: 'When a task is assigned to you' },
          { key: 'taskUpdated', label: 'Task Updated', desc: 'When a task you are assigned to is updated' },
          { key: 'projectUpdated', label: 'Project Updated', desc: 'When a project you belong to changes' },
          { key: 'deadlineReminder', label: 'Deadline Reminders', desc: 'Alerts before task due dates' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{label}</p>
              <p className="text-xs text-surface-500">{desc}</p>
            </div>
            <ToggleSwitch checked={notifSettings[key]} onChange={v => setNotifSettings(p => ({ ...p, [key]: v }))} />
          </div>
        ))}
      </div>

      {/* Account Info */}
      <div className="card p-6 space-y-4">
        <h2 className="section-title flex items-center gap-2"><Shield size={18} /> Account Details</h2>
        <div className="space-y-3">
          {[
            { label: 'Name', value: user?.name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role?.replace('-', ' ') },
            { label: 'Member Since', value: 'Active Account' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
              <span className="text-sm text-surface-500">{label}</span>
              <span className="text-sm font-medium text-surface-900 dark:text-surface-100 capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary">
        <Save size={16} />
        Save Settings
      </button>
    </div>
  );
};

export default Settings;
