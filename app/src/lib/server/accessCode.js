/**
 * accessCode.js — skąd Klient zna kod dostępu do oferty.
 *
 * Kod dostępu (access_code) jest jednocześnie hasłem do zaszyfrowanych PDF-ów
 * od ubezpieczyciela, a te są zabezpieczane 4 ostatnimi cyframi PESEL
 * Ubezpieczonego. Gdy tak jest, nie ma po co wysyłać kodu w SMS-ie ani mailu —
 * Klient go zna, a wiadomość przestaje nosić hasło do własnych dokumentów.
 *
 * Gdy kod jest inny (losowy PIN albo oferta bez powiązanego Klienta), wracamy
 * do dotychczasowego zachowania: kod jedzie SMS-em.
 */

/**
 * 4 ostatnie cyfry numeru PESEL albo null, gdy numeru nie ma.
 * @param {string|null|undefined} pesel
 * @returns {string|null}
 */
export function last4Pesel(pesel) {
  const digits = String(pesel || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb klient service_role
 * @param {{ client_id?: string|null, access_code?: string|null }} offer
 * @returns {Promise<'pesel'|'code'>}
 */
export async function accessCodeSource(sb, offer) {
  const code = String(offer?.access_code || '').trim();
  if (!code || !offer?.client_id) return 'code';

  const { data: client } = await sb
    .from('ud_clients')
    .select('pesel')
    .eq('id', offer.client_id)
    .maybeSingle();

  return last4Pesel(client?.pesel) === code ? 'pesel' : 'code';
}
