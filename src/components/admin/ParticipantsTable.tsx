'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { adminUpdateRegistrationStatus, adminBulkUpdateRegistrationStatus } from '@/server/participants';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/forms';

export function ParticipantsTable({ registrations, lang }: { registrations: any[], lang: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ succeeded: string[], failed: { id: string, reason: string }[] } | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === registrations.length && registrations.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(registrations.map(r => r.id)));
    }
  };

  const handleAction = async (id: string, status: any) => {
    setPending(true);
    setBulkResult(null);
    try {
      const res = await adminUpdateRegistrationStatus(id, status);
      if (!res.ok) alert(res.message);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const handleBulkAction = async (status: any) => {
    if (selected.size === 0) return;
    setPending(true);
    setBulkResult(null);
    try {
      const ids = Array.from(selected);
      const res = await adminBulkUpdateRegistrationStatus(ids, status);
      setBulkResult(res);
      setSelected(new Set());
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4">
      {bulkResult && (
        <div className={`p-4 rounded-lg border ${bulkResult.failed.length === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-danger/10 border-danger/20 text-danger'}`}>
          <p className="font-medium">Bulk action completed: {bulkResult.succeeded.length} succeeded, {bulkResult.failed.length} failed.</p>
          {bulkResult.failed.length > 0 && (
            <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
              {bulkResult.failed.map((f, i) => <li key={i}>{f.reason} (ID: {f.id.split('-')[0]})</li>)}
            </ul>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="bg-surface-alt border border-border p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('confirmed')} disabled={pending}>Approve</Button>
            <Button size="sm" variant="secondary" onClick={() => handleBulkAction('checked_in')} disabled={pending}>Check In</Button>
            <Button size="sm" variant="danger" onClick={() => handleBulkAction('rejected')} disabled={pending}>Reject</Button>
            <Button size="sm" variant="danger" onClick={() => handleBulkAction('cancelled')} disabled={pending}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-alt text-text-muted">
            <tr>
              <th className="p-3 w-10">
                <button onClick={toggleAll} className="p-1 hover:text-text">
                  {registrations.length > 0 && selected.size === registrations.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="p-3 font-medium">Ticket</th>
              <th className="p-3 font-medium">Name (Leader)</th>
              <th className="p-3 font-medium">Contact</th>
              <th className="p-3 font-medium">Event</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Registered</th>
              <th className="p-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {registrations.map(reg => {
              const leader = reg.members.find((m: any) => m.isLeader) || reg.members[0];
              const isExpanded = expanded.has(reg.id);
              const isSelected = selected.has(reg.id);
              
              return (
                <React.Fragment key={reg.id}>
                  <tr className={`hover:bg-surface-alt/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                    <td className="p-3">
                      <button onClick={() => toggleSelect(reg.id)} className="p-1 text-text-muted hover:text-text">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-xs">{reg.ticketCode}</td>
                    <td className="p-3">
                      <div className="font-medium flex items-center gap-2">
                        <button onClick={() => toggleExpand(reg.id)} className="p-1 hover:bg-surface-alt rounded">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        {leader?.fullName}
                        {reg.teamName && <span className="text-xs px-2 py-0.5 bg-surface-alt rounded-full">{reg.teamName}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-text-muted">
                      <div>{leader?.email}</div>
                      <div>{leader?.phone}</div>
                    </td>
                    <td className="p-3 truncate max-w-[150px]">{reg.event.title}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`capitalize ${
                        reg.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        reg.status === 'checked_in' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' :
                        reg.status === 'waitlisted' ? 'bg-gold-500/10 text-gold-500 border-gold-500/20' : ''
                      }`}>{reg.status}</Badge>
                    </td>
                    <td className="p-3 text-xs text-text-muted">{formatDateTime(new Date(reg.queuedAt), lang)}</td>
                    <td className="p-3 text-right space-x-2">
                      <div className="flex gap-2 justify-end">
                        <Select 
                          className="h-8 text-xs py-0 w-[120px]" 
                          value={reg.status} 
                          onChange={(e: any) => handleAction(reg.id, e.target.value)}
                          disabled={pending}
                        >
                          <option value="waitlisted">Waitlist</option>
                          <option value="confirmed">Approve</option>
                          <option value="checked_in">Check In</option>
                          <option value="rejected">Reject</option>
                          <option value="cancelled">Cancel</option>
                        </Select>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-surface-alt/20">
                      <td colSpan={8} className="p-4">
                        <div className="grid grid-cols-2 gap-6 text-sm">
                          <div>
                            <h4 className="font-semibold mb-2">Members ({reg.members.length})</h4>
                            <ul className="space-y-2">
                              {reg.members.map((m: any) => (
                                <li key={m.id} className="p-2 bg-surface rounded border border-border">
                                  <div className="font-medium">{m.fullName} {m.isLeader && <Badge variant="outline" className="ml-1 text-[10px]">Leader</Badge>}</div>
                                  <div className="text-xs text-text-muted">{m.email} • {m.phone} • Class: {m.classLevel}</div>
                                </li>
                              ))}
                            </ul>
                            {reg.notes && (
                              <div className="mt-4">
                                <h4 className="font-semibold mb-1">Notes</h4>
                                <p className="text-text-muted p-2 bg-surface rounded border border-border">{reg.notes}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Audit History</h4>
                            <ul className="space-y-2 text-xs text-text-muted max-h-48 overflow-y-auto">
                              {reg.auditLogs.map((log: any) => (
                                <li key={log.id} className="flex gap-2">
                                  <span className="whitespace-nowrap">{formatDateTime(new Date(log.createdAt), lang)}</span>
                                  <span className="font-medium text-text">{log.actor?.fullName || 'System'}</span>
                                  <span>{log.action}</span>
                                  <span>{JSON.stringify(log.meta)}</span>
                                </li>
                              ))}
                              {reg.auditLogs.length === 0 && <li>No audit history.</li>}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {registrations.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-text-muted">No participants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
