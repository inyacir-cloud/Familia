import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";

type Contact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

type EmergencyData = {
  name: string;
  age: string;
  message: string;
  address: string;
  notes: string;
  photo: string;
  qrPhoto: string;
  contacts: Contact[];
  primaryContactId: string;
};

type CredentialRecord = EmergencyData & {
  cardId: string;
  updatedAt: number;
};

type TextField = "name" | "age" | "message" | "address" | "notes";
type ContactField = "name" | "relation" | "phone";

type IconName =
  | "back"
  | "cake"
  | "check"
  | "copy"
  | "download"
  | "duplicate"
  | "edit"
  | "eye"
  | "grid"
  | "heart"
  | "home"
  | "idCard"
  | "info"
  | "lock"
  | "phone"
  | "phoneCall"
  | "plus"
  | "print"
  | "search"
  | "shield"
  | "trash"
  | "user"
  | "warning";

const STORAGE_MULTI = "familia-credenciales-v3";
const STORAGE_KEY = "familia-credencial-emergencia-v2";
const QR_SAFE_LENGTH = 2100;
const QR_PHOTO_TARGET_LENGTH = 750;

const initialData: EmergencyData = {
  name: "Crescencio Sánchez Montiel",
  age: "86 años",
  message:
    "Si no puedo comunicarme correctamente o parezco desorientado, por favor no me dejes solo y comunícate con mi familia.",
  address: "Morelos 67, Amp el Triunfo\nIztapalapa, 09438, CDMX",
  notes: "Audición débil.\nAnsiedad.\nNo sé escribir.",
  photo: "",
  qrPhoto: "",
  contacts: [
    { id: "azucena", name: "Azucena Sánchez", relation: "Hija", phone: "56 6857 5221" },
    { id: "ruben", name: "Rubén Sánchez", relation: "Hijo", phone: "56 6857 5221" },
  ],
  primaryContactId: "azucena",
};

/* ---------------------------------- icons ---------------------------------- */

