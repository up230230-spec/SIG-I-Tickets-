/**
 * PhotoUpload — selector de fotos con diseño moderno para el reporte de incidencias.
 *
 * - Arrastrar y soltar o clic para elegir archivos.
 * - Vista previa en miniaturas con botón para quitar.
 * - Redimensiona y comprime en el cliente (canvas) antes de convertir a data URL
 *   base64, para que el payload JSON quede liviano (máx. ~1280px, JPEG 0.7).
 * - Devuelve un arreglo de data URLs vía `onChange` (máx. `max`, por defecto 3).
 */
import { useRef, useState } from 'react';

const MAX_DIMENSION = 1280; // lado mayor tras redimensionar
const JPEG_QUALITY = 0.7;

// Lee un File, lo redimensiona/comprime y resuelve con una data URL JPEG.
function fileToCompressedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Archivo de imagen no válido.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoUpload({ value = [], onChange, max = 3, disabled = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remaining = max - value.length;

  const addFiles = async (fileList) => {
    setError('');
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    if (remaining <= 0) {
      setError(`Máximo ${max} fotos.`);
      return;
    }
    setBusy(true);
    try {
      const picked = files.slice(0, remaining);
      const dataUrls = await Promise.all(picked.map(fileToCompressedDataUrl));
      onChange([...value, ...dataUrls]);
      if (files.length > remaining) setError(`Solo se agregaron ${remaining}; el máximo es ${max}.`);
    } catch (err) {
      setError(err.message || 'No se pudo procesar la imagen.');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || busy) return;
    addFiles(e.dataTransfer.files);
  };

  const onPick = (e) => {
    addFiles(e.target.files);
    e.target.value = ''; // permite volver a elegir el mismo archivo
  };

  const removeAt = (i) => onChange(value.filter((_, idx) => idx !== i));

  const canAdd = !disabled && !busy && remaining > 0;

  return (
    <div className="photo-upload">
      <button
        type="button"
        className={`photo-dropzone${dragOver ? ' is-drag' : ''}${canAdd ? '' : ' is-disabled'}`}
        onClick={() => canAdd && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (canAdd) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        disabled={!canAdd}
      >
        <span className="photo-dropzone-icon" aria-hidden="true">📷</span>
        <span className="photo-dropzone-title">
          {busy ? 'Procesando…' : 'Agregar foto'}
        </span>
        <span className="photo-dropzone-hint">
          {remaining > 0
            ? 'Arrastra una imagen o haz clic para elegir'
            : `Límite de ${max} fotos alcanzado`}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        onChange={onPick}
        style={{ display: 'none' }}
      />

      {error && <p className="photo-error">{error}</p>}

      {value.length > 0 && (
        <div className="photo-grid">
          {value.map((src, i) => (
            <div className="photo-thumb" key={i}>
              <img src={src} alt={`Foto ${i + 1}`} />
              <button
                type="button"
                className="photo-remove"
                onClick={() => removeAt(i)}
                aria-label="Quitar foto"
                disabled={disabled}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
