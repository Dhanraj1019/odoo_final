import React, { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Inbox,
  Loader2,
} from "lucide-react";

/**
 * Reusable, High-Performance DataTable Component
 * Features:
 * - Client-side pagination with custom page sizes
 * - Multi-column sorting (asc, desc, default)
 * - Search filter
 * - Custom cell renderers
 * - Loading and empty states
 * - Row click handler
 */
export default function DataTable({
  columns = [],
  data = [],
  keyField = "_id",
  searchPlaceholder = "Search records...",
  searchable = true,
  searchKeys = [], // array of key strings to search on; defaults to all text columns
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  isLoading = false,
  emptyMessage = "No records found",
  emptySubMessage = "Try adjusting your search or filters.",
  onRowClick = null,
  rowClassName = null,
  toolbarSlot = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // 1. Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = row[key];
          if (val == null) return false;
          if (typeof val === "object") {
            return Object.values(val).some(
              (sub) => sub && String(sub).toLowerCase().includes(query)
            );
          }
          return String(val).toLowerCase().includes(query);
        });
      }

      // Default: inspect all column keys
      return columns.some((col) => {
        const val = col.accessor ? col.accessor(row) : row[col.key];
        if (val == null) return false;
        return String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchKeys, columns]);

  // 2. Sort filtered data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    const col = columns.find((c) => c.key === sortConfig.key);
    return [...filteredData].sort((a, b) => {
      let aVal = col?.accessor ? col.accessor(a) : a[sortConfig.key];
      let bVal = col?.accessor ? col.accessor(b) : b[sortConfig.key];

      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      if (typeof aVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(String(bVal))
          : String(bVal).localeCompare(aVal);
      }

      if (sortConfig.direction === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }, [filteredData, sortConfig, columns]);

  // 3. Paginate sorted data
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if query reduces page count
  const validPage = Math.min(currentPage, totalPages);
  if (validPage !== currentPage && totalPages > 0) {
    setCurrentPage(validPage);
  }

  const paginatedData = useMemo(() => {
    const startIndex = (validPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, validPage, pageSize]);

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const startIndex = totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalItems);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Toolbar */}
      {(searchable || toolbarSlot) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {toolbarSlot && <div className="flex items-center gap-2">{toolbarSlot}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[300px] flex flex-col justify-between">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {columns.map((col) => {
                const isSorted = sortConfig.key === col.key;
                const isSortable = col.sortable !== false;

                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, isSortable)}
                    className={`px-4 py-3.5 text-xs font-semibold text-slate-600 tracking-wider uppercase ${
                      isSortable
                        ? "cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                        : ""
                    } ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${
                      col.width ? col.width : ""
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""
                      }`}
                    >
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-indigo-600 stroke-[2.5]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-600">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-base font-semibold text-slate-800">{emptyMessage}</p>
                    <p className="text-xs text-slate-400">{emptySubMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => {
                const rowKey = row[keyField] || idx;
                const isClickable = typeof onRowClick === "function";
                const customClass = typeof rowClassName === "function" ? rowClassName(row) : "";

                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`transition-colors duration-150 ${
                      isClickable
                        ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60"
                        : "hover:bg-slate-50/40"
                    } ${customClass}`}
                  >
                    {columns.map((col) => {
                      const cellValue = col.accessor ? col.accessor(row) : row[col.key];

                      return (
                        <td
                          key={`${rowKey}-${col.key}`}
                          className={`px-4 py-3.5 text-slate-700 ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left"
                          }`}
                        >
                          {col.render ? col.render(cellValue, row) : cellValue ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && totalItems > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <p>
              Showing <span className="font-semibold text-slate-700">{startIndex}</span> to{" "}
              <span className="font-semibold text-slate-700">{endIndex}</span> of{" "}
              <span className="font-semibold text-slate-700">{totalItems}</span> entries
            </p>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show current page, edges, and +/- 1 neighbor
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - validPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                          p === validPage
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
