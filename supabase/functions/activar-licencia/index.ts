// Supabase Edge Function: activar-licencia
// Valida la licencia con la service_role (nunca expuesta al escritorio), vincula el equipo
// y devuelve un token firmado con ECDSA P-256 que el escritorio verifica con la llave pública.
// Además registra cada intento en licencia_eventos y la última conexión en licencias.
//
// Secretos requeridos (Dashboard → Edge Functions → Secrets, o `supabase secrets set`):
//   LICENSE_PRIVATE_KEY      -> PKCS8 en Base64 (archivo LICENSE_PRIVATE_KEY.txt)
//   LICENSE_OFFLINE_DAYS     -> (opcional) días máximos sin conexión, por defecto 30
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Despliegue:  supabase functions deploy activar-licencia --no-verify-jwt
// (o desde el Dashboard con "Verify JWT" desactivado)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const OFFLINE_DAYS = Number(Deno.env.get("LICENSE_OFFLINE_DAYS") ?? "30");
let llavePrivada: CryptoKey | null = null;

async function obtenerLlave(): Promise<CryptoKey> {
  if (llavePrivada) return llavePrivada;
  const der = Uint8Array.from(atob(Deno.env.get("LICENSE_PRIVATE_KEY")!), (c) => c.charCodeAt(0));
  llavePrivada = await crypto.subtle.importKey(
    "pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  return llavePrivada;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function firmar(payload: Record<string, unknown>): Promise<string> {
  const datos = new TextEncoder().encode(JSON.stringify(payload));
  const firma = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, await obtenerLlave(), datos),
  );
  return `${b64url(datos)}.${b64url(firma)}`;
}

function responder(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const recortar = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder({ status: "METODO_NO_PERMITIDO" }, 405);

  let entrada: Record<string, unknown>;
  try { entrada = await req.json(); } catch { return responder({ status: "PETICION_INVALIDA" }, 400); }

  const clave = recortar(entrada.clave, 100);
  const hwid = recortar(entrada.hwid, 64);
  const hwidLegacy = recortar(entrada.hwid_legacy, 64);
  const equipo = recortar(entrada.equipo, 100);
  const version = recortar(entrada.version, 30);
  if (!clave || !/^HW2-[0-9A-F]{24}$/.test(hwid)) {
    return responder({ status: "PETICION_INVALIDA" }, 400);
  }

  const { data: lic, error } = await supabase
    .from("licencias")
    .select("id, clave_licencia, esta_activa, fecha_emision, fecha_expiracion, hardware_id, cliente_id, plan_id")
    .eq("clave_licencia", clave)
    .maybeSingle();

  if (error) return responder({ status: "ERROR_CONEXION_NUBE" }, 500);
  if (!lic) return responder({ status: "LICENCIA_INEXISTENTE" });

  // Bitácora de intentos (no bloquea la respuesta si falla)
  const registrar = (resultado: string) =>
    supabase.from("licencia_eventos").insert({
      licencia_id: lic.id, clave, hardware_id: hwid, equipo, version_app: version, resultado,
    }).then(() => {}, () => {});

  if (!lic.esta_activa) { await registrar("LICENCIA_BLOQUEADA"); return responder({ status: "LICENCIA_BLOQUEADA" }); }

  const ahora = new Date();
  const expiracion = new Date(lic.fecha_expiracion);
  if (isNaN(expiracion.getTime()) || ahora > expiracion) {
    await registrar("LICENCIA_VENCIDA");
    return responder({ status: "LICENCIA_VENCIDA" });
  }

  // Vinculación de equipo (con migración desde el HWID viejo basado en MAC)
  const vincular = !lic.hardware_id || (hwidLegacy !== "" && lic.hardware_id === hwidLegacy);
  if (!vincular && lic.hardware_id !== hwid) {
    await registrar("HARDWARE_DISTINTO");
    return responder({ status: "HARDWARE_DISTINTO" });
  }

  const cambios: Record<string, unknown> = {
    ultima_validacion: ahora.toISOString(),
    version_app: version || null,
    equipo_nombre: equipo || null,
  };
  if (vincular) cambios.hardware_id = hwid;
  const { error: errUpd } = await supabase.from("licencias").update(cambios).eq("id", lic.id);
  if (errUpd) return responder({ status: "ERROR_CONEXION_NUBE" }, 500);

  let cliente = "";
  if (lic.cliente_id != null) {
    const { data } = await supabase.from("clientes").select("nombre_empresa").eq("id", lic.cliente_id).maybeSingle();
    cliente = data?.nombre_empresa ?? "";
  }
  let plan = "";
  if (lic.plan_id != null) {
    const { data } = await supabase.from("planes").select("nombre").eq("id", lic.plan_id).maybeSingle();
    plan = data?.nombre ?? "";
  }

  const token = await firmar({
    v: 2,
    lic: clave,
    hwid,
    iat: Math.floor(ahora.getTime() / 1000),        // hora del servidor (piso anti-retroceso de reloj)
    exp: Math.floor(expiracion.getTime() / 1000),
    off: OFFLINE_DAYS,
    cli: cliente,
    plan,
  });

  await registrar(vincular ? "ACTIVACION" : "VALIDACION");

  const emision = lic.fecha_emision ? new Date(lic.fecha_emision) : null;
  return responder({
    status: "EXITO",
    token,
    inicio: emision && !isNaN(emision.getTime()) ? emision.toLocaleDateString("es-MX") : "",
  });
});
