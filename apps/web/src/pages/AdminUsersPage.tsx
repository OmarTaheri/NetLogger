import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { HudBadge, HudButton, HudInput, HudPageTitle, HudPanel } from '../components/ui/HudComponents';
import { getAdminUsers, type AdminUser } from '../api/admin';

const column = createColumnHelper<AdminUser>();

function displayDate(value: string | null) {
  if (!value) return '—';
  return new Date(`${value}Z`).toLocaleString();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setError('');
      setUsers(await getAdminUsers());
    } catch (err: any) {
      setError(err.message || 'Could not load users');
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) => [user.displayName, user.email, user.username, user.role]
      .filter(Boolean).some((value) => value!.toLowerCase().includes(term)));
  }, [search, users]);

  const columns = useMemo(() => [
    column.accessor('displayName', {
      header: 'Account',
      cell: ({ row, getValue }) => (
        <div>
          <p className="font-mono text-sm text-hud-text">{getValue()}</p>
          <p className="font-mono text-hud-xs text-hud-text-muted">{row.original.email || row.original.username || 'No email address'}</p>
        </div>
      ),
    }),
    column.accessor('role', {
      header: 'Role',
      cell: ({ getValue }) => <HudBadge variant={getValue() === 'admin' ? 'warning' : 'info'}>{getValue()}</HudBadge>,
    }),
    column.accessor('providers', {
      header: 'Sign-in',
      enableSorting: false,
      cell: ({ getValue }) => <span className="font-mono text-hud-xs uppercase text-hud-text-dim">{getValue().join(' + ') || 'none'}</span>,
    }),
    column.accessor('linkCount', {
      header: 'Links',
      cell: ({ getValue }) => <span className="font-mono text-sm text-hud-accent">{getValue()}</span>,
    }),
    column.accessor('visitorCount', {
      header: 'Visits',
      cell: ({ getValue }) => <span className="font-mono text-sm text-hud-text">{getValue()}</span>,
    }),
    column.accessor('lastActivityAt', {
      header: 'Last activity',
      cell: ({ getValue }) => <span className="whitespace-nowrap font-mono text-hud-xs text-hud-text-muted">{displayDate(getValue())}</span>,
    }),
    column.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => <span className="whitespace-nowrap font-mono text-hud-xs text-hud-text-muted">{displayDate(getValue())}</span>,
    }),
  ], []);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <HudPageTitle subtitle="Account activity and usage // Read-only" animate>Users</HudPageTitle>
      <HudPanel corners className="p-4 md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-hud-xs uppercase tracking-widest text-hud-text-muted">{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'}</p>
          <HudInput aria-label="Search users" value={search} onChange={(event) => { setSearch(event.target.value); table.setPageIndex(0); }} placeholder="Search name, email, or role" className="sm:max-w-xs" />
        </div>
        {error ? <p className="font-mono text-hud-sm text-hud-red">{error}</p> : (
          <>
            <div className="overflow-x-auto border border-hud-border">
              <table className="w-full min-w-[860px] text-left">
                <thead className="bg-hud-bg">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="border-b border-hud-border px-3 py-3 font-mono text-hud-xs uppercase tracking-wider text-hud-text-muted">
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              disabled={!header.column.getCanSort()}
                              className="flex items-center gap-1 text-left disabled:cursor-default"
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{ asc: '↑', desc: '↓' }[header.column.getIsSorted() as string] ?? (header.column.getCanSort() ? '↕' : '')}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-hud-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-hud-accent/5">
                      {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-3 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                    </tr>
                  ))}
                  {!table.getRowModel().rows.length && <tr><td colSpan={columns.length} className="px-3 py-10 text-center font-mono text-hud-sm text-hud-text-muted">No accounts match your search.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 font-mono text-hud-xs text-hud-text-muted">
              <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}</span>
              <div className="flex gap-2">
                <HudButton variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</HudButton>
                <HudButton variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</HudButton>
              </div>
            </div>
          </>
        )}
      </HudPanel>
    </div>
  );
}