function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (name) {
    case "back":
      return (
        <svg {...props}>
          <path d="M19 12H5m6 6-6-6 6-6" />
        </svg>
      );
    case "cake":
      return (
        <svg {...props}>
          <path d="M4 21h16M5 17h14v4H5zM5 17v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
          <path d="M12 12V8m0 0a1.5 1.5 0 1 0 0-.01M8 12v-1m8 1v-1" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "copy":
      return (
        <svg {...props}>
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      );
    case "download":
      return (
        <svg {...props}>
          <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
        </svg>
      );
    case "duplicate":
      return (
        <svg {...props}>
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        </svg>
      );
    case "eye":
      return (
        <svg {...props}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "grid":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "heart":
      return (
        <svg {...props}>
          <path d="M20.8 8.6c0 5.4-8.8 10.1-8.8 10.1S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 8.8 2.6Z" />
        </svg>
      );
    case "home":
      return (
        <svg {...props}>
          <path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-6h6v6" />
        </svg>
      );
    case "idCard":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <circle cx="8" cy="11" r="2" />
          <path d="M5.6 16.5a2.6 2.6 0 0 1 4.8 0M14 9.5h5M14 13h5" />
        </svg>
      );
    case "info":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5m0-8h.01" />
        </svg>
      );
    case "lock":
      return (
        <svg {...props}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "phone":
      return (
        <svg {...props}>
          <path d="M21 16.7v2.1a1.7 1.7 0 0 1-1.9 1.7A16.8 16.8 0 0 1 12 17.8a16.5 16.5 0 0 1-5.8-5.8 16.8 16.8 0 0 1-2.7-7.1A1.7 1.7 0 0 1 5.2 3H7.3a1.7 1.7 0 0 1 1.7 1.4c.1.8.3 1.5.6 2.2a1.7 1.7 0 0 1-.4 1.8l-.9.9a13.6 13.6 0 0 0 5.4 5.4l.9-.9a1.7 1.7 0 0 1 1.8-.4c.7.3 1.4.5 2.2.6A1.7 1.7 0 0 1 21 16.7Z" />
        </svg>
      );
    case "phoneCall":
      return (
        <svg {...props}>
          <path d="M15 3a7 7 0 0 1 5 5M15 7a3 3 0 0 1 2 2" />
          <path d="M13.5 16.5 11 14a13.6 13.6 0 0 1-5.4-5.4l2.5-2.5a1.7 1.7 0 0 0 .4-1.8c-.3-.7-.5-1.4-.6-2.2A1.7 1.7 0 0 0 6.2 1H4.1A1.7 1.7 0 0 0 2.4 2.9 16.8 16.8 0 0 0 5.1 10a16.5 16.5 0 0 0 5.8 5.8 16.8 16.8 0 0 0 7.1 2.7 1.7 1.7 0 0 0 1.7-1.9v-2.1a1.7 1.7 0 0 0-1.4-1.7c-.8-.1-1.5-.3-2.2-.6a1.7 1.7 0 0 0-1.8.4Z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "print":
      return (
        <svg {...props}>
          <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 15h12v6H6zM18 12h.01" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.8-3.8" />
        </svg>
      );
    case "shield":
      return (
        <svg {...props}>
          <path d="M12 21s8-3.8 8-10V5l-8-3-8 3v6c0 6.2 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "trash":
      return (
        <svg {...props}>
          <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "warning":
      return (
        <svg {...props}>
          <path d="m10.3 3.6-8 14A2 2 0 0 0 4 20.5h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0Z" />
          <path d="M12 8v5m0 3.5h.01" />
        </svg>
      );
  }
}

/* --------------------------------- helpers --------------------------------- */

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textOr(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function callLink(phone: string): string | null {
  const number = phone.trim().replace(/[\s().-]/g, "");
  return /^\+?\d{7,15}$/.test(number) ? `tel:${number}` : null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function orderedContacts(data: EmergencyData) {
  return [...data.contacts].sort(
    (a, b) => Number(b.id === data.primaryContactId) - Number(a.id === data.primaryContactId),
  );
}

function safeImageData(value: unknown, maxLength: number) {
  return typeof value === "string" &&
    value.length <= maxLength &&
    /^data:image\/(?:jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
    ? value
    : "";
}

async function preparePhoto(file: File): Promise<{ photo: string; qrPhoto: string }> {
  if (!/^image\/(?:jpeg|png|webp)$/.test(file.type)) {
    throw new Error("Elige una foto JPG, PNG o WebP.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("La foto supera los 12 MB. Elige una imagen más pequeña.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se pudo abrir la foto. Prueba con otra imagen."));
      image.src = objectUrl;
    });
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("La foto no tiene un tamaño válido.");
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Este navegador no pudo procesar la foto.");

    const drawPortrait = (width: number, height: number) => {
      canvas.width = width;
      canvas.height = height;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      const targetRatio = width / height;
      const sourceWidth = sourceRatio > targetRatio
        ? image.naturalHeight * targetRatio
        : image.naturalWidth;
      const sourceHeight = sourceRatio > targetRatio
        ? image.naturalHeight
        : image.naturalWidth / targetRatio;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(
        image,
        (image.naturalWidth - sourceWidth) / 2,
        (image.naturalHeight - sourceHeight) / 2,
        sourceWidth,
        sourceHeight,
        0,
        0,
        width,
        height,
      );
    };

    drawPortrait(640, 816);
    let photo = canvas.toDataURL("image/jpeg", 0.78);
    if (photo.length > 240000) {
      drawPortrait(480, 612);
      photo = canvas.toDataURL("image/jpeg", 0.65);
    }

    // Keep the QR thumbnail small enough to scan on a 54 mm printed card.
    // The larger photo remains local for printing and this device.
    let qrPhoto = "";
    for (const width of [76, 68, 60, 52, 44, 36, 28, 20]) {
      drawPortrait(width, Math.round(width * 1.275));
      for (const [format, quality] of [["image/webp", 0.38], ["image/jpeg", 0.28]] as const) {
        const candidate = canvas.toDataURL(format, quality);
        if (safeImageData(candidate, QR_PHOTO_TARGET_LENGTH)) {
          qrPhoto = candidate;
          break;
        }
      }
      if (qrPhoto) break;
    }
    if (!qrPhoto) throw new Error("No se pudo preparar la foto para el QR. Prueba con otra.");
    return { photo, qrPhoto };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function blankEmergency(): EmergencyData {
  const id = newId();
  return {
    name: "",
    age: "",
    message:
      "Si no puedo comunicarme correctamente o parezco desorientado, por favor no me dejes solo y comunícate con mi familia.",
    address: "",
    notes: "",
    photo: "",
    qrPhoto: "",
    contacts: [{ id, name: "", relation: "", phone: "" }],
    primaryContactId: id,
  };
}

function sanitizeRecord(raw: unknown): CredentialRecord | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const contactsRaw = value.contacts;
  let contacts: Contact[] = [];
  if (Array.isArray(contactsRaw)) {
    contacts = contactsRaw
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
      .map((item) => ({
        id: textOr(item.id, newId()),
        name: textOr(item.name, ""),
        relation: textOr(item.relation, ""),
        phone: textOr(item.phone, ""),
      }));
  } else {
    const legacy = (full: unknown, phone: unknown, id: string): Contact => {
      const fullName = textOr(full, "");
      const match = fullName.match(/\s*\(([^()]+)\)\s*$/);
      return {
        id,
        name: match ? fullName.slice(0, match.index).trim() : fullName,
        relation: match ? match[1] : "",
        phone: textOr(phone, ""),
      };
    };
    contacts = [
      legacy(value.primaryName, value.primaryPhone, newId()),
      legacy(value.alternateName, value.alternatePhone, newId()),
    ];
  }
  if (!contacts.length) {
    const id = newId();
    contacts = [{ id, name: "", relation: "", phone: "" }];
  }
  const cardId =
    (typeof value.cardId === "string" && value.cardId) ||
    (typeof value.id === "string" && value.id) ||
    newId();
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : Date.now();
  return {
    cardId,
    updatedAt,
    name: textOr(value.name, ""),
    age: textOr(value.age, ""),
    message: textOr(value.message, initialData.message),
    address: textOr(value.address, ""),
    notes: textOr(value.notes, ""),
    photo: safeImageData(value.photo, 300000),
    qrPhoto: safeImageData(value.qrPhoto, 1180),
    contacts,
    primaryContactId: contacts.some((c) => c.id === value.primaryContactId)
      ? String(value.primaryContactId)
      : contacts[0].id,
  };
}

function loadStore(): { cards: CredentialRecord[]; selectedId: string | null } {
  try {
    const multi = window.localStorage.getItem(STORAGE_MULTI);
    if (multi !== null) {
      const parsed: unknown = JSON.parse(multi);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && Array.isArray((parsed as { cards?: unknown }).cards)
          ? (parsed as { cards: unknown[] }).cards
          : [];
      const cards = list
        .map(sanitizeRecord)
        .filter((c): c is CredentialRecord => c !== null);
      return { cards, selectedId: null };
    }
    const single =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem("auxilio-emergency-card");
    if (single) {
      const rec = sanitizeRecord(JSON.parse(single));
      if (rec) return { cards: [rec], selectedId: null };
    }
  } catch {
    /* start with the example below */
  }
  return {
    cards: [{ ...initialData, cardId: newId(), updatedAt: Date.now() }],
    selectedId: null,
  };
}

/** The QR carries a full snapshot, including a tiny photo, without a server. */
function buildShareUrl(data: EmergencyData) {
  const payload = [
    3,
    data.name,
    data.age,
    data.message,
    data.address,
    data.notes,
    orderedContacts(data)
      .filter((c) => c.name.trim() || c.phone.trim())
      .map(({ name, relation, phone }) => [name, relation, phone]),
    data.qrPhoto,
  ];
  const base = window.location.href.split("#")[0].split("?")[0];
  const encoded = compressToEncodedURIComponent(JSON.stringify(payload));
  // Keep the payload only once so a photo does not make the QR unreadably dense.
  // The marker prevents a truncated QR from showing the family editor.
  return `${base}?c=${encoded}#credencial`;
}

function qrStatusFor(card: EmergencyData, hasSafeBase: boolean) {
  const link = buildShareUrl(card);
  const validPhones = card.contacts.filter((c) => callLink(c.phone)).length;
  const canMake = hasSafeBase && link.length <= QR_SAFE_LENGTH && validPhones > 0;
  const problem = !hasSafeBase
    ? "Publica la página en una dirección web para generar el QR."
    : validPhones === 0
      ? "Agrega al menos un número válido para crear el QR."
      : "La foto y los datos ocupan demasiado espacio. Acorta el mensaje, domicilio o notas.";
  return { link, validPhones, canMake, problem };
}

function slugFor(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "familia"
  );
}

function formatDate(ts: number) {
  try {
    return new Date(ts).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

const SHARE_KEYS = ["c", "credencial", "tarjeta"];

/** Regex fallback in case URLSearchParams mangles an odd location. */
function rawParamFrom(search: string): string | null {
  const match = /[?&]c=([^&#]+)/.exec(search);
  return match ? match[1] : null;
}

function fragmentParam(fragment: string, keys: string[]): string | null {
  const clean = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (!clean) return null;
  for (const part of clean.split("&")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (keys.includes(part.slice(0, eq))) return part.slice(eq + 1);
  }
  return null;
}

/**
 * Read the encoded credential from anywhere in the current URL:
 * query string, hash fragment, or a partially rewritten location.
 */
function getEncodedFromLocation(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of SHARE_KEYS) {
      const value = params.get(key);
      if (value) return value;
    }
  } catch {
    /* ignore malformed query */
  }
  const raw = rawParamFrom(window.location.search);
  if (raw) return raw;
  const fromHash = fragmentParam(window.location.hash, SHARE_KEYS);
  if (fromHash) return fromHash;
  if (window.location.hash === "#credencial") return "";
  // Last resort: scan the whole location, in case a scanner rewrote the separators.
  const keys = SHARE_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const anywhere = new RegExp(`[?&#=](${keys})=([^&#]+)`).exec(window.location.href);
  return anywhere ? anywhere[2] : null;
}

function parseSharedCredential(encoded: string | null): { isShared: boolean; card: EmergencyData | null } {
  if (encoded === null) return { isShared: false, card: null };
  try {
    const unpacked = decompressFromEncodedURIComponent(encoded);
    if (!unpacked) throw new Error("empty");
    const payload: unknown = JSON.parse(unpacked);
    if (!Array.isArray(payload)) throw new Error("bad shape");

    let name = "";
    let age = "";
    let message = "";
    let address = "";
    let notes = "";
    let people: unknown = [];
    let photoValue: unknown = "";

    if (payload[0] === 3 && payload.length === 8) {
      [, name, age, message, address, notes, people, photoValue] = payload as [number, string, string, string, string, string, unknown, unknown];
    } else if (payload[0] === 2 && payload.length === 7) {
      [, name, age, message, address, notes, people] = payload as [number, string, string, string, string, string, unknown];
    } else if (payload[0] === 1 && payload.length === 6) {
      [, name, message, address, notes, people] = payload as [number, string, string, string, string, unknown];
      age = "";
    } else {
      throw new Error("unknown version");
    }
    if ([name, age, message, address, notes].some((v) => typeof v !== "string")) throw new Error("bad text");
    if (!Array.isArray(people)) throw new Error("bad contacts");

    const contacts: Contact[] = people
      .filter(
        (person: unknown): person is [string, string, string] =>
          Array.isArray(person) &&
          person.length === 3 &&
          person.every((field) => typeof field === "string"),
      )
      .map(([personName, relation, phone], index) => ({
        id: `qr-${index}`,
        name: personName,
        relation,
        phone,
      }));

    return {
      isShared: true,
      card: {
        name,
        age,
        message,
        address,
        notes,
        photo: safeImageData(photoValue, 1180),
        qrPhoto: "",
        contacts,
        primaryContactId: contacts[0]?.id ?? "",
      },
    };
  } catch {
    return { isShared: true, card: null };
  }
}

/* --------------------------- credential (shared UI) -------------------------- */

function Credential({ card }: { card: EmergencyData }) {
  const contacts = orderedContacts(card).filter((c) => c.name.trim() || c.phone.trim());
  const addressLines = card.address.split("\n").map((l) => l.trim()).filter(Boolean);
  const noteLines = card.notes.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <article className="credential" aria-label={`Credencial de ayuda de ${card.name}`}>
      <header className="cred-top">
        <div className="cred-avatar" aria-hidden="true">
          <span className="cred-avatar-person">
            <Icon name="user" size={44} />
          </span>
          <span className="cred-avatar-heart">
            <Icon name="heart" size={18} />
          </span>
        </div>
        <div className="cred-hello">
          <span className="cred-hello-small">Hola, soy</span>
          <strong className="cred-hello-name">{card.name || "Sin nombre"}</strong>
          <span className="cred-hello-small">Estos son mis datos</span>
        </div>
      </header>

      <div className="cred-main">
        <div className={`cred-photo ${card.photo ? "has-photo" : ""}`}>
          {card.photo ? (
            <img className="cred-photo-image" src={card.photo} alt={`Foto de ${card.name || "la persona"}`} />
          ) : (
            <>
              <span className="cred-cloud" />
              <span className="cred-hill hill-back" />
              <span className="cred-hill hill-front" />
              <span className="cred-initials">{initials(card.name)}</span>
            </>
          )}
        </div>

        <div className="cred-facts">
          <div className="fact">
            <span className="fact-icon">
              <Icon name="user" size={17} />
            </span>
            <div>
              <label>Nombre completo</label>
              <p>{card.name || "—"}</p>
            </div>
          </div>
          <div className="fact">
            <span className="fact-icon">
              <Icon name="cake" size={17} />
            </span>
            <div>
              <label>Edad</label>
              <p>{card.age.trim() || "—"}</p>
            </div>
          </div>
          <div className="fact">
            <span className="fact-icon">
              <Icon name="phone" size={17} />
            </span>
            <div>
              <label>Contactos para llamar</label>
              <p>
                {contacts.length === 0
                  ? "Sin contactos"
                  : `${contacts.length} ${contacts.length === 1 ? "persona disponible" : "personas disponibles"}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {card.message.trim() && (
        <p className="cred-message">
          <Icon name="info" size={18} />
          <span>{card.message}</span>
        </p>
      )}

      <section className="cred-contacts" aria-label="Contactos de emergencia">
        <div className="cred-contacts-head">
          <span>CONTACTOS DE EMERGENCIA</span>
          <p>Toca el botón verde para llamar directamente</p>
        </div>
        <div className="cred-contact-list">
          {contacts.map((contact) => {
            const href = callLink(contact.phone);
            const isPrimary = contact.id === card.primaryContactId;
            return (
              <div className={`cred-contact ${isPrimary ? "is-primary" : ""}`} key={contact.id}>
                <div className="cc-info">
                  <span className={`cc-badge ${isPrimary ? "cc-badge-primary" : ""}`}>
                    {isPrimary ? "Principal · Llama primero" : "Familiar"}
                  </span>
                  <strong>
                    {contact.name || "Familiar"}
                    {contact.relation.trim() && <em> ({contact.relation.trim()})</em>}
                  </strong>
                  {href ? (
                    <a className="cc-number" href={href}>
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="cc-number is-missing">{contact.phone.trim() || "Número pendiente"}</span>
                  )}
                </div>
                {href ? (
                  <a
                    className="cc-call"
                    href={href}
                    aria-label={`Llamar a ${contact.name || "familiar"} al ${contact.phone}`}
                  >
                    <Icon name="phoneCall" size={21} />
                    <span>Llamar</span>
                  </a>
                ) : (
                  <span className="cc-call is-disabled">
                    <Icon name="phone" size={21} />
                    <span>Sin número</span>
                  </span>
                )}
              </div>
            );
          })}
          {contacts.length === 0 && (
            <p className="cred-no-contacts">Esta credencial aún no tiene contactos agregados.</p>
          )}
        </div>
      </section>

      <div className="cred-extra">
        <div className="extra-row">
          <span className="extra-icon green">
            <Icon name="home" size={20} />
          </span>
          <div>
            <label>Domicilio</label>
            {addressLines.length ? (
              <p>
                {addressLines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </p>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
        <div className="extra-row">
          <span className="extra-icon blue">
            <Icon name="info" size={20} />
          </span>
          <div>
            <label>Información importante</label>
            {noteLines.length ? (
              <ul>
                {noteLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>
      </div>

      <a className="cred-911" href="tel:911" aria-label="En caso de emergencia, llama al 911">
        <span className="n911-icon">
          <Icon name="phoneCall" size={38} />
        </span>
        <span className="n911-divider" aria-hidden="true" />
        <span className="n911-text">
          <small>EN CASO DE EMERGENCIA</small>
          <strong>LLAMA AL 911</strong>
        </span>
      </a>
    </article>
  );
}

function PhysicalFront({ card }: { card: EmergencyData }) {
  const primary = orderedContacts(card).find((contact) => callLink(contact.phone))
    ?? orderedContacts(card)[0];

  return (
    <article className="physical-card physical-front" aria-label="Frente de la credencial">
      <header className="physical-front-head">
        <span className="physical-front-avatar" aria-hidden="true">
          <Icon name="user" size={27} />
          <Icon name="heart" size={13} className="physical-avatar-heart" />
        </span>
        <div>
          <span>Hola, soy</span>
          <strong>{card.name || "Sin nombre"}</strong>
          <span>Estos son mis datos</span>
        </div>
      </header>

      <div className="physical-front-body">
        <div className={`physical-front-photo ${card.photo ? "has-photo" : ""}`}>
          {card.photo ? (
            <img src={card.photo} alt={`Foto de ${card.name || "la persona"}`} />
          ) : (
            <span>{initials(card.name)}</span>
          )}
        </div>
        <div className="physical-front-facts">
          <div className="physical-fact">
            <span className="physical-fact-icon"><Icon name="user" size={11} /></span>
            <div><small>Nombre completo</small><strong>{card.name || "Sin nombre"}</strong></div>
          </div>
          <div className="physical-fact">
            <span className="physical-fact-icon"><Icon name="cake" size={11} /></span>
            <div><small>Edad</small><strong>{card.age || "Sin dato"}</strong></div>
          </div>
          <div className="physical-fact physical-fact-contact">
            <span className="physical-fact-icon"><Icon name="phone" size={11} /></span>
            <div>
              <small>Contacto de emergencia</small>
              <strong>{primary?.name || "Sin contacto"}{primary?.relation ? ` (${primary.relation})` : ""}</strong>
              <b>{primary?.phone || "Sin número"}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="physical-front-bottom">
        <div className="physical-front-emergency">
          <Icon name="phoneCall" size={31} />
          <span className="physical-emergency-rule" />
          <div><small>EN CASO DE EMERGENCIA</small><strong>LLAMA AL 911</strong></div>
        </div>
        <span className="physical-front-footer">Mis contactos y mi QR están al reverso</span>
      </div>
    </article>
  );
}

function PhysicalBack({ card, qrLink }: { card: EmergencyData; qrLink: string | null }) {
  const contacts = orderedContacts(card).filter((contact) => contact.name.trim() || contact.phone.trim());
  const address = card.address.replace(/\s*\n\s*/g, ", ").trim();
  const notes = card.notes.split("\n").map((note) => note.trim()).filter(Boolean);

  return (
    <article className="physical-card physical-back" aria-label="Reverso de la credencial">
      <header className="physical-back-alert">
        <Icon name="warning" size={34} />
        <strong>SI ME ENCUENTRAS<br />DESORIENTADO,<br />POR FAVOR AYÚDAME</strong>
      </header>
      <p className="physical-back-message">
        Mi nombre es <strong>{card.name || "..."}.</strong> {card.message}
      </p>

      <div className="physical-back-contact-area">
        <div className="physical-back-contact-heading">
          <strong>LLAMA A MI FAMILIA</strong>
          {contacts.length > 2 && <span>+{contacts.length - 2} más en el QR</span>}
        </div>
        <div className="physical-back-contact-list">
          {contacts.slice(0, 2).map((contact, index) => (
            <div className="physical-back-contact" key={contact.id}>
              <small>{index === 0 ? "Contacto principal" : "Contacto alternativo"}</small>
              <span>{contact.name || "Familiar"}{contact.relation ? ` (${contact.relation})` : ""}</span>
              <strong>{contact.phone || "Sin número"}</strong>
            </div>
          ))}
          {contacts.length === 0 && <span className="physical-back-empty">Aún no hay contactos</span>}
        </div>
      </div>

      <div className="physical-back-bottom">
        <div className="physical-back-details">
          <div><strong>Domicilio</strong><p>{address || "Sin dato"}</p></div>
          <div><strong>Información importante</strong><p>{notes.join(" · ") || "Sin dato"}</p></div>
        </div>
        <div className="physical-back-qr">
          {qrLink ? (
            <QRCodeCanvas value={qrLink} size={420} level="L" marginSize={4} bgColor="#ffffff" fgColor="#123f7d" />
          ) : (
            <span className="physical-qr-placeholder">QR pendiente</span>
          )}
          <small>Escanea para llamar<br />a todos mis contactos</small>
        </div>
      </div>
    </article>
  );
}

function PrintSheets({ jobs }: { jobs: { card: EmergencyData; qrLink: string | null; label: string }[] }) {
  if (!jobs.length) return <div className="print-only" aria-hidden="true" />;
  return (
    <div className="print-only" aria-hidden="true">
      {jobs.map((job, index) => (
        <Fragment key={`${job.label}-${index}`}>
          <section className="print-page" aria-label={`Frente de ${job.label}`}>
            <div className="print-placement">
              <PhysicalFront card={job.card} />
              <span>{job.label} · FRENTE · 54 × 85,6 mm · imprimir al 100 %</span>
            </div>
          </section>
          <section className="print-page" aria-label={`Reverso de ${job.label}`}>
            <div className="print-placement">
              <PhysicalBack card={job.card} qrLink={job.qrLink} />
              <span>{job.label} · REVERSO · 54 × 85,6 mm · imprimir al 100 %</span>
            </div>
          </section>
        </Fragment>
      ))}
    </div>
  );
}

/* ------------------------------ helper (QR) view ----------------------------- */

function HelperView({ card }: { card: EmergencyData | null }) {
  useEffect(() => {
    document.title = card ? `Credencial de ayuda | ${card.name}` : "Credencial de ayuda";
  }, [card]);

  if (!card) {
    // Deliberately no link back to any editor: helpers must never reach family editing.
    return (
      <main className="helper-shell">
        <div className="helper-error">
          <span className="helper-error-icon">
            <Icon name="warning" size={44} />
          </span>
          <h1>No pudimos abrir esta credencial</h1>
          <p>
            El código QR está incompleto o dañado. Por favor pide a la familia que te comparta un
            QR nuevo.
          </p>
          <p className="helper-error-note">Si es una emergencia, llama al 911.</p>
          <a className="helper-911-small" href="tel:911">
            <Icon name="phoneCall" size={20} /> Llamar al 911
          </a>
        </div>
      </main>
    );
  }

  const contacts = orderedContacts(card).filter((c) => c.name.trim() || c.phone.trim());
  const primary = contacts.find((c) => c.id === card.primaryContactId) ?? contacts[0];
  const primaryHref = primary ? callLink(primary.phone) : null;
  const printableLink = buildShareUrl({ ...card, qrPhoto: card.photo });
  const printQrLink = printableLink.length <= QR_SAFE_LENGTH ? printableLink : null;

  return (
    <main className="helper-shell">
      <div className="helper-container">
        <div className="helper-badge">
          <span className="helper-dot" aria-hidden="true" />
          Credencial digital · Solo lectura
        </div>
        <p className="helper-intro">
          Si estás con esta persona, por favor ayúdala a comunicarse con su familia. Toca cualquier
          botón verde para llamar.
        </p>

        <Credential card={card} />

        <button type="button" className="helper-print" onClick={() => window.print()}>
          <Icon name="print" size={18} /> Imprimir credencial
        </button>

        <footer className="helper-footer">
          <Icon name="shield" size={16} />
          <span>
            Esta página se abrió desde un QR y no permite editar datos. Si es una emergencia grave,
            llama al 911.
          </span>
        </footer>
      </div>

      {primaryHref && primary && (
        <div className="helper-sticky-call">
          <div className="sticky-inner">
            <div className="sticky-who">
              <span>¿Puedes ayudar?</span>
              <strong>
                Llama a {primary.name || "su familia"}
                {primary.relation.trim() ? ` (${primary.relation.trim()})` : ""}
              </strong>
            </div>
            <a href={primaryHref} aria-label={`Llamar ahora a ${primary.name} al ${primary.phone}`}>
              <Icon name="phoneCall" size={20} /> Llamar
            </a>
          </div>
        </div>
      )}
      <PrintSheets jobs={[{ card, qrLink: printQrLink, label: card.name || "Credencial" }]} />
    </main>
  );
}

/* ------------------------------- family editor ------------------------------- */

function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  maxLength = 200,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "numeric";
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          type={type}
          inputMode={inputMode}
        />
      )}
    </label>
  );
}

function DashboardCard({
  card,
  hasSafeBase,
  onEdit,
  onPrint,
  onDuplicate,
  onDelete,
}: {
  card: CredentialRecord;
  hasSafeBase: boolean;
  onEdit: () => void;
  onPrint: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const status = useMemo(() => qrStatusFor(card, hasSafeBase), [card, hasSafeBase]);
  const filledContacts = card.contacts.filter((c) => c.name.trim() || c.phone.trim()).length;
  const openDigital = () => {
    if (status.canMake) window.open(status.link, "_blank", "noopener");
  };

  return (
    <article className="dash-card">
      <div className="dash-preview">
        <PhysicalFront card={card} />
        <span className="dash-preview-tag">FRENTE · 54 × 85,6 mm</span>
      </div>
      <div className="dash-body">
        <div className="dash-identity">
          <div className="dash-photo" aria-hidden="true">
            {card.photo ? <img src={card.photo} alt="" /> : <span>{initials(card.name)}</span>}
          </div>
          <div className="dash-identity-text">
            <strong>{card.name.trim() || "Sin nombre"}</strong>
            <span>{card.age.trim() || "Edad pendiente"} · {filledContacts} {filledContacts === 1 ? "contacto" : "contactos"}</span>
            <span className="dash-updated">Actualizada el {formatDate(card.updatedAt)}</span>
          </div>
          <span className={`dash-status ${status.canMake ? "ok" : "warn"}`}>
            {status.canMake ? "QR listo" : "Revisar"}
          </span>
        </div>

        <div className="dash-qr-row">
          {status.canMake ? (
            <>
              <div className="dash-qr-mini" aria-hidden="true">
                <QRCodeCanvas value={status.link} size={320} level="L" marginSize={2} bgColor="#ffffff" fgColor="#123f7d" />
              </div>
              <div className="dash-qr-info">
                <strong>QR listo para imprimir</strong>
                <span>{status.validPhones} {status.validPhones === 1 ? "número válido" : "números válidos"} · {status.link.length} caracteres</span>
                <button type="button" className="link-button" onClick={openDigital}>
                  <Icon name="eye" size={14} /> Abrir versión digital
                </button>
              </div>
            </>
          ) : (
            <p className="dash-qr-warn">
              <Icon name="warning" size={16} />
              <span>{status.problem}</span>
            </p>
          )}
        </div>

        <div className="dash-actions">
          <button type="button" className="dash-edit" onClick={onEdit}>
            <Icon name="edit" size={15} /> Editar
          </button>
          <button type="button" className="dash-ghost" onClick={onPrint} disabled={!status.canMake}>
            <Icon name="print" size={15} /> Imprimir
          </button>
          <button type="button" className="dash-ghost" onClick={onDuplicate}>
            <Icon name="duplicate" size={15} /> Duplicar
          </button>
          <button
            type="button"
            className="dash-delete"
            onClick={onDelete}
            aria-label={`Eliminar credencial de ${card.name || "esta persona"}`}
            title="Eliminar credencial"
          >
            <Icon name="trash" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

function FamilyView() {
  const [store, setStore] = useState(loadStore);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [savedTick, setSavedTick] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [printOverride, setPrintOverride] = useState<string[] | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const selected = store.cards.find((c) => c.cardId === store.selectedId) ?? null;

  const baseProtocol = window.location.protocol;
  const baseHost = window.location.host;
  const hasSafeBase =
    (baseProtocol === "https:" || baseProtocol === "http:") && !!baseHost && !/^(about|blob|data|javascript):/i.test(baseProtocol);
  const isLocalPage =
    baseProtocol === "file:" ||
    ["localhost", "127.0.0.1"].includes(window.location.hostname);

  const selectedStatus = useMemo(
    () => (selected ? qrStatusFor(selected, hasSafeBase) : null),
    [selected, hasSafeBase],
  );

  const stats = useMemo(() => {
    let ready = 0;
    for (const card of store.cards) {
      if (qrStatusFor(card, hasSafeBase).canMake) ready += 1;
    }
    return { total: store.cards.length, ready, missing: store.cards.length - ready };
  }, [store.cards, hasSafeBase]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return store.cards;
    return store.cards.filter((c) => `${c.name} ${c.age}`.toLowerCase().includes(q));
  }, [store.cards, query]);

  const effectiveJobs = useMemo(() => {
    const targets = printOverride
      ? store.cards.filter((c) => printOverride.includes(c.cardId))
      : selected
        ? [selected]
        : store.cards;
    return targets.map((card) => {
      const st = qrStatusFor(card, hasSafeBase);
      return { card, qrLink: st.canMake ? st.link : null, label: card.name.trim() || "Sin nombre" };
    });
  }, [printOverride, store.cards, selected, hasSafeBase]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MULTI, JSON.stringify({ cards: store.cards, savedAt: Date.now() }));
      setSavedTick((t) => t + 1);
    } catch {
      setNotice("No se pudo guardar: almacenamiento lleno. Quita fotos o credenciales.");
    }
  }, [store.cards]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.title = selected
      ? `Editando ${selected.name || "credencial"} | Mis credenciales`
      : `Mis credenciales (${store.cards.length}) | Espacio familiar privado`;
  }, [selected, store.cards.length]);

  useEffect(() => {
    const clear = () => setPrintOverride(null);
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const selectCard = (id: string) => {
    setStore((prev) => ({ ...prev, selectedId: id }));
    setPhotoError("");
    scrollTop();
  };

  const backToDashboard = () => {
    setStore((prev) => ({ ...prev, selectedId: null }));
    setPhotoError("");
    scrollTop();
  };

  const saveCredential = () => {
    if (!selected || photoBusy) return;
    try {
      window.localStorage.setItem(
        STORAGE_MULTI,
        JSON.stringify({ cards: store.cards, savedAt: Date.now() }),
      );
      setSavedTick((tick) => tick + 1);
      backToDashboard();
      setNotice(`Credencial de ${selected.name.trim() || "esta persona"} guardada.`);
    } catch {
      setNotice("No se pudo guardar. Revisa el espacio disponible en este dispositivo.");
    }
  };

  const createCard = () => {
    const record: CredentialRecord = { ...blankEmergency(), cardId: newId(), updatedAt: Date.now() };
    setStore((prev) => ({ cards: [...prev.cards, record], selectedId: record.cardId }));
    setPhotoError("");
    setNotice("Nueva credencial creada. Completa nombre, foto y contactos.");
    scrollTop();
  };

  const duplicateCard = (id: string) => {
    setStore((prev) => {
      const source = prev.cards.find((c) => c.cardId === id);
      if (!source) return prev;
      const contacts = source.contacts.map((c) => ({ ...c, id: newId() }));
      const primaryIndex = Math.max(
        0,
        source.contacts.findIndex((c) => c.id === source.primaryContactId),
      );
      const primary = contacts[primaryIndex] ?? contacts[0];
      const copy: CredentialRecord = {
        ...source,
        cardId: newId(),
        updatedAt: Date.now(),
        name: source.name ? `${source.name} (copia)` : "Sin nombre (copia)",
        contacts,
        primaryContactId: primary?.id ?? contacts[0].id,
      };
      const index = prev.cards.findIndex((c) => c.cardId === id);
      const cards = [...prev.cards];
      cards.splice(index + 1, 0, copy);
      return { ...prev, cards };
    });
    setNotice("Credencial duplicada. Edita los datos de la copia.");
  };

  const deleteCard = (id: string) => {
    const target = store.cards.find((c) => c.cardId === id);
    const label = target?.name.trim() || "esta credencial";
    if (!window.confirm(`¿Eliminar la credencial de ${label}? Esta acción no se puede deshacer.`)) return;
    setStore((prev) => ({
      cards: prev.cards.filter((c) => c.cardId !== id),
      selectedId: prev.selectedId === id ? null : prev.selectedId,
    }));
    setNotice("Credencial eliminada.");
  };

  const updateSelected = (updater: (card: CredentialRecord) => CredentialRecord) => {
    setStore((prev) => {
      if (!prev.selectedId) return prev;
      return {
        ...prev,
        cards: prev.cards.map((c) =>
          c.cardId === prev.selectedId ? { ...updater(c), cardId: c.cardId, updatedAt: Date.now() } : c,
        ),
      };
    });
  };

  const changeField = (field: TextField) => (value: string) =>
    updateSelected((card) => ({ ...card, [field]: value }));

  const changeContact = (id: string, field: ContactField, value: string) =>
    updateSelected((card) => ({
      ...card,
      contacts: card.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }));

  const addContact = () => {
    updateSelected((card) => ({
      ...card,
      contacts: [...card.contacts, { id: newId(), name: "", relation: "", phone: "" }],
    }));
    setNotice("Nuevo contacto agregado. No olvides su número.");
  };

  const removeContact = (id: string) => {
    if (selected && selected.contacts.length === 1) return;
    updateSelected((card) => {
      const remaining = card.contacts.filter((c) => c.id !== id);
      return {
        ...card,
        contacts: remaining,
        primaryContactId: card.primaryContactId === id ? remaining[0].id : card.primaryContactId,
      };
    });
  };

  const onPhotoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selected) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      const prepared = await preparePhoto(file);
      updateSelected((card) => ({ ...card, ...prepared }));
      setNotice("Foto agregada. Descarga un QR nuevo para mostrarla al escanear.");
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : "No se pudo procesar la foto.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = () => {
    updateSelected((card) => ({ ...card, photo: "", qrPhoto: "" }));
    setPhotoError("");
    setNotice("Foto eliminada. Descarga un QR nuevo si ya compartiste uno.");
  };

  const downloadQr = () => {
    if (!selected || !selectedStatus?.canMake) return;
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.download = `qr-credencial-${slugFor(selected.name)}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
    setNotice("QR descargado. Si cambias datos, descarga uno nuevo.");
  };

  const copyLink = async () => {
    if (!selectedStatus) return;
    try {
      await navigator.clipboard.writeText(selectedStatus.link);
      setNotice("Enlace de la credencial copiado.");
    } catch {
      window.prompt("Copia el enlace de la credencial:", selectedStatus.link);
    }
  };

  const openCredential = () => {
    if (selectedStatus?.canMake) window.open(selectedStatus.link, "_blank", "noopener");
  };

  const printWhenReady = () => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  };

  const printOne = (id: string) => {
    const target = store.cards.find((c) => c.cardId === id);
    if (!target) return;
    const st = qrStatusFor(target, hasSafeBase);
    if (!st.canMake) {
      setNotice(st.problem);
      return;
    }
    setPrintOverride([id]);
    printWhenReady();
  };

  const printAll = () => {
    if (!store.cards.length) return;
    setPrintOverride(null);
    setNotice(`Imprimiendo ${store.cards.length} ${store.cards.length === 1 ? "credencial" : "credenciales"}: 2 páginas por persona.`);
    printWhenReady();
  };

  const data = selected;
  const link = selectedStatus?.link ?? "";
  const validPhones = selected ? selected.contacts.filter((c) => callLink(c.phone)).length : 0;
  const canMakeQr = selectedStatus?.canMake ?? false;
  const qrProblem = selectedStatus?.problem ?? "";

  return (
    <div className="family-shell">
      <header className="family-header">
        <div className="family-header-inner">
          <div className="family-identity">
            <span className="family-lock">
              <Icon name="lock" size={19} />
            </span>
            <div>
              <span className="family-overline">ESPACIO FAMILIAR PRIVADO · SOLO TÚ VES ESTO</span>
              <strong>
                {selected
                  ? `Credencial de ${selected.name.trim().split(" ")[0] || "la persona"}`
                  : `Mis credenciales${store.cards.length ? ` (${store.cards.length})` : ""}`}
              </strong>
            </div>
          </div>
          <div className="family-header-actions">
            <span className="family-saved" key={savedTick}>
              <span className="saved-dot" /> Guardado en este dispositivo
            </span>
            {selected ? (
              <button type="button" className="header-save-btn" onClick={saveCredential} disabled={photoBusy}>
                <Icon name="check" size={17} />
                <span className="save-label-desktop">Guardar credencial</span>
                <span className="save-label-mobile">Guardar</span>
              </button>
            ) : (
              <button type="button" className="header-new-btn" onClick={createCard}>
                <Icon name="plus" size={16} /> Nueva credencial
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="family-main">
        {!selected || !data ? (
          <>
            <section className="family-intro">
              <div>
                <h1>Una credencial por persona, todas en un solo lugar.</h1>
                <p>
                  Crea, edita, duplica e imprime credenciales para cada integrante de la familia.
                  Cada una tiene su propia <strong>foto, contactos y QR</strong>. Quien escanee un QR
                  verá únicamente esa credencial digital, sin acceso a esta edición.
                </p>
              </div>
              <div className="family-steps">
                <span><b>1</b> Crea</span>
                <span><b>2</b> Edita</span>
                <span><b>3</b> Imprime</span>
              </div>
            </section>

            <div className="dash-toolbar">
              <label className="dash-search">
                <Icon name="search" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre…"
                  aria-label="Buscar credencial por nombre"
                />
              </label>
              <div className="dash-toolbar-actions">
                <button type="button" className="ghost-action dash-toolbar-btn" onClick={printAll} disabled={!store.cards.length}>
                  <Icon name="print" size={17} /> Imprimir todas
                </button>
                <button type="button" className="primary-action dash-toolbar-btn" onClick={createCard}>
                  <Icon name="plus" size={18} /> Nueva credencial
                </button>
              </div>
            </div>

            {store.cards.length > 0 && (
              <div className="dash-stats" aria-label="Resumen de credenciales">
                <span className="dash-stat"><b>{stats.total}</b> {stats.total === 1 ? "credencial" : "credenciales"}</span>
                <span className="dash-stat ok"><b>{stats.ready}</b> listas para QR</span>
                <span className="dash-stat warn"><b>{stats.missing}</b> por revisar</span>
              </div>
            )}

            {store.cards.length === 0 ? (
              <section className="dash-empty">
                <span className="dash-empty-icon"><Icon name="idCard" size={30} /></span>
                <h2>Aún no tienes credenciales</h2>
                <p>Crea la primera: agrega foto, datos, contactos de emergencia y genera su QR para imprimir frente y reverso a tamaño credencial.</p>
                <button type="button" className="primary-action dash-empty-btn" onClick={createCard}>
                  <Icon name="plus" size={18} /> Crear mi primera credencial
                </button>
              </section>
            ) : visible.length === 0 ? (
              <section className="dash-empty">
                <span className="dash-empty-icon"><Icon name="search" size={28} /></span>
                <h2>Sin resultados para “{query.trim()}”</h2>
                <p>Prueba con otro nombre o crea una credencial nueva.</p>
                <button type="button" className="primary-action dash-empty-btn" onClick={createCard}>
                  <Icon name="plus" size={18} /> Nueva credencial
                </button>
              </section>
            ) : (
              <div className="dash-grid">
                {visible.map((card) => (
                  <DashboardCard
                    key={card.cardId}
                    card={card}
                    hasSafeBase={hasSafeBase}
                    onEdit={() => selectCard(card.cardId)}
                    onPrint={() => printOne(card.cardId)}
                    onDuplicate={() => duplicateCard(card.cardId)}
                    onDelete={() => deleteCard(card.cardId)}
                  />
                ))}
                <button type="button" className="dash-new-tile" onClick={createCard}>
                  <span className="dash-new-icon"><Icon name="plus" size={22} /></span>
                  <strong>Crear nueva credencial</strong>
                  <span>Una por persona: foto, datos, contactos y QR propio para frente y reverso.</span>
                </button>
              </div>
            )}

            <footer className="family-footer">
              <Icon name="heart" size={16} />
              <span>
                Espacio privado de la familia. Cada QR abre solo su credencial digital y no permite editar.
              </span>
            </footer>
          </>
        ) : (
          <>
            <div className="editor-topbar">
              <button type="button" className="back-button" onClick={backToDashboard}>
                <Icon name="back" size={16} /> Todas las credenciales
              </button>
              <div className="editor-switcher">
                <label htmlFor="credential-switch">Credencial:</label>
                <select
                  id="credential-switch"
                  value={data.cardId}
                  onChange={(e) => selectCard(e.target.value)}
                >
                  {store.cards.map((c, i) => (
                    <option key={c.cardId} value={c.cardId}>
                      {i + 1}. {c.name.trim() || "Sin nombre"}
                    </option>
                  ))}
                </select>
                <span>{store.cards.findIndex((c) => c.cardId === data.cardId) + 1} de {store.cards.length}</span>
              </div>
              <div className="editor-top-actions">
                <button type="button" className="editor-duplicate" onClick={() => duplicateCard(data.cardId)}>
                  <Icon name="duplicate" size={15} /> Duplicar
                </button>
                <button type="button" className="editor-delete" onClick={() => deleteCard(data.cardId)}>
                  <Icon name="trash" size={15} /> Eliminar
                </button>
              </div>
            </div>

            <section className="family-intro">
              <div>
                <h1>Editando la credencial de {data.name.trim().split(" ")[0] || "esta persona"}.</h1>
                <p>
                  Actualiza foto, datos y contactos. Su QR es único: si cambias algo,
                  descarga e imprime de nuevo <strong>solo esta credencial</strong>.
                </p>
              </div>
              <div className="family-steps">
                <span><b>1</b> Edita</span>
                <span><b>2</b> Revisa QR</span>
                <span><b>3</b> Imprime</span>
              </div>
            </section>

            <div className="admin-grid">
              <div className="editor-column">
                <section className="editor-card">
                  <div className="editor-title">
                    <span className="editor-icon">
                      <Icon name="user" size={19} />
                    </span>
                    <div>
                      <h2>Datos de la persona</h2>
                      <p>Así aparecerá en la parte superior de la credencial.</p>
                    </div>
                  </div>
                  <Field
                    label="Nombre completo"
                    value={data.name}
                    onChange={changeField("name")}
                    maxLength={80}
                    placeholder="Ej. Crescencio Sánchez Montiel"
                  />
                  <div className="two-fields">
                    <Field
                      label="Edad"
                      value={data.age}
                      onChange={changeField("age")}
                      maxLength={20}
                      placeholder="Ej. 86 años"
                    />
                    <div className="field-hint">
                      <Icon name="eye" size={15} />
                      <span>La foto se reduce para que también aparezca al escanear el QR.</span>
                    </div>
                  </div>
                  <div className="photo-editor">
                    <div className="photo-editor-preview">
                      {data.photo ? (
                        <img src={data.photo} alt="Vista previa de la foto" />
                      ) : (
                        <Icon name="user" size={32} />
                      )}
                    </div>
                    <div className="photo-editor-content">
                      <strong>Foto de la persona</strong>
                      <p>Se recorta automáticamente. JPG, PNG o WebP de hasta 12 MB. La versión para imprimir queda en este dispositivo; una miniatura va en el QR.</p>
                      <div className="photo-editor-actions">
                        <label className={`photo-upload-button ${photoBusy ? "is-busy" : ""}`}>
                          <Icon name="plus" size={16} />
                          {photoBusy ? "Procesando foto..." : data.photo ? "Cambiar foto" : "Subir foto"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={onPhotoSelected}
                            disabled={photoBusy}
                            aria-label="Subir foto de la persona"
                          />
                        </label>
                        {data.photo && (
                          <button type="button" className="photo-remove-button" onClick={removePhoto} disabled={photoBusy}>
                            Quitar foto
                          </button>
                        )}
                      </div>
                      {photoError && <p className="photo-error" role="alert">{photoError}</p>}
                    </div>
                  </div>
                  <Field
                    label="Mensaje para quien le encuentre"
                    value={data.message}
                    onChange={changeField("message")}
                    multiline
                    rows={3}
                    maxLength={320}
                    placeholder="Ej. Por favor no me dejes solo y llama a mi familia."
                  />
                </section>

                <section className="editor-card" id="contactos">
                  <div className="editor-title">
                    <span className="editor-icon green">
                      <Icon name="phone" size={19} />
                    </span>
                    <div>
                      <h2>Contactos de la familia</h2>
                      <p>
                        Agrega todos los que necesites. Cada uno tendrá su propio botón verde para
                        llamar desde la credencial.
                      </p>
                    </div>
                    <span className="contacts-count">{data.contacts.length}</span>
                  </div>

                  <div className="contact-edit-list">
                    {data.contacts.map((contact, index) => {
                      const href = callLink(contact.phone);
                      const isPrimary = contact.id === data.primaryContactId;
                      return (
                        <div className={`contact-edit ${isPrimary ? "is-primary" : ""}`} key={contact.id}>
                          <div className="contact-edit-head">
                            <div>
                              <span className="contact-num">{String(index + 1).padStart(2, "0")}</span>
                              <strong>Contacto {index + 1}</strong>
                              {isPrimary && <span className="primary-pill">Principal</span>}
                            </div>
                            <button
                              type="button"
                              className="icon-danger"
                              onClick={() => removeContact(contact.id)}
                              disabled={data.contacts.length === 1}
                              aria-label={`Eliminar contacto ${index + 1}`}
                              title="Eliminar contacto"
                            >
                              <Icon name="trash" size={17} />
                            </button>
                          </div>
                          <div className="contact-edit-inputs">
                            <Field
                              label="Nombre"
                              value={contact.name}
                              onChange={(v) => changeContact(contact.id, "name", v)}
                              maxLength={70}
                              placeholder="Nombre y apellido"
                            />
                            <Field
                              label="Parentesco"
                              value={contact.relation}
                              onChange={(v) => changeContact(contact.id, "relation", v)}
                              maxLength={30}
                              placeholder="Ej. Hija"
                            />
                            <Field
                              label="Número de teléfono"
                              value={contact.phone}
                              onChange={(v) => changeContact(contact.id, "phone", v)}
                              maxLength={25}
                              placeholder="Ej. 56 1234 5678"
                              type="tel"
                              inputMode="tel"
                            />
                          </div>
                          <div className="contact-edit-foot">
                            {!isPrimary && (
                              <button
                                type="button"
                                className="link-button"
                                onClick={() =>
                                  updateSelected((card) => ({ ...card, primaryContactId: contact.id }))
                                }
                              >
                                Marcar como principal
                              </button>
                            )}
                            {href ? (
                              <a className="link-button" href={href}>
                                <Icon name="phoneCall" size={14} /> Probar llamada
                              </a>
                            ) : (
                              <span className="phone-warning">Escribe un número válido de 7 a 15 dígitos.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button type="button" className="add-contact" onClick={addContact}>
                    <Icon name="plus" size={18} /> Agregar otro contacto
                  </button>
                </section>

                <section className="editor-card">
                  <div className="editor-title">
                    <span className="editor-icon amber">
                      <Icon name="home" size={19} />
                    </span>
                    <div>
                      <h2>Domicilio y datos importantes</h2>
                      <p>Información útil para ayudar y acompañar a casa.</p>
                    </div>
                  </div>
                  <Field
                    label="Domicilio"
                    value={data.address}
                    onChange={changeField("address")}
                    multiline
                    rows={2}
                    maxLength={200}
                    placeholder="Calle, colonia y ciudad"
                  />
                  <Field
                    label="Información importante (una línea por dato)"
                    value={data.notes}
                    onChange={changeField("notes")}
                    multiline
                    rows={4}
                    maxLength={320}
                    placeholder={"Ej.\nAudición débil\nAnsiedad"}
                  />
                </section>
              </div>

              <div className="preview-column">
                <section className="preview-card">
                  <div className="preview-head">
                    <div>
                      <span className="mini-overline">VISTA PREVIA PARA LA FAMILIA</span>
                      <h2>Frente y reverso</h2>
                    </div>
                    <span className="preview-pill">
                      54 × 85,6 mm
                    </span>
                  </div>
                  <div className="physical-preview">
                    <div className="physical-preview-side">
                      <span>01 / FRENTE</span>
                      <PhysicalFront card={data} />
                    </div>
                    <div className="physical-preview-side">
                      <span>02 / REVERSO</span>
                      <PhysicalBack card={data} qrLink={canMakeQr ? link : null} />
                    </div>
                  </div>
                  <p className="preview-print-note">Dos páginas A4: frente y reverso de 54 × 85,6 mm. Imprime a doble cara (voltear por el borde largo), escala 100 %, con gráficos de fondo, y recorta por el borde. También puedes guardar como PDF. Prueba escanear el QR antes de plastificar.</p>
                  <div className="preview-actions">
                    <button type="button" className="open-credential" onClick={openCredential} disabled={!canMakeQr}>
                      <Icon name="eye" size={17} /> Ver versión digital
                    </button>
                    <button type="button" className="print-credential-button" onClick={() => printOne(data.cardId)} disabled={!canMakeQr}>
                      <Icon name="print" size={17} /> Imprimir frente y reverso
                    </button>
                  </div>
                  {!canMakeQr && <p className="preview-qr-warning">Completa un teléfono válido y habilita el QR antes de imprimir.</p>}
                </section>

                <section className="qr-card">
                  <span className="mini-overline">PARA IMPRIMIR O GUARDAR</span>
                  <h2>Código QR de {data.name.trim().split(" ")[0] || "esta persona"}</h2>
                  <p>
                    Al escanearlo se abre su credencial con botones para llamar a cada contacto. No
                    muestra esta pantalla privada ni las demás credenciales.
                  </p>
                  {canMakeQr ? (
                    <div className="qr-frame" ref={qrRef}>
                      <QRCodeCanvas
                        value={link}
                        size={1024}
                        level="L"
                        marginSize={4}
                        bgColor="#ffffff"
                        fgColor="#123f7d"
                      />
                    </div>
                  ) : (
                    <div className="qr-blocked">
                      <Icon name="warning" size={28} />
                      <span>{qrProblem}</span>
                    </div>
                  )}
                  <p className="qr-target">
                    <span>Al escanear abre la credencial de:</span>
                    <strong>{baseHost || "sin dirección"}</strong>
                  </p>
                  <div className="qr-length">
                    <span>Contactos con número válido: {validPhones}</span>
                    <span className={link.length > QR_SAFE_LENGTH ? "too-long" : ""}>
                      Tamaño del enlace: {link.length} / {QR_SAFE_LENGTH}
                    </span>
                  </div>
                  <div className="qr-actions">
                    <button type="button" className="primary-action" onClick={downloadQr} disabled={!canMakeQr}>
                      <Icon name="download" size={18} /> Descargar QR
                    </button>
                    <button type="button" className="ghost-action" onClick={copyLink}>
                      <Icon name="copy" size={17} /> Copiar enlace
                    </button>
                  </div>
                  <p className="qr-note">
                    El QR guarda una copia de los datos y una foto pequeña. Si editas algo o cambias la foto, descarga un QR nuevo: el anterior no se actualiza solo.
                  </p>
                  {isLocalPage && (
                    <p className="local-note">
                      Estás en una vista local. Para que el QR funcione en otro teléfono, publica esta
                      página en una dirección web.
                    </p>
                  )}
                </section>
              </div>
            </div>

            <footer className="family-footer">
              <Icon name="heart" size={16} />
              <span>
                Editando a {data.name || "esta persona"} · {store.cards.length} {store.cards.length === 1 ? "credencial guardada" : "credenciales guardadas"} en este dispositivo.
              </span>
            </footer>
          </>
        )}
      </main>

      <PrintSheets jobs={effectiveJobs} />

      {notice && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const [encoded, setEncoded] = useState<string | null>(getEncodedFromLocation);

  useEffect(() => {
    const onNavigate = () => {
      setEncoded(getEncodedFromLocation());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onNavigate);
    window.addEventListener("popstate", onNavigate);
    return () => {
      window.removeEventListener("hashchange", onNavigate);
      window.removeEventListener("popstate", onNavigate);
    };
  }, []);

  const shared = useMemo(() => parseSharedCredential(encoded), [encoded]);

  // Critical separation: a QR link renders ONLY the helper credential.
  // Family editing code and private storage are unreachable from that view.
  if (shared.isShared) return <HelperView card={shared.card} />;
  return <FamilyView />;
}
