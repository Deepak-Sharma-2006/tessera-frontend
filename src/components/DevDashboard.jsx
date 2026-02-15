import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import {
  Users,
  Building2,
  AlertCircle,
  MessageSquare,
  Search,
  ArrowUpDown,
  Ban,
  Trash2,
  X,
  Check,
  LogOut,
  Crown,
  BarChart3,
  Zap
} from 'lucide-react';
import api from '@/lib/api.js';

export default function DevDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    collegeCount: 0,
    activeReports: 0,
    totalReplies: 0
  });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [badgeStats, setBadgeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'email', direction: 'asc' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanConfirm, setShowBanConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // Fetch stats and users on mount
  useEffect(() => {
    fetchStatsAndUsers();
    fetchBadgeStats();
    fetchMaintenanceStatus();
  }, []);

  // Filter and sort users
  useEffect(() => {
    let result = users.filter(u => {
      const query = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(query) ||
        (u.fullName && u.fullName.toLowerCase().includes(query)) ||
        (u.collegeName && u.collegeName.toLowerCase().includes(query))
      );
    });

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredUsers(result);
  }, [searchQuery, sortConfig, users]);

  const fetchStatsAndUsers = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await api.get('/api/admin/stats');
      setStats(statsRes.data);

      // Fetch users
      const usersRes = await api.get('/api/admin/users');
      setUsers(usersRes.data || []);
      setMessage('');
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setMessage('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeStats = async () => {
    try {
      const res = await api.get('/api/admin/badges/stats');
      setBadgeStats(res.data || {});
    } catch (err) {
      console.error('Failed to fetch badge stats:', err);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await api.get('/api/admin/system/maintenance');
      setMaintenanceMode(res.data.maintenanceMode || false);
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePromoteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await api.patch(`/api/admin/users/${selectedUser._id}/promote`);
      setMessage(`User ${selectedUser.email} promoted to College Head`);
      setShowPromoteConfirm(false);
      setSelectedUser(null);
      fetchStatsAndUsers();
    } catch (err) {
      console.error('Failed to promote user:', err);
      setMessage('Error promoting user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await api.patch(`/api/admin/users/${selectedUser._id}/ban`, {
        reason: 'Banned by admin'
      });
      setMessage(`User ${selectedUser.email} banned successfully`);
      setShowBanConfirm(false);
      setSelectedUser(null);
      fetchStatsAndUsers();
    } catch (err) {
      console.error('Failed to ban user:', err);
      setMessage('Error banning user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      await api.delete(`/api/admin/users/${selectedUser._id}`);
      setMessage(`User ${selectedUser.email} deleted successfully`);
      setShowDeleteConfirm(false);
      setDeleteConfirmStep(0);
      setSelectedUser(null);
      fetchStatsAndUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setMessage('Error deleting user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/api/admin/system/maintenance/toggle', {
        enabled: !maintenanceMode
      });
      setMaintenanceMode(res.data.maintenanceMode);
      setMessage(res.data.message);
    } catch (err) {
      console.error('Failed to toggle maintenance:', err);
      setMessage('Error toggling maintenance mode');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCleanupPromotedUsers = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/api/admin/cleanup/fix-promoted-users');
      const fixed = res.data.usersFixed || 0;
      setMessage(`✅ Cleanup complete! Fixed ${fixed} users. Removed incorrectly assigned Founding Dev badges.`);
      fetchStatsAndUsers();
    } catch (err) {
      console.error('Failed to cleanup:', err);
      setMessage('Error running cleanup. Check console for details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear ALL storage - both localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force hard redirect to login page (bypasses React state issues)
    window.location.replace('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/5 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Logout */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, review statistics, and maintain platform health</p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Exit Dashboard
          </Button>
        </div>

        {/* Maintenance Mode Banner */}
        {maintenanceMode && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-500">⚠️ System is in MAINTENANCE MODE - Non-admins cannot log in</p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-500">{message}</p>
          </div>
        )}

        {/* Maintenance Toggle */}
        <Card className="mb-6 p-6 bg-gradient-to-r from-orange-500/10 to-transparent border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold">System Maintenance</h3>
                <p className="text-sm text-muted-foreground">When enabled, only admins can access the platform</p>
              </div>
            </div>
            <Button
              className={maintenanceMode ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              onClick={handleToggleMaintenance}
              disabled={actionLoading}
            >
              {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
            </Button>
          </div>
        </Card>

        {/* Data Cleanup Section */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-semibold">Data Cleanup</h3>
                <p className="text-sm text-muted-foreground">Remove incorrectly assigned badges from promoted users</p>
              </div>
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCleanupPromotedUsers}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cleaning...' : 'Clean Up Badges'}
            </Button>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Colleges</p>
                <p className="text-3xl font-bold">{stats.collegeCount}</p>
              </div>
              <Building2 className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Reports</p>
                <p className="text-3xl font-bold">{stats.activeReports}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Replies</p>
                <p className="text-3xl font-bold">{stats.totalReplies}</p>
              </div>
              <MessageSquare className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${activeTab === 'badges' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Badge Analytics
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="overflow-hidden">
            {/* Search Bar */}
            <div className="p-6 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or college..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      <button
                        onClick={() => handleSort('fullName')}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        Name
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      <button
                        onClick={() => handleSort('email')}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        Email
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      <button
                        onClick={() => handleSort('collegeName')}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        College
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm">{u.fullName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-mono text-xs">{u.email}</td>
                        <td className="px-6 py-4 text-sm">{u.collegeName || 'Unknown'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'COLLEGE_HEAD' 
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {u.role || 'STUDENT'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            {u.role !== 'COLLEGE_HEAD' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-purple-500 border-purple-500/30 hover:bg-purple-500/10"
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowPromoteConfirm(true);
                                }}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                Promote
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowBanConfirm(true);
                              }}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Ban
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteConfirm(true);
                                setDeleteConfirmStep(0);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Info */}
            <div className="px-6 py-4 border-t border-border text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </Card>
        )}

        {/* Badge Analytics Tab */}
        {activeTab === 'badges' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Badge Distribution</h3>
            {Object.keys(badgeStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(badgeStats).map(([badge, count]) => (
                  <div key={badge} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{badge}</span>
                        <span className="text-sm text-muted-foreground">{count} users</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary to-purple-600 h-2 rounded-full"
                          style={{ width: `${Math.min((count / Math.max(...Object.values(badgeStats))) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No badges earned yet</p>
            )}
          </Card>
        )}
      </div>

      {/* Promote Confirmation Modal */}
      {showPromoteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Promote to College Head</h3>
            <p className="text-muted-foreground mb-6">
              Promote <strong>{selectedUser.email}</strong> to College Head?
              They will receive the Campus Catalyst badge.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPromoteConfirm(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handlePromoteUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Promoting...' : 'Promote'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Ban User</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to ban <strong>{selectedUser.email}</strong>?
              They will receive a Spam Alert badge.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanConfirm(false);
                  setSelectedUser(null);
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleBanUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Banning...' : 'Ban User'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            {deleteConfirmStep === 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-4 text-red-500">Delete User</h3>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete <strong>{selectedUser.email}</strong>?
                  This action cannot be undone. All their posts will be anonymized.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmStep(0);
                      setSelectedUser(null);
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => setDeleteConfirmStep(1)}
                    disabled={actionLoading}
                  >
                    Yes, Delete
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4 text-red-500">Confirm Deletion</h3>
                <p className="text-muted-foreground mb-6">
                  This is the final confirmation. Type <strong>DELETE</strong> to permanently remove this user.
                </p>
                <Input
                  placeholder="Type DELETE to confirm"
                  id="delete-confirm"
                  className="mb-6"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmStep(0);
                      setSelectedUser(null);
                    }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      const input = document.getElementById('delete-confirm').value;
                      if (input === 'DELETE') {
                        handleDeleteUser();
                      } else {
                        alert('Please type DELETE to confirm');
                      }
                    }}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
