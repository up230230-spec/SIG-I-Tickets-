import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [incidentes, setIncidentes] = useState([])
  

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api/incidents' 
    : 'http://192.168.100.202:3000/api/incidents';

  const [nuevoIncidente, setNuevoIncidente] = useState({
    title: '',
    description: '',
    type: 'medical' 
  })


  const cargarIncidentes = () => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setIncidentes(data))
      .catch(err => console.error("Error al cargar:", err))
  }

 
  const eliminarIncidente = async (id) => {
  if (window.confirm("¿Estás seguro de que deseas eliminar este reporte?")) {
    try {
     
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        
        setIncidentes(incidentes.filter(inc => inc._id !== id));
        alert("Reporte eliminado con éxito 🗑️");
      } else {
        const data = await response.json();
        alert("Error del servidor: " + (data.mensaje || "No se pudo borrar"));
      }
    } catch (error) {
      console.error("Error al borrar:", error);
      alert("Error de conexión al intentar eliminar");
    }
  }
};

  useEffect(() => {
    cargarIncidentes()
    const intervalo = setInterval(() => {
      cargarIncidentes()
    }, 5000)
    return () => clearInterval(intervalo)
  }, [])
 
  const handleChange = (e) => {
    setNuevoIncidente({
      ...nuevoIncidente,
      [e.target.name]: e.target.value
    })
  }

  
  const handleSubmit = async (e) => {
    e.preventDefault()

    const obtenerUbicacion = () => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ lat: 0, lng: 0 }); 
        } else {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            () => {
              resolve({ lat: 0, lng: 0 });
            }
          );
        }
      });
    };

    const ubicacion = await obtenerUbicacion();

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...nuevoIncidente,
          clientSideId: Date.now().toString(),
          location: [ubicacion.lng, ubicacion.lat]
        })
      })

      if (response.ok) {
        alert("¡Incidente reportado con éxito! 🚨")
        setNuevoIncidente({ title: '', description: '', type: 'medical' })
        cargarIncidentes()
      } else {
        alert("Error al guardar en el servidor")
      }
    } catch (error) {
      console.error("Error enviando:", error)
      alert("Error de conexión con el servidor. Verifica que el backend esté corriendo.")
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🚑 Brigada SOS</h1>
        <p>Sistema de Gestión de Incidentes en Tiempo Real</p>
      </header>

      <div className="dashboard">
        {/* FORMULARIO */}
        <div className="form-section">
          <div className="form-card">
            <h2>📝 Reportar Nuevo</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título del Incidente:</label>
                <input 
                  type="text" 
                  name="title" 
                  value={nuevoIncidente.title}
                  onChange={handleChange}
                  placeholder="Ej: Incendio forestal..." 
                  required 
                />
              </div>

               <div className="form-group">
              <label>Tipo:</label>
              <select name="type" value={nuevoIncidente.type} onChange={handleChange}>
                   {/* El 'value' es lo que se guarda en la DB, el texto fuera es lo que ves tú */}
                  <option value="medical">Médico 🏥</option>
                  <option value="structural">Estructural 🏗️</option>
                  <option value="rescue">Rescate 🛟</option>
                  <option value="supplies">Suministros 📦</option>
                  </select>
                    </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea 
                  name="description" 
                  value={nuevoIncidente.description}
                  onChange={handleChange}
                  placeholder="Detalla lo ocurrido..." 
                  rows="4"
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-submit">Enviar Reporte 📡</button>
            </form>
          </div>
        </div>

        {/* LISTA DE INCIDENTES */}
        <div className="list-section">
          <h2>🚨 Incidentes Activos ({incidentes.length})</h2>
          <div className="incidents-grid">
            {incidentes.length === 0 ? (
              <p>No hay incidentes reportados. ✅</p>
            ) : (
              incidentes.map((inc) => (
                <div key={inc._id} className={`incident-card ${inc.type}`}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={`tag ${inc.type}`}>{inc.type.toUpperCase()}</span>
                      <h3>{inc.title}</h3>
                    </div>
                    <button 
                      onClick={() => eliminarIncidente(inc._id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>🗑️</span>
                    </button>
                  </div>

                  <p>{inc.description}</p>
                  
                  <small style={{color: '#888'}}>
                    📅 {inc.createdAt ? new Date(inc.createdAt).toLocaleString() : 'Recién reportado'}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App