import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileClock, 
  Search, 
  Filter, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock, 
  Shield, 
  Calendar,
  Layers,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  ChevronDown
} from 'lucide-react';
import { useDMS } from '../../context/DMSContext';

export const AuditLogs = () => {
  const { logs, projects = [], files = [], currentUser, setCurrentUserId, canViewLogs, addToast, loadBackendAuditLogs } = useDMS();

  const [logSearch, setLogSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Helper to format details and replace any raw project IDs with Project Names
  const formatLogDetails = (text) => {
    if (!text || typeof text !== 'string') return text || '—';
    let formatted = text;
    projects.forEach((p) => {
      if (p.id && p.name && formatted.includes(p.id)) {
        formatted = formatted.replaceAll(p.id, p.name);
      }
      if (p._id && p.name && formatted.includes(p._id)) {
        formatted = formatted.replaceAll(p._id, p.name);
      }
    });
    return formatted;
  };

  useEffect(() => {
    if (loadBackendAuditLogs) {
      loadBackendAuditLogs(1, 100);
    }
  }, [loadBackendAuditLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [logSearch, selectedProjectFilter]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (loadBackendAuditLogs) {
      const pId = selectedProjectFilter !== 'all' ? selectedProjectFilter : null;
      await loadBackendAuditLogs(1, 100, pId);
    }
    setTimeout(() => setIsRefreshing(false), 500);
    addToast('Audit logs refreshed from backend!', 'info');
  };

  const filteredLogs = useMemo(() => {
    const selectedProjObj = selectedProjectFilter !== 'all'
      ? projects.find((p) => p.id === selectedProjectFilter)
      : null;

    return logs.filter((log) => {
      // Exclude local failed login attempts
      if (log.action === 'LOGIN_FAILED' || log.actionLabel === 'Failed Login Attempt') {
        return false;
      }

      // 1. Filter by Project
      if (selectedProjectFilter !== 'all' && selectedProjObj) {
        const pId = selectedProjectFilter;
        const pNameLower = selectedProjObj.name.toLowerCase();

        const matchesId = log.projectId === pId;
        const matchesName = log.projectName && log.projectName.toLowerCase() === pNameLower;
        const matchesInDetails = log.details && (
          log.details.toLowerCase().includes(pNameLower) ||
          log.details.includes(pId)
        );
        const matchesInTarget = log.target && (
          log.target.toLowerCase() === pNameLower ||
          log.target.includes(pId)
        );
        const matchesProjectFile = files.some(
          (f) => (f.projectId === pId || f.folder === pId) && (f.name === log.target || log.details?.includes(f.name))
        );

        if (!matchesId && !matchesName && !matchesInDetails && !matchesInTarget && !matchesProjectFile) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (logSearch) {
        const q = logSearch.toLowerCase();
        const formattedDet = formatLogDetails(log.details);
        const match =
          (log.userName && log.userName.toLowerCase().includes(q)) ||
          (log.actionLabel && log.actionLabel.toLowerCase().includes(q)) ||
          (log.target && log.target.toLowerCase().includes(q)) ||
          (log.details && log.details.toLowerCase().includes(q)) ||
          (formattedDet && formattedDet.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, logSearch, selectedProjectFilter, projects, files]);

  const totalEntries = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  if (!canViewLogs) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-[#0A2540] mb-2">
          Audit Trail Restricted
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          You are currently viewing as <strong className="text-slate-800">{currentUser.name}</strong>. The security audit log is restricted to Administrator roles to prevent unauthorized data monitoring.
        </p>
        <button
          onClick={() => {
            setCurrentUserId('u-admin');
            addToast('Switched to Administrator account to view Audit Logs.', 'info');
          }}
          className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#07192C] text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          Switch to Administrator Account
        </button>
      </div>
    );
  }

  const getActionBadge = (action) => {
    switch (action) {
      case 'FILE_UPLOAD':
      case 'UPLOAD_FILE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FILE_DELETE':
      case 'DELETE_FILE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'FILE_RENAME':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'FILE_DOWNLOAD':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PERMISSION_UPDATE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'USER_INVITE':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'USER_REGISTER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'USER_CREATE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'USER_DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'UNAUTHORIZED_ATTEMPT':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).trim();
    return `"${str.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Event Type', 'Target Entity', 'Details'];

    const rows = filteredLogs.map((l) => {
      const dateObj = new Date(l.timestamp);
      const isValidDate = !isNaN(dateObj.getTime());
      const timeFormatted = isValidDate
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';
      const dateFormatted = isValidDate
        ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      const formattedTimestamp = dateFormatted && timeFormatted ? `${dateFormatted}, ${timeFormatted}` : l.timestamp;

      return [
        formattedTimestamp,
        l.userName,
        l.actionLabel,
        l.target,
        formatLogDetails(l.details),
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kaspertech_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    addToast('Audit log exported to CSV successfully!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#0A2540] flex items-center gap-2">
            <FileClock className="w-5 h-5 text-[#00A3E0]" />
            <span>Activity Trail & Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable compliance record tracking all user document uploads, edits, deletes, permission updates, and login attempts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#00A3E0] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-[#00A3E0]" />
            <span>Export Logs (CSV)</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, document name, or details..."
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30"
          />
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <div className="relative w-full md:w-64">
            <FolderKanban className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00A3E0] pointer-events-none" />
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30 cursor-pointer appearance-none"
            >
              <option value="all">All Projects (All Logs)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {selectedProjectFilter !== 'all' && (
            <button
              onClick={() => setSelectedProjectFilter('all')}
              className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 border border-slate-200"
              title="Show all projects"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[#0A2540]">
              Audit Trail Entries
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-[#0284C7] font-bold">
              {filteredLogs.length} events
            </span>
            {selectedProjectFilter !== 'all' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A2540] text-white font-semibold">
                Project: {projects.find((p) => p.id === selectedProjectFilter)?.name || 'Filtered'}
              </span>
            )}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No matching log entries</h4>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 pl-6 pr-3">Timestamp</th>
                  <th className="py-3.5 px-3">User</th>
                  <th className="py-3.5 px-3">Event Type</th>
                  <th className="py-3.5 px-3">Target Entity</th>
                  <th className="py-3.5 pr-6 pl-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const timeFormatted = dateObj.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const dateFormatted = dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-sky-50/30 transition-colors">
                      <td className="py-3.5 pl-6 pr-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{timeFormatted}</div>
                        <div className="text-[10px] text-slate-400">{dateFormatted}</div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#0A2540]">{log.userName}</div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                          {log.actionLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-800 max-w-xs truncate">
                        {log.target}
                      </td>

                      <td className="py-3.5 pr-6 pl-3 text-slate-500 max-w-md">
                        {formatLogDetails(log.details)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalEntries > 0 && (
          <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Showing</span>
              <span className="font-bold text-slate-800">
                {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </span>
              <span>to</span>
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * pageSize, totalEntries)}
              </span>
              <span>of</span>
              <span className="font-bold text-[#0A2540]">{totalEntries}</span>
              <span>entries</span>

              <div className="ml-3 flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#00A3E0]/30"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPage <= 1
                    ? 'text-slate-300 bg-slate-100/50 cursor-not-allowed'
                    : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((num) => {
                  return num === 1 || num === totalPages || Math.abs(num - currentPage) <= 1;
                })
                .map((num, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && num - prev > 1;

                  return (
                    <React.Fragment key={num}>
                      {showEllipsis && (
                        <span className="px-1 text-xs text-slate-400 select-none">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(num)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === num
                            ? 'bg-[#00A3E0] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentPage >= totalPages
                    ? 'text-slate-300 bg-slate-100/50 cursor-not-allowed'
                    : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs cursor-pointer'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
