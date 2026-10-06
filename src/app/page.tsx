"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";

type InstrumentRecord = {
  id: number;
  user_name: string;
  instrument: string;
  part_number: string;
  serial_number: string;
  photo_url: string;
  created_at: string;
};

export default function Home() {
  const [records, setRecords] = useState<InstrumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [photoName, setPhotoName] = useState("");

  async function loadRecords() {
    setLoading(true);
    try {
      const response = await fetch("/api/instruments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo cargar el inventario.");
      setRecords(data.instruments);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error de conexión.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/instruments", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el instrumento.");

      event.currentTarget.reset();
      setPhotoName("");
      setRecords((current) => [data.instrument, ...current]);
      setNotice("Instrumento agregado al inventario.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Ibarra Instruments, inicio">
          <span className="brand-mark">II</span>
          <span>IBARRA <strong>INSTRUMENTS</strong></span>
        </a>
        <span className="topbar-label"><i /> REGISTRO DE INVENTARIO</span>
      </header>

      <section className="intro" id="inicio">
        <div>
          <p className="eyebrow">CONTROL DE EQUIPO <span> / </span> 01</p>
          <h1>Instrumentos<br /><em>en registro.</em></h1>
        </div>
        <p className="intro-note">Una ficha clara para cada instrumento.<br />Consulta los registros o agrega uno nuevo.</p>
      </section>

      <section className="workspace" aria-label="Registro de instrumentos">
        <div className="form-panel">
          <div className="section-heading">
            <div><span className="step-number">01</span><h2>Nuevo instrumento</h2></div>
            <span className="required-note">* OBLIGATORIO</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Nombre del usuario</span>
              <input name="userName" autoComplete="name" placeholder="Nombre y apellido" maxLength={120} />
            </label>
            <label className="field">
              <span>Instrumento</span>
              <input name="instrument" placeholder="Ej. Guitarra acústica" maxLength={120} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>Número de parte</span>
                <input name="partNumber" placeholder="Ej. IB-204" maxLength={80} />
              </label>
              <label className="field">
                <span>Número de serie</span>
                <input name="serialNumber" placeholder="Ej. SN-008421" maxLength={120} />
              </label>
            </div>
            <label className="photo-picker">
              <span className="upload-symbol" aria-hidden="true">+</span>
              <span className="photo-copy"><strong>Subir foto del instrumento</strong><small>JPG, PNG o WebP · máximo 5 MB</small></span>
              <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setPhotoName(event.currentTarget.files?.[0]?.name ?? "")} />
              <span className="choose-file">ELEGIR ARCHIVO</span>
            </label>
            <p className="file-name" aria-live="polite">{photoName || "La foto se guardará con este registro."}</p>
            <button className="submit-button" type="submit" disabled={saving}>
              <span>{saving ? "GUARDANDO..." : "AGREGAR AL INVENTARIO"}</span><span aria-hidden="true">↗</span>
            </button>
            {error && <p className="form-message error-message" role="alert">{error}</p>}
            {notice && <p className="form-message success-message" role="status">{notice}</p>}
          </form>
        </div>

        <div className="inventory-panel">
          <div className="section-heading inventory-heading">
            <div><span className="step-number">02</span><h2>Inventario</h2></div>
            <span className="record-count">{records.length.toString().padStart(2, "0")} REGISTROS</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>INSTRUMENTO</th><th>USUARIO</th><th>NÚMERO DE PARTE</th><th>SERIE</th><th>FOTO</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td className="table-state" colSpan={5}>Cargando registros...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td className="table-state" colSpan={5}>Aún no hay instrumentos registrados.</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>
                    <td className="instrument-name">{record.instrument}</td>
                    <td>{record.user_name}</td>
                    <td className="mono">{record.part_number}</td>
                    <td className="mono">{record.serial_number}</td>
                    <td><a className="photo-link" href={record.photo_url} target="_blank" rel="noreferrer"><Image src={record.photo_url} alt={`Foto: ${record.instrument}`} width={42} height={36} unoptimized /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inventory-footer"><span>IBARRA INSTRUMENTS</span><span>FICHAS RECIENTES PRIMERO</span></div>
        </div>
      </section>

      <footer className="page-footer"><span>IBARRA INSTRUMENTS © 2026</span><span>HECHO PARA CUIDAR CADA DETALLE</span></footer>
    </main>
  );
}