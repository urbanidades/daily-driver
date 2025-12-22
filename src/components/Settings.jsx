import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { User, Sparkles, LogOut, Shield, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const MAX_AI_USES = 5;
const ADMIN_EMAILS = ['afonsurbano@gmail.com'];

function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [aiUsage, setAiUsage] = useState(0);
  const [stats, setStats] = useState(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Fetch AI usage
        const { data: settingsData, error } = await supabase
          .from('user_settings')
          .select('ai_uses')
          .eq('user_id', user.id)
          .single();

        if (settingsData) {
          setAiUsage(settingsData.ai_uses || 0);
        }

        // Fetch user stats (e.g. total completed tasks)
        // This is a "nice to have" dashboard feature
        const { count: completedCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'done');
          
        const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        setStats({
          completedTasks: completedCount || 0,
          totalProjects: 0, // Placeholder if we want to add later
          totalTasks: totalCount || 0
        });

      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) return null;

  const usagePercentage = isAdmin ? 0 : Math.min(100, (aiUsage / MAX_AI_USES) * 100);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings & Dashboard</h1>
        <p className="settings-subtitle">Manage your account and view your activity.</p>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card profile-card">
          <div className="card-header">
            <User className="card-icon" size={24} />
            <h2>Profile</h2>
          </div>
          <div className="profile-info">
            <div className="profile-avatar">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <h3>{user.user_metadata?.full_name || 'Daily Driver User'}</h3>
              <div className="detail-row">
                 <Mail size={16} />
                 <span>{user.email}</span>
              </div>
              {isAdmin && (
                <div className="admin-badge">
                  <Shield size={14} />
                  <span>Admin Access</span>
                </div>
              )}
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* AI Usage Card */}
        <div className="settings-card ai-card">
          <div className="card-header">
            <Sparkles className="card-icon" size={24} />
            <h2>AI Usage</h2>
          </div>
          <div className="ai-usage-content">
            <div className="usage-stats">
              <span className="usage-number">
                {isAdmin ? 'Unlimited' : `${MAX_AI_USES - aiUsage} / ${MAX_AI_USES}`}
              </span>
              <span className="usage-label">credits remaining</span>
            </div>
            
            {!isAdmin && (
                <div className="progress-bar-container">
                <div 
                    className="progress-bar-fill" 
                    style={{ width: `${usagePercentage}%`, backgroundColor: usagePercentage >= 100 ? '#ef4444' : 'var(--primary)' }} 
                ></div>
                </div>
            )}
            
            <div className="ai-status-message">
                {isAdmin ? (
                    <p>You have unlimited access to AI features as an administrator.</p>
                ) : (
                    <p>Credits reset monthly. Use them to enhance task descriptions and generate subtasks.</p>
                )}
            </div>
          </div>
        </div>
        
        {/* Activity Stats (Mini Dashboard) */}
        <div className="settings-card stats-card">
            <div className="card-header">
                <span className="material-symbols-outlined card-icon">bar_chart</span>
                <h2>Activity</h2>
            </div>
            {loading ? (
                <div className="stats-loading">Loading stats...</div>
            ) : (
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-value">{stats?.totalTasks || 0}</span>
                        <span className="stat-label">Total Tasks</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats?.completedTasks || 0}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                    <div className="stat-item">
                         {/* Calculate completion rate */}
                        <span className="stat-value">
                            {stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                        </span>
                        <span className="stat-label">Completion Rate</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
