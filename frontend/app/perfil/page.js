'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { c } from '../lib/styles';
import { API_URL } from '../lib/api';

export default function PerfilPage() {
  const router = useRouter();

  // Estados del perfil
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estados para cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  // Pestañas y pedidos
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Función para calcular tiempo restante (UTC corregido)
  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    let expiryStr = expiresAt;
    // Forzar UTC si no tiene zona horaria
    if (!expiryStr.includes('Z') && !expiryStr.includes('+')) {
      expiryStr = expiryStr + 'Z';
    }
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diff = expiry - now;
    if (diff <= 0) return 'Expirado';
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutos`;
  };

  // Cargar perfil
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch(`${API_URL}/api/users/profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Cargar pedidos (solo cuando se activa la pestaña)
  useEffect(() => {
    if (activeTab !== 'orders') return;
    const token = localStorage.getItem('access');
    if (!token) return;
    setLoadingOrders(true);
    fetch(`${API_URL}/api/orders/my-orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error('Error cargando pedidos:', err);
        setLoadingOrders(false);
      });
  }, [activeTab]);

  // Guardar cambios de nombre/apellido
  const handleGuardar = async () => {
    if (!firstName.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre no puede estar vacío' });
      return;
    }
    setSaving(true);
    setMensaje(null);
    const token = localStorage.getItem('access');
    const res = await fetch(`${API_URL}/api/users/profile/`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...user, name: data.first_name }));
      setMensaje({ tipo: 'ok', texto: '¡Perfil actualizado correctamente!' });
      window.dispatchEvent(new Event('userUpdated'));
    } else {
      setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar' });
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ tipo: 'error', texto: 'Todos los campos son obligatorios' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ tipo: 'error', texto: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    const token = localStorage.getItem('access');
    try {
      const res = await fetch(`${API_URL}/api/users/change-password/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ tipo: 'ok', texto: '¡Contraseña actualizada correctamente!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ tipo: 'error', texto: data.error || 'Error al cambiar contraseña' });
      }
    } catch (error) {
      setPasswordMessage({ tipo: 'error', texto: 'Error de conexión' });
    } finally {
      setChangingPassword(false);
    }
  };

  // Desactivar cuenta (soft delete)
  const handleEliminar = async () => {
    setDeleting(true);
    const token = localStorage.getItem('access');
    const res = await fetch(`${API_URL}/api/users/profile/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      localStorage.clear();
      document.cookie = 'access=; path=/; max-age=0';
      window.dispatchEvent(new Event('userUpdated'));
      router.push('/login?message=cuenta_desactivada');
    } else {
      setDeleting(false);
      const data = await res.json().catch(() => ({}));
      setMensaje({ tipo: 'error', texto: data.error || 'Error al desactivar la cuenta' });
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
        <div style={{ padding: '60px', textAlign: 'center', color: c.textSub }}>
          Cargando perfil...
        </div>
      </div>
    );
  }

  // Estilos compartidos
  const labelStyle = {
    display: 'block',
    color: c.textSub,
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '8px',
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: c.input,
    color: c.textMain,
    border: `1px solid ${c.border}`,
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const successMessageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    backgroundColor: '#052e16',
    color: c.success,
    border: `1px solid ${c.success}`,
  };

  const errorMessageStyle = {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    backgroundColor: '#3b0a0a',
    color: c.error,
    border: `1px solid ${c.error}`,
  };

  return (
    <div style={{ backgroundColor: c.bg, minHeight: '100vh', color: c.textMain }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px' }}>
        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: `1px solid ${c.border}` }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'profile' ? c.primary : c.textSub,
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'profile' ? `2px solid ${c.primary}` : '2px solid transparent',
            }}
          >
            Mi Perfil
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: activeTab === 'orders' ? c.primary : c.textSub,
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === 'orders' ? `2px solid ${c.primary}` : '2px solid transparent',
            }}
          >
            Mis Pedidos
          </button>
        </div>

        {/* ================= PERFIL ================= */}
        {activeTab === 'profile' && (
          <>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '6px' }}>
              Mi <span style={{ color: c.primary }}>Perfil</span>
            </h1>
            <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '40px' }}>
              Miembro desde {new Date(profile.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
            </p>

            <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '32px', marginBottom: '20px' }}>
              {/* Email fijo */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Correo electrónico</label>
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: c.input,
                  borderRadius: '8px',
                  border: `1px solid ${c.border}`,
                  color: c.textWeak,
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{profile.email}</span>
                  <span style={{ fontSize: '11px', color: c.textWeak, backgroundColor: c.bgDark, padding: '3px 8px', borderRadius: '4px' }}>
                    No editable
                  </span>
                </div>
              </div>

              {/* Nombre */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  maxLength={30}
                  placeholder="Tu nombre"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.primary}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </div>

              {/* Apellido */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  maxLength={30}
                  placeholder="Tu apellido"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = c.primary}
                  onBlur={(e) => e.target.style.borderColor = c.border}
                />
              </div>

              {mensaje && (
                <div style={mensaje.tipo === 'ok' ? successMessageStyle : errorMessageStyle}>
                  {mensaje.texto}
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '13px',
                  backgroundColor: c.primary,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  letterSpacing: '0.5px',
                }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {/* Cambio de contraseña */}
              <div style={{ marginTop: '40px', borderTop: `1px solid ${c.border}`, paddingTop: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Cambiar contraseña</h3>
                <form onSubmit={handleChangePassword}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Contraseña actual</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={labelStyle}>Nueva contraseña</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        style={inputStyle}
                        required
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        style={inputStyle}
                        required
                      />
                    </div>
                  </div>
                  {passwordMessage && (
                    <div style={passwordMessage.tipo === 'ok' ? successMessageStyle : errorMessageStyle}>
                      {passwordMessage.texto}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: c.primary,
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: changingPassword ? 'not-allowed' : 'pointer',
                      opacity: changingPassword ? 0.7 : 1,
                    }}
                  >
                    {changingPassword ? 'Cambiando...' : 'Actualizar contraseña'}
                  </button>
                </form>
              </div>
            </div>

            {/* Zona peligrosa */}
            <div style={{ backgroundColor: '#1a0a0a', border: `1px solid #3b0a0a`, borderRadius: '12px', padding: '24px' }}>
              <h3 style={{ color: c.error, fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Zona peligrosa</h3>
              <p style={{ color: c.textSub, fontSize: '13px', marginBottom: '20px' }}>
                Al desactivar tu cuenta ya no podrás iniciar sesión, pero tus pedidos se conservarán en nuestro sistema.
              </p>
              <button
                onClick={() => setConfirmar(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: c.error,
                  border: `1px solid ${c.error}`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Desactivar mi cuenta
              </button>
            </div>
          </>
        )}

        {/* ================= MIS PEDIDOS ================= */}
        {activeTab === 'orders' && (
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '30px' }}>
              Mis <span style={{ color: c.primary }}>Pedidos</span>
            </h1>

            {loadingOrders ? (
              <p style={{ color: c.textSub, textAlign: 'center', padding: '40px' }}>Cargando pedidos...</p>
            ) : orders.length === 0 ? (
              <div style={{ backgroundColor: c.card, borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <p style={{ color: c.textSub, marginBottom: '20px' }}>Aún no has realizado ningún pedido.</p>
                <button
                  onClick={() => router.push('/catalog')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: c.primary,
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Explorar catálogo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order) => {
                  const isPending = order.status === 'pending';
                  const timeLeft = isPending ? getTimeRemaining(order.expires_at) : null;
                  const isExpired = timeLeft === 'Expirado';

                  const statusBadge = {
                    pending: { emoji: '⏳', label: 'Pendiente', bg: '#fff3e0', color: '#e65100' },
                    paid: { emoji: '✅', label: 'Pagado', bg: '#e8f5e9', color: '#2e7d32' },
                    shipped: { emoji: '🚚', label: 'Enviado', bg: '#e3f2fd', color: '#1565c0' },
                  }[order.status] || { emoji: '📦', label: order.status, bg: '#f5f5f5', color: '#666' };

                  return (
                    <div key={order.id} style={{ backgroundColor: c.card, borderRadius: '12px', padding: '24px', border: `1px solid ${c.border}`, position: 'relative' }}>
                      {/* Cabecera */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px' }}>Pedido #{order.order_number}</h3>
                          <p style={{ margin: '4px 0 0', color: c.textSub, fontSize: '13px' }}>
                            {new Date(order.created_at + 'Z').toLocaleString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 14px',
                          borderRadius: '30px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.color,
                        }}>
                          {statusBadge.emoji} {statusBadge.label}
                        </span>
                      </div>

                      {/* Barra de advertencia (estilo peligro) - solo para pendientes no expiradas */}
                      {isPending && !isExpired && timeLeft && (
                        <div style={{
                          marginBottom: '20px',
                          padding: '16px 20px',
                          backgroundColor: '#8B0000', // Rojo oscuro
                          borderRadius: '12px',
                          borderLeft: `6px solid ${c.primary}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <span style={{ fontSize: '32px' }}>⚠️</span>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '4px' }}>
                              ¡ATENCIÓN! Esta orden se eliminará automáticamente
                            </div>
                            <div style={{ fontSize: '15px', color: '#FFF' }}>
                              Tienes <strong style={{ fontSize: '18px', color: c.primary }}>{timeLeft}</strong> para completar el pago.
                              <br />
                              <span style={{ fontSize: '13px', color: '#FFD700' }}>
                                Si no pagas antes de ese plazo, la orden será cancelada y los productos volverán al carrito.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Barra roja para pedidos expirados */}
                      {isPending && isExpired && (
                        <div style={{
                          marginBottom: '20px',
                          padding: '16px 20px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          borderRadius: '12px',
                          borderLeft: `6px solid #ef4444`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}>
                          <span style={{ fontSize: '32px' }}>❌</span>
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>Pedido expirado</div>
                            <div style={{ fontSize: '14px' }}>
                              El tiempo para pagar este pedido ha expirado. No es posible completar la compra.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ marginBottom: '20px' }}>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '4px 0' }}>
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>${item.subtotal.toLocaleString()}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p style={{ color: c.textSub, fontSize: '13px', marginTop: '8px' }}>
                            +{order.items.length - 3} productos más
                          </p>
                        )}
                      </div>

                      {/* Total y botones */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${c.border}`, paddingTop: '16px' }}>
                        <span style={{ fontWeight: '600' }}>Total</span>
                        <span style={{ fontWeight: '700', color: c.primary, fontSize: '18px' }}>
                          ${order.total.toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        {/* Botón Ver detalles (siempre visible) */}
                        <button
                          onClick={() => router.push(`/order-confirmation/${order.id}`)}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            color: c.primary,
                            border: `1px solid ${c.primary}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          Ver detalles
                        </button>

                        {/* Botón Reanudar pago (solo para pendientes no expiradas) */}
                        {isPending && !isExpired && (
                          <button
                            onClick={() => router.push(`/checkout?resume_order=${order.id}`)}
                            style={{
                              flex: 1,
                              padding: '8px 16px',
                              backgroundColor: c.primary,
                              color: '#000',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 'bold',
                            }}
                          >
                            💳 Reanudar pago
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación para desactivar cuenta */}
      {confirmar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}>
          <div style={{
            backgroundColor: c.card,
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            border: `1px solid ${c.error}`,
          }}>
            <h3 style={{ color: c.error, marginBottom: '12px' }}>¿Desactivar cuenta?</h3>
            <p style={{ color: c.textSub, fontSize: '14px', marginBottom: '28px' }}>
              Ya no podrás iniciar sesión, pero tus pedidos se conservarán. ¿Deseas continuar?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmar(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: c.input,
                  color: c.textMain,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: c.error,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Desactivando...' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}