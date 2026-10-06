import { neon } from "@neondatabase/serverless";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

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
  if (!connectionString) throw new Error("Falta configurar DATABASE_URL en Vercel.");
  return neon(connectionString);
}

async function ensureTable() {
  const sql = getDatabase();
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

export async function POST(request: Request) {
  let photoUrl: string | undefined;

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Falta conectar Vercel Blob y configurar BLOB_READ_WRITE_TOKEN.");
    }

    const form = await request.formData();
    const userName = String(form.get("userName") ?? "").trim();
    const instrument = String(form.get("instrument") ?? "").trim();
    const partNumber = String(form.get("partNumber") ?? "").trim();
    const serialNumber = String(form.get("serialNumber") ?? "").trim();
    const photo = form.get("photo");

    if (!userName || !instrument || !partNumber || !serialNumber) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }
    if (!(photo instanceof File) || photo.size === 0 || !photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Selecciona una foto válida del instrumento." }, { status: 400 });
    }
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "La foto debe pesar menos de 5 MB." }, { status: 400 });
    }

    const extension = photo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    const blob = await put(`instrument-photos/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`, photo, {
      access: "public",
      contentType: photo.type,
    });
    photoUrl = blob.url;

    const sql = await ensureTable();
    const rows = await sql.query(
      `INSERT INTO instruments (user_name, instrument, part_number, serial_number, photo_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_name, instrument, part_number, serial_number, photo_url, created_at`,
      [userName, instrument, partNumber, serialNumber, photoUrl],
    );

    return NextResponse.json({ instrument: rows[0] as InstrumentRow }, { status: 201 });
  } catch (error) {
    if (photoUrl) await del(photoUrl).catch(() => undefined);
    const message = error instanceof Error ? error.message : "No se pudo guardar el instrumento.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}