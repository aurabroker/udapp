import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase.js';
import { getSettings } from '$lib/server/settings.js';

const PUBLIC_BUCKET = 'ud-public';

const TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  gif: 'image/gif'
};

/**
 * Logo serwowane z naszej domeny.
 * Gmail i Resend traktują obrazy spoza domeny nadawcy jako podejrzane
 * („Image URLs that don't align with your sending domain…”), więc e-maile
 * nie mogą linkować wprost do publicznego adresu Supabase Storage.
 */
export async function GET() {
  const settings = await getSettings();
  const path = settings.logo_path;
  if (!path) throw error(404, 'Brak logo.');

  const sb = createAdminClient();
  const { data, error: dlErr } = await sb.storage.from(PUBLIC_BUCKET).download(path);
  if (dlErr || !data) throw error(502, 'Nie udało się pobrać logo.');

  const ext = (path.split('.').pop() || '').toLowerCase();
  return new Response(data.stream(), {
    headers: {
      'Content-Type': TYPES[ext] || data.type || 'image/png',
      // Klient pocztowy pobiera obraz przy każdym otwarciu wiadomości.
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
