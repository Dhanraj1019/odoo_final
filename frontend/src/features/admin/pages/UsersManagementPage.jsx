import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ShieldCheck,
  Plus,
  Filter,
  RefreshCw,
  Users,
  UserCheck,
  UserX,
  Link as LinkIcon,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import UserListTable from "../components/UserListTable";
import UserFormModal from "../components/UserFormModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import usersApi from "../../../api/users";
import { addNotification } from "../../notifications/notificationSlice";
import { ROLES } from "../../../lib/constants";

export default function UsersManagementPage() {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await usersApi.listUsers({
        role: selectedRole,
        status: selectedStatus,
        search: searchTerm,
      });

      if (res.ok && (res.data?.users || res.users)) {
        setUsers(res.data?.users || res.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedStatus, searchTerm]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Actions
  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleOpenResetPassword = (user) => {
    setTargetPasswordUser(user);
    setIsResetPasswordOpen(true);
  };

  const handleDeactivate = async (user) => {
    const isSelf = currentUser && (user._id === currentUser._id || user._id === currentUser.id);
    if (isSelf) {
      dispatch(
        addNotification({
          type: "error",
          message: "You cannot deactivate your own administrative account.",
        })
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to deactivate access for "${user.fullName}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await usersApi.deleteUser(user._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `User account "${user.fullName}" deactivated successfully.`,
          })
        );
        loadUsers();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to deactivate user account.",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  const handleReactivate = async (user) => {
    try {
      const res = await usersApi.reactivateUser(user._id);
      if (res.ok) {
        dispatch(
          addNotification({
            type: "success",
            message: `User account "${user.fullName}" reactivated successfully.`,
          })
        );
        loadUsers();
      } else {
        dispatch(
          addNotification({
            type: "error",
            message: res.message || "Failed to reactivate user account.",
          })
        );
      }
    } catch (err) {
      dispatch(addNotification({ type: "error", message: err.message }));
    }
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;
    const linked = users.filter((u) => Boolean(u.employee)).length;

    return { total, active, inactive, linked };
  }, [users]);

  return (
    <PageContainer
      title="User & Access Administration"
      description="Manage system access accounts, canonical roles, credentials, and employee record linkages"
      breadcrumbs={[{ label: "Admin", path: "/admin/users" }, { label: "User Management" }]}
      actions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadUsers}
            title="Refresh user directory"
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision User</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Logins</p>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">{metrics.active}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disabled Logins</p>
              <p className="text-2xl font-black text-rose-700 tracking-tight">{metrics.inactive}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked to Staff</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{metrics.linked}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <LinkIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Role Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
              >
                <option value="">All Roles</option>
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-600">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 p-0 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Accounts Table */}
        <UserListTable
          users={users}
          isLoading={isLoading}
          currentUser={currentUser}
          onEdit={handleOpenEdit}
          onResetPassword={handleOpenResetPassword}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
        />

        {/* Modals */}
        <UserFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          initialData={editingUser}
          onSuccess={loadUsers}
        />

        <ResetPasswordModal
          isOpen={isResetPasswordOpen}
          onClose={() => {
            setIsResetPasswordOpen(false);
            setTargetPasswordUser(null);
          }}
          user={targetPasswordUser}
          onSuccess={loadUsers}
        />
      </div>
    </PageContainer>
  );
}
