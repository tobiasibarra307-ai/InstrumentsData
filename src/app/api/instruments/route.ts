import { neon } from "@neondatabase/serverless";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { buildInstrumentPayload } from "@/lib/instrumentForm.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InstrumentRow = {
  id: number;
  user_name: string;
  instrument: string;
  part_number: string;
  serial_number: string;
  photo_url: string;
  created_at: string;
};

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return neon(connectionString);
}

async function ensureTable() {
  const sql = getDatabase();
  if (!sql) return null;

  await sql.query(`
    CREATE TABLE IF NOT EXISTS instruments (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_name VARCHAR(120) NOT NULL,
      instrument VARCHAR(120) NOT NULL,
      part_number VARCHAR(80) NOT NULL,
      serial_number VARCHAR(120) NOT NULL,
      photo_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  return sql;
}

export async function GET() {
  try {
    const sql = await ensureTable();
    if (!sql) {
      return NextResponse.json({ instruments: [], warning: "Falta configurar DATABASE_URL en Vercel." }, { status: 200 });
    }

    const instruments = await sql.query(`
      SELECT id, user_name, instrument, part_number, serial_number, photo_url, created_at
      FROM instruments
      ORDER BY created_at DESC, id DESC
    `);
    return NextResponse.json({ instruments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo consultar la base de datos.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return !!value && typeof value === "object" && "arrayBuffer" in value && typeof (value as File).arrayBuffer === "function";
}

export async function POST(request: Request) {
  let photoUrl = "";

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Falta configurar DATABASE_URL en Vercel." }, { status: 503 });
    }

    const form = await request.formData();
    const payload = buildInstrumentPayload(form);
    const { userName, instrument, partNumber, serialNumber, photo } = payload;

    const hasPhoto = !!photo && isUploadedFile(photo);
    if (hasPhoto && photo.size === 0) {
      return NextResponse.json({ error: "La foto seleccionada no es válida." }, { status: 400 });
    }
    if (hasPhoto && !photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "La foto debe ser una imagen válida." }, { status: 400 });
    }
    if (hasPhoto && photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La foto debe pesar menos de 5 MB." }, { status: 400 });
    }

    if (hasPhoto) {
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("Falta configurar BLOB_READ_WRITE_TOKEN en Vercel.");
      }

      const extension = photo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
      const blob = await put(`instrument-photos/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`, photo, {
        access: "public",
        contentType: photo.type,
      });
      photoUrl = blob.url;
    }

    const sql = await ensureTable();
    if (!sql) {
      return NextResponse.json({ error: "Falta configurar DATABASE_URL en Vercel." }, { status: 503 });
    }

    const rows = await sql.query(
      `INSERT INTO instruments (user_name, instrument, part_number, serial_number, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_name, instrument, part_number, serial_number, photo_url, created_at`,
      [userName || "", instrument || "", partNumber || "", serialNumber || "", photoUrl || ""],
    );

    return NextResponse.json({ instrument: rows[0] as InstrumentRow }, { status: 201 });
  } catch (error) {
    if (photoUrl) await del(photoUrl).catch(() => undefined);
    const message = error instanceof Error ? error.message : "No se pudo guardar el instrumento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}