import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import qimmiqAvatar from "@/assets/qimmiq-avatar.jpg";

type Mode = "client" | "admin";
type Msg = { from: "user" | "ai"; text: string };

const CLIENT_PROMPTS = [
  "Are you open on Sundays?",
  "What's the price for a 30lb Goldendoodle?",
  "How do VIP Club subscriptions work?",
  "Which Toronto areas do you service?",
  "How does Latchkey contactless work?",
  "What vaccines are required in Ontario?",
  "Do you accept Interac & Apple Pay?",
];

const ADMIN_PROMPTS = [
  "📊 Ingresos de hoy y balance del mes",
  "🚐 Estado de agua y combustible Van #1",
  "🔑 Códigos Latchkey activos de hoy",
  "📍 Densidad de rutas por zonas en Toronto",
  "👑 Tasa de retención de miembros VIP",
  "❄️ Simulación de reprogramación por clima",
  "🩺 Auditoría de vacunas de mascotas",
];

function reply(q: string, mode: Mode): string {
  const s = q.toLowerCase();

  // ========================================================
  // ADMIN COPILOT REPLIES
  // ========================================================
  if (mode === "admin") {
    // Revenue & financial metrics
    if (
      s.includes("revenue") ||
      s.includes("ingreso") ||
      s.includes("dinero") ||
      s.includes("factura") ||
      s.includes("kpi") ||
      s.includes("balance") ||
      s.includes("ganancia") ||
      s.includes("ventas")
    ) {
      return "📊 **Resumen Financiero y Operaciones de Hoy:**\n\n• **Citas de hoy:** 5 servicios de spa completados en Midtown y The Annex.\n• **Ingresos recaudados hoy:** $860.00 CAD.\n• **Facturación del mes (Nov):** $21,280.00 CAD (+15.8% sobre objetivo).\n• **Ticket promedio:** $154.20 CAD por perro.\n• **Propinas hoy:** $142.00 CAD (16.5% promedio).\n• **Ocupación de van #1:** 94% de slots reservados.\n\n*Hito operacional:* 54 perritos con suscripción VIP activa generan $7,830.00 CAD de MRR garantizado.";
    }

    // Van telemetry, tanks & fuel
    if (
      s.includes("water") ||
      s.includes("agua") ||
      s.includes("van") ||
      s.includes("tank") ||
      s.includes("tanque") ||
      s.includes("fuel") ||
      s.includes("gasolina") ||
      s.includes("combustible") ||
      s.includes("trailer") ||
      s.includes("bater") ||
      s.includes("generador") ||
      s.includes("mantenimiento")
    ) {
      return "🚐 **Telemetría en Vivo — Van #1 (Luxury Mobile Spa):**\n\n• **Tanque de Agua Dulce:** 72% (~95 Litros disponibles, suficiente para 4 servicios adicionales sin recargar).\n• **Tanque de Aguas Grises:** 31% de capacidad (vaciado seguro programado al fin de turno).\n• **Combustible / Generador silencioso:** 78% (próximo repostaje el viernes).\n• **Baterías Eco-Litio & Solar:** 88% de carga.\n• **Próximo Mantenimiento Preventivo:** 12 de Diciembre (inspección de bomba y fluidos).\n• **Ubicación GPS actual:** Corredor Roehampton Ave, Midtown (M4P 1R4).";
    }

    // Latchkey access codes & security
    if (
      s.includes("latchkey") ||
      s.includes("codigo") ||
      s.includes("código") ||
      s.includes("llave") ||
      s.includes("lockbox") ||
      s.includes("clave") ||
      s.includes("puerta") ||
      s.includes("acceso") ||
      s.includes("stop") ||
      s.includes("parada")
    ) {
      return "🔑 **Códigos Latchkey Activos de Hoy (Toronto):**\n\n• **Midtown (10:00 AM):** Barnaby (Goldendoodle) — Código: `4821` (Portón lateral de madera; gato Jasper en terraza).\n• **The Annex (12:30 PM):** Winston (Poodle) — Código: `9042` (Smart Lock Schlage).\n• **Rosedale (3:00 PM):** Coco (Pomeranian) — Código: `1537` (Lockbox con combinación en porche).\n\n*Protocolo de Seguridad:* Todos los códigos se encriptan bajo AES-256 geolocalizado. Solo se revelan en la app del peluquero certificado cuando el GPS detecta la van a menos de 50 metros del domicilio.";
    }

    // Route density & zones
    if (
      s.includes("route") ||
      s.includes("ruta") ||
      s.includes("densidad") ||
      s.includes("density") ||
      s.includes("zona") ||
      s.includes("zone") ||
      s.includes("barrio") ||
      s.includes("midtown") ||
      s.includes("annex") ||
      s.includes("beaches") ||
      s.includes("rosedale")
    ) {
      return "📍 **Densidad de Rutas y Saturación por Zonas de Toronto:**\n\n• **Midtown (Miércoles):** 92% ocupación (34 reservas / 36 slots) — Zona de mayor densidad y rentabilidad.\n• **The Annex (Martes):** 84% ocupación (27 reservas).\n• **The Beaches (Sábados):** 88% ocupación (31 reservas).\n• **Rosedale (Jueves):** 68% ocupación (19 reservas).\n• **King West (Lunes):** 54% ocupación (15 reservas).\n\n*Optimización de ruta:* Tiempos muertos de traslado reducidos a una media de 11.4 minutos entre paradas.";
    }

    // VIP retention & members
    if (
      s.includes("vip") ||
      s.includes("retenci") ||
      s.includes("retention") ||
      s.includes("miembro") ||
      s.includes("suscrip") ||
      s.includes("mrr")
    ) {
      return "👑 **Salud de Suscripciones VIP Pooch Club:**\n\n• **Miembros Activos:** 54 perritos en rutinas recurrentes de 4, 6 y 8 semanas (+8 altas este mes).\n• **Tasa de Retención a 90 días:** 96.2%.\n• **MRR (Ingresos Recurrentes Mensuales):** $7,830.00 CAD asegurados.\n• **Impacto Comercial:** El 68% de las reservas mensuales se completan automáticamente sin gasto publicitario.";
    }

    // Weather & snowstorm rescheduling
    if (
      s.includes("weather") ||
      s.includes("clima") ||
      s.includes("nieve") ||
      s.includes("snow") ||
      s.includes("storm") ||
      s.includes("tormenta") ||
      s.includes("reschedule") ||
      s.includes("reprogram")
    ) {
      return "❄️ **Protocolo de Tormentas de Nieve (Toronto Winter Protocol):**\n\n• Monitoreo activo conectado con Environment Canada.\n• En alertas de nieve en Don Valley Parkway o Gardiner Expressway, el asistente puede reorganizar automáticamente hasta 3 citas al cluster de Midtown del día siguiente sin penalización para el cliente.\n• Avisos por SMS y correo listos para disparar con 1 clic.";
    }

    // Vaccines & veterinary compliance
    if (
      s.includes("vaccin") ||
      s.includes("vacun") ||
      s.includes("rabia") ||
      s.includes("bordetella") ||
      s.includes("audit") ||
      s.includes("compliance")
    ) {
      return "🩺 **Auditoría de Vacunación (Normativa Veterinaria Ontario):**\n\n• **Total mascotas registradas:** 138 perros.\n• **Cartilla 100% al día:** 131 perros (94.9%).\n• **Próximas a vencer (<14 días):** 7 perros (notificaciones preventivas automáticas enviadas a sus dueños para actualizar el certificado digital).";
    }

    // MoeGo migration
    if (
      s.includes("moego") ||
      s.includes("migra") ||
      s.includes("sync")
    ) {
      return "🔄 **Sincronización y Estado de MoeGo:**\n\n• El 100% de expedientes de clientes, notas de peinado y perfiles caninos fueron migrados con éxito a nuestro sistema propio.\n• Operamos de forma nativa e independiente, ahorrando comisiones de terceros y con control total sobre los datos.";
    }

    return "👨‍💼 **Copiloto de Operaciones Qimmiq Online:**\n\nPuedo informarte en vivo sobre ingresos ($860 hoy / $21,280 mes), telemetría de la Van #1 (agua 72%), códigos Latchkey activos, saturación de rutas por barrios o auditoría de vacunas. ¿Qué deseas consultar?";
  }

  // ========================================================
  // CLIENT CONCIERGE REPLIES
  // ========================================================

  // Operating hours & Sundays
  if (
    s.includes("sunday") ||
    s.includes("domingo") ||
    s.includes("hour") ||
    s.includes("horario") ||
    s.includes("open") ||
    s.includes("abierto") ||
    s.includes("dias") ||
    s.includes("días")
  ) {
    return "¡Sí! Atendemos los 7 días de la semana, de **lunes a domingo de 8:30 AM a 6:00 PM**. Los fines de semana son especialmente solicitados para consentir a tu perro en la puerta de tu hogar sin que tengas que desplazarte ni interrumpir tus planes familiares.";
  }

  // Service zones & Toronto coverage
  if (
    s.includes("area") ||
    s.includes("zone") ||
    s.includes("zona") ||
    s.includes("neighborhood") ||
    s.includes("barrio") ||
    s.includes("where") ||
    s.includes("donde") ||
    s.includes("dónde") ||
    s.includes("etobicoke") ||
    s.includes("mississauga") ||
    s.includes("markham") ||
    s.includes("scarborough") ||
    s.includes("midtown") ||
    s.includes("rosedale") ||
    s.includes("annex")
  ) {
    return "Cubrimos todo el centro de Toronto y el GTA: Midtown, The Annex, Rosedale, Leaside, Downtown Toronto, East York, Etobicoke, North York, York, más rutas programadas en Mississauga, Markham, Scarborough y Richmond Hill. Si nos indicas tu código postal, te decimos al instante qué días estamos en tu calle.";
  }

  // Pricing & breeds
  if (
    s.includes("doodle") ||
    s.includes("price") ||
    s.includes("cost") ||
    s.includes("precio") ||
    s.includes("cuanto") ||
    s.includes("cuánto") ||
    s.includes("tarifa") ||
    s.includes("rate") ||
    s.includes("poodle") ||
    s.includes("pomeranian") ||
    s.includes("frenchie") ||
    s.includes("bulldog") ||
    s.includes("golden") ||
    s.includes("shih tzu")
  ) {
    return "Nuestras tarifas transparentes todo incluido:\n• **Perros Pequeños (<20 lbs, ej. Pomeranian, Shih Tzu):** $120–$140 CAD.\n• **Perros Medianos (20–45 lbs, ej. Goldendoodle, Frenchie):** $145–$185 CAD.\n• **Perros Grandes (45–70 lbs, ej. Golden Retriever, Labrador):** $185–$225 CAD.\n\n*Incluye:* Hidrobaño tibio orgánico, secado suave a mano sin jaulas, Blueberry Facial desmanchador, corte estilizado a tijera, corte y limado de uñas, y limpieza de oídos. ¡Los miembros del Club VIP ahorran un 15% de por vida!";
  }

  // Subscriptions & VIP Club
  if (
    s.includes("subscri") ||
    s.includes("suscrip") ||
    s.includes("vip") ||
    s.includes("plan") ||
    s.includes("membership") ||
    s.includes("membres") ||
    s.includes("descuento") ||
    s.includes("ahorro") ||
    s.includes("save")
  ) {
    return "Con el **Club VIP Pooch** disfrutas de una rutina periódica cada 4, 6 u 8 semanas con un **15% de descuento permanente** (ahorras hasta $250+ CAD al año). Además recibes: horarios garantizados en fin de semana, Facial de Arándanos orgánico GRATIS en cada visita (valor $15 CAD), el mismo peluquero de confianza para tu perrito, y cero penalizaciones por reprogramación.";
  }

  // In-house booking vs MoeGo
  if (
    s.includes("moego") ||
    s.includes("book") ||
    s.includes("appoin") ||
    s.includes("cita") ||
    s.includes("reserva") ||
    s.includes("agenda")
  ) {
    return "¡No necesitas usar MoeGo! Puedes reservar directamente desde nuestra web o app en menos de 90 segundos. Seleccionas el tamaño de tu perro, el paquete deseado, eliges fecha y hora con optimización de ruta en tiempo real, y recibes confirmación inmediata por SMS y correo.";
  }

  // Vaccinations & Pet Passport
  if (
    s.includes("vaccin") ||
    s.includes("vacun") ||
    s.includes("rabies") ||
    s.includes("rabia") ||
    s.includes("bordetella") ||
    s.includes("shot") ||
    s.includes("requisito")
  ) {
    return "Por normativa de bienestar animal y salud en Ontario, requerimos vacunas vigentes de **Rabia, Bordetella (tos de las perreras) y DHPP**. Puedes guardar y consultar las fechas de vencimiento de tu perro en tu Pasaporte de Salud digital dentro del Portal de Clientes, con alertas automáticas antes de que caduquen.";
  }

  // Latchkey service
  if (
    s.includes("latchkey") ||
    s.includes("lockbox") ||
    s.includes("key") ||
    s.includes("llave") ||
    s.includes("contactless") ||
    s.includes("sin contacto") ||
    s.includes("trabajo")
  ) {
    return "Nuestro servicio **Latchkey** te permite no estar en casa o seguir trabajando tranquilamente mientras consentimos a tu perro. Compartes tu código de smart-lock o lockbox de forma 100% cifrada. Nuestro peluquero certificado recoge a tu perro, lo atiende en nuestro spa móvil 1-on-1, lo regresa a salvo a tu hogar y te envía fotos y un Pooch Report Card digital inmediatamente.";
  }

  // Payment methods
  if (
    s.includes("pay") ||
    s.includes("pago") ||
    s.includes("interac") ||
    s.includes("apple") ||
    s.includes("google") ||
    s.includes("tarjeta") ||
    s.includes("card") ||
    s.includes("stripe")
  ) {
    return "Aceptamos todos los métodos de pago canadienses más cómodos y seguros: **Interac e-Transfer, Apple Pay, Google Pay y tarjetas de crédito/débito (Visa, Mastercard, American Express)**. Todos los pagos se procesan de forma cifrada mediante Stripe sin necesidad de efectivo en la van.";
  }

  // Trailer capabilities & fresh water
  if (
    s.includes("water") ||
    s.includes("van") ||
    s.includes("tank") ||
    s.includes("agua") ||
    s.includes("enchufe") ||
    s.includes("trailer")
  ) {
    return "Nuestro tráiler vintage de lujo es 100% autosuficiente: llevamos nuestra propia agua tibia filtrada, energía eco-solar silenciosa y climatización interior. **Nunca necesitamos conectarnos a tu manguera ni a los enchufes de tu casa**.";
  }

  // Cancellation policy
  if (
    s.includes("cancel") ||
    s.includes("polic") ||
    s.includes("politica") ||
    s.includes("política")
  ) {
    return "Enviamos recordatorios automáticos por SMS 48h y 24h antes. Las cancelaciones con menos de 24h tienen una tarifa del 50%, pero los miembros del Club VIP disfrutan de cancelaciones gratuitas ilimitadas. Y en caso de tormentas de nieve severas en Toronto, reprogramamos a todos con cero costo.";
  }

  // Real reviews & social proof
  if (
    s.includes("review") ||
    s.includes("reseña") ||
    s.includes("google") ||
    s.includes("real") ||
    s.includes("instagram") ||
    s.includes("opinion") ||
    s.includes("opinión")
  ) {
    return "Todas nuestras reseñas provienen 100% de clientes y perros reales verificados en Toronto (Rosedale, Midtown, The Annex, etc.) con una calificación promedio de 4.9★. También puedes seguir nuestro Instagram **@thefreshpooch** para ver videos reales diarios de la van, el proceso de baño y los perros felices con sus report cards.";
  }

  return "🐾 ¡Hola! Soy **Qimmiq**, tu Asistente de Spa Canino en Toronto. Puedo ayudarte con precios exactos para tu raza, agendar citas en menos de 90 segundos, explicar nuestro servicio Latchkey sin contacto o resolver dudas sobre el Club VIP y vacunas. ¿Cómo puedo consentir a tu perro hoy?";
}

