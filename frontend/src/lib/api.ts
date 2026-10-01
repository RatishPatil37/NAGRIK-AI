/**
 * API client and Server-Sent Events (SSE) streaming connector.
 */

import { fetchEventSource } from '@microsoft/fetch-event-source';
import type {
  CitationItem,
  ClarificationPayload,
  EmergencyPayload,
  EscalationTicket,
  MunicipalWard,
  SLAStatusData,
  WardHeatmapStat,
} from '../types';

export interface StreamCallbacks {
  onStatus?: (status: string) => void;
  onToken?: (token: string, model: string) => void;
  onCitations?: (citations: CitationItem[]) => void;
  onSOS?: (sos: EmergencyPayload) => void;
  onClarification?: (clarification: ClarificationPayload) => void;
  onEscalation?: (escalation: EscalationTicket) => void;
  onError?: (error: any) => void;
  onDone?: () => void;
}

export async function streamChatQuery(
  query: string,
  wardId: number | null,
  languageCode: string,
  callbacks: StreamCallbacks,
  abortController: AbortController
) {
  try {
    await fetchEventSource('/api/v1/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ward_id: wardId,
        language_code: languageCode,
      }),
      signal: abortController.signal,
      async onopen(response) {
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }
      },
      onmessage(event) {
        if (!event.data) return;

        if (event.event === 'status') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onStatus?.(data.status);
          } catch (e) {}
        } else if (event.event === 'token') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onToken?.(data.token, data.model);
          } catch (e) {}
        } else if (event.event === 'citations') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onCitations?.(data.citations || []);
          } catch (e) {}
        } else if (event.event === 'sos') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onSOS?.(data);
          } catch (e) {}
        } else if (event.event === 'clarification') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onClarification?.(data);
          } catch (e) {}
        } else if (event.event === 'escalation') {
          try {
            const data = JSON.parse(event.data);
            callbacks.onEscalation?.(data);
          } catch (e) {}
        } else if (event.event === 'done') {
          callbacks.onDone?.();
        }
      },
      onerror(err) {
        callbacks.onError?.(err);
        throw err;
      },
      onclose() {
        callbacks.onDone?.();
      },
    });
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      callbacks.onError?.(err);
    }
  }
}

// REST Endpoints
export async function fetchWards(): Promise<MunicipalWard[]> {
  const res = await fetch('/api/v1/wards/');
  if (!res.ok) throw new Error('Failed to fetch wards');
  return res.json();
}

export async function fetchWardHeatmap(): Promise<{ city_total_grievances: number; wards: WardHeatmapStat[] }> {
  const res = await fetch('/api/v1/admin/heatmap');
  if (!res.ok) throw new Error('Failed to fetch admin heatmap');
  return res.json();
}

export async function fetchSLAStatus(): Promise<SLAStatusData> {
  const res = await fetch('/api/v1/admin/sla-status');
  if (!res.ok) throw new Error('Failed to fetch SLA analytics');
  return res.json();
}

export async function fetchAdminFAQs(): Promise<any> {
  const res = await fetch('/api/v1/admin/faqs');
  if (!res.ok) throw new Error('Failed to fetch FAQ analytics');
  return res.json();
}