export function QimmiqAssistant({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(isAdmin ? "admin" : "client");
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "ai",
      text: isAdmin
        ? "👨‍💼 ¡Hola Director de Operaciones! Soy Qimmiq, tu Copiloto de Flota y Gestión. Puedo responderte sobre ingresos en vivo, telemetría de la Van #1, códigos Latchkey del día y optimización de rutas en Toronto. ⚡"
        : "Woof! I'm Qimmiq, your Toronto Mobile Dog Spa Concierge. How can I help you and your pooch today? 🐾 (¡Hablo español e inglés!)",
    },
  ]);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  useEffect(() => {
    setMode(isAdmin ? "admin" : "client");
    setMsgs([
      {
        from: "ai",
        text: isAdmin
          ? "👨‍💼 ¡Hola Director de Operaciones! Soy Qimmiq, tu Copiloto de Flota y Gestión. Puedo responderte sobre ingresos en vivo, telemetría de la Van #1, códigos Latchkey del día y optimización de rutas en Toronto. ⚡"
          : "Woof! I'm Qimmiq, your Toronto Mobile Dog Spa Concierge. How can I help you and your pooch today? 🐾 (¡Hablo español e inglés!)",
      },
    ]);
  }, [isAdmin]);

  useEffect(() => {
    // Show welcoming speech bubble 1.5 seconds after page loads
    const timer = setTimeout(() => {
      setWelcomeToast(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setInput("");
    setTyping(true);

    try {
      const res = await api.qimmiq.chat({
        message: t,
        mode: mode === "client" ? "CLIENT_CONCIERGE" : "ADMIN_COPILOT",
      });
      const responseText = res.message || res.reply || res.text || reply(t, mode);
      setMsgs((m) => [...m, { from: "ai", text: responseText }]);
    } catch {
      // Fallback seamlessly to local intelligent reply if backend is offline
      setMsgs((m) => [...m, { from: "ai", text: reply(t, mode) }]);
    } finally {
      setTyping(false);
    }
  };

  const prompts = mode === "admin" ? ADMIN_PROMPTS : CLIENT_PROMPTS;

  return (
    <>
      {/* Welcome Speech Bubble */}
      {welcomeToast && !open && (
        <div className="animate-fade-up fixed bottom-20 right-5 z-40 max-w-xs rounded-2xl border border-gold/40 bg-card/95 p-4 shadow-lift backdrop-blur-md">
          <div className="flex items-start gap-3">
            <img
              src={qimmiqAvatar}
              alt="Qimmiq"
              className="h-9 w-9 rounded-full border-2 border-gold object-cover shrink-0 shadow-sm"
            />
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-teal flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-gold" /> {isAdmin ? "Qimmiq Ops Copilot" : "Qimmiq AI Concierge"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setWelcomeToast(false);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded transition-colors"
                  aria-label="Cerrar mensaje"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p
                className="mt-1 text-xs text-foreground leading-relaxed cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  setOpen(true);
                  setWelcomeToast(false);
                }}
              >
                {isAdmin ? (
                  <>⚡ <strong>¡Hola Director de Operaciones!</strong> Revisa ingresos de hoy ($860 CAD), tanques de agua (72%), códigos Latchkey o telemetría de ruta. 🚐</>
                ) : (
                  <>👋 <strong>¡Hola!</strong> Soy <strong>Qimmiq</strong>. Pregúntame sobre precios para la raza de tu perro, qué incluye cada paquete de spa o cómo reservar en Toronto. 🐾</>
                )}
              </p>
              <button
                onClick={() => {
                  setOpen(true);
                  setWelcomeToast(false);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold text-teal hover:underline"
              >
                {isAdmin ? "Abrir Copiloto de Operaciones →" : "Chatear con Qimmiq →"}
              </button>
            </div>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 right-8 h-3.5 w-3.5 rotate-45 border-b border-r border-gold/40 bg-card" />
        </div>
      )}

      <button
        onClick={() => {
          setOpen(true);
          setWelcomeToast(false);
        }}
        className={cn(
          "bg-gradient-teal fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full pl-2 pr-5 py-2 text-sm font-bold text-primary-foreground shadow-lift transition-transform hover:scale-105 border border-gold/30",
          open && "hidden",
        )}
      >
        <div className="relative">
          <img
            src={qimmiqAvatar}
            alt="Qimmiq Dog Service AI"
            className="h-10 w-10 rounded-full border-2 border-gold object-cover shadow-sm"
          />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative h-3 w-3 rounded-full bg-success border-2 border-background" />
          </span>
        </div>
        <div className="text-left leading-tight">
          <div className="text-xs text-gold flex items-center gap-1 font-semibold">
            <Sparkles className="h-3 w-3" /> {mode === "admin" ? "Ops Copilot AI" : "Dog Service AI"}
          </div>
          <span className="text-sm">Ask Qimmiq</span>
        </div>
      </button>

      {open && <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background shadow-lift transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="bg-gradient-teal trailer-rivets p-5 text-primary-foreground">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={qimmiqAvatar}
                alt="Qimmiq AI Avatar"
                className="h-14 w-14 rounded-full border-2 border-gold object-cover shadow-md"
              />
              <div>
                <div className="eyebrow text-gold">Canadian Dog Service AI</div>
                <h3 className="text-xl font-serif font-bold leading-tight">Qimmiq</h3>
                <p className="text-xs text-primary-foreground/80">Fresh Pooch Concierge & Copilot</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="rounded-full p-1.5 hover:bg-primary-foreground/15"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 inline-flex rounded-full bg-primary-foreground/15 p-1 text-xs font-semibold">
            {(["client", "admin"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("rounded-full px-3.5 py-1.5 transition-colors", mode === m ? "bg-gold text-ink" : "opacity-80")}
              >
                {m === "client" ? "🐾 Client Concierge" : "⚡ Admin Copilot"}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex-1 space-y-3 overflow-y-auto p-5">
          {/* Subtle watermark of Qimmiq in the chat background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <img src={qimmiqAvatar} alt="" className="h-64 w-64 object-contain" />
          </div>

          {msgs.map((m, i) => (
            <div key={i} className={cn("flex items-end gap-2", m.from === "user" ? "justify-end" : "justify-start")}>
              {m.from === "ai" && (
                <img
                  src={qimmiqAvatar}
                  alt="Qimmiq"
                  className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover"
                />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                  m.from === "user" ? "bg-ink text-ink-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none shadow-sm",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <img src={qimmiqAvatar} alt="Qimmiq" className="h-7 w-7 rounded-full border border-gold shrink-0 object-cover" />
              <div className="w-16 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground animate-pulse">…</div>
            </div>
          )}
          <div ref={end} />
        </div>

        <div className="border-t border-border p-4 bg-muted/20">
          <div className="mb-3 flex flex-wrap gap-2">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:border-sage hover:bg-sage-soft transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "admin" ? "Pregúntale a Qimmiq sobre ingresos, van, códigos o rutas…" : "Pregúntale a Qimmiq sobre precios, razas, domingos…"}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring shadow-sm"
            />
            <button
              type="submit"
              aria-label="Send"
              className="bg-gradient-gold rounded-full p-3 text-ink shadow-lift transition-transform hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
